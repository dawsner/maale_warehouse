from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import sys
import os

# Add parent directory to path so we can import from existing project
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import from existing project
from components.statistics import (
    calculate_equipment_usage,
    calculate_student_statistics,
    calculate_monthly_trends,
    calculate_category_analysis
)
from api.auth import get_current_user, get_current_active_user

router = APIRouter()

@router.get("/equipment-usage")
async def get_equipment_usage(current_user = Depends(get_current_user)):
    """
    Get equipment usage statistics
    """
    # Only staff and admin can access statistics
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics"
        )
    
    try:
        equipment_usage = calculate_equipment_usage()
        return {"data": equipment_usage}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate equipment usage: {str(e)}"
        )

@router.get("/student-statistics")
async def get_student_statistics(current_user = Depends(get_current_user)):
    """
    Get student statistics
    """
    # Only staff and admin can access statistics
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics"
        )
    
    try:
        student_stats = calculate_student_statistics()
        return {"data": student_stats}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate student statistics: {str(e)}"
        )

@router.get("/monthly-trends")
async def get_monthly_trends(current_user = Depends(get_current_user)):
    """
    Get monthly trends
    """
    # Only staff and admin can access statistics
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics"
        )
    
    try:
        trends = calculate_monthly_trends()
        return {"data": trends}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate monthly trends: {str(e)}"
        )

@router.get("/category-analysis")
async def get_category_analysis(current_user = Depends(get_current_user)):
    """
    Get category analysis
    """
    # Only staff and admin can access statistics
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics"
        )
    
    try:
        categories = calculate_category_analysis()
        return {"data": categories}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate category analysis: {str(e)}"
        )

@router.get("/overview")
async def get_statistics_overview(current_user = Depends(get_current_user)):
    """
    Get overview of all statistics in one request
    """
    # Only staff and admin can access statistics
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access statistics"
        )
    
    try:
        equipment_usage = calculate_equipment_usage()
        student_stats = calculate_student_statistics()
        trends = calculate_monthly_trends()
        categories = calculate_category_analysis()
        
        return {
            "equipment_usage": equipment_usage,
            "student_statistics": student_stats,
            "monthly_trends": trends,
            "category_analysis": categories
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not calculate statistics overview: {str(e)}"
        )