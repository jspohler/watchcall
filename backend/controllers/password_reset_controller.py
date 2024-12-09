from flask import Blueprint, jsonify, request, current_app
from models import db, User
from email_validator import validate_email, EmailNotValidError
from utils.email_notifier import EmailNotifier

password_reset_bp = Blueprint('password_reset', __name__)

@password_reset_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({"error": "Email is required"}), 400

    try:
        # Validate email format
        validate_email(data['email'])
    except EmailNotValidError as e:
        return jsonify({"error": str(e)}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user:
        # Don't reveal if email exists or not
        return jsonify({
            "message": "If an account exists with this email, you will receive a password reset link"
        })

    # Generate reset token
    reset = user.create_reset_token()
    
    # Create reset link
    reset_link = f"http://localhost:3003/reset-password/{reset.token}"

    # Send email
    notifier = EmailNotifier()
    try:
        msg = f"""
        Hello {user.username},

        You have requested to reset your password for your WatchCall account.
        Click the link below to reset your password:

        {reset_link}

        This link will expire in 1 hour.

        If you did not request this reset, please ignore this email.

        Best regards,
        WatchCall Team
        """

        notifier.send_email(
            subject="WatchCall Password Reset",
            recipient=user.email,
            body=msg
        )
    except Exception as e:
        return jsonify({"error": "Failed to send reset email"}), 500

    return jsonify({
        "message": "If an account exists with this email, you will receive a password reset link"
    })

@password_reset_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    if not data or 'new_password' not in data:
        return jsonify({"error": "New password is required"}), 400

    user = User.verify_reset_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired reset token"}), 400

    # Update password
    user.set_password(data['new_password'])
    
    # Mark token as used
    reset = user.reset_tokens[-1]
    reset.used = True
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update password"}), 500

    return jsonify({"message": "Password has been reset successfully"}) 