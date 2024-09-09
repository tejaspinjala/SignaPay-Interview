# Signapay Interview Backend

This is the backend server for the Signapay Interview project. The server is built with Flask and provides APIs for user management and file processing.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Python 3.7 or higher
- pip (Python package manager)

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd SIGNAPAY-INTERVIEW/backend

2. **Install the required dependencies:**
   pip install -r requirements.txt

3. **Running the server:**
   python app.py

It is recommended to use a virtual environment to avoid dependency conflicts.

## API Endpoints

Here are the main API endpoints available:
- Create Account - POST /api/create-account
    - Expects: JSON body with username, email, password, and confirmPassword.
    - Response: Success message or error message.
- Login - POST /api/login
    - Expects: JSON body with username and password.
    - Response: Success message or error message.
- Upload File - POST /api/upload
    - Expects: CSV file upload.
    - Response: Success message with details of processed data or error message.
- Reset System - POST /api/reset
    - Response: Success message or error message.
- Get Chart of Accounts - GET /api/chart-of-accounts
    - Query Parameters: page, items_per_page, search_term.
    - Response: Paginated chart of accounts data.
- Get Collections Accounts - GET /api/collections-accounts
    - Query Parameters: page, items_per_page, search_term.
    - Response: Paginated collections accounts data.
- Get Bad Transactions - GET /api/bad-transactions
    - Query Parameters: page, items_per_page, search_term.
    - Response: Paginated bad transactions data.