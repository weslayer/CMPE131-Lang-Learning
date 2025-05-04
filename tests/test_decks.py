import sys
import os
from fastapi.testclient import TestClient
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.models import User
from backend.auth import get_current_user

def override_get_current_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        name="Test User",
        provider="google",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )


app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_create_get_delete_deck():
    response = client.post("/decks", json={
        "name": "Test Deck",
        "description": "Deck created for unit testing"
    })
    print("Create Response:", response.json())
    assert response.status_code == 200
    created_deck = response.json()
    assert created_deck["name"] == "Test Deck"
    deck_id = created_deck["_id"]

    # 2. Get the created deck
    get_response = client.get(f"/decks/{deck_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Test Deck"

    # 3. Delete the created deck
    delete_response = client.delete(f"/decks/{deck_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Deck deleted successfully"
