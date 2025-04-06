import streamlit as st
import pandas as pd
from utils import get_overdue_loans
from datetime import datetime
from auth import require_role
from database import return_loan, get_db_connection

def show_overdue_alerts():
    st.markdown('<h1 class="title">השאלות באיחור</h1>', unsafe_allow_html=True)
    
    # Modern filter buttons like in the reference
    st.markdown("""
    <div class="filters-row">
        <div class="filter-button active" id="filter-all" onclick="setFilter('all')">
            הכל
        </div>
        <div class="filter-button" id="filter-week1" onclick="setFilter('week1')">
            שבוע 1
        </div>
        <div class="filter-button" id="filter-week2" onclick="setFilter('week2')">
            שבועיים
        </div>
        <div class="filter-button" id="filter-week3plus" onclick="setFilter('week3plus')">
            +3 שבועות
        </div>
    </div>
    
    <style>
        .filters-row {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .filter-button {
            background-color: #F5F7FA;
            color: #333;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            border: 1px solid #E6E9EF;
        }
        
        .filter-button:hover {
            background-color: #E6F4FF;
        }
        
        .filter-button.active {
            background-color: #0095FF;
            color: white;
            border-color: #0095FF;
        }
        
        /* Table styling to match reference */
        .modern-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .modern-table thead th {
            background-color: #F5F7FA;
            color: #333;
            font-weight: 600;
            text-align: right;
            padding: 16px;
            border-bottom: 1px solid #E6E9EF;
        }
        
        .modern-table tbody td {
            padding: 16px;
            border-bottom: 1px solid #E6E9EF;
            color: #333;
        }
        
        .modern-table tbody tr:hover {
            background-color: #F9FAFC;
        }
        
        .status-pill {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 500;
        }
        
        .status-week1 {
            background-color: #E6F4FF;
            color: #0095FF;
        }
        
        .status-week2 {
            background-color: #FFF8E1;
            color: #F9A825;
        }
        
        .status-week3plus {
            background-color: #FFEBEE;
            color: #E53935;
        }
        
        .action-button {
            display: inline-block;
            color: #0095FF;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
        }
    </style>
    
    <script>
        function setFilter(filter) {
            // Remove active class from all filters
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected filter
            document.getElementById('filter-' + filter).classList.add('active');
            
            // Show/hide rows based on filter
            const rows = document.querySelectorAll('table.modern-table tbody tr');
            
            if (filter === 'all') {
                rows.forEach(row => row.style.display = '');
            } else {
                rows.forEach(row => {
                    const statusPill = row.querySelector('.status-pill');
                    if (statusPill && statusPill.classList.contains('status-' + filter)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        }
    </script>
    """, unsafe_allow_html=True)
    
    # Hidden filters but still functional
    with st.container():
        st.markdown('<div style="display: none">', unsafe_allow_html=True)
        col1, col2 = st.columns(2)
        with col1:
            days_filter = st.slider(
                "הצג איחורים מעל X ימים",
                min_value=1,
                max_value=30,
                value=1
            )
        
        with col2:
            sort_order = st.selectbox(
                "מיון לפי",
                ["ימי איחור", "תאריך השאלה", "שם סטודנט"],
                format_func=lambda x: {
                    "ימי איחור": "ימי איחור (יורד)",
                    "תאריך השאלה": "תאריך השאלה (עולה)",
                    "שם סטודנט": "שם סטודנט (א-ב)"
                }[x]
            )
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Get overdue loans
    overdue_df = get_overdue_loans()
    
    if overdue_df.empty:
        st.success("אין השאלות באיחור")
        return
    
    # Apply days filter
    overdue_df = overdue_df[overdue_df['days_overdue'] >= days_filter]
    
    if overdue_df.empty:
        st.info(f"אין השאלות באיחור של {days_filter} ימים או יותר")
        return
    
    # Sort based on user selection
    if sort_order == "ימי איחור":
        overdue_df = overdue_df.sort_values('days_overdue', ascending=False)
    elif sort_order == "תאריך השאלה":
        overdue_df = overdue_df.sort_values('loan_date')
    else:  # שם סטודנט
        overdue_df = overdue_df.sort_values('student_name')
    
    # Prepare the table data
    table_data = []
    for _, loan in overdue_df.iterrows():
        days_overdue = int(loan['days_overdue'])
        due_date_str = loan['due_date'].strftime('%d %b, %Y')
        return_date_str = (loan['due_date'] + pd.Timedelta(days=days_overdue)).strftime('%d %b, %Y')
        
        status_weeks = "3weeks"
        status_text = "3 שבועות"
        if days_overdue <= 7:
            status_weeks = "week1"
            status_text = "שבוע 1"
        elif days_overdue <= 14:
            status_weeks = "week2"
            status_text = "שבועיים"
        else:
            status_weeks = "week3plus"
        
        table_data.append({
            "borrower": loan['student_name'],
            "item": loan['item_name'],
            "due": due_date_str,
            "return": return_date_str,
            "status_text": status_text,
            "status_class": status_weeks,
            "id": loan['id'],
            "student_id": loan['student_id'],
            "quantity": loan['quantity'],
            "loan_date": loan['loan_date'].strftime('%Y-%m-%d %H:%M'),
            "due_date": loan['due_date'].strftime('%Y-%m-%d %H:%M'),
            "loan_notes": loan.get('loan_notes', '')
        })
    
    # Create a modern HTML table like in the reference image
    table_html = """
    <table class="modern-table">
        <thead>
            <tr>
                <th>שואל</th>
                <th>פריט</th>
                <th>תאריך החזרה</th>
                <th>תאריך השאלה</th>
                <th>סטטוס</th>
                <th>פעולה</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for idx, loan in enumerate(table_data):
        table_html += f"""
        <tr>
            <td>{loan['borrower']}</td>
            <td>{loan['item']}</td>
            <td>{loan['due']}</td>
            <td>{loan['return']}</td>
            <td>
                <span class="status-pill status-{loan['status_class']}">
                    {loan['status_text']}
                </span>
            </td>
            <td>
                <div id="loan_action_{idx}" class="action-button">
                    סמן כהוחזר
                </div>
            </td>
        </tr>
        """
    
    table_html += """
        </tbody>
    </table>
    """
    
    st.markdown(table_html, unsafe_allow_html=True)
    
    # Hidden buttons for actions
    for idx, loan in enumerate(table_data):
        if st.button("סמן כהוחזר", key=f"return_alert_{loan['id']}_{idx}", type="primary"):
            if return_loan(loan['id']):
                st.success("הציוד הוחזר בהצלחה")
                st.rerun()
            else:
                st.error("שגיאה בביצוע ההחזרה")
    
    # Use JavaScript to move the buttons into the table
    st.markdown("""
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Wait for Streamlit to finish rendering
            setTimeout(function() {
                const buttons = document.querySelectorAll('[data-testid="baseButton-primary"]');
                buttons.forEach((button, idx) => {
                    const target = document.getElementById(`loan_action_${idx}`);
                    if (target) {
                        target.innerHTML = '';
                        target.appendChild(button);
                        
                        // Style the button to match the reference
                        button.style.backgroundColor = "transparent";
                        button.style.color = "#0095FF";
                        button.style.border = "none";
                        button.style.padding = "0";
                        button.style.fontWeight = "500";
                        button.style.boxShadow = "none";
                        button.innerText = "סמן כהוחזר";
                    }
                });
            }, 1000);
        });
    </script>
    """, unsafe_allow_html=True)
