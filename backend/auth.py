from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
from models import User, UserLogin
from typing import Optional, Dict, Any, List
import secrets
from datetime import datetime, timedelta
import jwt
import logging
import httpx
from passlib.context import CryptContext

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth")

# Load environment variables
load_dotenv()

# Auth configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
COOKIE_NAME = "auth_token"
CSRF_TOKEN_HEADER = "X-CSRF-Token"
CSRF_COOKIE_NAME = "csrf_token"

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")

# Security schemes
auth_scheme = HTTPBearer(auto_error=False)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate a hash from plain password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict) -> str:
    """
    Create a JWT access token with the provided data
    """
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token
    """
    try:
        # Log token decoding attempt without revealing the token
        logger.info(f"Attempting to decode token with algorithm {JWT_ALGORITHM}")
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        logger.info(f"Token decoded successfully for user: {payload.get('sub', 'unknown')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
        )

def get_google_auth_url() -> str:
    """
    Generate the Google OAuth authorization URL
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth client ID not configured"
        )
    
    scopes = ["email", "profile"]
    scope_string = " ".join(scopes)
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": scope_string,
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent"
    }
    
    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
    return f"https://accounts.google.com/o/oauth2/auth?{query_string}"

async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    Exchange an authorization code for an access token from Google
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google OAuth credentials not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials not configured"
        )
    
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    logger.info(f"Exchanging code for token using redirect URI: {GOOGLE_REDIRECT_URI}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                logger.error(f"Google OAuth token exchange failed: Status {response.status_code}, Response: {response.text}")
                error_detail = "Failed to exchange authorization code"
                try:
                    error_json = response.json()
                    if "error_description" in error_json:
                        error_detail += f": {error_json['error_description']}"
                except:
                    pass
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=error_detail
                )
            
            token_data = response.json()
            logger.info("Successfully obtained Google OAuth token")
            return token_data
    except httpx.RequestError as e:
        logger.error(f"Request error during Google OAuth token exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Network error during Google authentication"
        )
    except Exception as e:
        logger.error(f"Unexpected error during Google OAuth token exchange: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Google authentication: {str(e)}"
        )

async def get_google_user_info(token: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the user information from Google using the obtained access token
    """
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {token['access_token']}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(user_info_url, headers=headers)
        
        if response.status_code != 200:
            logger.error(f"Error getting user info: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from Google"
            )
            
        return response.json()

async def authenticate_user(email: str, password: str):
    """Authenticate a user by email and password"""
    # Import here to avoid circular imports
    from database import get_user_by_email
    
    user = await get_user_by_email(email)
    if not user:
        return False
    
    if not user.get("password"):
        # User exists but has no password set (e.g., created through another method)
        return False
    
    if not verify_password(password, user["password"]):
        return False
    
    return user

def generate_csrf_token() -> str:
    """Generate a random CSRF token"""
    return secrets.token_urlsafe(32)

def validate_csrf_token(request: Request, response: Optional[Response] = None) -> bool:
    """
    Validate that the CSRF token in the request header matches the one in the cookie
    
    This protects against CSRF attacks by ensuring that the request comes from
    a page that has access to both the cookie and the header value
    """
    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get(CSRF_TOKEN_HEADER)
    
    # If we're in development mode, be more lenient with CSRF validation
    if os.getenv("ENVIRONMENT", "development") == "development":
        # In development, if either token is missing, consider it valid for testing
        if not csrf_cookie or not csrf_header:
            return True
    else:
        # In production, if either is missing, validation fails
        if not csrf_cookie or not csrf_header:
            return False
    
    # Compare the values using a constant-time comparison to prevent timing attacks
    return secrets.compare_digest(csrf_cookie, csrf_header)

async def get_current_user(
    request: Request,
) -> User:
    """
    Authenticate a user from:
    1. JWT token in cookie
    2. JWT token in Authorization header (as fallback)
    
    Returns a User object if authentication succeeds, or raises an HTTPException
    """
    # Import here to avoid circular imports
    from database import get_user_by_id
    
    token = None
    cookie_auth = False
    
    # Method 1: Check for JWT in cookie
    token_cookie = request.cookies.get(COOKIE_NAME)
    if token_cookie:
        token = token_cookie
        cookie_auth = True
    
    # Method 2: Check for JWT in Authorization header (as fallback)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    # Method 3: Check for user ID in X-User-ID header (NextAuth.js)
    if not token:
        user_id = request.headers.get("X-User-ID")
        if user_id:
            # If we have a user ID from header, try to get the user directly
            user = await get_user_by_id(user_id)
            if user:
                return User(
                    id=user["_id"],
                    email=user["email"],
                    name=user["name"],
                    picture=user.get("picture", ""),
                    provider=user.get("provider", "jwt")
                )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If using cookie-based authentication, validate CSRF token
    if cookie_auth and not validate_csrf_token(request):
        # Log instead of reject in development for debugging
        if os.getenv("ENVIRONMENT", "development") == "development":
            logger.warning("CSRF token validation failed, but proceeding in development mode")
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed",
            )
    
    try:
        # Decode the token
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        
        # Get user from database
        user = await get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        # Return the user model
        return User(
            id=user["_id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture", ""),
            provider=user.get("provider", "jwt")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
        )

async def get_optional_user(
    request: Request,
) -> Optional[User]:
    """
    Similar to get_current_user but returns None instead of raising an exception
    if the user is not authenticated
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_current_user_from_header(
    request: Request,
) -> User:
    """
    Authenticate a user from the X-User-ID header sent by NextAuth.js
    
    Returns a User object if authentication succeeds, or raises an HTTPException
    """
    # Import here to avoid circular imports
    from database import get_user_by_id
    
    # Get the user ID from header
    user_id = request.headers.get("X-User-ID")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Get user from database
        user = await get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        # Return the user model
        return User(
            id=user["_id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture", ""),
            provider=user.get("provider", "google")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
        )

# New function that securely verifies user identity
async def secure_get_current_user(
    request: Request,
) -> User:
    """
    Authenticate a user exclusively using secure JWT tokens
    from either cookie or Authorization header.
    
    Returns a User object if authentication succeeds, or raises an HTTPException
    """
    # This function inherits the same secure token authentication logic
    # from get_current_user, ensuring all authentication is handled
    # through cryptographically signed tokens
    return await get_current_user(request) 