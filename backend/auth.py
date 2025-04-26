from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from models import User
from typing import Optional, Dict, Any
import secrets
from datetime import datetime, timedelta, timezone
import jwt
import logging
import httpx

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

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")

# OAuth2 scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

def create_access_token(data: Dict) -> str:
    """Create a JWT access token with the provided data"""
    to_encode = data.copy()
    # Use explicitly UTC datetime and add debugging
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire.timestamp()})
    logger.info(f"Creating token with exp: {expire.isoformat()}, timestamp: {expire.timestamp()}")
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError as e:
        logger.error(f"Token expired: {str(e)}")
        current_time = datetime.now(tz=timezone.utc).timestamp()
        # Try to decode without verification to see expiration time
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            exp_time = unverified.get("exp", 0)
            logger.error(f"Token expired at {exp_time}, current time: {current_time}, diff: {current_time - exp_time}")
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
        )

def get_google_auth_url() -> str:
    """Generate the Google OAuth authorization URL"""
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
    """Exchange an authorization code for an access token from Google"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
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
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
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
            
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Network error during Google authentication"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during Google authentication: {str(e)}"
        )

async def get_google_user_info(token: Dict[str, Any]) -> Dict[str, Any]:
    """Get the user information from Google using the obtained access token"""
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {token['access_token']}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(user_info_url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from Google"
            )
            
        return response.json()

async def get_current_user(request: Request) -> User:
    """
    Authenticate a user from JWT token in Authorization header or cookie
    Returns a User object if authentication succeeds, or raises an HTTPException
    """
    # Import here to avoid circular imports
    from database import get_user_by_id
    
    token = None
    
    # Check for JWT token in cookie
    token_cookie = request.cookies.get(COOKIE_NAME)
    if token_cookie:
        token = token_cookie
    
    # Check for JWT token in Authorization header (as fallback)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
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

async def get_optional_user(request: Request) -> Optional[User]:
    """Similar to get_current_user but returns None if not authenticated"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None 
    