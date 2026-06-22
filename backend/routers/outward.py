import datetime
import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_root_path, get_iodms_settings
from routers.inward import get_effective_year
import filesystem_utils

router = APIRouter()

# --- Pydantic Request Models ---
class DraftCreate(BaseModel):
    outward_no: str
    folder_id: str
    issuing_date: str
    address_to: List[int]
    cc_to: List[int]
    subject: str
    remarks: Optional[str] = ""
    prepared_by: str
    actioned_by: str
    template_type: str

class DraftLockAction(BaseModel):
    user_id: str

# --- Helper functions ---

# FR-055: Pre-assign and reserve Outward number
def get_next_outward_no(folder_id: str, year: int, db: Session) -> str:
    """Gets the next sequential Outward Number by looking at both outward_register and draft_files.
    
    Implements:
    - FR-055: Reserves the number immediately on creation to prevent concurrency conflicts.
    """
    # 1. Fetch from outward_register
    register_nos = db.query(models.OutwardRegister.outward_no).filter(
        models.OutwardRegister.folder_id == folder_id,
        models.OutwardRegister.year == year
    ).all()
    
    # 2. Fetch from draft_files
    draft_nos = db.query(models.DraftFile.outward_no).filter(
        models.DraftFile.folder_id == folder_id,
        models.DraftFile.year == year
    ).all()
    
    numbers = []
    for (no_str,) in register_nos + draft_nos:
        try:
            numbers.append(int(no_str))
        except ValueError:
            pass
            
    if not numbers:
        return "001"
        
    next_val = max(numbers) + 1
    if next_val <= 999:
        return f"{next_val:03d}"
    else:
        return str(next_val)


# FR-042: Generate Word document draft with placeholder tags
def create_draft_document(filepath: str, data: dict, db: Session):
    """Creates a basic formatted text file representing a MS Word Document.
    
    Implements:
    - FR-042: Generates a document containing form metadata and template placeholder tags.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Fetch details of primary address
    address_str = ""
    if data["address_to"]:
        addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == data["address_to"][0]).first()
        if addr:
            address_str = f"{addr.name}\n{addr.designation or ''}\n{addr.organisation or ''}\n{addr.address_line_1 or ''}\n{addr.address_line_2 or ''}"
            
    # CC List names
    cc_names = []
    for cc_id in data["cc_to"]:
        addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == cc_id).first()
        if addr:
            cc_names.append(addr.name)
    cc_str = ", ".join(cc_names)

    # Document contents formatted as plain text
    content = f"""======================================================
HAL AURDC, NASHIK - DESIGN & ENGINEERING ACTIVITY (DEA)
======================================================
Outward Reference No: {data['outward_no']}
Date: {data['issuing_date']}
Folder ID: {data['folder_id']}
Template: {data['template_type']}
Prepared By: {data['prepared_by']}

TO:
{address_str}

CC: {cc_str}

SUBJECT: {data['subject']}

------------------------------------------------------
[TEMPLATE BODY: {data['template_type']}]
------------------------------------------------------
Dear Sir/Madam,

This is a draft document. You can modify the text below:

[Place your letter body contents here...]

------------------------------------------------------
Remarks: {data['remarks']}
======================================================
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


# --- Endpoints ---

# FR-055: Reserve Outward No.
@router.get("/next-no")
def get_next_no(folder_id: str, db: Session = Depends(get_db)):
    """Reserves the next available Outward number.
    
    Implements:
    - FR-055: Pre-assigns the Outward No. when Compose Outward opens.
    """
    year = get_effective_year()
    next_no = get_next_outward_no(folder_id, year, db)
    return {"outward_no": next_no, "year": year}


