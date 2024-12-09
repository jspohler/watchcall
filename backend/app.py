from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager
from dotenv import load_dotenv
import os

from models import db
from controllers.user_controller import user_bp, load_user
from controllers.movie_controller import movie_bp
from controllers.streaming_controller import streaming_bp
from controllers.password_reset_controller import password_reset_bp
from controllers.admin_controller import admin_bp
from scheduler import init_scheduler

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS properly
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["http://localhost:3003"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type"]
         }
     })

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)

# Set up login manager
login_manager.user_loader(load_user)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(movie_bp, url_prefix='/api')
app.register_blueprint(streaming_bp, url_prefix='/api')
app.register_blueprint(password_reset_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')

def reset_database():
    """Drop all tables and recreate them"""
    with app.app_context():
        # Drop all tables
        db.drop_all()
        # Create all tables with updated schema
        db.create_all()
        print("Database has been reset successfully!")

# Create database tables
with app.app_context():
    db.create_all()

# Initialize scheduler
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    init_scheduler()

if __name__ == '__main__':
    # Check if we need to reset the database
    if os.environ.get('RESET_DB') == 'true':
        reset_database()
    app.run(debug=True, port=int(os.getenv('PORT', 5000))) 