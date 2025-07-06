# מערכת ניהול מחסן השאלות - Cinema Equipment Management System

## Overview

This is a bilingual (Hebrew/English) cinema equipment lending management system built with Python (Streamlit) and React frontends, designed for managing equipment loans and reservations in a film school or production environment. The system supports equipment inventory management, student loan tracking, reservations, maintenance scheduling, and comprehensive analytics.

## System Architecture

### Frontend Architecture
- **Primary Frontend**: Streamlit-based web application (`main.py`) with Hebrew RTL support
- **Alternative Frontend**: React application (`react-app/`) for modern web interface
- **Styling**: Custom CSS with Hebrew fonts (IBM Plex Sans Hebrew) and RTL layout support
- **UI Components**: Modular component structure in `components/` directory

### Backend Architecture
- **Database**: PostgreSQL with connection pooling via psycopg2
- **Authentication**: Custom user management with role-based access control (students, warehouse staff)
- **API Layer**: Python scripts in `react-app/api/` directory for React frontend integration
- **Data Processing**: Excel import/export functionality with pandas

### Database Schema
The system uses PostgreSQL with the following key tables:
- `items`: Equipment inventory with categories, quantities, availability status
- `loans`: Active and historical equipment loans
- `reservations`: Future equipment reservations
- `users`: User accounts with roles and permissions
- `maintenance_schedules`: Equipment maintenance tracking
- `maintenance_status`: Current maintenance status of items

## Key Components

### Inventory Management (`components/inventory.py`)
- Real-time equipment tracking and availability monitoring
- Add, update, delete inventory items
- Category-based organization
- Availability toggling and quantity management

### Loan Management (`components/loans.py`)
- Create new equipment loans with due dates
- Track active loans and overdue items
- Return processing with notes
- Student-specific loan history

### Reservation System (`components/reservations.py`)
- Future equipment booking system
- Date conflict prevention
- Approval workflow for reservations
- Integration with loan system

### Analytics & Reporting (`components/statistics.py`)
- Equipment usage trends and patterns
- Student activity analytics
- Monthly/yearly reporting
- Advanced analytics with predictive features

### Maintenance Tracking (`maintenance.py`, `api/maintenance.py`)
- Equipment maintenance scheduling
- Service history tracking
- Preventive maintenance alerts
- Warranty and service record management

## Data Flow

1. **User Authentication**: Users log in through Streamlit or React interface
2. **Inventory Access**: Equipment data flows from PostgreSQL through database layer
3. **Loan Processing**: Create loan → Check availability → Update inventory → Generate tracking
4. **Reservation Workflow**: Request reservation → Check conflicts → Approval process → Convert to loan
5. **Analytics Pipeline**: Historical data → Statistical analysis → Visualization → Reports

## External Dependencies

### Python Dependencies
- `streamlit`: Web application framework
- `psycopg2`: PostgreSQL database adapter
- `pandas`: Data manipulation and Excel processing
- `plotly`: Interactive data visualization
- `openpyxl`: Excel file processing
- `werkzeug`: Password hashing utilities
- `pytz`: Timezone handling for Israel time

### JavaScript Dependencies (React App)
- `react`: Frontend framework
- `@mui/material`: Material-UI components with RTL support
- `axios`: HTTP client for API communication
- `recharts`: Charts and data visualization
- `stylis-plugin-rtl`: RTL CSS processing
- `jwt-decode`: JWT token handling

### Database Requirements
- PostgreSQL 12+ with connection pooling
- Database URL configuration via environment variable

## Deployment Strategy

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Timezone configuration for Israel (Asia/Jerusalem)
- Custom CSS and font loading for Hebrew support

### Application Deployment
- Streamlit app serves as primary interface on default port
- React development server on port 5000 with proxy configuration
- Python API scripts handle React frontend requests
- Static asset serving for fonts and styling

### Database Initialization
- Automatic table creation via `init_db()` function
- Excel import capability for initial data loading
- Migration-friendly schema design

## Authentication Credentials
### Admin Login
- Username: admin
- Password: admin

### Other Admin Users
- Username: bennyit (IT Admin)
- Username: mahsan (Warehouse Admin)

### Test User Login
- Username: test  
- Password: 123456

## Changelog
- June 29, 2025. Initial setup
- June 29, 2025. Completed comprehensive responsive design implementation across entire application
- June 29, 2025. Successfully updated all references from "אשף הוינטג'" to "אשף ההזמנות" (Order Wizard) throughout the system
- June 29, 2025. Confirmed API functionality: system successfully serves 257 equipment items to frontend
- July 2, 2025. Added template management system for order wizard - admins can now configure equipment combinations
- July 2, 2025. Fixed navigation routing to ensure admin/warehouse staff see proper management interface  
- July 2, 2025. Added "ניהול מערכי הזמנות" button to main admin navigation menu
- July 3, 2025. Fixed critical dashboard timeout issue by optimizing database queries - reduced response time from 30+ seconds to under 3 seconds
- July 3, 2025. Fixed authentication system to support both scrypt and bcrypt password formats - resolved post-deployment login errors
- July 3, 2025. Fixed deployment configuration to use React production build with Node.js server on port 5000
- July 6, 2025. Fixed post-deployment authentication issues - completed login.py and verify_token.py with full support for bcrypt, scrypt, and plain text passwords
- July 6, 2025. Implemented universal dashboard routing - all users (admin, warehouse staff, students) now redirect to dashboard after login instead of role-specific pages

## User Preferences

Preferred communication style: Simple, everyday language.