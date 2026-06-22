import datetime
import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_root_path, get_iodms_settings
import filesystem_utils

router = APIRouter()

# --- Helper functions ---

# FR-141: New Year Cutover and override date
def get_effective_year() -> int:
    """Calculates the active year for records, taking into account any Admin cutover override.
    
    Implements:
    - FR-141: If a cutover date is set and today is before that date, use the previous year.
    """
    settings = get_iodms_settings()
    override = settings.get("cutover_override_date")
    today = datetime.date.today()
    if override:
        try:
            override_date = datetime.datetime.strptime(override, "%Y-%m-%d").date()
            # If we are in the new year but before the cutover date, use the prior year
            if today < override_date and today.year == override_date.year:
                return today.year - 1
        except Exception:
            pass
    return today.year


# FR-060, FR-061: Generate next Inward Number
def get_next_inward_no(folder_id: str, year: int, db: Session) -> str:
    """Computes the next inward sequential number for a specific Folder ID and Year.
    
    Implements:
    - FR-061: Resets to 001 yearly per Folder ID, zero-padded up to 999, then 4+ digits.
    """
    records = db.query(models.InwardRegister.inward_no).filter(
        models.InwardRegister.folder_id == folder_id,
        models.InwardRegister.year == year
    ).all()
    
    if not records:
        return "001"
        
    max_val = 0
    for (no_str,) in records:
        try:
            val = int(no_str)
            if val > max_val:
                max_val = val
        except ValueError:
            pass
            
    next_val = max_val + 1
    if next_val <= 999:
        return f"{next_val:03d}"
    else:
        return str(next_val)


# --- Endpoints ---

# FR-060, FR-061: Request Inward No.
@router.get("/next-no")
def get_next_no(folder_id: str, db: Session = Depends(get_db)):
    """API endpoint to get the next sequential Inward Number for a folder.
    
    Implements:
    - FR-060, FR-061: Auto-generates and displays next Inward No. as read-only.
    """
    year = get_effective_year()
    next_no = get_next_inward_no(folder_id, year, db)
    return {"inward_no": next_no, "year": year}


