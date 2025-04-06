from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from existing project and API models
from components.reservations import create_reservation, get_user_reservations, get_all_reservations, update_reservation_status
from api.models import ReservationCreate, ReservationResponse, ReservationUpdate
from api.auth import get_current_user, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ReservationResponse])
async def read_reservations(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Get all reservations, optionally filtered by status
    """
    # For students, only show their own reservations
    if current_user.role == "student":
        reservations = get_user_reservations(current_user.id)
    else:
        reservations = get_all_reservations()
    
    # Filter by status if requested
    if status:
        reservations = [r for r in reservations if r.get("status") == status]
    
    # Format the reservations to match the response model
    formatted_reservations = []
    for res in reservations:
        formatted_reservations.append({
            "id": res.get("id"),
            "item_id": res.get("item_id"),
            "item_name": res.get("item_name", ""),
            "student_name": res.get("student_name", ""),
            "student_id": res.get("student_id", ""),
            "quantity": res.get("quantity", 0),
            "start_date": res.get("start_date"),
            "end_date": res.get("end_date"),
            "user_id": res.get("user_id"),
            "notes": res.get("notes", ""),
            "status": res.get("status", "pending"),
            "created_at": res.get("created_at")
        })
    
    return formatted_reservations[skip : skip + limit]

@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation_api(
    reservation: ReservationCreate, 
    current_user = Depends(get_current_active_user)
):
    """
    Create a new reservation
    """
    # Create the reservation
    reservation_id = create_reservation(
        item_id=reservation.item_id,
        student_name=reservation.student_name,
        student_id=reservation.student_id,
        quantity=reservation.quantity,
        start_date=reservation.start_date,
        end_date=reservation.end_date,
        user_id=current_user.id if not reservation.user_id else reservation.user_id,
        notes=reservation.notes
    )
    
    # Get all reservations to find the created one
    if current_user.role == "student":
        reservations = get_user_reservations(current_user.id)
    else:
        reservations = get_all_reservations()
    
    created_reservation = next((r for r in reservations if r.get("id") == reservation_id), None)
    
    if not created_reservation:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reservation created but could not be retrieved"
        )
    
    return {
        "id": created_reservation.get("id"),
        "item_id": created_reservation.get("item_id"),
        "item_name": created_reservation.get("item_name", ""),
        "student_name": created_reservation.get("student_name", ""),
        "student_id": created_reservation.get("student_id", ""),
        "quantity": created_reservation.get("quantity", 0),
        "start_date": created_reservation.get("start_date"),
        "end_date": created_reservation.get("end_date"),
        "user_id": created_reservation.get("user_id"),
        "notes": created_reservation.get("notes", ""),
        "status": created_reservation.get("status", "pending"),
        "created_at": created_reservation.get("created_at")
    }

@router.put("/{reservation_id}/status", response_model=ReservationResponse)
async def update_reservation_status_api(
    reservation_id: int, 
    status_update: ReservationUpdate, 
    current_user = Depends(get_current_active_user)
):
    """
    Update reservation status (approve/reject)
    """
    # Check if user has permissions to update reservation status
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update reservation status"
        )
    
    # Get all reservations to find the one to update
    reservations = get_all_reservations()
    reservation = next((r for r in reservations if r.get("id") == reservation_id), None)
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with id {reservation_id} not found"
        )
    
    # Update the status
    update_reservation_status(reservation_id, status_update.status)
    
    # Get updated reservation
    reservations = get_all_reservations()
    updated_reservation = next((r for r in reservations if r.get("id") == reservation_id), None)
    
    if not updated_reservation:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reservation status updated but could not retrieve updated reservation"
        )
    
    return {
        "id": updated_reservation.get("id"),
        "item_id": updated_reservation.get("item_id"),
        "item_name": updated_reservation.get("item_name", ""),
        "student_name": updated_reservation.get("student_name", ""),
        "student_id": updated_reservation.get("student_id", ""),
        "quantity": updated_reservation.get("quantity", 0),
        "start_date": updated_reservation.get("start_date"),
        "end_date": updated_reservation.get("end_date"),
        "user_id": updated_reservation.get("user_id"),
        "notes": updated_reservation.get("notes", ""),
        "status": updated_reservation.get("status"),
        "created_at": updated_reservation.get("created_at")
    }

@router.get("/{reservation_id}", response_model=ReservationResponse)
async def read_reservation(reservation_id: int, current_user = Depends(get_current_user)):
    """
    Get a specific reservation by ID
    """
    # Get all reservations to find the requested one
    if current_user.role == "student":
        reservations = get_user_reservations(current_user.id)
    else:
        reservations = get_all_reservations()
    
    reservation = next((r for r in reservations if r.get("id") == reservation_id), None)
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with id {reservation_id} not found"
        )
    
    # For students, only allow them to see their own reservations
    if current_user.role == "student" and reservation.get("student_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this reservation"
        )
    
    return {
        "id": reservation.get("id"),
        "item_id": reservation.get("item_id"),
        "item_name": reservation.get("item_name", ""),
        "student_name": reservation.get("student_name", ""),
        "student_id": reservation.get("student_id", ""),
        "quantity": reservation.get("quantity", 0),
        "start_date": reservation.get("start_date"),
        "end_date": reservation.get("end_date"),
        "user_id": reservation.get("user_id"),
        "notes": reservation.get("notes", ""),
        "status": reservation.get("status", "pending"),
        "created_at": reservation.get("created_at")
    }