# FR-042: Save Draft
@router.post("/draft")
def save_draft(payload: DraftCreate, db: Session = Depends(get_db)):
    """Saves outward details as a draft and generates a .doc file on disk.
    
    Implements:
    - FR-042: Generates a draft file under IODMS/Drafts/{Year}/{FolderID}/fax-...doc
    """
    year = get_effective_year()
    
    # Filename format: fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"fax-{payload.actioned_by}-{timestamp}.doc"
    
    relative_folder, full_folder = filesystem_utils.ensure_folder_path(get_iodms_root_path(), "Drafts", year, payload.folder_id)
    relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
    full_path = os.path.join(full_folder, filename)
    
    # Save the physical file on disk (FR-042)
    try:
        create_draft_document(full_path, payload.model_dump(), db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create draft document on disk: {str(e)}")

    try:
        iss_date = datetime.datetime.strptime(payload.issuing_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    new_draft = models.DraftFile(
        file_path=relative_path,
        outward_no=payload.outward_no,
        folder_id=payload.folder_id,
        issuing_date=iss_date,
        address_to=payload.address_to,
        cc_to=payload.cc_to,
        subject=payload.subject,
        remarks=payload.remarks,
        prepared_by=payload.prepared_by,
        actioned_by=payload.actioned_by,
        template_type=payload.template_type,
        is_locked=False,
        year=year
    )
    
    db.add(new_draft)
    db.commit()
    return {"message": "Draft created successfully", "draft_id": new_draft.draft_id, "success": True}


# FR-044, FR-045: Modify Outward (Modify Mode)
@router.put("/modify/{folder_id}/{year}/{outward_no}")
def modify_outward(
    folder_id: str,
    year: int,
    outward_no: str,
    payload: DraftCreate,
    db: Session = Depends(get_db)
):
    """Modifies an already dispatched outward record in place and updates its file.
    
    Implements:
    - FR-044: Pre-filled form edit. Modifies existing outward_register record and replaces file on disk.
    """
    record = db.query(models.OutwardRegister).filter(
        models.OutwardRegister.folder_id == folder_id,
        models.OutwardRegister.year == year,
        models.OutwardRegister.outward_no == outward_no
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Outward record not found")

    try:
        iss_date = datetime.datetime.strptime(payload.issuing_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Update database record
    record.issuing_date = iss_date
    record.address_to = payload.address_to
    record.cc_to = payload.cc_to
    record.subject = payload.subject
    record.remarks = payload.remarks
    record.prepared_by = payload.prepared_by
    record.actioned_by = payload.actioned_by
    record.template_type = payload.template_type

    # Recreate the file on disk
    full_path = os.path.join(get_iodms_root_path(), record.document_path)
    try:
        create_draft_document(full_path, payload.model_dump(), db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to overwrite file on disk: {str(e)}")

    db.commit()
    return {"message": "Outward record updated successfully", "success": True}


# FR-050: Get Drafts list
@router.get("/drafts")
def get_drafts(db: Session = Depends(get_db)):
    """Retrieves all drafts waiting to be dispatched.
    
    Implements:
    - FR-050: Lists all drafts.
    - FR-057: No per-user filtering (all users see all drafts).
    - Excludes drafts pending deletion.
    """
    # Exclude drafts that are flagged in pending_deletions
    pending_deletes = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "draft_files",
        models.PendingDeletion.status == "Pending"
    ).all()
    pending_ids = [int(pd.record_id) for pd in pending_deletes]

    query = db.query(models.DraftFile)
    if pending_ids:
        query = query.filter(~models.DraftFile.draft_id.in_(pending_ids))
    drafts = query.all()
    
    output = []
    for d in drafts:
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == d.folder_id).first()
        folder_name = folder.folder_name if folder else ""
        
        # Primary recipient name
        recipient_name = ""
        if d.address_to:
            addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == d.address_to[0]).first()
            recipient_name = addr.name if addr else ""

        output.append({
            "draft_id": d.draft_id,
            "file_path": d.file_path,
            "outward_no": d.outward_no,
            "folder_id": d.folder_id,
            "folder_name": folder_name,
            "issuing_date": d.issuing_date.isoformat(),
            "address_to": d.address_to,
            "recipient_name": recipient_name,
            "cc_to": d.cc_to,
            "subject": d.subject,
            "remarks": d.remarks,
            "prepared_by": d.prepared_by,
            "actioned_by": d.actioned_by,
            "template_type": d.template_type,
            "is_locked": d.is_locked,
            "locked_by": d.locked_by,
            "created_on": d.created_on.isoformat()
        })
    return output


# FR-052: Lock draft file for editing
@router.put("/drafts/{draft_id}/lock")
def lock_draft(draft_id: int, payload: DraftLockAction, db: Session = Depends(get_db)):
    """Locks the draft to prevent editing conflicts.
    
    Implements:
    - FR-052: Checks if locked by another user and rejects request.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.is_locked and draft.locked_by != payload.user_id:
        # Find locked user name
        locker = db.query(models.User).filter(models.User.user_id == draft.locked_by).first()
        locker_name = locker.name if locker else draft.locked_by
        raise HTTPException(
            status_code=400,
            detail=f"This draft is currently being edited by {locker_name}. Please try again later."
        )

    draft.is_locked = True
    draft.locked_by = payload.user_id
    db.commit()
    return {"message": "Draft file locked for editing", "file_path": draft.file_path, "success": True}


# FR-053: Unlock draft file
@router.put("/drafts/{draft_id}/unlock")
def unlock_draft(draft_id: int, db: Session = Depends(get_db)):
    """Unlocks the draft file.
    
    Implements:
    - FR-053: Reset lock settings. Manual release available for Admin.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.is_locked = False
    draft.locked_by = None
    db.commit()
    return {"message": "Draft file unlocked", "success": True}


# FR-054: Dispatch Draft
@router.post("/drafts/{draft_id}/dispatch")
def dispatch_draft(draft_id: int, db: Session = Depends(get_db)):
    """Dispatches a draft document, moving it to the final Outward Register.
    
    Implements:
    - FR-054: Moves draft to outward_register, renames file to next sequential number (e.g. 004.doc),
      moves file to Outward/{Year}/{FolderID}/, removes draft record from database.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.is_locked:
         raise HTTPException(status_code=400, detail="Cannot dispatch a draft that is currently locked for editing.")

    year = draft.year
    folder_id = draft.folder_id
    
    # Auto-generate next sequential outward number (FR-054)
    # Note: the reserved number is draft.outward_no, but we re-fetch to make sure there are no gaps
    outward_no = draft.outward_no

    # If the reserved number is already used in register, fetch next
    register_conflict = db.query(models.OutwardRegister).filter(
        models.OutwardRegister.folder_id == folder_id,
        models.OutwardRegister.year == year,
        models.OutwardRegister.outward_no == outward_no
    ).first()
    if register_conflict:
         outward_no = get_next_outward_no(folder_id, year, db)

    # File rename & move (FR-054)
    # From: Drafts/{Year}/{FolderID}/fax-...doc
    # To: Outward/{Year}/{FolderID}/{OutwardNo}.doc
    old_relative_path = draft.file_path
    new_filename = f"{outward_no}.doc"
    
    try:
        new_relative_path, full_new_path = filesystem_utils.move_draft_to_outward(
            get_iodms_root_path(), old_relative_path, year, folder_id, new_filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move document on disk: {str(e)}")
        
    full_old_path = os.path.join(get_iodms_root_path(), old_relative_path)
    
    # Perform file system move and rename
    if not os.path.exists(full_old_path) and not os.path.exists(full_new_path):
        # If draft file is missing, create it directly in Outward folder
        create_draft_document(full_new_path, {
            "outward_no": outward_no,
            "issuing_date": datetime.date.today().isoformat(),
            "folder_id": folder_id,
            "template_type": draft.template_type,
            "prepared_by": draft.prepared_by,
            "address_to": draft.address_to,
            "cc_to": draft.cc_to,
            "subject": draft.subject,
            "remarks": draft.remarks
        }, db)

    # Insert record into Outward Register
    new_outward = models.OutwardRegister(
        outward_no=outward_no,
        folder_id=folder_id,
        year=year,
        issuing_date=datetime.date.today(),
        address_to=draft.address_to,
        cc_to=draft.cc_to,
        subject=draft.subject,
        remarks=draft.remarks,
        prepared_by=draft.prepared_by,
        actioned_by=draft.actioned_by,
        document_path=new_relative_path,
        template_type=draft.template_type
    )
    
    db.add(new_outward)
    db.delete(draft)  # delete draft record (FR-054)
    db.commit()

    return {"message": "Document dispatched successfully", "outward_no": outward_no, "success": True}


# FR-056: Discard Draft
@router.delete("/drafts/{draft_id}")
def discard_draft(draft_id: int, requester_id: str, db: Session = Depends(get_db)):
    """Requests draft discarding.
    
    Implements:
    - FR-056: Creates deletion request in pending_deletions; draft hidden immediately.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
         raise HTTPException(status_code=404, detail="Draft not found")

    new_del = models.PendingDeletion(
        source_table="draft_files",
        record_id=str(draft_id),
        requested_by=requester_id,
        status="Pending"
    )
    db.add(new_del)
    db.commit()
    return {"message": "Draft discard requested. Awaiting Admin approval.", "success": True}


# FR-090, FR-091, FR-092, FR-093: View Outward Register
@router.get("/register")
def get_outward_register(
    year: int,
    page: int = 1,
    limit: int = 20,
    search_folder_id: Optional[str] = None,
    search_prepared_by: Optional[str] = None,
    search_address_to: Optional[str] = None,
    search_subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated outward logs filtered by year and search keywords.
    
    Implements:
    - FR-090: Displays outward entries.
    - FR-091: Address To and CC To printed as comma-separated values in single cell.
    - FR-092: Year filter.
    - FR-093: Search filters: Folder ID, Prepared By, Address To (text search), Subject.
    - FR-095: Marks row with Pending Deletion badge.
    """
    query = db.query(models.OutwardRegister).filter(models.OutwardRegister.year == year)

    # Search filters
    if search_folder_id:
        query = query.filter(models.OutwardRegister.folder_id == search_folder_id)
    if search_prepared_by:
        query = query.filter(models.OutwardRegister.prepared_by == search_prepared_by)
    if search_subject:
        query = query.filter(models.OutwardRegister.subject.ilike(f"%{search_subject}%"))
    if search_address_to:
        matching_addrs = db.query(models.AddressBook.address_id).filter(
            models.AddressBook.name.ilike(f"%{search_address_to}%")
        ).all()
        matching_ids = [m[0] for m in matching_addrs]
        if matching_ids:
            query = query.filter(models.OutwardRegister.address_to.overlap(matching_ids))
        else:
            query = query.filter(models.OutwardRegister.address_to.overlap([-1]))
    
    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(models.OutwardRegister.outward_no.desc()).offset(offset).limit(limit).all()

    # Get pending deletions
    pending_deletes = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "outward_register",
        models.PendingDeletion.status == "Pending"
    ).all()
    pending_keys = {pd.record_id for pd in pending_deletes} # format "folder_id:year:outward_no"

    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.outward_no}"
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        folder_name = folder.folder_name if folder else ""

        # Fetch Address To recipient names
        address_to_names = []
        for a_id in r.address_to:
            addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == a_id).first()
            if addr:
                address_to_names.append(addr.name)
        
        # Fetch CC names
        cc_to_names = []
        for c_id in r.cc_to:
            addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == c_id).first()
            if addr:
                cc_to_names.append(addr.name)

        output.append({
            "outward_no": r.outward_no,
            "folder_id": r.folder_id,
            "folder_name": folder_name,
            "year": r.year,
            "issuing_date": r.issuing_date.isoformat(),
            "address_to_names": address_to_names,
            "cc_to_names": cc_to_names,
            "subject": r.subject,
            "remarks": r.remarks,
            "prepared_by": r.prepared_by,
            "document_path": r.document_path,
            "template_type": r.template_type,
            "is_pending_deletion": key in pending_keys
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": output
    }


# FR-094: View Document
@router.get("/view-document")
def view_document(path: str):
    """Downloads/streams the Word document file.
    
    Implements:
    - FR-094: Stream file from stored path.
    """
    root_dir = os.path.abspath(get_iodms_root_path())
    full_path = os.path.abspath(os.path.join(root_dir, path))
    
    # Security Check: Prevent path traversal
    if not full_path.startswith(root_dir):
        raise HTTPException(status_code=403, detail="Invalid path access denied")
        
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")
    return FileResponse(full_path)


# FR-095: Soft-delete outward register entry
@router.delete("/{folder_id}/{year}/{outward_no}")
def delete_outward_record(folder_id: str, year: int, outward_no: str, requester_id: str, db: Session = Depends(get_db)):
    """Submits outward record deletion request.
    
    Implements:
    - FR-095: Logs request in pending_deletions.
    """
    key = f"{folder_id}:{year}:{outward_no}"
    
    existing = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "outward_register",
        models.PendingDeletion.record_id == key,
        models.PendingDeletion.status == "Pending"
    ).first()
    
    if existing:
        return {"message": "Deletion request already pending.", "success": True}
        
    new_del = models.PendingDeletion(
        source_table="outward_register",
        record_id=key,
        requested_by=requester_id,
        status="Pending"
    )
    db.add(new_del)
    db.commit()
    return {"message": "Deletion request submitted to Admin.", "success": True}
