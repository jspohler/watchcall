from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from models import db, StreamingAvailability, User

streaming_bp = Blueprint('streaming', __name__)

VALID_SERVICES = ['Netflix', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Sky', 'WOW']

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return None

@streaming_bp.route('/streaming/<movie_id>', methods=['GET'])
@login_required
def get_streaming_availability(movie_id):
    availabilities = StreamingAvailability.query.filter_by(
        movie_id=movie_id,
        region='DE'  # For now, hardcoded to Germany
    ).all()
    return jsonify([avail.to_dict() for avail in availabilities])

@streaming_bp.route('/streaming/<movie_id>', methods=['POST'])
@login_required
def add_streaming_availability(movie_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    service = data.get('service')
    if not service or service not in VALID_SERVICES:
        return jsonify({"error": "Invalid streaming service"}), 400

    # Parse dates
    available_from = parse_date(data.get('available_from'))
    available_until = parse_date(data.get('available_until'))

    # Check if entry already exists
    existing = StreamingAvailability.query.filter_by(
        movie_id=movie_id,
        service=service,
        region='DE'
    ).first()

    if existing:
        # Update existing entry
        existing.available_from = available_from
        existing.available_until = available_until
        existing.updated_at = datetime.utcnow()
    else:
        # Create new entry
        availability = StreamingAvailability(
            movie_id=movie_id,
            service=service,
            available_from=available_from,
            available_until=available_until,
            region='DE',
            added_by_user_id=current_user.id
        )
        db.session.add(availability)

    try:
        db.session.commit()
        return jsonify({"message": "Streaming availability updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@streaming_bp.route('/streaming/<movie_id>/<int:availability_id>', methods=['DELETE'])
@login_required
def delete_streaming_availability(movie_id, availability_id):
    availability = StreamingAvailability.query.get_or_404(availability_id)
    
    # Verify the movie_id matches
    if availability.movie_id != movie_id:
        return jsonify({"error": "Invalid movie ID"}), 400

    try:
        db.session.delete(availability)
        db.session.commit()
        return jsonify({"message": "Streaming availability deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@streaming_bp.route('/services', methods=['GET'])
@login_required
def get_services():
    return jsonify(VALID_SERVICES)

@streaming_bp.route('/user/services', methods=['GET'])
@login_required
def get_user_services():
    return jsonify(current_user.streaming_services or [])

@streaming_bp.route('/user/services', methods=['PUT'])
@login_required
def update_user_services():
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Invalid data format. Expected list of services"}), 400
    
    # Validate services
    for service in data:
        if service not in VALID_SERVICES:
            return jsonify({"error": f"Invalid streaming service: {service}"}), 400
    
    try:
        current_user.streaming_services = data
        db.session.commit()
        return jsonify({"message": "Streaming services updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 