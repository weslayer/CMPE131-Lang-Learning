from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import logging
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger("database")

DB_USERNAME = os.getenv("DB_USERNAME")
if not DB_USERNAME:
    raise ValueError("DB_USERNAME environment variable is required")

DB_PASSWORD = os.getenv("DB_PASSWORD")
if not DB_PASSWORD:
    raise ValueError("DB_PASSWORD environment variable is required")

DB_CLUSTER = os.getenv("DB_CLUSTER", "langlearning-cluster.lg4o4fr.mongodb.net")
DB_NAME = os.getenv("DB_NAME", "langlearn")

MONGODB_URL = f"mongodb+srv://{DB_USERNAME}:{DB_PASSWORD}@{DB_CLUSTER}/?retryWrites=true&w=majority&appName=langlearning-cluster"

db = None

# Helper functions for common operations
def to_object_id(id_value):
    """Convert string ID to ObjectId if needed"""
    if isinstance(id_value, str) and ObjectId.is_valid(id_value):
        return ObjectId(id_value)
    return id_value

def get_timestamp():
    """Get current timestamp for database operations"""
    return datetime.utcnow()

async def get_database():
    try:
        client = AsyncIOMotorClient(MONGODB_URL)   
        await client.admin.command('ping')
        return client[DB_NAME]
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

async def init_db():
    global db
    db = await get_database()

async def get_collection(collection_name):
    """Centralized function to get a collection from the database"""
    if db is not None:
        return db[collection_name]
    else:
        database = await get_database()
        return database[collection_name]

async def get_users_collection():
    return await get_collection("users")

async def get_decks_collection():
    return await get_collection("decks")

async def get_flashcards_collection():
    return await get_collection("flashcards")

async def get_user_by_email(email: str):
    try:
        collection = await get_users_collection()
        user = await collection.find_one({"email": email})
        return user
    except Exception as e:
        logger.error(f"Error getting user by email: {str(e)}")
        raise

async def create_user(user_data):
    try:
        collection = await get_users_collection()
        user_copy = user_data.copy()
        
        custom_id = None
        if "_id" in user_copy:
            custom_id = user_copy.pop("_id")
        
        timestamp = get_timestamp()
        user_copy["created_at"] = timestamp
        user_copy["updated_at"] = timestamp
        
        if "provider" not in user_copy:
            user_copy["provider"] = "google"
            
        if custom_id:
            user_copy["_id"] = custom_id
            result = await collection.insert_one(user_copy)
        else:
            result = await collection.insert_one(user_copy)
        
        new_user = await collection.find_one({"_id": custom_id or result.inserted_id})
        logger.info(f"User created successfully: {user_copy.get('email')} with ID: {custom_id or result.inserted_id}")
        return new_user
    except DuplicateKeyError:
        logger.warning(f"User already exists with this ID or unique field")
        if "_id" in user_data:
            return await collection.find_one({"_id": user_data["_id"]})
        elif "email" in user_data:
            return await collection.find_one({"email": user_data["email"]})
        return None
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise

async def get_deck(deck_id: str):
    try:
        collection = await get_decks_collection()
        deck = await collection.find_one({"_id": to_object_id(deck_id)})
        return deck
    except Exception as e:
        logger.error(f"Error getting deck: {str(e)}")
        raise

async def create_deck(deck_data: dict):
    try:
        timestamp = get_timestamp()
        if "created_at" not in deck_data:
            deck_data["created_at"] = timestamp
        if "updated_at" not in deck_data:
            deck_data["updated_at"] = timestamp
            
        collection = await get_decks_collection()
        result = await collection.insert_one(deck_data)
        deck = await collection.find_one({"_id": result.inserted_id})
        return deck
    except Exception as e:
        logger.error(f"Error creating deck: {str(e)}")
        raise

async def update_deck(deck_id: str, update_data: dict):
    try:
        collection = await get_decks_collection()
        
        # Add updated timestamp
        if "$set" in update_data:
            update_data["$set"]["updated_at"] = get_timestamp()
        else:
            if "$push" not in update_data:
                update_data = {"$set": update_data}
            update_data.setdefault("$set", {})["updated_at"] = get_timestamp()
                
        await collection.update_one(
            {"_id": to_object_id(deck_id)},
            update_data
        )
        deck = await get_deck(deck_id)
        return deck
    except Exception as e:
        logger.error(f"Error updating deck: {str(e)}")
        raise

