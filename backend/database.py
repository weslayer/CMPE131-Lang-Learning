from typing import List, Dict, Optional, Any
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import json
import logging
from dotenv import load_dotenv
load_dotenv()

# Set up logging
logger = logging.getLogger("database")

# Environment variables with validation
DB_USERNAME = os.getenv("DB_USERNAME")
if not DB_USERNAME:
    raise ValueError("DB_USERNAME environment variable is required")

DB_PASSWORD = os.getenv("DB_PASSWORD")
if not DB_PASSWORD:
    raise ValueError("DB_PASSWORD environment variable is required")

DB_CLUSTER = os.getenv("DB_CLUSTER", "langlearning-cluster.lg4o4fr.mongodb.net")
DB_NAME = os.getenv("DB_NAME", "langlearn")

# Updated connection string with minimal parameters
MONGODB_URL = f"mongodb+srv://{DB_USERNAME}:{DB_PASSWORD}@{DB_CLUSTER}/?retryWrites=true&w=majority&appName=langlearning-cluster"

# Database connection with retry logic
async def get_database():
        try:
            client = AsyncIOMotorClient(MONGODB_URL)   
            await client.admin.command('ping')
            return client[DB_NAME]
        except Exception as e:
            raise

# Initialize database connection
db = None

async def init_db():
    global db
    db = await get_database()

# Collections
async def get_users_collection():
    if db is not None:
        return db.users
    else:
        database = await get_database()
        return database.users

async def get_decks_collection():
    if db is not None:
        return db.decks
    else:
        database = await get_database()
        return database.decks

async def get_flashcards_collection():
    if db is not None:
        return db.flashcards
    else:
        database = await get_database()
        return database.flashcards

# Helper functions
async def get_user_by_email(email: str):
    collection = await get_users_collection()
    user = await collection.find_one({"email": email})
    if user:
        return user
    else:
        return None

async def create_user(user_data):
    """Create a new user"""
    try:
        collection = await get_users_collection()
        user_copy = user_data.copy()
        
        # Handle custom ID if provided
        custom_id = None
        if "_id" in user_copy:
            custom_id = user_copy.pop("_id")
        
        # Add registration timestamp
        user_copy["created_at"] = datetime.utcnow()
        user_copy["updated_at"] = datetime.utcnow()
        
        # Set provider if not provided
        if "provider" not in user_copy:
            user_copy["provider"] = "google"
            
        # If custom ID was provided, use it directly
        if custom_id:
            user_copy["_id"] = custom_id
            result = await collection.insert_one(user_copy)
        else:
            # Otherwise let MongoDB generate an ID
            result = await collection.insert_one(user_copy)
        
        # Get the newly created user
        new_user = await collection.find_one({"_id": custom_id or result.inserted_id})
        print(f"User created successfully: {user_copy.get('email')} with ID: {custom_id or result.inserted_id}")
        return new_user
    except DuplicateKeyError:
        # Handle case where user already exists
        print(f"User already exists with this ID or unique field")
        # Try to return the existing user
        if "_id" in user_data:
            return await collection.find_one({"_id": user_data["_id"]})
        elif "email" in user_data:
            return await collection.find_one({"email": user_data["email"]})
        return None
    except Exception as e:
        print(f"Error creating user: {e}")
        return None

async def get_deck(deck_id: str):
    try:
        collection = await get_decks_collection()
        deck = await collection.find_one({"_id": ObjectId(deck_id)})
        if deck:
            return deck
        else:
            return None
    except Exception as e:
        raise

async def create_deck(deck_data: dict):
    try:
        collection = await get_decks_collection()
        result = await collection.insert_one(deck_data)
        deck = await collection.find_one({"_id": result.inserted_id})
        return deck
    except Exception as e:
        raise

async def update_deck(deck_id: str, update_data: dict):
    try:
        collection = await get_decks_collection()
        await collection.update_one(
            {"_id": ObjectId(deck_id)},
            {"$set": update_data} if "$push" not in update_data else update_data
        )
        deck = await get_deck(deck_id)
        return deck
    except Exception as e:
        raise

async def delete_deck(deck_id: str):
    try:
        collection = await get_decks_collection()
        result = await collection.delete_one({"_id": ObjectId(deck_id)})
        return result
    except Exception as e:
        raise

async def create_flashcard(flashcard_data: dict):
    try:
        collection = await get_flashcards_collection()
        result = await collection.insert_one(flashcard_data)
        flashcard = await collection.find_one({"_id": result.inserted_id})
        return flashcard
    except Exception as e:
        raise

async def get_flashcard(flashcard_id: str):
    try:
        collection = await get_flashcards_collection()
        flashcard = await collection.find_one({"_id": ObjectId(flashcard_id)})
        if flashcard:
            return flashcard
        else:
            return None
    except Exception as e:
        raise

