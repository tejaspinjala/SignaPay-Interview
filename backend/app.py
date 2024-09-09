from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import csv
import os
import pandas as pd

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the app

# Constants for file paths
CSV_FILE = 'users.csv'
UPLOAD_FOLDER = 'uploads'  # Folder to save uploaded files
ALLOWED_EXTENSIONS = {'csv'}  # Set of allowed file extensions
DATA_FILE = os.path.join(UPLOAD_FOLDER, 'data.csv')
BAD_DATA_CSV = os.path.join(UPLOAD_FOLDER, 'bad_data.csv')
GOOD_DATA_CSV = os.path.join(UPLOAD_FOLDER, 'good_data.csv')
CHART_OF_ACCOUNTS_CSV = os.path.join(UPLOAD_FOLDER, 'chart_of_accounts.csv')
COLLECTIONS_ACCOUNTS_CSV = os.path.join(UPLOAD_FOLDER, 'collections_accounts.csv')
COLUMN_NAMES = ['Account Name', 'Card Number', 'Transaction Amount', 'Transaction Type', 'Description', 'Target Card Number']

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def init_csv():
    """Initializes the users CSV file with a header row if it does not already exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['Username', 'Email', 'Password'])

def user_exists(username, email):
    """Checks if a user with the given username or email already exists in the CSV.

    Args:
        username: The username to check.
        email: The email to check.

    Returns:
        True if the user exists, False otherwise.
    """
    if not os.path.exists(CSV_FILE) or os.path.getsize(CSV_FILE) == 0:
        return False
    with open(CSV_FILE, 'r') as file:
        reader = csv.reader(file)
        next(reader, None)
        for row in reader:
            if row and (row[0].lower() == username.lower() or row[1].lower() == email.lower()):
                return True
    return False

def save_user(username, email, password):
    """Saves a new user to the CSV file after hashing the password.

    Args:
        username: The username of the new user.
        email: The email of the new user.
        password: The plaintext password of the new user.
    """
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    with open(CSV_FILE, 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([username, email, hashed_password.decode('utf-8')])

@app.route('/api/create-account', methods=['POST'])
def create_account():
    """API endpoint to create a new user account.

    Expects JSON data with username, email, password, and confirmPassword.
    Returns an error message if the data is invalid or the user already exists.
    """
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')

    # Basic validation
    if not all([username, email, password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    # Check if username or email already exists
    if user_exists(username, email):
        return jsonify({'error': 'Username or email already exists'}), 400

    # Save user to CSV file
    save_user(username, email, password)

    return jsonify({'message': 'Account created successfully'}), 201

@app.route('/users', methods=['GET'])
def display_users():
    """API endpoint to display all users without their passwords."""
    users = []
    if os.path.exists(CSV_FILE) and os.path.getsize(CSV_FILE) > 0:
        with open(CSV_FILE, 'r') as file:
            reader = csv.reader(file)
            next(reader, None)  # Skip header row
            for row in reader:
                if row:  # Check if the row is not empty
                    users.append({'username': row[0], 'email': row[1]})
    return jsonify(users)

def check_credentials(username, password):
    """Checks if the provided username and password match the stored credentials.

    Args:
        username: The username to check.
        password: The plaintext password to verify.

    Returns:
        True if the credentials are correct, False otherwise.
    """
    if not os.path.exists(CSV_FILE):
        return False
    
    with open(CSV_FILE, 'r') as file:
        reader = csv.reader(file)
        next(reader, None)
        for row in reader:
            if row and row[0] == username:
                stored_password = row[2].encode('utf-8')
                return bcrypt.checkpw(password.encode('utf-8'), stored_password)
    return False

@app.route('/api/login', methods=['POST'])
def login():
    """API endpoint for user login.

    Expects JSON data with username and password.
    Returns a success message if the credentials are correct.
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if check_credentials(username, password):
        return jsonify({'message': 'Login successful', 'redirect': '/dashboard'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension.

    Args:
        filename: The name of the uploaded file.

    Returns:
        True if the file is allowed, False otherwise.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def append_to_data_file(new_file_path):
    """Appends content of a new CSV file to the existing data file.

    Args:
        new_file_path: Path to the new CSV file to append.

    Raises:
        RuntimeError: If the file is empty or improperly formatted.
    """
    try:
        with open(new_file_path, 'r') as new_file:
            reader = csv.reader(new_file)
            new_data = list(reader)

        # Check if the file has header and data
        if len(new_data) == 0 or len(new_data[0]) == 0:
            raise ValueError("The uploaded CSV file is empty or improperly formatted.")

        # Check if the data file exists and has content
        if os.path.exists(DATA_FILE) and os.path.getsize(DATA_FILE) > 0:
            with open(DATA_FILE, 'a', newline='') as data_file:
                writer = csv.writer(data_file)
                for row in new_data:
                    writer.writerow(row)  # Append each row
        else:
            # If DATA_FILE does not exist, create it with header from the first uploaded file
            with open(DATA_FILE, 'w', newline='') as data_file:
                writer = csv.writer(data_file)
                writer.writerows(new_data)

    except Exception as e:
        raise RuntimeError(f"Error appending to data file: {e}")

def is_valid_row(row):
    """Validates each row of a CSV file based on specific criteria.

    Args:
        row: A dictionary-like row from a pandas DataFrame.

    Returns:
        True if the row is valid, False otherwise.
    """
    if pd.isna(row['Account Name']) or pd.isna(row['Card Number']) or pd.isna(row['Transaction Amount']) or \
       pd.isna(row['Transaction Type']) or pd.isna(row['Description']):
        return False
    
    try:
        float(row['Card Number'])
        float(row['Transaction Amount'])
    except ValueError:
        return False
    
    if row['Transaction Type'] not in ['Credit', 'Debit', 'Transfer']:
        return False
    
    if row['Transaction Type'] == 'Transfer':
        if pd.isna(row['Target Card Number']):
            return False
        try:
            float(row['Target Card Number'])
        except ValueError:
            return False
    
    return True

def process_csv(input_csv, good_data_csv, bad_data_csv):
    """Processes the CSV file, separating valid and invalid rows.

    Args:
        input_csv: Path to the input CSV file.
        good_data_csv: Path to save the valid rows.
        bad_data_csv: Path to save the invalid rows.

    Returns:
        Tuple containing the counts of good and bad rows.
    """
    try:
        # Read the CSV with specific dtypes to prevent float conversion
        df = pd.read_csv(input_csv, header=None, names=COLUMN_NAMES, dtype={'Card Number': str, 'Target Card Number': str})
    except Exception as e:
        raise

    good_data = df[df.apply(is_valid_row, axis=1)]
    bad_data = df[~df.apply(is_valid_row, axis=1)]

    # Save the processed good and bad data
    good_data.to_csv(good_data_csv, index=False)
    bad_data.to_csv(bad_data_csv, index=False)

    return len(good_data), len(bad_data)

def generate_reports(good_data_csv, chart_of_accounts_csv, collections_accounts_csv):
    """Generates reports based on good transaction data.

    Args:
        good_data_csv: Path to the CSV file with valid transaction data.
        chart_of_accounts_csv: Path to save the chart of accounts report.
        collections_accounts_csv: Path to save the collections accounts report.
    """
    # Ensure card numbers are read as strings
    good_data = pd.read_csv(good_data_csv, dtype={'Card Number': str, 'Target Card Number': str})

    # Group data and calculate the total amount, ensuring no conversion issues with Card Number
    chart_of_accounts = good_data.groupby(['Account Name', 'Card Number'])['Transaction Amount'].sum().reset_index()
    chart_of_accounts.columns = ['Account Name', 'Card Number', 'Total Amount']

    # Round the 'Total Amount' column to 2 decimal places
    chart_of_accounts['Total Amount'] = chart_of_accounts['Total Amount'].round(2)

    # Save the chart of accounts to CSV
    chart_of_accounts.to_csv(chart_of_accounts_csv, index=False)

    # Filter accounts with negative total amounts for collections
    collections_accounts = chart_of_accounts[chart_of_accounts['Total Amount'] < 0]
    collections_accounts.to_csv(collections_accounts_csv, index=False)

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    """API endpoint for uploading and processing CSV files.

    Expects a CSV file upload and processes the file by appending, validating,
    and generating reports. Responds with counts of valid and invalid records.
    """
    if request.method == 'OPTIONS':
        return '', 200

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only CSV files are allowed.'}), 400

    try:
        # Save the uploaded file temporarily
        temp_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_data.csv')
        file.save(temp_file_path)

        # Append the contents of the new file to the existing data.csv
        append_to_data_file(temp_file_path)

        # Remove the temporary file after appending
        os.remove(temp_file_path)

        # Process the updated data.csv
        good_count, bad_count = process_csv(DATA_FILE, GOOD_DATA_CSV, BAD_DATA_CSV)

        # Generate reports based on the updated good data
        generate_reports(GOOD_DATA_CSV, CHART_OF_ACCOUNTS_CSV, COLLECTIONS_ACCOUNTS_CSV)

        return jsonify({
            'message': 'File uploaded and processed successfully',
            'good_records': good_count,
            'bad_records': bad_count
        }), 200

    except Exception as e:
        print(f"Error during file upload and processing: {e}")
        return jsonify({'error': 'An error occurred while processing the file'}), 500
    
def reset_data():
    """Clears all uploaded and processed data files by deleting them from the uploads folder."""
    if os.path.exists(UPLOAD_FOLDER):
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)  # Remove file
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")

@app.route('/api/reset', methods=['POST'])
def reset():
    """API endpoint to reset the system by clearing all uploaded and processed data."""
    try:
        reset_data()
        return jsonify({'message': 'System reset successfully'}), 200
    except Exception as e:
        print(f"Error during reset: {e}")
        return jsonify({'error': 'An error occurred while resetting the system'}), 500

@app.route('/api/chart-of-accounts', methods=['GET'])
def get_chart_of_accounts():
    """API endpoint to retrieve paginated Chart of Accounts data with optional search functionality."""
    search_term = request.args.get('search_term', '', type=str).lower()
    page = request.args.get('page', 1, type=int)
    items_per_page = request.args.get('items_per_page', 20, type=int)
    
    if not os.path.exists(CHART_OF_ACCOUNTS_CSV):
        return jsonify({'error': 'Chart of Accounts not found'}), 404

    try:
        # Load the CSV data
        chart_of_accounts = pd.read_csv(CHART_OF_ACCOUNTS_CSV)
        
        # Filter by search term if provided
        if search_term:
            chart_of_accounts = chart_of_accounts[
                chart_of_accounts['Account Name'].str.lower().str.contains(search_term) |
                chart_of_accounts['Card Number'].astype(str).str.contains(search_term)
            ]
        # Calculate pagination
        total_items = len(chart_of_accounts)
        start = (page - 1) * items_per_page
        end = start + items_per_page
        paginated_accounts = chart_of_accounts.iloc[start:end]

        result = paginated_accounts.to_dict(orient='records')

        return jsonify({
            'chart_of_accounts': result,
            'total_items': total_items,
            'total_pages': (total_items + items_per_page - 1) // items_per_page,
            'current_page': page,
        }), 200
    except Exception as e:
        print(f"Error reading chart of accounts: {e}")
        return jsonify({'error': 'An error occurred while retrieving the chart of accounts'}), 500
    
@app.route('/api/collections-accounts', methods=['GET'])
def get_collections_accounts():
    """API endpoint to retrieve paginated Collections Accounts data with optional search functionality."""
    search_term = request.args.get('search_term', '', type=str).lower()
    page = request.args.get('page', 1, type=int)
    items_per_page = request.args.get('items_per_page', 20, type=int)

    if not os.path.exists(COLLECTIONS_ACCOUNTS_CSV):
        return jsonify({'error': 'Collections Accounts not found'}), 404

    try:
        # Load the collections accounts CSV data
        collections_accounts = pd.read_csv(COLLECTIONS_ACCOUNTS_CSV)
        
        # Filter by search term if provided
        if search_term:
            collections_accounts = collections_accounts[
                collections_accounts['Account Name'].str.lower().str.contains(search_term) |
                collections_accounts['Card Number'].astype(str).str.contains(search_term)
            ]

        # Calculate pagination
        total_items = len(collections_accounts)
        start = (page - 1) * items_per_page
        end = start + items_per_page
        paginated_accounts = collections_accounts.iloc[start:end]

        result = paginated_accounts.to_dict(orient='records')

        return jsonify({
            'collections_accounts': result,
            'total_items': total_items,
            'total_pages': (total_items + items_per_page - 1) // items_per_page,
            'current_page': page,
        }), 200
    except Exception as e:
        print(f"Error reading collections accounts: {e}")
        return jsonify({'error': 'An error occurred while retrieving the collections accounts'}), 500

@app.route('/api/bad-transactions', methods=['GET'])
def get_bad_transactions():
    """API endpoint to retrieve paginated Bad Transactions data with optional search functionality."""
    search_term = request.args.get('search_term', '', type=str).lower()
    page = request.args.get('page', 1, type=int)
    items_per_page = request.args.get('items_per_page', 20, type=int)

    if not os.path.exists(BAD_DATA_CSV):
        return jsonify({'error': 'Bad Transactions not found'}), 404

    try:
        # Load the bad transactions CSV data
        bad_transactions = pd.read_csv(BAD_DATA_CSV)

        # Ensure 'Card Number' columns are read as strings to avoid float conversion
        if 'Card Number' in bad_transactions.columns:
            bad_transactions['Card Number'] = bad_transactions['Card Number'].astype(str)
        if 'Target Card Number' in bad_transactions.columns:
            bad_transactions['Target Card Number'] = bad_transactions['Target Card Number'].astype(str)

        # Filter by search term if provided
        if search_term:
            bad_transactions = bad_transactions[
                bad_transactions['Account Name'].str.lower().str.contains(search_term) |
                bad_transactions['Card Number'].str.contains(search_term)
            ]

        # Calculate pagination
        total_items = len(bad_transactions)
        start = (page - 1) * items_per_page
        end = start + items_per_page
        paginated_transactions = bad_transactions.iloc[start:end]

        result = paginated_transactions.to_dict(orient='records')

        return jsonify({
            'bad_transactions': result,
            'total_items': total_items,
            'total_pages': (total_items + items_per_page - 1) // items_per_page,
            'current_page': page,
        }), 200
    except Exception as e:
        print(f"Error reading bad transactions: {e}")
        return jsonify({'error': 'An error occurred while retrieving the bad transactions'}), 500

if __name__ == '__main__':
    init_csv()  # Initialize the users CSV file
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)  # Create the uploads folder if it doesn't exist
    app.run(debug=True, port=8000)