from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from existing project and API models
from database import get_all_items, add_item, update_item, delete_item, toggle_item_availability
from api.models import ItemCreate, ItemResponse, ItemUpdate
from api.auth import get_current_user, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ItemResponse])
async def read_items(skip: int = 0, limit: int = 100, current_user = Depends(get_current_user)):
    """
    Get all items in the inventory
    """
    items = get_all_items()
    
    # Convert the items to the expected format
    formatted_items = []
    for item in items:
        formatted_items.append({
            "id": item["id"],
            "name": item["name"],
            "category": item["category"],
            "quantity": item["quantity"],
            "notes": item.get("notes", ""),
            "is_available": item.get("is_available", True),
            "created_at": item.get("created_at", None)
        })
        
    return formatted_items[skip : skip + limit]

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate, current_user = Depends(get_current_active_user)):
    """
    Create a new item in the inventory
    """
    # Check if user has permissions to create items
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create items"
        )
    
    item_id = add_item(
        name=item.name,
        category=item.category,
        quantity=item.quantity,
        notes=item.notes
    )
    
    # Get the created item
    items = get_all_items()
    created_item = next((i for i in items if i["id"] == item_id), None)
    
    if not created_item:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Item created but could not be retrieved"
        )
    
    return {
        "id": created_item["id"],
        "name": created_item["name"],
        "category": created_item["category"],
        "quantity": created_item["quantity"],
        "notes": created_item.get("notes", ""),
        "is_available": created_item.get("is_available", True),
        "created_at": created_item.get("created_at", None)
    }

@router.put("/{item_id}", response_model=ItemResponse)
async def update_item_api(item_id: int, item: ItemUpdate, current_user = Depends(get_current_active_user)):
    """
    Update an existing item
    """
    # Check if user has permissions to update items
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update items"
        )
    
    # Get all items to check if the item exists
    items = get_all_items()
    existing_item = next((i for i in items if i["id"] == item_id), None)
    
    if not existing_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    
    # Update the item with new values or keep existing ones
    name = item.name if item.name is not None else existing_item["name"]
    category = item.category if item.category is not None else existing_item["category"]
    quantity = item.quantity if item.quantity is not None else existing_item["quantity"]
    notes = item.notes if item.notes is not None else existing_item.get("notes", "")
    
    update_item(item_id, name, category, quantity, notes)
    
    # If is_available was provided, update that too
    if item.is_available is not None and item.is_available != existing_item.get("is_available", True):
        toggle_item_availability(item_id, item.is_available)
    
    # Get the updated item
    items = get_all_items()
    updated_item = next((i for i in items if i["id"] == item_id), None)
    
    return {
        "id": updated_item["id"],
        "name": updated_item["name"],
        "category": updated_item["category"],
        "quantity": updated_item["quantity"],
        "notes": updated_item.get("notes", ""),
        "is_available": updated_item.get("is_available", True),
        "created_at": updated_item.get("created_at", None)
    }

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_api(item_id: int, current_user = Depends(get_current_active_user)):
    """
    Delete an item
    """
    # Check if user has permissions to delete items
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete items"
        )
    
    # Get all items to check if the item exists
    items = get_all_items()
    existing_item = next((i for i in items if i["id"] == item_id), None)
    
    if not existing_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found"
        )
    
    delete_item(item_id)
    
    return None