async def update_flashcard(flashcard_id: str, update_data: dict):
    try:
        collection = await get_flashcards_collection()
        await collection.update_one(
            {"_id": ObjectId(flashcard_id)},
            {"$set": update_data}
        )
        flashcard = await get_flashcard(flashcard_id)
        return flashcard
    except Exception as e:
        raise

async def delete_flashcard(flashcard_id: str):
    try:
        collection = await get_flashcards_collection()
        result = await collection.delete_one({"_id": ObjectId(flashcard_id)})
        return result
    except Exception as e:
        raise

async def get_user_by_id(user_id: str):
    """Get a user by their ID"""
    try:
        print(f"Looking for user with ID: {user_id}")
        collection = await get_users_collection()
        # Try direct string ID lookup (UUID or other format)
        user = await collection.find_one({"_id": user_id})
        if user:
            print(f"Found user with ID: {user.get('_id')}")
            return user
            
        print(f"User not found with ID: {user_id}")
        return None
    except Exception as e:
        print(f"Error finding user by ID: {str(e)}")
        return None

async def get_user_decks(user_id: str):
    """Get all decks for a user"""
    try:
        collection = await get_decks_collection()
        # Use string user_id directly
        user_decks = await collection.find({"user_id": user_id}).to_list(length=100)
        return user_decks
    except Exception as e:
        print(f"Error getting user decks: {str(e)}")
        raise

