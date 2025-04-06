from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from existing project
from database import get_db_connection, init_db
from auth import User, create_user, login as auth_login
from api.models import create_api_models

# Create FastAPI app
app = FastAPI(
    title="מערכת ניהול מחסן השאלות API",
    description="API עבור מערכת ניהול מחסן השאלות לסטודנטים לקולנוע",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Include routers for resources
from api.routers import items, loans, reservations, users, statistics
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(loans.router, prefix="/api/loans", tags=["loans"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["reservations"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])

@app.get("/")
async def root():
    return {"message": "Welcome to Warehouse Management API"}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    from api.auth import create_access_token
    from datetime import timedelta
    
    user = auth_login(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token using JWT
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)