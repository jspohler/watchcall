from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
import os
from dotenv import load_dotenv, set_key
from pathlib import Path
from scrapers.streaming_scraper import update_all_movies
from models import db, User

admin_bp = Blueprint('admin', __name__)

def is_admin(user):
    # You might want to add an is_admin field to your User model
    # For now, we'll consider the first user (ID=1) as admin
    return user.id == 1

def admin_required(f):
    @login_required
    def decorated_function(*args, **kwargs):
        if not is_admin(current_user):
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': is_admin(user)
    } for user in users])

@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    if user_id == current_user.id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    
    user = User.query.get_or_404(user_id)
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": f"User {user.username} deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/make-admin', methods=['POST'])
@admin_required
def make_admin(user_id):
    if user_id == current_user.id:
        return jsonify({"error": "You are already an admin"}), 400
    
    user = User.query.get_or_404(user_id)
    try:
        # Since we're using ID=1 as admin check, we can't actually make other users admin
        # This would need to be updated when implementing proper admin field
        return jsonify({"error": "Feature not implemented yet"}), 501
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/admin/env', methods=['GET'])
@admin_required
def get_env_vars():
    # List of environment variables that are safe to expose
    SAFE_ENV_VARS = [
        'PORT',
        'FLASK_ENV',
        'OMDB_API_KEY',
        'SMTP_SERVER',
        'SMTP_PORT',
        'SMTP_USERNAME',
        'NOTIFICATION_EMAIL'
    ]
    
    env_vars = {}
    for var in SAFE_ENV_VARS:
        env_vars[var] = os.getenv(var, '')
    
    return jsonify(env_vars)

@admin_bp.route('/admin/env', methods=['PUT'])
@admin_required
def update_env_vars():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # List of environment variables that are allowed to be updated
    ALLOWED_ENV_VARS = [
        'PORT',
        'FLASK_ENV',
        'OMDB_API_KEY',
        'SMTP_SERVER',
        'SMTP_PORT',
        'SMTP_USERNAME',
        'SMTP_PASSWORD',
        'NOTIFICATION_EMAIL'
    ]

    env_file = Path('.env')
    if not env_file.exists():
        return jsonify({"error": ".env file not found"}), 500

    try:
        for key, value in data.items():
            if key in ALLOWED_ENV_VARS:
                # Update .env file
                set_key(env_file, key, value)
                # Update current environment
                os.environ[key] = value

        # Reload environment variables
        load_dotenv()
        
        return jsonify({"message": "Environment variables updated successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to update environment variables: {str(e)}"}), 500

@admin_bp.route('/admin/scrape', methods=['POST'])
@admin_required
def trigger_scraping():
    try:
        # Run the scraping in a separate thread to not block the response
        from threading import Thread
        thread = Thread(target=update_all_movies)
        thread.start()
        
        return jsonify({
            "message": "Scraping process started",
            "status": "running"
        })
    except Exception as e:
        return jsonify({
            "error": f"Failed to start scraping: {str(e)}"
        }), 500 