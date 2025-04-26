import asyncio
import logging
from backend.database import (
    init_db, get_user_by_id, get_or_create_user_default_deck,
    get_user_flashcards_direct, create_user_flashcard_direct,
    get_flashcard
)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Test user ID
USER_ID = "google-053d86ee-e523-4853-8d88-4b56cf452a76"

async def test_user_exists():
    """Test if user exists in the database"""
    user = await get_user_by_id(USER_ID)
    if user:
        print(f"✅ User found: {user.get('name')} ({user.get('email')})")
        return user
    else:
        print(f"❌ User not found with ID: {USER_ID}")
        return None

async def test_default_deck():
    """Test retrieving or creating the user's default deck"""
    deck = await get_or_create_user_default_deck(USER_ID)
    print(f"✅ Default deck: '{deck['name']}' with {len(deck.get('cards', []))} cards")
    return deck

async def test_get_flashcards():
    """Test retrieving the user's flashcards"""
    cards = await get_user_flashcards_direct(USER_ID)
    print(f"✅ Retrieved {len(cards)} flashcards")
    
    # Display a sample of cards if any exist
    if cards:
        sample = cards[0]
        print(f"Sample card - Front: {sample.get('front', 'N/A')}, Back: {sample.get('back', 'N/A')}")
        
        # Check if sample card has deck_id
        if "deck_id" in sample:
            print(f"✅ Card has deck_id: {sample['deck_id']}")
        else:
            print("❌ Card does not have deck_id")
    return cards

async def test_create_flashcard():
    """Test creating a new flashcard for the user"""
    # Get the default deck first
    default_deck = await get_or_create_user_default_deck(USER_ID)
    
    # Create a test flashcard
    card_data = {
        "front": "Test Card Front",
        "back": "Test Card Back",
        "language": "en",
        "tags": ["test"]
    }
    
    new_card = await create_user_flashcard_direct(USER_ID, card_data)
    if new_card:
        print(f"✅ Created new flashcard: {new_card['_id']}")
        
        # Verify deck_id is set correctly
        if "deck_id" in new_card and new_card["deck_id"] == default_deck["_id"]:
            print(f"✅ Card has correct deck_id: {new_card['deck_id']}")
        else:
            print(f"❌ Card has wrong or missing deck_id")
            
        return new_card
    else:
        print("❌ Failed to create flashcard")
        return None

async def run_tests():
    """Run all database tests"""
    print("🔍 STARTING DATABASE TESTS\n")
    
    # Initialize database connection
    await init_db()
    
    # Test user exists
    user = await test_user_exists()
    if not user:
        print("❌ Cannot continue tests without valid user")
        return
    
    print("\n")
    
    # Test default deck
    await test_default_deck()
    
    print("\n")
    
    # Test getting flashcards
    await test_get_flashcards()
    
    print("\n")
    
    # Test creating a flashcard
    create_choice = input("Do you want to create a test flashcard? (y/n): ")
    if create_choice.lower() == 'y':
        await test_create_flashcard()
    
    print("\n🏁 TESTS COMPLETED")

if __name__ == "__main__":
    asyncio.run(run_tests()) 