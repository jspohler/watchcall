from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from email_validator import validate_email, EmailNotValidError
from models import db, User, MovieList

user_bp = Blueprint('user', __name__)

def load_user(user_id):
    return User.query.get(int(user_id))

def create_default_lists(user_id):
    default_lists = ['Watchlist', 'Favorites']
    for list_name in default_lists:
        movie_list = MovieList(name=list_name, user_id=user_id, is_default=True)
        db.session.add(movie_list)
    db.session.commit()

def is_admin(user):
    return user.id == 1

@user_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate email
        try:
            validate_email(email)
        except EmailNotValidError as e:
            return jsonify({"error": str(e)}), 400

        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Create default lists
        create_default_lists(user.id)
        
        # Log the user in
        login_user(user)
        return jsonify({
            "message": "Signup successful",
            "user": {
                "id": user.id,
                "username": user.username, 
                "email": user.email,
                "is_admin": is_admin(user)
            }
        }), 201
        
    except Exception as e:
        print("Error in signup:", str(e))
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = data.get('username')
        password = data.get('password')

        if not all([username, password]):
            return jsonify({"error": "Missing username or password"}), 400

        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username, 
                    "email": user.email,
                    "is_admin": is_admin(user)
                }
            })
        
        return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "An error occurred during login"}), 500

@user_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"})

@user_bp.route('/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": is_admin(current_user)
    }) 