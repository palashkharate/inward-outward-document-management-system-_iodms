import datetime
import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_settings, save_iodms_settings, get_iodms_root_path
from routers.auth import get_password_hash
from filesystem_utils import move_to_trash
from auth_utils import require_admin, get_current_user

router = APIRouter(dependencies=[Depends(require_admin)])
address_router = APIRouter(dependencies=[Depends(get_current_user)])

# --- Pydantic Request Models ---
class UserCreate(BaseModel):
    user_id: str
    pb_no: str
    name: str
    dob: str
    role: str
    password: str

class UserEdit(BaseModel):
    name: str
    dob: str
    role: str

class PasswordReset(BaseModel):
    password: str

class AddressCreate(BaseModel):
    name: str
    designation: Optional[str] = ""
    organisation: Optional[str] = ""
    address_line_1: Optional[str] = ""
    address_line_2: Optional[str] = ""
    fax_no: Optional[str] = ""
    email: Optional[str] = ""
    address_group: str

class FolderTypeSchema(BaseModel):
    folder_id: str
    folder_name: str

class FolderTypeEditSchema(BaseModel):
    folder_name: str

class NameOnlySchema(BaseModel):
    name: str

class SystemSettingsSchema(BaseModel):
    iodms_root_path: str
    cutover_override_date: Optional[str] = None

class AllowedIPCreate(BaseModel):
    ip_address: str
    description: Optional[str] = ""

class ApprovalAction(BaseModel):
    action: str  # 'Approve' or 'Reject'

# --- Helper function for folder renaming ---
# FR-130: Rename folders on disk when Folder ID is renamed
def rename_folders_on_disk(old_id: str, new_id: str):
    """Scans the Inward, Outward, and Drafts directories and renames the physical folders."""
    root = get_iodms_root_path()
    for category in ["Inward", "Outward", "Drafts"]:
        cat_path = os.path.join(root, category)
        if os.path.exists(cat_path):
            for year in os.listdir(cat_path):
                year_path = os.path.join(cat_path, year)
                if os.path.isdir(year_path):
                    old_folder = os.path.join(year_path, old_id)
                    new_folder = os.path.join(year_path, new_id)
                    if os.path.exists(old_folder) and not os.path.exists(new_folder):
                        try:
                            os.rename(old_folder, new_folder)
                        except Exception:
                            # If rename fails (e.g. permission or lock), we log it or ignore
                            pass

# --- User Management (9A) ---