async def get_or_create_user_default_deck(user_id: str):
    """Get a user's default deck or create one if it doesn't exist"""
    try:
        collection = await get_decks_collection()
        
        # Try to find a default deck for the user using string ID
        default_deck = await collection.find_one({
            "user_id": user_id,
            "is_default": True
        })
        
        # If default deck exists, return it
        if default_deck:
            return default_deck
        
        # Get user info to personalize deck name if possible    
        user = await get_user_by_id(user_id)
        deck_name = f"{user['name']}'s Flashcards" if user and 'name' in user else "My Flashcards"
            
        # If no default deck, create one with string user_id
        new_deck = {
            "name": deck_name,
            "description": "Your personal flashcard deck",
            "user_id": user_id,
            "is_default": True,
            "cards": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await collection.insert_one(new_deck)
        created_deck = await collection.find_one({"_id": result.inserted_id})
        
        print(f"Created default deck for user {user_id}: {deck_name} ({result.inserted_id})")
        return created_deck
    except Exception as e:
        print(f"Error with default deck: {str(e)}")
        raise

async def update_user(user_id: str, update_data: dict):
    """Update an existing user"""
    try:
        collection = await get_users_collection()
        
        # Ensure updated_at is set
        if "updated_at" not in update_data:
            update_data["updated_at"] = datetime.utcnow()
            
        # Update user document
        await collection.update_one(
            {"_id": user_id},  # Use string ID directly
            {"$set": update_data}
        )
        
        # Return updated user
        updated_user = await get_user_by_id(user_id)
        return updated_user
    except Exception as e:
        print(f"Error updating user: {e}")
        return None

async def get_or_create_user(user_id: str, email: str, name: str = "", picture: str = ""):
    """
    Single, unified function to get or create a user by ID
    
    This function handles all user retrieval and creation needs:
    1. First tries to find the user by ID
    2. If not found, tries to find the user by email
    3. If still not found, creates the user with the provided data
    
    Returns the user object or None if there was an error
    """
    try:
        # Get the users collection
        collection = await get_users_collection()
        
        # Step 1: Try to find user by ID
        user = await get_user_by_id(user_id)
        if user:
            # Check if user needs updates
            update_needed = False
            updates = {}
            
            if email and user.get("email") != email:
                updates["email"] = email
                update_needed = True
                
            if name and user.get("name") != name:
                updates["name"] = name
                update_needed = True
                
            if picture and user.get("picture") != picture:
                updates["picture"] = picture
                update_needed = True
            
            # Determine provider based on user_id format
            provider = "google" if user_id.startswith("google-") else "jwt"
            if user.get("provider") != provider:
                updates["provider"] = provider
                update_needed = True
                
            # Update if needed
            if update_needed:
                updates["updated_at"] = datetime.utcnow()
                await update_user(user_id, updates)
                user = await get_user_by_id(user_id)
                
            return user
        
        # Step 2: Try to find user by email
        if email:
            user = await get_user_by_email(email)
            if user:
                # User found by email but with different ID
                # This might happen if the user logs in through different providers
                # Just return the user without migrating IDs to avoid data loss
                return user
        
        # Step 3: Create new user
        # Determine provider based on user_id format
        provider = "google" if user_id.startswith("google-") else "jwt"
        
        user_data = {
            "_id": user_id,
            "email": email,
            "name": name or "User",
            "picture": picture,
            "provider": provider,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert the new user
        result = await collection.insert_one(user_data)
        
        # Return the newly created user
        return await get_user_by_id(user_id)
        
    except Exception as e:
        logger.error(f"Error in get_or_create_user: {str(e)}")
        return None

async def get_user_flashcards_direct(user_id: str):
    """
    Get all flashcards for a user in a single optimized database operation.
    This combines the steps of getting the user's default deck and then fetching all flashcards.
    """
    try:
        print(f"Getting flashcards for user ID: {user_id}")
        
        # Validate that user exists first
        user = await get_user_by_id(user_id)
        if not user:
            print(f"User not found with ID: {user_id}")
            return []
            
        # Get database collections
        decks_collection = await get_decks_collection()
        flashcards_collection = await get_flashcards_collection()
        
        # First get the user's default deck
        default_deck = await decks_collection.find_one({
            "user_id": user_id,
            "is_default": True
        })
        
        # If no default deck exists, create one
        if not default_deck:
            print(f"Creating default deck for user: {user_id}")
            new_deck = {
                "name": "My Flashcards",
                "description": "Your default flashcard deck",
                "user_id": user_id,
                "is_default": True,
                "cards": [],
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            result = await decks_collection.insert_one(new_deck)
            default_deck = await decks_collection.find_one({"_id": result.inserted_id})
            
            print(f"Created default deck with ID: {result.inserted_id}")
            
            # Return empty list since this is a new deck with no cards
            return []
        
        # If deck exists but has no cards, return empty list
        if not default_deck.get("cards") or len(default_deck["cards"]) == 0:
            print(f"Default deck exists for user {user_id} but has no cards")
            return []
        
        print(f"Found default deck with {len(default_deck['cards'])} cards")
        
        # Convert ObjectIds to strings if needed
        card_ids = [
            str(card_id) if isinstance(card_id, ObjectId) else card_id 
            for card_id in default_deck["cards"]
        ]
        
        # Use $in operator to fetch all cards in a single query
        # Convert strings back to ObjectIds for the query
        object_ids = [ObjectId(card_id) for card_id in card_ids]
        flashcards = await flashcards_collection.find(
            {"_id": {"$in": object_ids}}
        ).to_list(length=None)
        
        print(f"Retrieved {len(flashcards)} flashcards for user {user_id}")
        return flashcards
        
    except Exception as e:
        print(f"Error in get_user_flashcards_direct: {str(e)}")
        # Return empty list instead of raising error for better user experience
        return []

async def create_user_flashcard_direct(user_id: str, flashcard_data: dict):
    """
    Create a flashcard and add it to the user's default deck in a single operation.
    """
    try:
        print(f"Creating flashcard for user ID: {user_id}")
        
        # Validate that user exists first
        user = await get_user_by_id(user_id)
        if not user:
            print(f"User not found with ID: {user_id}")
            # Create a minimal user if not found - this is a fallback scenario
            user_data = {
                "_id": user_id,
                "email": f"user-{user_id}@example.com",  # Placeholder email
                "name": f"User {user_id}",  # Placeholder name
                "provider": "jwt"
            }
            user = await create_user(user_data)
            if not user:
                print(f"Failed to create user with ID: {user_id}")
                return None
            print(f"Created user with ID: {user_id} as fallback")
        
        # Get database collections
        decks_collection = await get_decks_collection()
        flashcards_collection = await get_flashcards_collection()
        
        # First get or create the user's default deck
        default_deck = await decks_collection.find_one({
            "user_id": user_id,
            "is_default": True
        })
        
        # Create default deck if it doesn't exist
        if not default_deck:
            print(f"Creating default deck for user: {user_id}")
            default_deck_data = {
                "name": "My Flashcards",
                "description": "Default flashcard collection",
                "user_id": user_id,
                "cards": [],
                "is_default": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await decks_collection.insert_one(default_deck_data)
            default_deck = await decks_collection.find_one({"_id": result.inserted_id})
            
        # Now create the flashcard
        print(f"Creating flashcard in deck: {default_deck['_id']}")
        
        # Add created_at and updated_at if not present
        if "created_at" not in flashcard_data:
            flashcard_data["created_at"] = datetime.utcnow()
        if "updated_at" not in flashcard_data:
            flashcard_data["updated_at"] = datetime.utcnow()
            
        # Create the flashcard
        result = await flashcards_collection.insert_one(flashcard_data)
        created_card = await flashcards_collection.find_one({"_id": result.inserted_id})
        
        # Add the flashcard ID to the default deck
        await decks_collection.update_one(
            {"_id": default_deck["_id"]},
            {"$push": {"cards": created_card["_id"]}}
        )
        
        print(f"Successfully created flashcard {created_card['_id']} for user {user_id}")
        return created_card
        
    except Exception as e:
        print(f"Error in create_user_flashcard_direct: {str(e)}")
        return None
    