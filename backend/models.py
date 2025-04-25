from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic.types import StringConstraints

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        # For UUIDs or string IDs, just return as string
        if isinstance(v, str) and not ObjectId.is_valid(v):
            return v
            
        # For ObjectId-compatible strings, convert to ObjectId
        if ObjectId.is_valid(v):
            return str(ObjectId(v))
            
        # For existing ObjectIds, convert to string
        if isinstance(v, ObjectId):
            return str(v)
            
        raise ValueError("Invalid ID format")

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

class User(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[str, Field(default_factory=str, alias="_id")]
    email: EmailStr
    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    picture: Optional[str] = None
    provider: Optional[str] = "jwt"  # Authentication provider (jwt, google, etc.)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# User login model for authentication
class UserLogin(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8)]

# User creation model with password
class UserCreate(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8)]
    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    picture: Optional[str] = None

class Flashcard(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    term: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    reading: List[Annotated[str, StringConstraints(min_length=1, max_length=100)]]
    definition: Annotated[str, StringConstraints(min_length=1, max_length=500)]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now) 

    @field_validator('term')
    def validate_chinese_term(cls, v):
        if not any('\u4e00-\u9fff' in char for char in v):
            raise ValueError("Term must contain at least one Chinese character")
        return v

class Deck(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    description: Optional[Annotated[str, StringConstraints(max_length=500)]] = None
    user_id: str  # Store user_id as string for compatibility with UUIDs
    cards: List[PyObjectId] = Field(default_factory=list, max_items=1000)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now) 