# FR-110: List all active users
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Retrieves all non-deleted users for the Admin panel user table."""
    users = db.query(models.User).filter(models.User.is_deleted == False).order_by(models.User.user_id).all()
    return [{
        "user_id": u.user_id,
        "pb_no": u.pb_no,
        "name": u.name,
        "dob": u.dob.isoformat(),
        "role": u.role,
        "is_active": u.is_active
    } for u in users]

# FR-111: Add New User
@router.post("/users")
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Creates a new officer account in the database."""
    # Check if user_id or pb_no is unique
    existing_user = db.query(models.User).filter(
        (models.User.user_id == payload.user_id) | (models.User.pb_no == payload.pb_no)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID or PB No. already exists.")

    try:
        dob_parsed = datetime.datetime.strptime(payload.dob, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Date format. Use YYYY-MM-DD")

    new_user = models.User(
        user_id=payload.user_id,
        pb_no=payload.pb_no,
        name=payload.name,
        dob=dob_parsed,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully", "success": True}

# FR-112: Edit User
@router.put("/users/{user_id}")
def edit_user(user_id: str, payload: UserEdit, db: Session = Depends(get_db)):
    """Updates user information directly."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        dob_parsed = datetime.datetime.strptime(payload.dob, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Date format. Use YYYY-MM-DD")

    user.name = payload.name
    user.dob = dob_parsed
    user.role = payload.role
    db.commit()
    return {"message": "User updated successfully", "success": True}

# FR-113: Activate / Deactivate User
@router.put("/users/{user_id}/toggle")
def toggle_user_status(user_id: str, db: Session = Depends(get_db)):
    """Toggles user active status (FR-113)."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User status set to {'Active' if user.is_active else 'Inactive'}", "is_active": user.is_active, "success": True}

# FR-114: Reset Password
@router.put("/users/{user_id}/reset-password")
def reset_password(user_id: str, payload: PasswordReset, db: Session = Depends(get_db)):
    """Resets an officer's password by Admin."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(payload.password)
    db.commit()
    return {"message": "Password reset successfully", "success": True}

# FR-115: Soft Delete User
@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin_id: str, db: Session = Depends(get_db)):
    """Soft deletes a user account."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.user_id == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete the default admin account.")
        
    user.is_deleted = True
    user.deleted_at = datetime.datetime.now(datetime.timezone.utc)
    user.deleted_by = admin_id
    user.is_active = False # Deactivate on delete
    db.commit()
    return {"message": "User deleted successfully", "success": True}

# FR-116: Get Deleted Users
@router.get("/deleted-users")
def get_deleted_users(db: Session = Depends(get_db)):
    """Retrieves all soft-deleted users."""
    users = db.query(models.User).filter(models.User.is_deleted == True).order_by(models.User.deleted_at.desc()).all()
    return [{
        "user_id": u.user_id,
        "pb_no": u.pb_no,
        "name": u.name,
        "role": u.role,
        "deleted_at": u.deleted_at.isoformat() if u.deleted_at else None,
        "deleted_by": u.deleted_by
    } for u in users]

# FR-116: Restore User
@router.put("/users/{user_id}/restore")
def restore_user(user_id: str, db: Session = Depends(get_db)):
    """Restores a soft-deleted user account."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_deleted = False
    user.deleted_at = None
    user.deleted_by = None
    user.is_active = True
    db.commit()
    return {"message": "User restored successfully", "success": True}

# FR-116: Permanently Delete User
@router.delete("/users/{user_id}/permanent")
def permanent_delete_user(user_id: str, db: Session = Depends(get_db)):
    """Permanently deletes a user from the database."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User permanently deleted", "success": True}

# --- Pending Approvals - Deletion Requests (9B) ---

# FR-120: View pending deletions
@router.get("/pending-deletions")
def get_pending_deletions(db: Session = Depends(get_db)):
    """Lists all deletion requests awaiting Admin action."""
    deletions = db.query(models.PendingDeletion).filter(models.PendingDeletion.status == "Pending").all()
    return [{
        "id": d.id,
        "source_table": d.source_table,
        "record_id": d.record_id,
        "requested_by": d.requested_by,
        "requested_on": d.requested_on.isoformat(),
        "status": d.status
    } for d in deletions]

# FR-084, FR-095: Get Permanently Deleted (Lost) Numbers
@router.get("/permanently-deleted")
def get_permanently_deleted(db: Session = Depends(get_db)):
    """Retrieves all records with status='Permanently Deleted' from inward and outward registers."""
    inwards = db.query(models.InwardRegister).filter(models.InwardRegister.status == "Permanently Deleted").all()
    outwards = db.query(models.OutwardRegister).filter(models.OutwardRegister.status == "Permanently Deleted").all()
    
    results = []
    
    # Process inwards
    for r in inwards:
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        results.append({
            "type": "Inward",
            "number": r.inward_no,
            "year": r.year,
            "folder_id": r.folder_id,
            "folder_name": folder.folder_name if folder else "",
            "deleted_at": r.deleted_at.isoformat() if r.deleted_at else None,
            "deleted_by": r.deleted_by,
        })
        
    # Process outwards
    for r in outwards:
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        results.append({
            "type": "Outward",
            "number": r.outward_no,
            "year": r.year,
            "folder_id": r.folder_id,
            "folder_name": folder.folder_name if folder else "",
            "deleted_at": r.deleted_at.isoformat() if r.deleted_at else None,
            "deleted_by": r.deleted_by,
        })
        
    # Sort by deleted_at descending
    results.sort(key=lambda x: x["deleted_at"] or "", reverse=True)
    
    return results