async def delete_deck(deck_id: str):
    try:
        collection = await get_decks_collection()
        result = await collection.delete_one({"_id": to_object_id(deck_id)})
        return result
    except Exception as e:
        logger.error(f"Error deleting deck: {str(e)}")
        raise

async def create_flashcard(flashcard_data: dict):
    try:
        timestamp = get_timestamp()
        if "created_at" not in flashcard_data:
            flashcard_data["created_at"] = timestamp
        if "updated_at" not in flashcard_data:
            flashcard_data["updated_at"] = timestamp
            
        # Ensure deck_id is in the flashcard data if provided
        if "deck_id" not in flashcard_data and "temp_deck_id" in flashcard_data:
            flashcard_data["deck_id"] = to_object_id(flashcard_data.pop("temp_deck_id"))
            
        collection = await get_flashcards_collection()
        result = await collection.insert_one(flashcard_data)
        flashcard = await collection.find_one({"_id": result.inserted_id})
        return flashcard
    except Exception as e:
        logger.error(f"Error creating flashcard: {str(e)}")
        raise

async def get_flashcard(flashcard_id: str):
    try:
        collection = await get_flashcards_collection()
        flashcard = await collection.find_one({"_id": to_object_id(flashcard_id)})
        return flashcard
    except Exception as e:
        logger.error(f"Error getting flashcard: {str(e)}")
        raise

async def update_flashcard(flashcard_id: str, update_data: dict):
    try:
        collection = await get_flashcards_collection()
        
        # Ensure updated_at timestamp
        if "$set" not in update_data:
            update_data = {"$set": update_data}
        update_data["$set"]["updated_at"] = get_timestamp()
        
        await collection.update_one(
            {"_id": to_object_id(flashcard_id)},
            update_data
        )
        flashcard = await get_flashcard(flashcard_id)
        return flashcard
    except Exception as e:
        logger.error(f"Error updating flashcard: {str(e)}")
        raise

async def delete_flashcard(flashcard_id: str):
    try:
        collection = await get_flashcards_collection()
        result = await collection.delete_one({"_id": to_object_id(flashcard_id)})
        return result
    except Exception as e:
        logger.error(f"Error deleting flashcard: {str(e)}")
        raise

async def get_user_by_id(user_id: str):
    """Get a user by their ID"""
    try:
        logger.info(f"Looking for user with ID: {user_id}")
        collection = await get_users_collection()
        user = await collection.find_one({"_id": user_id})
        if user:
            logger.info(f"Found user with ID: {user.get('_id')}")
            return user
            
        logger.info(f"User not found with ID: {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error finding user by ID: {str(e)}")
        raise

async def get_user_decks(user_id: str):
    """Get all decks for a user"""
    try:
        collection = await get_decks_collection()
        user_decks = await collection.find({"user_id": user_id}).to_list(length=100)
        return user_decks
    except Exception as e:
        logger.error(f"Error getting user decks: {str(e)}")
        raise

