import sys
import os
from fastapi.testclient import TestClient
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.models import User
from backend.auth import get_current_user

client = TestClient(app)

def override_get_current_user():
    return User(
        id="google-123456",
        email="testuser@example.com",
        name="Test User",
        picture="https://example.com/pic.png",
        provider="google",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

app.dependency_overrides[get_current_user] = override_get_current_user

def test_register_google_user():
    response = client.post("/auth/google/register", json={
        "_id": "google-123456",  # optional
        "email": "testuser@example.com",
        "name": "Test User",
        "picture": "https://example.com/pic.png",
        "provider": "google",
        "created_at": str(datetime.now()),
        "updated_at": str(datetime.now())
    })

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "user_id" in data
    print("User registered with ID:", data["user_id"])