# FR-060 to FR-077: Create/Log Inward
@router.post("")
def log_inward(
    inward_no: str = Form(...),
    folder_id: str = Form(...),
    receiving_date: str = Form(...),
    inward_letter_no: Optional[str] = Form(None),
    inward_date: Optional[str] = Form(None),
    received_from: Optional[str] = Form(None),
    originated_by: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    remarks: Optional[str] = Form(None),
    document_type: str = Form(...),
    scanned_format: Optional[str] = Form(None),
    status: str = Form("Active"),
    assign_to: List[str] = Form([]),
    cc_sent_to: List[int] = Form([]),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Logs a new inward document, saving form data and uploading the attachment.
    
    Implements:
    - FR-062: Date of receipt defaulted or picked
    - FR-064: File upload dropzone. Stores file inside Inward/{Year}/{FolderID}/NextNo.ext
    - FR-077: Creates db entry in inward_register
    """
    year = get_effective_year()

    # Verify if a number conflict exists
    existing = db.query(models.InwardRegister).filter(
        models.InwardRegister.folder_id == folder_id,
        models.InwardRegister.year == year,
        models.InwardRegister.inward_no == inward_no
    ).first()
    if existing:
        # Re-fetch the next available number if a race condition happened
        inward_no = get_next_inward_no(folder_id, year, db)

    try:
        rec_date = datetime.datetime.strptime(receiving_date, "%Y-%m-%d").date()
        let_date = datetime.datetime.strptime(inward_date, "%Y-%m-%d").date() if inward_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    attachment_path = None
    original_ext = None

    if file:
        # Keep original extension (FR-064)
        _, ext = os.path.splitext(file.filename)
        ext = ext.lstrip(".").lower()
        original_ext = ext
        
        # Build path: Inward/{Year}/{FolderID}/{InwardNo}.{ext}
        relative_folder, full_folder_path = filesystem_utils.ensure_folder_path(
            get_iodms_root_path(), "Inward", year, folder_id
        )
        
        filename = f"{inward_no}.{ext}"
        relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
        full_file_path = os.path.join(full_folder_path, filename)
        
        # Save file to disk
        try:
            with open(full_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            attachment_path = relative_path
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file on server: {str(e)}")

    new_inward = models.InwardRegister(
        inward_no=inward_no,
        folder_id=folder_id,
        year=year,
        receiving_date=rec_date,
        inward_letter_no=inward_letter_no,
        inward_date=let_date,
        received_from=received_from,
        originated_by=originated_by,
        subject=subject,
        assign_to=assign_to,
        cc_sent_to=cc_sent_to,
        remarks=remarks,
        document_type=document_type,
        scanned_format=scanned_format,
        status=status,
        attachment_path=attachment_path,
        attachment_original_ext=original_ext
    )

    db.add(new_inward)
    db.commit()
    return {"message": "Inward logged successfully", "inward_no": inward_no, "success": True}


# FR-078: Modify Inward details
@router.put("/{folder_id}/{year}/{inward_no}")
def modify_inward(
    folder_id: str,
    year: int,
    inward_no: str,
    receiving_date: str = Form(...),
    inward_letter_no: Optional[str] = Form(None),
    inward_date: Optional[str] = Form(None),
    received_from: Optional[str] = Form(None),
    originated_by: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    remarks: Optional[str] = Form(None),
    document_type: str = Form(...),
    scanned_format: Optional[str] = Form(None),
    status: str = Form(...),
    assign_to: List[str] = Form([]),
    cc_sent_to: List[int] = Form([]),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Modifies an existing inward log entry.
    
    Implements:
    - FR-078: Updates record in place, replaces document if new one is uploaded.
    """
    record = db.query(models.InwardRegister).filter(
        models.InwardRegister.folder_id == folder_id,
        models.InwardRegister.year == year,
        models.InwardRegister.inward_no == inward_no
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Inward record not found")

    try:
        rec_date = datetime.datetime.strptime(receiving_date, "%Y-%m-%d").date()
        let_date = datetime.datetime.strptime(inward_date, "%Y-%m-%d").date() if inward_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if file:
        # Delete old file if it exists
        if record.attachment_path:
            old_path = os.path.join(get_iodms_root_path(), record.attachment_path)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

        # Save new file
        _, ext = os.path.splitext(file.filename)
        ext = ext.lstrip(".").lower()
        record.attachment_original_ext = ext
        
        relative_folder = os.path.join("Inward", str(year), folder_id)
        full_folder_path = os.path.join(get_iodms_root_path(), relative_folder)
        os.makedirs(full_folder_path, exist_ok=True)
        
        filename = f"{inward_no}.{ext}"
        relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
        full_file_path = os.path.join(get_iodms_root_path(), relative_path)
        
        with open(full_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        record.attachment_path = relative_path

    record.receiving_date = rec_date
    record.inward_letter_no = inward_letter_no
    record.inward_date = let_date
    record.received_from = received_from
    record.originated_by = originated_by
    record.subject = subject
    record.assign_to = assign_to
    record.cc_sent_to = cc_sent_to
    record.remarks = remarks
    record.document_type = document_type
    record.scanned_format = scanned_format
    record.status = status

    db.commit()
    return {"message": "Inward record modified successfully", "success": True}


# FR-080, FR-081, FR-082: Search & Paginate Inward Register
@router.get("/register")
def get_inward_register(
    year: int,
    page: int = 1,
    limit: int = 20,
    search_assign_to: Optional[str] = None,
    search_received_from: Optional[str] = None,
    search_originated_by: Optional[str] = None,
    search_subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated inward entries filtered by year and search keywords.
    
    Implements:
    - FR-080: Paginated register view.
    - FR-081: Year filter.
    - FR-082: Search filters for Assign To, Received From, Originated By, Subject.
    - FR-084: Annotates records with pending deletion requests.
    """
    # Base query for the requested year
    query = db.query(models.InwardRegister).filter(models.InwardRegister.year == year)

    # Apply search filters
    if search_assign_to:
        query = query.filter(models.InwardRegister.assign_to.any(search_assign_to))
    if search_received_from:
        query = query.filter(models.InwardRegister.received_from.ilike(f"%{search_received_from}%"))
    if search_originated_by:
        query = query.filter(models.InwardRegister.originated_by.ilike(f"%{search_originated_by}%"))
    if search_subject:
        query = query.filter(models.InwardRegister.subject.ilike(f"%{search_subject}%"))

    total = query.count()
    offset = (page - 1) * limit
    results = query.order_by(models.InwardRegister.inward_no.desc()).offset(offset).limit(limit).all()

    # Fetch all pending deletions for inward_register
    pending_deletes = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "inward_register",
        models.PendingDeletion.status == "Pending"
    ).all()
    pending_keys = {pd.record_id for pd in pending_deletes} # format "folder_id:year:inward_no"

    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.inward_no}"
        # Fetch folder name
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        folder_name = folder.folder_name if folder else ""
        
        output.append({
            "inward_no": r.inward_no,
            "folder_id": r.folder_id,
            "folder_name": folder_name,
            "year": r.year,
            "receiving_date": r.receiving_date.isoformat(),
            "inward_letter_no": r.inward_letter_no,
            "inward_date": r.inward_date.isoformat() if r.inward_date else None,
            "received_from": r.received_from,
            "originated_by": r.originated_by,
            "subject": r.subject,
            "assign_to": r.assign_to,
            "cc_sent_to": r.cc_sent_to,
            "remarks": r.remarks,
            "document_type": r.document_type,
            "status": r.status,
            "attachment_path": r.attachment_path,
            "is_pending_deletion": key in pending_keys
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": output
    }


# FR-083: View File
@router.get("/view-file")
def view_file(path: str):
    """Exposes a file download/stream endpoint for attachments.
    
    Implements:
    - FR-083: Opens/views the attached file directly from its stored path.
    """
    root_dir = os.path.abspath(get_iodms_root_path())
    full_path = os.path.abspath(os.path.join(root_dir, path))
    
    # Security Check: Prevent path traversal
    if not full_path.startswith(root_dir):
        raise HTTPException(status_code=403, detail="Invalid path access denied")
        
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(full_path)


# FR-084: Request deletion of Inward record
@router.delete("/{folder_id}/{year}/{inward_no}")
def request_deletion(folder_id: str, year: int, inward_no: str, requester_id: str, db: Session = Depends(get_db)):
    """Submits a deletion request for an inward record.
    
    Implements:
    - FR-084: Records deletion request in pending_deletions; greys out row immediately.
    """
    key = f"{folder_id}:{year}:{inward_no}"
    
    # Check if request is already pending
    existing = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "inward_register",
        models.PendingDeletion.record_id == key,
        models.PendingDeletion.status == "Pending"
    ).first()
    
    if existing:
        return {"message": "Deletion request already pending.", "success": True}
        
    new_del = models.PendingDeletion(
        source_table="inward_register",
        record_id=key,
        requested_by=requester_id,
        status="Pending"
    )
    db.add(new_del)
    db.commit()
    return {"message": "Deletion request submitted to Admin.", "success": True}
