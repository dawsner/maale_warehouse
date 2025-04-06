from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, date
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from existing project and API models
from database import create_loan, return_loan, get_loan_details
from api.models import LoanCreate, LoanResponse, LoanUpdate
from api.auth import get_current_user, get_current_active_user
from utils import get_overdue_loans

router = APIRouter()

@router.get("/", response_model=List[LoanResponse])
async def read_loans(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Get all loans, optionally filtered by status
    """
    # Get all loans
    # Since we don't have a direct function to get all loans in database.py,
    # we'll use the information from 'utils.get_overdue_loans()' function
    
    loans = []
    overdue_loans = get_overdue_loans()
    
    # For students, only show their own loans
    if current_user.role == "student":
        overdue_loans = [loan for loan in overdue_loans if loan.get("student_id") == current_user.id]
    
    # Filter by status if requested
    if status:
        if status == "overdue":
            loans = overdue_loans
        elif status == "active":
            # Logic to get active loans would need to be implemented
            pass
        elif status == "returned":
            # Logic to get returned loans would need to be implemented
            pass
    else:
        loans = overdue_loans  # For now just showing overdue loans
    
    # Format the loans to match the response model
    formatted_loans = []
    for loan in loans:
        formatted_loans.append({
            "id": loan.get("id"),
            "item_id": loan.get("item_id"),
            "item_name": loan.get("item_name", ""),
            "student_name": loan.get("student_name", ""),
            "student_id": loan.get("student_id", ""),
            "quantity": loan.get("quantity", 0),
            "checkout_date": loan.get("checkout_date"),
            "due_date": loan.get("due_date"),
            "return_date": loan.get("return_date"),
            "status": "overdue" if loan.get("days_overdue", 0) > 0 else "active",
            "user_id": loan.get("user_id"),
            "loan_notes": loan.get("loan_notes", ""),
            "checkout_notes": loan.get("checkout_notes", ""),
            "return_notes": loan.get("return_notes", ""),
            "director": loan.get("director", ""),
            "producer": loan.get("producer", ""),
            "photographer": loan.get("photographer", ""),
            "price_per_unit": loan.get("price_per_unit", 0),
            "total_price": loan.get("total_price", 0)
        })
    
    return formatted_loans[skip : skip + limit]

@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan_api(loan: LoanCreate, current_user = Depends(get_current_active_user)):
    """
    Create a new loan
    """
    # Check if user has permissions to create loans
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create loans"
        )
    
    # Create the loan
    loan_id = create_loan(
        item_id=loan.item_id,
        student_name=loan.student_name,
        student_id=loan.student_id,
        quantity=loan.quantity,
        due_date=loan.due_date,
        user_id=current_user.id if not loan.user_id else loan.user_id,
        loan_notes=loan.loan_notes,
        checkout_notes=loan.checkout_notes,
        return_notes=loan.return_notes,
        director=loan.director,
        producer=loan.producer,
        photographer=loan.photographer,
        price_per_unit=loan.price_per_unit,
        total_price=loan.total_price
    )
    
    # Get the loan details
    loan_details = get_loan_details(loan_id)
    
    if not loan_details:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Loan created but could not retrieve details"
        )
    
    return {
        "id": loan_details.get("id"),
        "item_id": loan_details.get("item_id"),
        "item_name": loan_details.get("item_name", ""),
        "student_name": loan_details.get("student_name", ""),
        "student_id": loan_details.get("student_id", ""),
        "quantity": loan_details.get("quantity", 0),
        "checkout_date": loan_details.get("checkout_date"),
        "due_date": loan_details.get("due_date"),
        "return_date": loan_details.get("return_date"),
        "status": "active",
        "user_id": loan_details.get("user_id"),
        "loan_notes": loan_details.get("loan_notes", ""),
        "checkout_notes": loan_details.get("checkout_notes", ""),
        "return_notes": loan_details.get("return_notes", ""),
        "director": loan_details.get("director", ""),
        "producer": loan_details.get("producer", ""),
        "photographer": loan_details.get("photographer", ""),
        "price_per_unit": loan_details.get("price_per_unit", 0),
        "total_price": loan_details.get("total_price", 0)
    }

@router.put("/{loan_id}/return", response_model=LoanResponse)
async def return_loan_api(loan_id: int, loan_update: LoanUpdate, current_user = Depends(get_current_active_user)):
    """
    Return a loan
    """
    # Check if user has permissions to return loans
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to return loans"
        )
    
    # Get loan details before return
    loan_details = get_loan_details(loan_id)
    
    if not loan_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with id {loan_id} not found"
        )
    
    # Check if already returned
    if loan_details.get("return_date"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan with id {loan_id} has already been returned"
        )
    
    # Return the loan
    return_loan(loan_id, loan_update.return_notes)
    
    # Get updated loan details
    updated_loan = get_loan_details(loan_id)
    
    return {
        "id": updated_loan.get("id"),
        "item_id": updated_loan.get("item_id"),
        "item_name": updated_loan.get("item_name", ""),
        "student_name": updated_loan.get("student_name", ""),
        "student_id": updated_loan.get("student_id", ""),
        "quantity": updated_loan.get("quantity", 0),
        "checkout_date": updated_loan.get("checkout_date"),
        "due_date": updated_loan.get("due_date"),
        "return_date": updated_loan.get("return_date"),
        "status": "returned",
        "user_id": updated_loan.get("user_id"),
        "loan_notes": updated_loan.get("loan_notes", ""),
        "checkout_notes": updated_loan.get("checkout_notes", ""),
        "return_notes": updated_loan.get("return_notes", ""),
        "director": updated_loan.get("director", ""),
        "producer": updated_loan.get("producer", ""),
        "photographer": updated_loan.get("photographer", ""),
        "price_per_unit": updated_loan.get("price_per_unit", 0),
        "total_price": updated_loan.get("total_price", 0)
    }

@router.get("/{loan_id}", response_model=LoanResponse)
async def read_loan(loan_id: int, current_user = Depends(get_current_user)):
    """
    Get a specific loan by ID
    """
    loan_details = get_loan_details(loan_id)
    
    if not loan_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with id {loan_id} not found"
        )
    
    # For students, only allow them to see their own loans
    if current_user.role == "student" and loan_details.get("student_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this loan"
        )
    
    # Determine loan status
    status_value = "returned"
    if not loan_details.get("return_date"):
        days_overdue = (datetime.now().date() - loan_details.get("due_date")).days
        status_value = "overdue" if days_overdue > 0 else "active"
    
    return {
        "id": loan_details.get("id"),
        "item_id": loan_details.get("item_id"),
        "item_name": loan_details.get("item_name", ""),
        "student_name": loan_details.get("student_name", ""),
        "student_id": loan_details.get("student_id", ""),
        "quantity": loan_details.get("quantity", 0),
        "checkout_date": loan_details.get("checkout_date"),
        "due_date": loan_details.get("due_date"),
        "return_date": loan_details.get("return_date"),
        "status": status_value,
        "user_id": loan_details.get("user_id"),
        "loan_notes": loan_details.get("loan_notes", ""),
        "checkout_notes": loan_details.get("checkout_notes", ""),
        "return_notes": loan_details.get("return_notes", ""),
        "director": loan_details.get("director", ""),
        "producer": loan_details.get("producer", ""),
        "photographer": loan_details.get("photographer", ""),
        "price_per_unit": loan_details.get("price_per_unit", 0),
        "total_price": loan_details.get("total_price", 0)
    }