async def get_or_create_user_default_deck(user_id: str):
    """Get a user's default deck or create one if it doesn't exist"""
    try:
        collection = await get_decks_collection()
        
        # Try to find a default deck for the user
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
            
        # If no default deck, create one
        timestamp = get_timestamp()
        new_deck = {
            "name": deck_name,
            "description": "Your personal flashcard deck",
            "user_id": user_id,
            "is_default": True,
            "cards": [],
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        result = await collection.insert_one(new_deck)
        created_deck = await collection.find_one({"_id": result.inserted_id})
        
        logger.info(f"Created default deck for user {user_id}: {deck_name} ({result.inserted_id})")
        return created_deck
    except Exception as e:
        logger.error(f"Error with default deck: {str(e)}")
        raise

async def update_user(user_id: str, update_data: dict):
    """Update an existing user"""
    try:
        collection = await get_users_collection()
        
        # Ensure updated_at is set
        if "$set" not in update_data:
            update_data = {"$set": update_data}
        update_data["$set"]["updated_at"] = get_timestamp()
            
        # Update user document
        await collection.update_one(
            {"_id": user_id},
            update_data
        )
        
        # Return updated user
        updated_user = await get_user_by_id(user_id)
        return updated_user
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise

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
                await update_user(user_id, updates)
                user = await get_user_by_id(user_id)
                
            return user
        
        # Step 2: Try to find user by email
        if email:
            user = await get_user_by_email(email)
            if user:
                # User found by email but with different ID
                return user
        
        # Step 3: Create new user
        # Determine provider based on user_id format
        provider = "google" if user_id.startswith("google-") else "jwt"
        
        timestamp = get_timestamp()
        user_data = {
            "_id": user_id,
            "email": email,
            "name": name or "User",
            "picture": picture,
            "provider": provider,
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        # Insert the new user
        result = await collection.insert_one(user_data)
        
        # Return the newly created user
        return await get_user_by_id(user_id)
        
    except Exception as e:
        logger.error(f"Error in get_or_create_user: {str(e)}")
        raise

async def get_user_flashcards_direct(user_id: str):
    """
    Get all flashcards for a user in a single optimized database operation.
    This combines the steps of getting the user's default deck and then fetching all flashcards.
    """
    try:
        logger.info(f"Getting flashcards for user ID: {user_id}")
        
        # Validate that user exists first
        user = await get_user_by_id(user_id)
        if not user:
            logger.warning(f"User not found with ID: {user_id}")
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
            logger.info(f"Creating default deck for user: {user_id}")
            default_deck = await get_or_create_user_default_deck(user_id)
            
            # Return empty list since this is a new deck with no cards
            return []
        
        # If deck exists but has no cards, return empty list
        if not default_deck.get("cards") or len(default_deck["cards"]) == 0:
            logger.info(f"Default deck exists for user {user_id} but has no cards")
            return []
        
        logger.info(f"Found default deck with {len(default_deck['cards'])} cards")
        
        # Convert card IDs to ObjectIds for query
        object_ids = [to_object_id(card_id) for card_id in default_deck["cards"]]
        
        # Use $in operator to fetch all cards in a single query
        flashcards = await flashcards_collection.find(
            {"_id": {"$in": object_ids}}
        ).to_list(length=None)
        
        logger.info(f"Retrieved {len(flashcards)} flashcards for user {user_id}")
        return flashcards
        
    except Exception as e:
        logger.error(f"Error in get_user_flashcards_direct: {str(e)}")
        raise

async def create_user_flashcard_direct(user_id: str, flashcard_data: dict):
    """
    Create a flashcard and add it to the user's default deck in a single operation.
    """
    try:
        logger.info(f"Creating flashcard for user ID: {user_id}")
        
        # Validate that user exists first
        user = await get_user_by_id(user_id)
        if not user:
            logger.warning(f"User not found with ID: {user_id}")
            # We no longer create users automatically - just return None
            return None
        
        # Get the user's default deck or create it
        default_deck = await get_or_create_user_default_deck(user_id)
            
        # Now create the flashcard
        logger.info(f"Creating flashcard in deck: {default_deck['_id']}")
        
        # Add timestamps if not present
        timestamp = get_timestamp()
        if "created_at" not in flashcard_data:
            flashcard_data["created_at"] = timestamp
        if "updated_at" not in flashcard_data:
            flashcard_data["updated_at"] = timestamp
        
        # Add deck_id to the flashcard
        flashcard_data["deck_id"] = default_deck["_id"]
            
        # Create the flashcard
        flashcards_collection = await get_flashcards_collection()
        result = await flashcards_collection.insert_one(flashcard_data)
        created_card = await flashcards_collection.find_one({"_id": result.inserted_id})
        
        # Add the flashcard ID to the default deck
        await update_deck(
            str(default_deck["_id"]), 
            {"$push": {"cards": created_card["_id"]}}
        )
        
        logger.info(f"Successfully created flashcard {created_card['_id']} for user {user_id}")
        return created_card
        
    except Exception as e:
        logger.error(f"Error in create_user_flashcard_direct: {str(e)}")
        raise
    