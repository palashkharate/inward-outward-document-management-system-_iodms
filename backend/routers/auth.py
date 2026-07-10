import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import ipaddress

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


# FR-010, FR-011, FR-012, FR-162: Officer Login with Security Auditing
@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Logs in an officer by checking their user_id and password.
    
    Implements:
    - FR-010: Requires User ID and Password
    - FR-012: Returns error message if credentials do not match
    - FR-011: Upon success, redirects the frontend
    - FR-162: Logs IP address and user-agent to LoginLog
    """
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # FR-172: Check IP against allowed_ips if any exist
    allowed_records = db.query(models.AllowedIP).all()
    if allowed_records:
        ip_allowed = False
        try:
            client_ip_obj = ipaddress.ip_address(ip_address)
            for record in allowed_records:
                try:
                    if '*' in record.ip_address:
                        prefix = record.ip_address.split('*')[0]
                        if ip_address.startswith(prefix):
                            ip_allowed = True
                            break
                    elif '/' in record.ip_address:
                        net = ipaddress.ip_network(record.ip_address, strict=False)
                        if client_ip_obj in net:
                            ip_allowed = True
                            break
                    else:
                        if client_ip_obj == ipaddress.ip_address(record.ip_address):
                            ip_allowed = True
                            break
                except ValueError:
                    continue
        except ValueError:
            pass # Invalid IP format from client

        if not ip_allowed:
            # Save failure log for IP block
            failed_log = models.LoginLog(
                user_id=payload.user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                failure_reason="IP Address Blocked"
            )
            db.add(failed_log)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Login from this IP address is not allowed by the system administrator."
            )

    # Look up the user in the database
    user = db.query(models.User).filter(models.User.user_id == payload.user_id).first()
    
    # If user doesn't exist, is deactivated, or soft-deleted
    if not user or not user.is_active or user.is_deleted:
        # Save failure log
        failed_log = models.LoginLog(
            user_id=payload.user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            failure_reason="Invalid User ID or inactive account"
        )
        db.add(failed_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or Password"
        )
        
    # Verify the password hash
    if not verify_password(payload.password, user.password_hash):
        # Save failure log
        failed_log = models.LoginLog(
            user_id=payload.user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            failure_reason="Invalid password"
        )
        db.add(failed_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or Password"
        )
        
    # Success log
    success_log = models.LoginLog(
        user_id=user.user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )
    db.add(success_log)
    db.commit()

    import auth_utils
    access_token = auth_utils.create_access_token(data={"user_id": user.user_id, "role": user.role})

    # Return success and basic user details along with the token
    return {
        "success": True,
        "token": access_token,
        "user_id": user.user_id,
        "name": user.name,
        "role": user.role
    }


# FR-162: Get last successful login details (to inform user)
@router.get("/last-login/{user_id}")
def get_last_login(user_id: str, db: Session = Depends(get_db)):
    # Get the second most recent successful login (since the most recent is the current session)
    logs = db.query(models.LoginLog).filter(
        models.LoginLog.user_id == user_id,
        models.LoginLog.success == True
    ).order_by(models.LoginLog.logged_at.desc()).limit(2).all()
    
    if len(logs) < 2:
        return {"has_previous": False}
        
    last_login = logs[1] # The one before the current session
    return {
        "has_previous": True,
        "ip_address": last_login.ip_address,
        "user_agent": last_login.user_agent,
        "logged_at": last_login.logged_at.isoformat()
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
    all_users = db.query(models.User).filter(models.User.is_active == True, models.User.is_deleted == False).all()
    
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
