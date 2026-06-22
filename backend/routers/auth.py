import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt

import models
from database import get_db

# APIRouter helps us split our API endpoints into different files.
router = APIRouter()

# Pydantic schemas are like forms that define what data the client is sending or expecting to receive.
class LoginRequest(BaseModel):
    user_id: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: str
    dob: str  # YYYY-MM-DD format

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


# Helper functions to hash and check passwords
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that the plain text password matches the saved bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash of a plain text password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# FR-010, FR-011, FR-012: Officer Login
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Logs in an officer by checking their user_id and password.
    
    Implements:
    - FR-010: Requires User ID and Password
    - FR-012: Returns error message if credentials do not match
    - FR-011: Upon success, redirects the frontend (by returning user info + success)
    """
    # Look up the user in the database
    user = db.query(models.User).filter(models.User.user_id == payload.user_id).first()
    
    # If user doesn't exist or is deactivated
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or Password"
        )
        
    # Verify the password hash
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or Password"
        )
        
    # Return user details on successful login (no token is required for standalone LAN environment)
    return {
        "success": True,
        "user_id": user.user_id,
        "name": user.name,
        "role": user.role,
        "dob": user.dob.isoformat()
    }


# FR-021, FR-022: Birthday overlay
@router.get("/birthdays")
def get_birthdays(db: Session = Depends(get_db)):
    """Returns a list of all active users who have their birthday today.
    
    Implements:
    - FR-021: Identifies active users whose birthday matches today's month and day.
    - FR-022: Multiple users can be stacked if they share the same birthday.
    """
    today = datetime.date.today()
    all_users = db.query(models.User).filter(models.User.is_active == True).all()
    
    birthday_users = []
    for user in all_users:
        # Check if month and day match (ignoring the birth year)
        if user.dob.month == today.month and user.dob.day == today.day:
            birthday_users.append(user.name)
            
    return {"birthday_names": birthday_users}


# FR-150: View profile details
@router.get("/profile/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db)):
    """Retrieves profile details for a specific user.
    
    Implements:
    - FR-150: Returns User ID, Name, DOB, and Role.
    - FR-152: Returns details of any pending profile edits (so frontend can show badge).
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if there is a pending edit request for this user
    pending = db.query(models.PendingProfileEdit).filter(
        models.PendingProfileEdit.user_id == user_id,
        models.PendingProfileEdit.status == "Pending"
    ).order_by(models.PendingProfileEdit.requested_on.desc()).first()
    
    pending_details = None
    if pending:
        pending_details = pending.proposed_changes
        
    return {
        "user_id": user.user_id,
        "pb_no": user.pb_no,
        "name": user.name,
        "dob": user.dob.isoformat(),
        "role": user.role,
        "pending_changes": pending_details
    }


# FR-151, FR-152, FR-153: Edit profile details
@router.put("/profile/{user_id}")
def update_profile(user_id: str, payload: ProfileUpdateRequest, db: Session = Depends(get_db)):
    """Submits a profile change request for Admin approval.
    
    Implements:
    - FR-151: Changes are stored in pending_profile_edits and not applied immediately.
    - FR-153: Any prior pending profile edit request for this user is overwritten (deleted).
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        dob_parsed = datetime.datetime.strptime(payload.dob, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    # Delete previous pending edits for this user (FR-153)
    db.query(models.PendingProfileEdit).filter(
        models.PendingProfileEdit.user_id == user_id,
        models.PendingProfileEdit.status == "Pending"
    ).delete()
    
    # Create the new pending profile edit request
    new_pending = models.PendingProfileEdit(
        user_id=user_id,
        proposed_changes={
            "name": payload.name,
            "dob": payload.dob
        },
        status="Pending"
    )
    db.add(new_pending)
    db.commit()
    
    return {"message": "Profile edit submitted for Admin approval.", "success": True}


# FR-154: Change Password
@router.put("/profile/{user_id}/password")
def change_password(user_id: str, payload: PasswordChangeRequest, db: Session = Depends(get_db)):
    """Modifies the user's password directly without Admin approval.
    
    Implements:
    - FR-154: Verifies the current password and saves the bcrypt hash of the new password immediately.
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if current password is correct
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    # Hash and save the new password
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    
    return {"message": "Password changed successfully.", "success": True}
