from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from existing project and API models
from auth import create_user
from api.models import UserCreate, UserResponse
from api.auth import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_api(user: UserCreate, current_user = Depends(get_current_active_user)):
    """
    Create a new user (only admin can do this)
    """
    # Check if user has permissions to create users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create users"
        )
    
    # Create the user
    new_user = create_user(
        username=user.username,
        password=user.password,
        role=user.role,
        email=user.email,
        full_name=user.full_name
    )
    
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create user, username may already exist"
        )
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_active_user)):
    """
    Get information about the current user
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }