import datetime
import os
import shutil
import json
import uuid
from .link_utils import sync_bidirectional_links
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_root_path, get_iodms_settings
import filesystem_utils
from auth_utils import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

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

def log_edit(db: Session, record_type: str, record_id: str, action: str, user_id: str, changes: dict = None):
    """Helper to add an entry to the EditLog."""
    log = models.EditLog(
        record_type=record_type,
        record_id=str(record_id),
        action=action,
        changes=changes,
        edited_by=user_id
    )
    db.add(log)
    db.commit()

# --- Endpoints ---


# FR-060, FR-061: Actually reserve Inward No. (called when officer clicks "Get Number")
@router.get("/next-no")
def get_next_no(
    folder_id: str, 
    target_year: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reserves the next Inward Number for this officer in the database.

    Implements:
    - FR-060, FR-061: Auto-generates and reserves Inward No.
    - FR-144: Support target_year override for previous year entries.

    This is called ONLY when the officer explicitly clicks "Get Number".
    It creates a "Reserved" row in the database to guarantee the number
    is not given to anyone else.
    """
    user_id = current_user.get("user_id")

    # Check if the user already has a reserved inward record
    existing_reserved = db.query(models.InwardRegister).filter(
        models.InwardRegister.actioned_by == user_id,
        models.InwardRegister.status == "Reserved"
    ).first()

    if existing_reserved:
        # Before blocking, check if it's pending deletion
        pending_del = db.query(models.PendingDeletion).filter(
            models.PendingDeletion.source_table == "inward_register",
            models.PendingDeletion.record_id == f"{existing_reserved.folder_id}:{existing_reserved.year}:{existing_reserved.inward_no}",
            models.PendingDeletion.status == "Pending"
        ).first()
        
        if not pending_del:
            year = target_year if target_year else get_effective_year()
            if existing_reserved.folder_id == folder_id and existing_reserved.year == year:
                return {"inward_no": existing_reserved.inward_no, "year": existing_reserved.year, "reused": True}
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"You already have an unused reserved Inward Number for folder '{existing_reserved.folder_id}' (Year {existing_reserved.year}). Please go to the Inward Register to complete or delete it before reserving a new number in a different folder."
                )

    year = target_year if target_year else get_effective_year()
    
    # Retry loop to reserve the number
    for attempt in range(3):
        next_no = get_next_inward_no(folder_id, year, db)
        reserved_record = models.InwardRegister(
            inward_no=next_no,
            folder_id=folder_id,
            year=year,
            document_type="Reserved",
            status="Reserved",
            actioned_by=user_id
        )
        try:
            db.add(reserved_record)
            db.commit()
            return {"inward_no": next_no, "year": year}
        except Exception:
            db.rollback()
            
    raise HTTPException(status_code=500, detail="Failed to reserve inward number due to high concurrency. Please try again.")


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
    actioned_by: str = Form("unknown"),
    target_year: Optional[int] = Form(None),
    linked_documents: str = Form("[]"),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    """Logs a new inward document, saving form data and uploading the attachment.
    
    Implements:
    - FR-062: Date of receipt defaulted or picked
    - FR-064: File upload dropzone. Stores file inside Inward/{Year}/{FolderID}/NextNo.ext
    - FR-077: Creates db entry in inward_register
    - FR-144: Support previous year entry via target_year
    """
    year = target_year if target_year else get_effective_year()

    if not inward_no or inward_no.strip() == "":
        raise HTTPException(status_code=400, detail="Inward Number is required")

    # Find the reserved record
    reserved_record = db.query(models.InwardRegister).filter(
        models.InwardRegister.folder_id == folder_id,
        models.InwardRegister.year == year,
        models.InwardRegister.inward_no == inward_no,
        models.InwardRegister.status == "Reserved"
    ).first()

    if not reserved_record:
        raise HTTPException(status_code=400, detail="Inward Number is no longer reserved or was already used.")

    try:
        rec_date = datetime.datetime.strptime(receiving_date, "%Y-%m-%d").date()
        let_date = datetime.datetime.strptime(inward_date, "%Y-%m-%d").date() if inward_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    attachment_path = None
    original_ext = None

    any_compressed = False
    attachment_paths = []
    
    import json
    try:
        parsed_links = json.loads(linked_documents)
    except:
        parsed_links = []

    if files:
        relative_folder, full_folder_path = filesystem_utils.ensure_folder_path(
            get_iodms_root_path(), "Inward", year, folder_id
        )
        
        # Handle single vs multiple correctly
        if len(files) == 1 and files[0].filename == "":
            pass # No actual file uploaded
        else:
            for idx, file in enumerate(files):
                if not file.filename: continue
                _, ext = os.path.splitext(file.filename)
                ext = ext.lstrip(".").lower()
                
                # If multiple files, append index to filename
                if len(files) > 1:
                    filename = f"{inward_no}_{idx+1}.{ext}"
                else:
                    filename = f"{inward_no}.{ext}"
                    original_ext = ext
                    
                relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
                full_file_path = os.path.join(full_folder_path, filename)
                
                try:
                    with open(full_file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    final_abs_path, was_compressed = filesystem_utils.compress_file_if_large(full_file_path)
                    if was_compressed: any_compressed = True
                    
                    if was_compressed:
                        final_filename = os.path.basename(final_abs_path)
                        attachment_paths.append(os.path.join(relative_folder, final_filename).replace("\\", "/"))
                    else:
                        attachment_paths.append(relative_path)
                        
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to save file on server: {str(e)}")


    reserved_record.receiving_date = rec_date
    reserved_record.inward_letter_no = inward_letter_no
    reserved_record.inward_date = let_date
    reserved_record.is_compressed = any_compressed
    reserved_record.received_from = received_from
    reserved_record.originated_by = originated_by
    reserved_record.subject = subject
    reserved_record.assign_to = assign_to
    reserved_record.cc_sent_to = cc_sent_to
    reserved_record.remarks = remarks
    reserved_record.document_type = document_type
    reserved_record.scanned_format = scanned_format
    reserved_record.status = status
    reserved_record.attachment_paths = attachment_paths
    old_links = reserved_record.linked_documents or []
    reserved_record.linked_documents = parsed_links
    
    # Sync bidirectional links
    source_id = f"inward:{folder_id}:{year}:{inward_no}"
    sync_bidirectional_links(db, source_id, old_links, parsed_links)
    
    if attachment_paths and not reserved_record.attachment_path:
        # For legacy compatibility
        reserved_record.attachment_path = attachment_paths[0]
        reserved_record.attachment_original_ext = original_ext
    reserved_record.actioned_by = actioned_by
    
    log_edit(db, "inward", f"{folder_id}:{year}:{inward_no}", "create", actioned_by)
    
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
    actioned_by: str = Form("unknown"),
    linked_documents: str = Form("[]"),
    files: List[UploadFile] = File([]),
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

    import json
    try:
        parsed_links = json.loads(linked_documents)
        old_links = record.linked_documents or []
        record.linked_documents = parsed_links
        
        # Sync bidirectional links
        source_id = f"inward:{folder_id}:{year}:{inward_no}"
        sync_bidirectional_links(db, source_id, old_links, parsed_links)
    except:
        pass

    if files and not (len(files) == 1 and files[0].filename == ""):
        # Delete old files if they exist
        if record.attachment_paths:
            for p in record.attachment_paths:
                old_path = os.path.join(get_iodms_root_path(), p)
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
        elif record.attachment_path: # legacy fallback
            old_path = os.path.join(get_iodms_root_path(), record.attachment_path)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

        new_paths = []
        any_compressed = False
        relative_folder = os.path.join("Inward", str(year), folder_id)
        full_folder_path = os.path.join(get_iodms_root_path(), relative_folder)
        os.makedirs(full_folder_path, exist_ok=True)
        
        for idx, file in enumerate(files):
            if not file.filename: continue
            _, ext = os.path.splitext(file.filename)
            ext = ext.lstrip(".").lower()
            
            if len(files) > 1:
                filename = f"{inward_no}_{idx+1}.{ext}"
            else:
                filename = f"{inward_no}.{ext}"
                record.attachment_original_ext = ext
                
            relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
            full_file_path = os.path.join(full_folder_path, filename)
            
            try:
                with open(full_file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                final_abs_path, was_compressed = filesystem_utils.compress_file_if_large(full_file_path)
                if was_compressed: any_compressed = True
                
                if was_compressed:
                    final_filename = os.path.basename(final_abs_path)
                    new_paths.append(os.path.join(relative_folder, final_filename).replace("\\", "/"))
                else:
                    new_paths.append(relative_path)
            except Exception as e:
                pass # Ignore write errors for now

        record.attachment_paths = new_paths
        record.is_compressed = any_compressed
        if new_paths:
            record.attachment_path = new_paths[0]

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
    record.actioned_by = actioned_by

    log_edit(db, "inward", f"{folder_id}:{year}:{inward_no}", "edit", actioned_by)

    db.commit()
    return {"message": "Inward record modified successfully", "success": True}


# FR-080, FR-081, FR-082: Search & Paginate Inward Register
@router.get("/register")
def get_inward_register(
    year: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    search_folder_id: Optional[str] = None,
    search_assign_to: Optional[str] = None,
    search_received_from: Optional[str] = None,
    search_originated_by: Optional[str] = None,
    search_subject: Optional[str] = None,
    search_status: Optional[str] = None,
    search_date_from: Optional[str] = None,
    search_date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated inward entries filtered by year and advanced search keywords.
    
    Implements:
    - FR-080: Paginated register view.
    - FR-081: Year filter.
    - FR-082: Search filters for Assign To, Received From, Originated By, Subject.
    - FR-084: Annotates records with pending deletion requests.
    """
    # Base query: Exclude Permanently Deleted records
    query = db.query(models.InwardRegister).filter(models.InwardRegister.status != "Permanently Deleted")

    if year and year != "All":
        try:
            y = int(year)
            query = query.filter(models.InwardRegister.year == y)
        except ValueError:
            pass

    # Apply search filters
    if search_folder_id:
        query = query.filter(models.InwardRegister.folder_id == search_folder_id)
    if search_assign_to:
        query = query.filter(models.InwardRegister.assign_to.any(search_assign_to))
    if search_received_from:
        query = query.filter(models.InwardRegister.received_from.ilike(f"%{search_received_from}%"))
    if search_originated_by:
        query = query.filter(models.InwardRegister.originated_by.ilike(f"%{search_originated_by}%"))
    if search_subject:
        query = query.filter(models.InwardRegister.subject.ilike(f"%{search_subject}%"))
    if search_status:
        query = query.filter(models.InwardRegister.status == search_status)
    if search_date_from:
        try:
            d_from = datetime.datetime.strptime(search_date_from, "%Y-%m-%d").date()
            query = query.filter(models.InwardRegister.receiving_date >= d_from)
        except ValueError:
            pass
    if search_date_to:
        try:
            d_to = datetime.datetime.strptime(search_date_to, "%Y-%m-%d").date()
            query = query.filter(models.InwardRegister.receiving_date <= d_to)
        except ValueError:
            pass

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
