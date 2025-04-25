from fastapi import FastAPI, Query, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import jieba
import uvicorn
from typing import List, Dict, Optional
from starlette.responses import RedirectResponse
import os
import logging
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

import CDict
from contextlib import asynccontextmanager
from models import User, Deck, Flashcard, UserLogin, UserCreate
from database import (
    create_deck, get_deck, update_deck, delete_deck,
    create_flashcard, get_flashcard, update_flashcard, delete_flashcard,
    get_user_by_email, create_user, init_db, get_user_decks,
    get_or_create_user_default_deck, get_user_by_id
)
from auth import (
    get_current_user, get_optional_user, create_access_token,
    get_password_hash, verify_password, authenticate_user, COOKIE_NAME,
    get_current_user_from_header, secure_get_current_user,
    get_google_auth_url, exchange_code_for_token, get_google_user_info, CSRF_COOKIE_NAME,
    generate_csrf_token
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("main")

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

c_dict : CDict.CDict = None
@asynccontextmanager
async def lifespan(app: FastAPI):
    global c_dict
    try:
        # Initialize database connection
        await init_db()
        
        # Load dictionaries
        c_dict = CDict.CDict("./data/cedict_ts.txt")
        # Using the default Jieba dictionary instead of a custom one
        # jieba.set_dictionary('data/dict.txt.reduced')
    except Exception as e:
        raise
    yield
    c_dict = None

app = FastAPI(title="Language Learning API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses with relevant details"""
    # Generate a unique ID for this request
    import uuid
    request_id = str(uuid.uuid4())
    
    # Log request details
    logger.info(f"Request [{request_id}]: {request.method} {request.url.path}")
    
    # Log request headers (excluding sensitive information)
    headers = dict(request.headers)
    if "authorization" in headers:
        headers["authorization"] = "Bearer [REDACTED]"
    if "cookie" in headers:
        headers["cookie"] = "[REDACTED]"
    logger.debug(f"Request headers [{request_id}]: {headers}")
    
    # Process the request
    try:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response details
        logger.info(f"Response [{request_id}]: {response.status_code} completed in {process_time:.4f}s")
        return response
    except Exception as e:
        logger.error(f"Request [{request_id}] failed: {str(e)}")
        raise

# Add rate limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Configure CORS with more security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Only allow your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Can be more restrictive if needed
    expose_headers=["X-Total-Count"],  # Only expose headers you need
)

@app.get("/tokenize/cn")
@limiter.limit("20/minute")
async def tokenize_chinese(
    request: Request,
    q: str = Query(..., description="Chinese text to tokenize", max_length=1000)
):
    q = q.replace(" ", "")
    tokens = list(jieba.cut(q, cut_all=True))
    return {"tokens": tokens}

@app.get("/term/cn/{term}")
@limiter.limit("30/minute")
async def get_term(request: Request, term: str):
    result = c_dict.search(term)
    return result

@app.post("/decks", response_model=Deck)
async def create_new_deck(deck: Deck, current_user: User = Depends(get_current_user)):
    deck_data = deck.dict(by_alias=True)
    deck_data["user_id"] = str(current_user.id)
    created_deck = await create_deck(deck_data)
    return created_deck

@app.get("/decks/{deck_id}", response_model=Deck)
async def get_deck_by_id(deck_id: str, current_user: User = Depends(get_current_user)):
    deck = await get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if str(deck["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    return deck

@app.put("/decks/{deck_id}", response_model=Deck)
async def update_deck_by_id(deck_id: str, deck_update: Deck, current_user: User = Depends(get_current_user)):
    existing_deck = await get_deck(deck_id)
    if not existing_deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if str(existing_deck["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this deck")
    
    update_data = deck_update.dict(exclude_unset=True)
    updated_deck = await update_deck(deck_id, update_data)
    return updated_deck

@app.delete("/decks/{deck_id}")
async def delete_deck_by_id(deck_id: str, current_user: User = Depends(get_current_user)):
    deck = await get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if str(deck["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this deck")
    
    await delete_deck(deck_id)
    return {"message": "Deck deleted successfully"}

@app.post("/decks/{deck_id}/flashcards", response_model=Flashcard)
async def add_flashcard_to_deck(
    deck_id: str,
    flashcard: Flashcard,
    current_user: User = Depends(get_current_user)
):
    deck = await get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if str(deck["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this deck")
    
    flashcard_data = flashcard.dict(by_alias=True)
    created_flashcard = await create_flashcard(flashcard_data)
    
    await update_deck(deck_id, {
        "$push": {"cards": created_flashcard["_id"]}
    })
    return created_flashcard

@app.get("/decks/{deck_id}/flashcards", response_model=List[Flashcard])
async def get_deck_flashcards(deck_id: str, current_user: User = Depends(get_current_user)):
    deck = await get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if str(deck["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    
    flashcards = []
    for card_id in deck["cards"]:
        card = await get_flashcard(str(card_id))
        if card:
            flashcards.append(card)
    return flashcards

@app.get("/")
async def root():
    return {"msg": "yo"}

# Authentication routes
@app.post("/auth/login", response_model=Dict[str, str])
async def login_for_access_token(response: Response):
    """
    Redirect to Google OAuth login as the only authentication method
    """
    try:
        auth_url = get_google_auth_url()
        return {"url": auth_url, "message": "Please use Google OAuth to login"}
    except Exception as e:
        logger.error(f"Error during login redirect: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error redirecting to Google login"
        )

@app.post("/auth/register", response_model=Dict[str, str])
async def register_user(response: Response):
    """
    Redirect to Google OAuth as the only registration method
    """
    try:
        auth_url = get_google_auth_url()
        return {"url": auth_url, "message": "Please use Google OAuth to register"}
    except Exception as e:
        logger.error(f"Error during registration redirect: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error redirecting to Google registration"
        )

@app.post("/auth/logout")
async def logout(response: Response):
    """
    Logout the current user by clearing the auth cookie
    """
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"message": "Successfully logged out"}

@app.get("/auth/me", response_model=User)
async def get_authenticated_user(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's details"""
    return current_user

@app.get("/user/decks", response_model=List[Deck])
async def get_current_user_decks(current_user: User = Depends(get_current_user)):
    """Get all decks for the current logged-in user"""
    user_decks = await get_user_decks(str(current_user.id))
    return user_decks

@app.get("/user/default-deck", response_model=Deck)
async def get_user_default_deck(current_user: User = Depends(get_current_user)):
    """Get or create the user's default flashcard deck"""
    default_deck = await get_or_create_user_default_deck(str(current_user.id))
    return default_deck

@app.get("/user/flashcards", response_model=List[Flashcard])
async def get_user_flashcards(request: Request, current_user: User = Depends(get_current_user)):
    """Get all flashcards for the current user across all decks"""
    try:
        # Debug authentication information
        print("==== User Flashcards Request ====")
        print(f"Authenticated user: {current_user.id} ({current_user.email})")
        
        # Debug headers
        print("Request headers:")
        for name, value in request.headers.items():
            # Print auth header but obscure the token
            if name.lower() == "authorization":
                print(f"  {name}: Bearer xxxxx")
            else:
                print(f"  {name}: {value}")
        
        # Get the user's default deck
        default_deck = await get_or_create_user_default_deck(str(current_user.id))
        
        # Get all flashcards in the deck
        all_flashcards = []
        for card_id in default_deck["cards"]:
            card = await get_flashcard(str(card_id))
            if card:
                all_flashcards.append(card)
        
        print(f"Found {len(all_flashcards)} flashcards for user {current_user.id}")
        return all_flashcards
    except Exception as e:
        print(f"Error getting user flashcards: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching flashcards: {str(e)}"
        )

@app.post("/user/flashcards", response_model=Flashcard)
async def create_user_flashcard(request: Request, flashcard: Flashcard, current_user: User = Depends(get_current_user)):
    """Create a new flashcard and add it to the user's default deck"""
    try:
        # Debug request data
        print("==== Create User Flashcard Request ====")
        print(f"Authenticated user: {current_user.id} ({current_user.email})")
        print(f"Flashcard data: {flashcard.model_dump()}")
        
        # Validate term contains Chinese characters
        if not any('\u4e00' <= char <= '\u9fff' for char in flashcard.term):
            raise HTTPException(
                status_code=400,
                detail="Term must contain at least one Chinese character"
            )
        
        # Get the user's default deck
        default_deck = await get_or_create_user_default_deck(str(current_user.id))
        if not default_deck:
            raise HTTPException(
                status_code=500,
                detail="Could not find or create user's default deck"
            )
        
        # Create the flashcard
        flashcard_data = flashcard.model_dump(by_alias=True)
        created_flashcard = await create_flashcard(flashcard_data)
        
        if not created_flashcard:
            raise HTTPException(
                status_code=500,
                detail="Failed to create flashcard"
            )
        
        # Add the flashcard to the default deck
        update_result = await update_deck(str(default_deck["_id"]), {
            "$push": {"cards": created_flashcard["_id"]}
        })
        
        if not update_result:
            # Delete the created flashcard if we couldn't add it to the deck
            await delete_flashcard(str(created_flashcard["_id"]))
            raise HTTPException(
                status_code=500,
                detail="Failed to add flashcard to your deck"
            )
        
        print(f"Successfully created flashcard {created_flashcard['_id']} for user {current_user.id}")
        return created_flashcard
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating flashcard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating flashcard: {str(e)}"
        )

@app.get("/auth/status")
async def auth_status(request: Request, current_user: Optional[User] = Depends(get_optional_user)):
    """Check authentication status"""
    if current_user:
        return {
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "provider": getattr(current_user, "provider", "jwt")
            }
        }
    else:
        return {
            "authenticated": False,
            "message": "User is not authenticated"
        }

@app.get("/auth/google/login")
async def google_login():
    """
    Start the Google OAuth flow by generating the authorization URL
    """
    try:
        auth_url = get_google_auth_url()
        return {"url": auth_url}
    except Exception as e:
        print(f"Error generating Google Auth URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error starting Google authentication"
        )

@app.get("/auth/google/callback")
async def google_callback(request: Request, response: Response, code: str):
    """
    Handle the Google OAuth callback, create/update user and return JWT token
    """
    try:
        logger.info(f"Google OAuth callback received with code length: {len(code)}")
        
        # Exchange code for token
        token_data = await exchange_code_for_token(code)
        if not token_data or "access_token" not in token_data:
            logger.error(f"Failed to obtain access token, token data: {token_data}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain access token"
            )
        
        # Get user info from Google
        user_info = await get_google_user_info(token_data)
        if not user_info:
            logger.error("Failed to get user information from Google")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )
        
        # Log successful user info retrieval
        logger.info(f"Successfully retrieved Google user info for email: {user_info.get('email')}")
        
        # Extract user details
        google_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        if not google_id or not email:
            logger.error(f"Incomplete user information from Google: {user_info}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incomplete user information from Google"
            )
        
        # Format the Google ID as a string with google- prefix
        user_id = f"google-{google_id}"
        
        # Get or create user in our database
        from database import get_or_create_user
        user = await get_or_create_user(user_id, email, name, picture)
        logger.info(f"User retrieved or created with ID: {user_id}")
        
        # Update the provider field to clearly indicate this is a Google user
        if user:
            from database import update_user
            await update_user(user_id, {"provider": "google"})
            user = await get_user_by_id(user_id)
        
        if not user:
            logger.error(f"Failed to create or retrieve user with ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create or retrieve user"
            )
        
        # Create JWT token for the user
        token_data = {
            "sub": user_id,
            "email": email,
            "name": name
        }
        access_token = create_access_token(token_data)
        logger.info(f"JWT token created for user: {user_id}")
        
        # Generate a CSRF token for protection against CSRF attacks
        csrf_token = generate_csrf_token()
        
        # Set cookie with JWT token
        response.set_cookie(
            key=COOKIE_NAME,
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7  # 7 days
        )
        
        # Set CSRF token cookie (not httponly so JavaScript can read it)
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=csrf_token,
            httponly=False,  # JS needs to read this to include in headers
            secure=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7  # 7 days
        )
        
        # Redirect to welcome page or frontend with CSRF token as query parameter
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        welcome_url = f"{frontend_url}/auth/welcome?name={name}&email={email}&csrf_token={csrf_token}"
        logger.info(f"Redirecting authenticated user to: {welcome_url}")
        return RedirectResponse(url=welcome_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Google callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Google authentication: {str(e)}"
        )

@app.get("/api/my-flashcards", response_model=List[Flashcard])
async def get_my_flashcards(
    request: Request, 
    current_user: User = Depends(secure_get_current_user)
):
    """
    Streamlined endpoint to get all flashcards for the authenticated user
    using secure JWT token authentication
    """
    try:
        # At this point we know the current_user exists because of the Depends
        
        # Import here to avoid circular references
        from database import get_user_flashcards_direct
        
        # Log the authenticated user
        print(f"Fetching flashcards for user: {current_user.id} ({current_user.email})")
        
        # Use the optimized function with the user's ID
        flashcards = await get_user_flashcards_direct(str(current_user.id))
        
        if flashcards is None:
            # Log the error but return empty list instead of error
            print(f"Error retrieving flashcards for user {current_user.id}")
            return []
            
        # Return the flashcards directly
        print(f"Successfully fetched {len(flashcards)} flashcards for user {current_user.id}")
        return flashcards
        
    except Exception as e:
        print(f"Error in get_my_flashcards: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching flashcards: {str(e)}"
        )

@app.post("/api/my-flashcards", response_model=Flashcard)
async def create_my_flashcard(
    request: Request, 
    flashcard: Flashcard, 
    current_user: User = Depends(secure_get_current_user)
):
    """
    Streamlined endpoint to create a flashcard and add it to the user's default deck
    using secure JWT token authentication
    """
    try:
        # At this point we know the current_user exists because of the Depends
        
        # Import here to avoid circular references
        from database import create_user_flashcard_direct
        
        # Log the authenticated user
        print(f"Creating flashcard for user: {current_user.id} ({current_user.email})")
        print(f"Flashcard data: {flashcard.model_dump()}")
        
        # Convert Pydantic model to dict
        flashcard_data = flashcard.model_dump(by_alias=True)
        
        # Use the direct function with the user's ID
        created_flashcard = await create_user_flashcard_direct(
            str(current_user.id), 
            flashcard_data
        )
        
        if not created_flashcard:
            print(f"Failed to create flashcard for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create flashcard"
            )
        
        # Return the created flashcard
        print(f"Successfully created flashcard for user {current_user.id}: {created_flashcard.get('_id')}")
        return created_flashcard
        
    except Exception as e:
        print(f"Error in create_my_flashcard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating flashcard: {str(e)}"
        )

@app.get("/auth/debug")
async def auth_debug(request: Request, current_user: Optional[User] = Depends(get_optional_user)):
    """Debug endpoint to check authentication state"""
    try:
        # Get all headers for debugging
        headers = dict(request.headers)
        
        # Clean up sensitive headers for logging
        if "authorization" in headers:
            headers["authorization"] = "Bearer [REDACTED]"
        
        # Get cookie information
        cookies = request.cookies
        auth_cookie = None
        if COOKIE_NAME in cookies:
            auth_cookie = "[REDACTED]"  # Don't show the actual token
        
        return {
            "headers": headers,
            "cookies": {
                "auth_cookie_present": auth_cookie is not None
            },
            "authenticated": current_user is not None,
            "user": {
                "id": current_user.id if current_user else None,
                "email": current_user.email if current_user else None,
                "name": current_user.name if current_user else None,
                "provider": current_user.provider if current_user else None
            } if current_user else None
        }
    except Exception as e:
        print(f"Error in auth debug endpoint: {str(e)}")
        return {
            "error": str(e),
            "message": "Error in auth debug endpoint"
        }

@app.get("/auth/google/test")
async def test_google_oauth(current_user: Optional[User] = Depends(get_optional_user)):
    """Test endpoint to verify Google OAuth integration"""
    if current_user:
        return {
            "status": "authenticated",
            "user_info": {
                "id": current_user.id,
                "email": current_user.email,
                "name": current_user.name,
                "provider": current_user.provider,
                "picture": current_user.picture
            },
            "is_google_user": current_user.provider == "google",
            "message": "Google OAuth is working correctly!"
        }
    else:
        # Return unauthenticated response with instructions
        google_login_url = get_google_auth_url()
        return {
            "status": "unauthenticated",
            "message": "Not authenticated. Please use Google OAuth to log in.",
            "login_url": google_login_url
        }

@app.get("/auth/welcome")
async def welcome_page(request: Request, current_user: Optional[User] = Depends(get_optional_user)):
    """
    Welcome page after successful Google authentication
    """
    if current_user:
        return {
            "message": f"Welcome, {current_user.name}!",
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "provider": current_user.provider,
                "picture": current_user.picture
            },
            "next": "/my-flashcards"  # Redirect to flashcards page next
        }
    else:
        auth_url = get_google_auth_url()
        return {
            "message": "You are not logged in",
            "authenticated": False,
            "login_url": auth_url
        }

@app.post("/auth/token")
async def generate_token(request: Request):
    """Generate a JWT token for authenticated NextAuth.js users, skipping Pydantic validation"""
    try:
        # Log request headers for debugging
        headers = dict(request.headers)
        content_type = headers.get('content-type', 'unknown')
        logger.info(f"Token request with content-type: {content_type}")
        
        # Extract JSON directly
        try:
            body = await request.json()
        except Exception as e:
            logger.error(f"Failed to parse JSON: {str(e)}")
            # Try form data as fallback
            try:
                form_data = await request.form()
                body = dict(form_data)
            except Exception as form_e:
                logger.error(f"Failed to parse form data: {str(form_e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request body format"
                )
        
        # Log the parsed body
        logger.info(f"Parsed request body: {body}")
        
        # Extract user ID and email
        user_id = body.get("user_id")
        email = body.get("email")
        
        # Database imports
        from database import get_user_by_id, get_user_by_email
        
        # Try finding the user
        user = None
        if user_id:
            logger.info(f"Looking up user by ID: {user_id}")
            user = await get_user_by_id(user_id)
        
        if not user and email:
            logger.info(f"Looking up user by email: {email}")
            user = await get_user_by_email(email)
            
        if not user:
            logger.warning(f"User not found. user_id={user_id}, email={email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        # Create token data
        token_payload = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", "")
        }
        
        # Generate JWT token
        access_token = create_access_token(token_payload)
        logger.info(f"Token generated for user: {user['_id']}")
        
        # Create a JSON-compatible response and return it directly
        response_data = {
            "access_token": access_token,
            "token_type": "bearer"
        }
        return JSONResponse(content=jsonable_encoder(response_data))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating token: {str(e)}"
        )

class GoogleUser(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

@app.post("/auth/google/register")
async def register_google_user(user_data: GoogleUser):
    """
    Endpoint for NextAuth.js to register/update users in our backend database
    """
    try:
        # Get or create user in our database
        from database import get_or_create_user
        user = await get_or_create_user(
            user_id=user_data.id, 
            email=user_data.email, 
            name=user_data.name, 
            picture=user_data.picture
        )
        
        # Update the provider field to clearly indicate this is a Google user
        if user:
            from database import update_user
            await update_user(user_data.id, {"provider": "google"})
            
        return {"success": True, "user_id": user_data.id}
    except Exception as e:
        logger.error(f"Error registering Google user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {str(e)}"
        )

@app.get("/auth/healthcheck", response_model=Dict[str, bool])
async def auth_healthcheck():
    """Simple healthcheck endpoint to test if authentication is working"""
    return {"status": True}

@app.get("/api/healthcheck", response_model=Dict[str, bool])
async def protected_healthcheck(current_user: User = Depends(get_current_user)):
    """Protected healthcheck endpoint that requires authentication"""
    return {"status": True, "authenticated": True}

@app.get("/auth/google/test-oauth")
async def test_google_oauth_flow():
    """
    Test endpoint that provides all necessary information to debug Google OAuth
    """
    try:
        google_client_id = os.getenv("GOOGLE_CLIENT_ID", "Not configured")
        google_client_secret_status = "Configured" if os.getenv("GOOGLE_CLIENT_SECRET") else "Not configured"
        google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "Not configured")
        
        # Generate the actual auth URL for testing
        auth_url = get_google_auth_url()
        
        return {
            "status": "Google OAuth test endpoint",
            "configuration": {
                "google_client_id": google_client_id,
                "google_client_secret": google_client_secret_status,
                "google_redirect_uri": google_redirect_uri,
                "jwt_secret_key_configured": bool(os.getenv("JWT_SECRET_KEY")),
                "jwt_algorithm": os.getenv("JWT_ALGORITHM", "HS256"),
                "frontend_url": os.getenv("FRONTEND_URL", "Not configured")
            },
            "auth_url": auth_url,
            "instructions": {
                "1": "Visit the auth_url above in your browser",
                "2": "Complete Google authentication",
                "3": "You will be redirected to the callback URL",
                "4": "Check logs for detailed information about what happens in each step"
            },
            "troubleshooting": {
                "1": "Ensure Google OAuth consent screen is properly configured",
                "2": "Verify redirect URI matches exactly in both Google Console and .env",
                "3": "Check that client ID and secret are correct",
                "4": "Look for any CORS issues in browser console"
            }
        }
    except Exception as e:
        logger.error(f"Error in OAuth test endpoint: {str(e)}")
        return {
            "status": "Error generating OAuth test information",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    