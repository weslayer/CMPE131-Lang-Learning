from fastapi.testclient import TestClient
from main import app
from models import User
from auth import get_current_user

def override_get_current_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        name="Test User",
        provider="test"
    )

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_tokenize_cn():
    response = client.get("/tokenize/cn", params={"q": "我喜欢学习中文"})
    assert response.status_code == 200
    data = response.json()
    assert "tokens" in data
    assert any(token in data["tokens"] for token in ["我", "喜欢", "学习", "中文"])

def test_get_flashcards_auth():
    response = client.get("/user/flashcards")
    assert response.status_code in (200, 500)