# FR-121: Approve or Reject Deletion
@router.put("/pending-deletions/{id}")
def action_pending_deletion(id: int, payload: ApprovalAction, db: Session = Depends(get_db)):
    """Approves or rejects a deletion request.
    
    If Approved: permanently deletes record from table and file on disk.
    If Rejected: restores record to normal visibility.
    """
    req = db.query(models.PendingDeletion).filter(models.PendingDeletion.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if payload.action == "Approve":
        # Process the deletion of the target record and physical file
        table = req.source_table
        record_id = req.record_id

        # FR-164: Move to TrashBin for 30 days instead of permanent delete
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
        trash_entry = models.TrashBin(
            source_table=table,
            deleted_by=req.requested_by,
            expires_at=expires_at,
            record_data={} # Will be populated
        )

        # 1. Move files to Trash and record to TrashBin
        if table == "inward_register":
            # format in record_id is folder_id:year:inward_no
            fid, yr, ino = record_id.split(":")
            item = db.query(models.InwardRegister).filter(
                models.InwardRegister.folder_id == fid,
                models.InwardRegister.year == int(yr),
                models.InwardRegister.inward_no == ino
            ).first()
            if item:
                trash_entry.record_data = jsonable_encoder(item)
                if item.attachment_path:
                    trash_entry.original_file_path = item.attachment_path
                    rel_trash, _ = move_to_trash(get_iodms_root_path(), item.attachment_path)
                    trash_entry.trash_file_path = rel_trash
                db.add(trash_entry)
                
                # FR-084: Keep record to ensure number is lost
                item.status = "Permanently Deleted"
                item.deleted_by = req.requested_by
                item.deleted_at = datetime.datetime.now(datetime.timezone.utc)
                # Keep other metadata for audit, but it won't show in regular lists since status != Active

        elif table == "outward_register":
            # format in record_id is folder_id:year:outward_no
            fid, yr, ono = record_id.split(":")
            item = db.query(models.OutwardRegister).filter(
                models.OutwardRegister.folder_id == fid,
                models.OutwardRegister.year == int(yr),
                models.OutwardRegister.outward_no == ono
            ).first()
            if item:
                trash_entry.record_data = jsonable_encoder(item)
                if item.document_path:
                    trash_entry.original_file_path = item.document_path
                    rel_trash, _ = move_to_trash(get_iodms_root_path(), item.document_path)
                    trash_entry.trash_file_path = rel_trash
                db.add(trash_entry)
                
                # FR-095: Keep record to ensure number is lost
                item.status = "Permanently Deleted"
                item.deleted_by = req.requested_by
                item.deleted_at = datetime.datetime.now(datetime.timezone.utc)

        elif table == "draft_files":
            item = db.query(models.DraftFile).filter(models.DraftFile.draft_id == int(record_id)).first()
            if item:
                trash_entry.record_data = jsonable_encoder(item)
                if item.file_path:
                    trash_entry.original_file_path = item.file_path
                    rel_trash, _ = move_to_trash(get_iodms_root_path(), item.file_path)
                    trash_entry.trash_file_path = rel_trash
                db.add(trash_entry)
                db.delete(item)

        elif table == "address_book":
            item = db.query(models.AddressBook).filter(models.AddressBook.address_id == int(record_id)).first()
            if item:
                trash_entry.record_data = jsonable_encoder(item)
                db.add(trash_entry)
                db.delete(item)

        # Mark request as Approved
        req.status = "Approved"
        db.commit()
        return {"message": "Record moved to Trash Bin for 30 days.", "success": True}

    elif payload.action == "Reject":
        # Mark request as Rejected (restores normal visibility)
        req.status = "Rejected"
        db.commit()
        return {"message": "Deletion request rejected. Record restored.", "success": True}

    raise HTTPException(status_code=400, detail="Invalid action. Use Approve or Reject")


# --- FR-164/FR-165: Trash Bin Management ---

@router.get("/trash-bin")
def get_trash_bin(db: Session = Depends(get_db)):
    """Lists all soft-deleted records currently in the 30-day recycle bin, purging expired ones first."""
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Lazily purge expired items
    expired_items = db.query(models.TrashBin).filter(
        models.TrashBin.expires_at < now,
        models.TrashBin.is_permanently_deleted == False
    ).all()
    
    for item in expired_items:
        if item.trash_file_path:
            full_path = os.path.join(get_iodms_root_path(), item.trash_file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
        item.is_permanently_deleted = True
    
    if expired_items:
        db.commit()

    items = db.query(models.TrashBin).filter(models.TrashBin.is_permanently_deleted == False).order_by(models.TrashBin.trashed_at.desc()).all()
    return [{
        "id": i.id,
        "source_table": i.source_table,
        "deleted_by": i.deleted_by,
        "trashed_at": i.trashed_at.isoformat(),
        "expires_at": i.expires_at.isoformat(),
        "record_id": i.record_data.get("inward_no") or i.record_data.get("outward_no") or i.record_data.get("draft_id") or i.record_data.get("address_id", "Unknown")
    } for i in items]

@router.put("/trash-bin/{id}/restore")
def restore_from_trash(id: int, db: Session = Depends(get_db)):
    """Restores a record from the Trash Bin back to its original table."""
    import shutil
    trash_entry = db.query(models.TrashBin).filter(models.TrashBin.id == id).first()
    if not trash_entry:
        raise HTTPException(status_code=404, detail="Trash entry not found")
        
    table = trash_entry.source_table
    data = trash_entry.record_data
    
    # 1. Restore file physically if it exists
    if trash_entry.trash_file_path and trash_entry.original_file_path:
        trash_full = os.path.join(get_iodms_root_path(), trash_entry.trash_file_path)
        orig_full = os.path.join(get_iodms_root_path(), trash_entry.original_file_path)
        if os.path.exists(trash_full):
            os.makedirs(os.path.dirname(orig_full), exist_ok=True)
            shutil.move(trash_full, orig_full)
            
    # 2. Insert record back to DB
    if table == "inward_register":
        new_item = models.InwardRegister(**{k: v for k, v in data.items() if k not in ["created_at", "updated_at"]})
        db.add(new_item)
    elif table == "outward_register":
        new_item = models.OutwardRegister(**{k: v for k, v in data.items() if k not in ["created_at", "updated_at"]})
        db.add(new_item)
    elif table == "draft_files":
        new_item = models.DraftFile(**{k: v for k, v in data.items() if k not in ["created_on", "updated_at", "locked_at"]})
        db.add(new_item)
    elif table == "address_book":
        new_item = models.AddressBook(**{k: v for k, v in data.items()})
        db.add(new_item)
        
    db.delete(trash_entry)
    db.commit()
    return {"message": "Record restored successfully.", "success": True}

@router.delete("/trash-bin/{id}")
def delete_from_trash(id: int, db: Session = Depends(get_db)):
    """Permanently deletes a record and its physical file from the Trash Bin."""
    trash_entry = db.query(models.TrashBin).filter(models.TrashBin.id == id).first()
    if not trash_entry:
        raise HTTPException(status_code=404, detail="Trash entry not found")
        
    if trash_entry.trash_file_path:
        full_path = os.path.join(get_iodms_root_path(), trash_entry.trash_file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            
    trash_entry.is_permanently_deleted = True
    db.commit()
    return {"message": "Record permanently deleted.", "success": True}


# --- Pending Approvals - Profile Edits (9C) ---

# FR-125: View pending profile edits
@router.get("/pending-profile-edits")
def get_pending_profile_edits(db: Session = Depends(get_db)):
    """Lists profile modification requests waiting for Admin action."""
    edits = db.query(models.PendingProfileEdit).filter(models.PendingProfileEdit.status == "Pending").all()
    return [{
        "id": e.id,
        "user_id": e.user_id,
        "proposed_changes": e.proposed_changes,
        "requested_on": e.requested_on.isoformat()
    } for e in edits]

# FR-126: Approve or Reject Profile Edit
@router.put("/pending-profile-edits/{id}")
def action_pending_profile_edit(id: int, payload: ApprovalAction, db: Session = Depends(get_db)):
    """Applies profile updates to user table (Approve) or discards them (Reject)."""
    req = db.query(models.PendingProfileEdit).filter(models.PendingProfileEdit.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if payload.action == "Approve":
        user = db.query(models.User).filter(models.User.user_id == req.user_id).first()
        if user:
            # Apply proposed changes
            changes = req.proposed_changes
            if "name" in changes:
                user.name = changes["name"]
            if "dob" in changes:
                user.dob = datetime.datetime.strptime(changes["dob"], "%Y-%m-%d").date()
        req.status = "Approved"
        db.commit()
        return {"message": "Profile changes approved and applied.", "success": True}

    elif payload.action == "Reject":
        req.status = "Rejected"
        db.commit()
        return {"message": "Profile changes rejected and discarded.", "success": True}

    raise HTTPException(status_code=400, detail="Invalid action. Use Approve or Reject")


# --- Master List Management (9D) ---

# --- Folder Types ---
@router.get("/folder-types")
def get_folder_types(db: Session = Depends(get_db)):
    """Retrieves all Folder IDs and names."""
    return db.query(models.FolderType).order_by(models.FolderType.folder_id).all()

# FR-130: Create Folder ID
@router.post("/folder-types")
def create_folder_type(payload: FolderTypeSchema, db: Session = Depends(get_db)):
    """Adds a new Folder ID and name."""
    existing = db.query(models.FolderType).filter(models.FolderType.folder_id == payload.folder_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Folder ID already exists")
    new_ft = models.FolderType(folder_id=payload.folder_id, folder_name=payload.folder_name)
    db.add(new_ft)
    db.commit()
    return {"message": "Folder type created", "success": True}

# FR-130: Rename Folder ID / Name
@router.put("/folder-types/{folder_id}")
def edit_folder_type(folder_id: str, payload: FolderTypeSchema, db: Session = Depends(get_db)):
    """Renames a Folder ID (updates primary key) and updates physical files on disk."""
    ft = db.query(models.FolderType).filter(models.FolderType.folder_id == folder_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Folder ID not found")

    new_id = payload.folder_id
    new_name = payload.folder_name

    if new_id != folder_id:
        # Check if new ID is already taken
        taken = db.query(models.FolderType).filter(models.FolderType.folder_id == new_id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Target Folder ID already exists")

        # Create new record, update tables and delete old record
        # Note: cascade update on database foreign keys automatically takes care of InwardRegister, OutwardRegister and Drafts relationships.
        new_ft = models.FolderType(folder_id=new_id, folder_name=new_name)
        db.add(new_ft)
        db.commit()

        # Update all linked tables to cascade the change manually since SQLite doesn't always handle it,
        # but PostgreSQL does. However, let's execute SQL updates for safety.
        db.execute(models.InwardRegister.__table__.update().where(models.InwardRegister.folder_id == folder_id).values(folder_id=new_id))
        db.execute(models.OutwardRegister.__table__.update().where(models.OutwardRegister.folder_id == folder_id).values(folder_id=new_id))
        db.execute(models.DraftFile.__table__.update().where(models.DraftFile.folder_id == folder_id).values(folder_id=new_id))
        
        # Delete old record
        db.delete(ft)
        db.commit()

        # Rename physical folder paths
        rename_folders_on_disk(folder_id, new_id)
    else:
        ft.folder_name = new_name
        db.commit()

    return {"message": "Folder type updated successfully", "success": True}

# FR-130: Delete Folder ID
@router.delete("/folder-types/{folder_id}")
def delete_folder_type(folder_id: str, db: Session = Depends(get_db)):
    """Deletes a Folder ID if not referenced."""
    ft = db.query(models.FolderType).filter(models.FolderType.folder_id == folder_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Folder ID not found")

    # Check references
    inwards = db.query(models.InwardRegister).filter(models.InwardRegister.folder_id == folder_id).count()
    outwards = db.query(models.OutwardRegister).filter(models.OutwardRegister.folder_id == folder_id).count()
    drafts = db.query(models.DraftFile).filter(models.DraftFile.folder_id == folder_id).count()

    if inwards > 0 or outwards > 0 or drafts > 0:
        raise HTTPException(status_code=400, detail="Cannot delete Folder ID. It is currently referenced by files.")

    db.delete(ft)
    db.commit()
    return {"message": "Folder type deleted", "success": True}


# --- Address Groups (FR-131) ---
@router.get("/address-groups")
def get_address_groups(db: Session = Depends(get_db)):
    return db.query(models.AddressGroup).order_by(models.AddressGroup.group_name).all()

@router.post("/address-groups")
def create_address_group(payload: NameOnlySchema, db: Session = Depends(get_db)):
    existing = db.query(models.AddressGroup).filter(models.AddressGroup.group_name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Group already exists")
    new_grp = models.AddressGroup(group_name=payload.name)
    db.add(new_grp)
    db.commit()
    return {"message": "Address Group created", "success": True}

@router.put("/address-groups/{id}")
def rename_address_group(id: int, payload: NameOnlySchema, db: Session = Depends(get_db)):
    grp = db.query(models.AddressGroup).filter(models.AddressGroup.group_id == id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")
    
    old_name = grp.group_name
    grp.group_name = payload.name
    # Update linked address book references
    db.execute(models.AddressBook.__table__.update().where(models.AddressBook.address_group == old_name).values(address_group=payload.name))
    db.commit()
    return {"message": "Address Group renamed", "success": True}

@router.delete("/address-groups/{id}")
def delete_address_group(id: int, db: Session = Depends(get_db)):
    grp = db.query(models.AddressGroup).filter(models.AddressGroup.group_id == id).first()
    if not grp:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check address book entries
    count = db.query(models.AddressBook).filter(models.AddressBook.address_group == grp.group_name).count()
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete group. It contains address book entries.")
        
    db.delete(grp)
    db.commit()
    return {"message": "Address Group deleted", "success": True}


# --- Received From List (FR-132) ---
@router.get("/received-from-list")
def get_received_from(db: Session = Depends(get_db)):
    return db.query(models.ReceivedFromList).order_by(models.ReceivedFromList.name).all()

@router.post("/received-from-list")
def create_received_from(payload: NameOnlySchema, db: Session = Depends(get_db)):
    existing = db.query(models.ReceivedFromList).filter(models.ReceivedFromList.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Entry already exists")
    new_rf = models.ReceivedFromList(name=payload.name)
    db.add(new_rf)
    db.commit()
    return {"id": new_rf.id, "name": new_rf.name, "success": True}

@router.put("/received-from-list/{id}")
def rename_received_from(id: int, payload: NameOnlySchema, db: Session = Depends(get_db)):
    rf = db.query(models.ReceivedFromList).filter(models.ReceivedFromList.id == id).first()
    if not rf:
        raise HTTPException(status_code=404, detail="Entry not found")
    rf.name = payload.name
    db.commit()
    return {"message": "Entry renamed", "success": True}

@router.delete("/received-from-list/{id}")
def delete_received_from(id: int, db: Session = Depends(get_db)):
    rf = db.query(models.ReceivedFromList).filter(models.ReceivedFromList.id == id).first()
    if not rf:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(rf)
    db.commit()
    return {"message": "Entry deleted", "success": True}


# --- Originated By List (FR-133) ---
@router.get("/originated-by-list")
def get_originated_by(db: Session = Depends(get_db)):
    return db.query(models.OriginatedByList).order_by(models.OriginatedByList.name).all()

@router.post("/originated-by-list")
def create_originated_by(payload: NameOnlySchema, db: Session = Depends(get_db)):
    existing = db.query(models.OriginatedByList).filter(models.OriginatedByList.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Entry already exists")
    new_ob = models.OriginatedByList(name=payload.name)
    db.add(new_ob)
    db.commit()
    return {"id": new_ob.id, "name": new_ob.name, "success": True}

@router.put("/originated-by-list/{id}")
def rename_originated_by(id: int, payload: NameOnlySchema, db: Session = Depends(get_db)):
    ob = db.query(models.OriginatedByList).filter(models.OriginatedByList.id == id).first()
    if not ob:
        raise HTTPException(status_code=404, detail="Entry not found")
    ob.name = payload.name
    db.commit()
    return {"message": "Entry renamed", "success": True}

@router.delete("/originated-by-list/{id}")
def delete_originated_by(id: int, db: Session = Depends(get_db)):
    ob = db.query(models.OriginatedByList).filter(models.OriginatedByList.id == id).first()
    if not ob:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(ob)
    db.commit()
    return {"message": "Entry deleted", "success": True}


# --- System Settings (9E) ---

# FR-140, FR-141: View settings
@router.get("/settings")
def get_settings():
    """Gets the active system settings (base filesystem path)."""
    return get_iodms_settings()

# FR-140, FR-141: Save settings
@router.put("/settings")
def update_settings(payload: SystemSettingsSchema):
    """Updates system settings like IODMS root path and cutover dates."""
    settings = {
        "iodms_root_path": payload.iodms_root_path,
        "cutover_override_date": payload.cutover_override_date
    }
    
    # Try to make sure new path directory exists
    if not os.path.exists(payload.iodms_root_path):
        try:
            os.makedirs(payload.iodms_root_path, exist_ok=True)
            # Create subfolders
            for sub in ["Inward", "Outward", "Drafts"]:
                os.makedirs(os.path.join(payload.iodms_root_path, sub), exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot create or access configured directory: {str(e)}")

    if save_iodms_settings(settings):
        return {"message": "Settings saved successfully", "success": True}
    raise HTTPException(status_code=500, detail="Failed to save settings file")


# --- Address Book Management (Module 8) ---

# FR-100, FR-101: Retrieve Address Book entries
@address_router.get("/address-book")
def get_address_book(
    page: int = 1,
    limit: int = 20,
    search_field: Optional[str] = None,
    search_query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated address book list with query searching.
    
    Implements:
    - FR-100: Shows fields address_id, name, designation, etc.
    - FR-101: Admin/User can choose field to search (e.g. Name, Designation, Organisation, Fax, Email)
    - Excludes items that are pending deletion.
    """
    # Fetch pending deletion address IDs
    pending_deletes = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "address_book",
        models.PendingDeletion.status == "Pending"
    ).all()
    pending_ids = []
    for pd in pending_deletes:
        try:
            pending_ids.append(int(pd.record_id))
        except ValueError:
            pass

    query = db.query(models.AddressBook)
    if pending_ids:
        query = query.filter(~models.AddressBook.address_id.in_(pending_ids))

    if search_field and search_query:
        search_pattern = f"%{search_query}%"
        if search_field == "name":
            query = query.filter(models.AddressBook.name.ilike(search_pattern))
        elif search_field == "designation":
            query = query.filter(models.AddressBook.designation.ilike(search_pattern))
        elif search_field == "organisation":
            query = query.filter(models.AddressBook.organisation.ilike(search_pattern))
        elif search_field == "fax_no":
            query = query.filter(models.AddressBook.fax_no.ilike(search_pattern))
        elif search_field == "email":
            query = query.filter(models.AddressBook.email.ilike(search_pattern))

    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(models.AddressBook.name).offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": [{
            "address_id": r.address_id,
            "name": r.name,
            "designation": r.designation,
            "organisation": r.organisation,
            "address_line_1": r.address_line_1,
            "address_line_2": r.address_line_2,
            "fax_no": r.fax_no,
            "email": r.email,
            "address_group": r.address_group
        } for r in results]
    }

# FR-102: Add Address Entry
@address_router.post("/address-book")
def add_address_entry(payload: AddressCreate, db: Session = Depends(get_db)):
    """Creates a new contact address.
    
    Implements:
    - FR-102: Fields Name, Designation, Organisation, Address 1 & 2, Fax, Email, Group dropdown.
    - FR-103: Auto-generates Address ID.
    """
    new_entry = models.AddressBook(
        name=payload.name,
        designation=payload.designation,
        organisation=payload.organisation,
        address_line_1=payload.address_line_1,
        address_line_2=payload.address_line_2,
        fax_no=payload.fax_no,
        email=payload.email,
        address_group=payload.address_group
    )
    db.add(new_entry)
    db.commit()
    return {"message": "Address added successfully", "address_id": new_entry.address_id, "success": True}

# FR-104: Edit Address Entry
@address_router.put("/address-book/{id}")
def edit_address_entry(id: int, payload: AddressCreate, db: Session = Depends(get_db)):
    """Modifies a contact's details directly."""
    entry = db.query(models.AddressBook).filter(models.AddressBook.address_id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.name = payload.name
    entry.designation = payload.designation
    entry.organisation = payload.organisation
    entry.address_line_1 = payload.address_line_1
    entry.address_line_2 = payload.address_line_2
    entry.fax_no = payload.fax_no
    entry.email = payload.email
    entry.address_group = payload.address_group
    db.commit()
    return {"message": "Address updated successfully", "success": True}

# FR-104: Request Delete Address Entry
@address_router.delete("/address-book/{id}")
def delete_address_entry(id: int, requester_id: str, db: Session = Depends(get_db)):
    """Submits a deletion request for a contact instead of deleting it immediately.
    
    Implements:
    - FR-104: Soft delete via pending_deletions table.
    """
    entry = db.query(models.AddressBook).filter(models.AddressBook.address_id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Check if deletion request is already pending
    existing = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "address_book",
        models.PendingDeletion.record_id == str(id),
        models.PendingDeletion.status == "Pending"
    ).first()

    if existing:
         return {"message": "Deletion request is already pending approval.", "success": True}

    new_del = models.PendingDeletion(
        source_table="address_book",
        record_id=str(id),
        requested_by=requester_id,
        status="Pending"
    )
    db.add(new_del)
    db.commit()
    return {"message": "Deletion requested. Awaiting Admin approval.", "success": True}

# --- Template Management (FR-143) ---

@address_router.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    """Retrieves a list of all uploaded templates."""
    templates = db.query(models.DocumentTemplate).order_by(models.DocumentTemplate.uploaded_on.desc()).all()
    return templates

@router.post("/templates")
def upload_template(
    name: str = Form(...),
    template_type: str = Form(...),
    uploaded_by: str = Form("unknown"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a new .docx template."""
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")

    # Create Templates directory if not exists
    relative_folder = "Templates"
    full_folder_path = os.path.join(get_iodms_root_path(), relative_folder)
    os.makedirs(full_folder_path, exist_ok=True)

    # Save file securely
    safe_name = "".join([c for c in file.filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
    filename = f"{int(datetime.datetime.now().timestamp())}_{safe_name}"
    relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
    full_file_path = os.path.join(get_iodms_root_path(), relative_path)

    try:
        with open(full_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    new_template = models.DocumentTemplate(
        name=name,
        template_type=template_type,
        file_path=relative_path,
        uploaded_by=uploaded_by
    )
    db.add(new_template)
    db.commit()
    return {"message": "Template uploaded successfully", "success": True}

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Deletes a document template from database and filesystem."""
    template = db.query(models.DocumentTemplate).filter(models.DocumentTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    full_path = os.path.join(get_iodms_root_path(), template.file_path)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except:
            pass # Continue to delete from DB even if file deletion fails

    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully", "success": True}

# --- IP Whitelist (FR-172) ---

@router.get("/allowed-ips")
def get_allowed_ips(db: Session = Depends(get_db)):
    """Retrieves all whitelisted IP addresses."""
    ips = db.query(models.AllowedIP).all()
    return ips

@router.post("/allowed-ips")
def create_allowed_ip(payload: AllowedIPCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Adds a new allowed IP address or wildcard."""
    existing = db.query(models.AllowedIP).filter(models.AllowedIP.ip_address == payload.ip_address).first()
    if existing:
        raise HTTPException(status_code=400, detail="This IP address is already whitelisted.")
    
    new_ip = models.AllowedIP(
        ip_address=payload.ip_address,
        description=payload.description,
        added_by=current_user["user_id"]
    )
    db.add(new_ip)
    db.commit()
    return {"message": "IP address added to whitelist.", "success": True}

@router.delete("/allowed-ips/{ip_id}")
def delete_allowed_ip(ip_id: int, db: Session = Depends(get_db)):
    """Deletes an allowed IP address."""
    record = db.query(models.AllowedIP).filter(models.AllowedIP.id == ip_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="IP address not found.")
    db.delete(record)
    db.commit()
    return {"message": "IP address removed from whitelist.", "success": True}
