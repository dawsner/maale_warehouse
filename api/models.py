from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# User models
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    
    class Config:
        from_attributes = True

# Item models
class ItemBase(BaseModel):
    name: str
    category: str
    quantity: int
    notes: Optional[str] = None
    
class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    is_available: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Loan models
class LoanBase(BaseModel):
    item_id: int
    student_name: str
    student_id: str
    quantity: int
    due_date: date
    user_id: Optional[str] = None
    loan_notes: Optional[str] = None
    checkout_notes: Optional[str] = None
    return_notes: Optional[str] = None
    director: Optional[str] = None
    producer: Optional[str] = None
    photographer: Optional[str] = None
    price_per_unit: Optional[float] = None
    total_price: Optional[float] = None

class LoanCreate(LoanBase):
    pass

class LoanUpdate(BaseModel):
    return_notes: Optional[str] = None
    
class LoanResponse(LoanBase):
    id: int
    item_name: str
    checkout_date: datetime
    return_date: Optional[datetime] = None
    status: str
    
    class Config:
        from_attributes = True

# Reservation models
class ReservationBase(BaseModel):
    item_id: int
    student_name: str
    student_id: str
    quantity: int
    start_date: date
    end_date: date
    user_id: Optional[str] = None
    notes: Optional[str] = None

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    status: str

class ReservationResponse(ReservationBase):
    id: int
    item_name: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Statistics models
class EquipmentUsage(BaseModel):
    item_id: int
    item_name: str
    total_loans: int
    total_days: int
    usage_percentage: float

class StudentStatistics(BaseModel):
    student_id: str
    student_name: str
    total_loans: int
    overdue_count: int
    favorite_category: str

class MonthlyTrend(BaseModel):
    month: str
    loan_count: int
    return_count: int

class CategoryAnalysis(BaseModel):
    category: str
    item_count: int
    loan_count: int
    availability_percentage: float

def create_api_models():
    return {
        "UserBase": UserBase,
        "UserCreate": UserCreate,
        "UserResponse": UserResponse,
        "ItemBase": ItemBase,
        "ItemCreate": ItemCreate,
        "ItemUpdate": ItemUpdate,
        "ItemResponse": ItemResponse,
        "LoanBase": LoanBase,
        "LoanCreate": LoanCreate,
        "LoanUpdate": LoanUpdate,
        "LoanResponse": LoanResponse,
        "ReservationBase": ReservationBase,
        "ReservationCreate": ReservationCreate,
        "ReservationUpdate": ReservationUpdate,
        "ReservationResponse": ReservationResponse,
        "EquipmentUsage": EquipmentUsage,
        "StudentStatistics": StudentStatistics,
        "MonthlyTrend": MonthlyTrend,
        "CategoryAnalysis": CategoryAnalysis
    }