import datetime
import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_settings, save_iodms_settings, get_iodms_root_path
from routers.auth import get_password_hash

router = APIRouter()

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

# FR-110: List all users
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """Retrieves all users for the Admin panel user table."""
    users = db.query(models.User).order_by(models.User.user_id).all()
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

        # 1. Soft-delete files on disk and records in DB
        if table == "inward_register":
            # format in record_id is folder_id:year:inward_no
            fid, yr, ino = record_id.split(":")
            item = db.query(models.InwardRegister).filter(
                models.InwardRegister.folder_id == fid,
                models.InwardRegister.year == int(yr),
                models.InwardRegister.inward_no == ino
            ).first()
            if item:
                if item.attachment_path:
                    # delete file physically
                    full_path = os.path.join(get_iodms_root_path(), item.attachment_path)
                    if os.path.exists(full_path):
                        try:
                            os.remove(full_path)
                        except Exception:
                            pass
                db.delete(item)

        elif table == "outward_register":
            # format in record_id is folder_id:year:outward_no
            fid, yr, ono = record_id.split(":")
            item = db.query(models.OutwardRegister).filter(
                models.OutwardRegister.folder_id == fid,
                models.OutwardRegister.year == int(yr),
                models.OutwardRegister.outward_no == ono
            ).first()
            if item:
                if item.document_path:
                    full_path = os.path.join(get_iodms_root_path(), item.document_path)
                    if os.path.exists(full_path):
                        try:
                            os.remove(full_path)
                        except Exception:
                            pass
                db.delete(item)

        elif table == "draft_files":
            item = db.query(models.DraftFile).filter(models.DraftFile.draft_id == int(record_id)).first()
            if item:
                if item.file_path:
                    full_path = os.path.join(get_iodms_root_path(), item.file_path)
                    if os.path.exists(full_path):
                        try:
                            os.remove(full_path)
                        except Exception:
                            pass
                db.delete(item)

        elif table == "address_book":
            item = db.query(models.AddressBook).filter(models.AddressBook.address_id == int(record_id)).first()
            if item:
                db.delete(item)

        # Mark request as Approved
        req.status = "Approved"
        db.commit()
        return {"message": "Record permanently deleted.", "success": True}

    elif payload.action == "Reject":
        # Mark request as Rejected (restores normal visibility)
        req.status = "Rejected"
        db.commit()
        return {"message": "Deletion request rejected. Record restored.", "success": True}

    raise HTTPException(status_code=400, detail="Invalid action. Use Approve or Reject")


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
@router.get("/address-book")
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
    pending_ids = [int(pd.record_id) for pd in pending_deletes]

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
@router.post("/address-book")
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
@router.put("/address-book/{id}")
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
@router.delete("/address-book/{id}")
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
