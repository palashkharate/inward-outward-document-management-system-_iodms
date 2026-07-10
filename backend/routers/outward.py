import datetime
import os
import shutil
import json
import uuid
from .link_utils import sync_bidirectional_links
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import get_db, get_iodms_root_path, get_iodms_settings
from routers.inward import get_effective_year
import filesystem_utils
from auth_utils import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

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
    target_year: Optional[int] = None
    linked_documents: Optional[List[str]] = []

class DraftLockAction(BaseModel):
    user_id: str

# --- Helper functions ---

def check_draft_locks(db: Session):
    """Auto-expires locks older than 30 minutes."""
    thirty_mins_ago = datetime.datetime.now() - datetime.timedelta(minutes=30)
    db.query(models.DraftFile).filter(
        models.DraftFile.is_locked == True,
        models.DraftFile.locked_at < thirty_mins_ago
    ).update({"is_locked": False, "locked_by": None, "locked_at": None})
    db.commit()

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

# FR-055: Pre-assign and reserve Outward number
def get_next_outward_no(folder_id: str, year: int, db: Session) -> str:
    """Gets the next sequential Outward Number by looking at the whole outward year.
    
    Implements:
    - FR-055: Reserves the number immediately on creation to prevent concurrency conflicts.
      Outward numbers are yearly global numbers; Folder ID only controls storage grouping.
    """
    # 1. Fetch from outward_register for the whole year, not per Folder ID.
    register_nos = db.query(models.OutwardRegister.outward_no).filter(
        models.OutwardRegister.year == year
    ).all()
    
    # 2. Fetch from draft_files for the whole year, not per Folder ID.
    draft_nos = db.query(models.DraftFile.outward_no).filter(
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
    """Creates a document from template or fallback basic formatted text file.
    
    Implements:
    - FR-143: Generates a document using uploaded DocumentTemplates.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    template_id = data.get('template_type')
    try:
        template = db.query(models.DocumentTemplate).filter(models.DocumentTemplate.id == int(template_id)).first()
    except:
        template = None

    if template:
        src_path = os.path.join(get_iodms_root_path(), template.file_path)
        if os.path.exists(src_path):
            shutil.copyfile(src_path, filepath)
            return
            
    # Fallback to a valid DOCX so the in-browser viewer can render it.
    address_str = ""
    if data.get("address_to"):
        addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == data["address_to"][0]).first()
        if addr:
            address_str = f"{addr.name}\n{addr.designation or ''}\n{addr.organisation or ''}\n{addr.address_line_1 or ''}\n{addr.address_line_2 or ''}"
            
    cc_names = []
    if data.get("cc_to"):
        for cc_id in data["cc_to"]:
            addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == cc_id).first()
            if addr:
                cc_names.append(addr.name)
    cc_str = ", ".join(cc_names)

    try:
        from docx import Document

        doc = Document()
        doc.add_heading("HAL AURDC, NASHIK - DEA", level=1)
        doc.add_paragraph(f"Outward Reference No: {data.get('outward_no')}")
        doc.add_paragraph(f"Date: {data.get('issuing_date')}")
        doc.add_paragraph(f"Folder ID: {data.get('folder_id')}")
        doc.add_paragraph(f"Template ID: {data.get('template_type')}")
        doc.add_paragraph(f"Prepared By: {data.get('prepared_by')}")
        doc.add_heading("To", level=2)
        doc.add_paragraph(address_str or "To be filled")
        doc.add_paragraph(f"CC: {cc_str}")
        doc.add_heading(f"Subject: {data.get('subject')}", level=2)
        doc.add_paragraph("Dear Sir/Madam,")
        doc.add_paragraph("[Place your letter body contents here...]")
        doc.add_paragraph(f"Remarks: {data.get('remarks') or ''}")
        doc.save(filepath)
    except Exception:
        content = f"""HAL AURDC, NASHIK - DESIGN & ENGINEERING ACTIVITY (DEA)
Outward Reference No: {data.get('outward_no')}
Date: {data.get('issuing_date')}
Folder ID: {data.get('folder_id')}
Template ID: {data.get('template_type')}
Prepared By: {data.get('prepared_by')}

TO:
{address_str}

CC: {cc_str}

SUBJECT: {data.get('subject')}

Dear Sir/Madam,

[Place your letter body contents here...]

Remarks: {data.get('remarks')}
"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)


# --- Endpoints ---

# FR-055: Reserve Outward No.
@router.get("/next-no")
def get_next_no(
    folder_id: str, 
    target_year: Optional[int] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Reserves the next available Outward number.
    
    Implements:
    - FR-055: Pre-assigns the Outward No. when Compose Outward opens.
    - FR-055: Prevents duplicate reserved numbers while allowing officers to keep many saved drafts.
    - FR-144: Support target_year override for previous year entries.
    """
    user_id = current_user.get("user_id")
    year = target_year if target_year else get_effective_year()
    
    # Saved drafts do not block new drafts. Only an unfinished reservation is reused
    # so refresh/reset clicks do not burn several outward numbers before Save Draft.
    existing_reserved = db.query(models.DraftFile).filter(
        models.DraftFile.actioned_by == user_id,
        models.DraftFile.file_path == "[Reserved]"
    ).first()
    if existing_reserved:
        if existing_reserved.year == year:
            existing_reserved.folder_id = folder_id
            db.commit()
            return {"outward_no": existing_reserved.outward_no, "year": existing_reserved.year, "reused": True}
        raise HTTPException(
            status_code=400,
            detail=f"You already have an unused reserved Outward Number for Year {existing_reserved.year}. Please save it before reserving a number for another year."
        )

    # Retry loop to reserve the number
    for attempt in range(3):
        next_no = get_next_outward_no(folder_id, year, db)
        reserved_draft = models.DraftFile(
            file_path="[Reserved]",
            outward_no=next_no,
            folder_id=folder_id,
            issuing_date=datetime.date.today(),
            address_to=[],
            cc_to=[],
            subject="[Reserved Draft]",
            remarks="",
            prepared_by=user_id,
            actioned_by=user_id,
            template_type="Reserved",
            year=year
        )
        try:
            db.add(reserved_draft)
            db.commit()
            return {"outward_no": next_no, "year": year}
        except Exception:
            db.rollback()
            
    raise HTTPException(status_code=500, detail="Failed to reserve outward number due to high concurrency. Please try again.")


# FR-042: Save Draft
@router.post("/draft")
def save_draft(
    payload: DraftCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Saves outward details as a draft and generates a .doc file on disk.
    
    Implements:
    - FR-042: Generates a draft file under IODMS/Drafts/{Year}/{FolderID}/fax-...doc
    - FR-144: Support target_year override
    """
    year = payload.target_year if payload.target_year else get_effective_year()
    outward_no = payload.outward_no
    actor_id = current_user.get("user_id")
    
    if not outward_no or outward_no.strip() == "":
        raise HTTPException(status_code=400, detail="Outward Number is required")

    # Find the reserved draft
    draft_record = db.query(models.DraftFile).filter(
        models.DraftFile.folder_id == payload.folder_id,
        models.DraftFile.year == year,
        models.DraftFile.outward_no == outward_no,
        models.DraftFile.actioned_by == actor_id,
        models.DraftFile.file_path == "[Reserved]"
    ).first()

    if not draft_record:
        raise HTTPException(status_code=400, detail="Outward Number is no longer reserved or was already used.")

    # Filename format: draft-{UserID}-{YYYYMMDD}-{HHMMSS}.docx
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"draft-{actor_id}-{timestamp}.docx"
    
    relative_folder, full_folder = filesystem_utils.ensure_folder_path(get_iodms_root_path(), "Drafts", year, payload.folder_id)
    relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
    full_path = os.path.join(full_folder, filename)
    
    # Update payload with the actual outward_no if it changed
    payload_dict = payload.model_dump()
    payload_dict["outward_no"] = outward_no
    payload_dict["actioned_by"] = actor_id
    
    # Save the physical file on disk (FR-042)
    try:
        create_draft_document(full_path, payload_dict, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create draft document on disk: {str(e)}")

    try:
        iss_date = datetime.datetime.strptime(payload.issuing_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Update the reserved draft record
    draft_record.file_path = relative_path
    draft_record.issuing_date = iss_date
    draft_record.address_to = payload.address_to
    draft_record.cc_to = payload.cc_to
    draft_record.subject = payload.subject
    draft_record.remarks = payload.remarks
    draft_record.prepared_by = payload.prepared_by
    draft_record.actioned_by = actor_id
    draft_record.template_type = payload.template_type
    draft_record.linked_documents = payload.linked_documents
    draft_record.attachment_paths = [relative_path]
    log_edit(db, "draft", str(draft_record.draft_id), "create", actor_id, payload_dict)
    
    # We do NOT add a new record, we just commit the update
    # db.add(draft_record) is not needed because it's already attached to the session
    db.commit()
    return {"message": "Draft created successfully", "draft_id": draft_record.draft_id, "outward_no": outward_no, "success": True}


# FR-170b: Attach supporting files to an outward draft from Compose Outward
@router.post("/drafts/{draft_id}/attachments")
def attach_draft_files(
    draft_id: int,
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Adds supporting PDFs, PPTs, DOCs, or other office files to an existing draft."""
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if not files or (len(files) == 1 and files[0].filename == ""):
        raise HTTPException(status_code=400, detail="At least one file is required.")

    actor_id = current_user.get("user_id")
    relative_folder, full_folder = filesystem_utils.ensure_folder_path(
        get_iodms_root_path(), "Drafts", draft.year, draft.folder_id
    )
    existing_paths = draft.attachment_paths or []
    new_paths = []

    for idx, file in enumerate(files, start=1):
        if not file.filename:
            continue
        ext = os.path.splitext(file.filename)[1] or ".bin"
        filename = f"{draft.outward_no}_attachment_{len(existing_paths) + idx}{ext}"
        relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
        full_path = os.path.join(full_folder, filename)

        try:
            with open(full_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            final_abs_path, was_compressed = filesystem_utils.compress_file_if_large(full_path)
            if was_compressed:
                final_filename = os.path.basename(final_abs_path)
                relative_path = os.path.join(relative_folder, final_filename).replace("\\", "/")
            new_paths.append(relative_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save attachment: {str(e)}")

    draft.attachment_paths = existing_paths + new_paths
    log_edit(db, "draft", str(draft_id), "attach", actor_id, {"files": new_paths})
    db.commit()
    return {"message": "Draft attachment files uploaded successfully", "files": new_paths, "success": True}


# FR-057: Direct Draft Upload
@router.post("/drafts/upload")
def upload_existing_draft(
    folder_id: str = Form(...),
    issuing_date: str = Form(...),
    address_to: str = Form(...), # comma separated IDs
    cc_to: str = Form(""),       # comma separated IDs
    subject: str = Form(...),
    remarks: str = Form(""),
    prepared_by: str = Form(...),
    actioned_by: str = Form(...),
    files: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Uploads an existing PDF or DOCX file directly as a new Draft.
    
    Implements:
    - FR-057: Bypasses template generation and uses user-uploaded file.
    """
    year = get_effective_year()
    actor_id = current_user.get("user_id")
    outward_no = get_next_outward_no(folder_id, year, db)
    
    attachment_paths = []
    any_compressed = False

    if not files or (len(files) == 1 and files[0].filename == ""):
        raise HTTPException(status_code=400, detail="At least one file is required.")

    for idx, file in enumerate(files):
        if not file.filename: continue
        ext = os.path.splitext(file.filename)[1]
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        if len(files) > 1:
            filename = f"fax-{actor_id}-{timestamp}_{idx+1}{ext}"
        else:
            filename = f"fax-{actor_id}-{timestamp}{ext}"
        
        relative_folder, full_folder = filesystem_utils.ensure_folder_path(get_iodms_root_path(), "Drafts", year, folder_id)
        relative_path = os.path.join(relative_folder, filename).replace("\\", "/")
        full_path = os.path.join(full_folder, filename)
        
        try:
            with open(full_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            final_abs_path, was_compressed = filesystem_utils.compress_file_if_large(full_path)
            if was_compressed: any_compressed = True
            
            if was_compressed:
                final_filename = os.path.basename(final_abs_path)
                attachment_paths.append(os.path.join(relative_folder, final_filename).replace("\\", "/"))
            else:
                attachment_paths.append(relative_path)
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    try:
        iss_date = datetime.datetime.strptime(issuing_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    addr_list = [int(i.strip()) for i in address_to.split(",") if i.strip().isdigit()]
    cc_list = [int(i.strip()) for i in cc_to.split(",") if i.strip().isdigit()]

    new_draft = models.DraftFile(
        file_path=attachment_paths[0] if attachment_paths else "",
        attachment_paths=attachment_paths,
        outward_no=outward_no,
        folder_id=folder_id,
        issuing_date=iss_date,
        address_to=addr_list,
        cc_to=cc_list,
        subject=subject,
        remarks=remarks,
        prepared_by=prepared_by,
        actioned_by=actor_id,
        template_type="Manual Upload",
        is_locked=False,
        year=year
    )
    
    db.add(new_draft)
    db.commit()
    log_edit(db, "draft", str(new_draft.draft_id), "create", actor_id, {
        "outward_no": outward_no,
        "folder_id": folder_id,
        "subject": subject,
        "uploaded_files": attachment_paths
    })
    return {"message": "Draft uploaded successfully", "draft_id": new_draft.draft_id, "outward_no": outward_no, "success": True}

# FR-052: Re-Upload Draft File (after editing)
@router.put("/drafts/{draft_id}/reupload")
def reupload_draft_file(
    draft_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Re-uploads an edited draft file and releases its lock.
    
    Implements:
    - FR-052: User edits file locally and re-uploads it here.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    actor_id = current_user.get("user_id")
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    if not draft.is_locked:
        raise HTTPException(status_code=400, detail="Draft is not locked. Lock it first before re-uploading.")
    if draft.locked_by and draft.locked_by != actor_id:
        raise HTTPException(status_code=403, detail=f"This draft is locked by {draft.locked_by}. Ask them or an Admin to release the lock.")

    full_path = os.path.join(get_iodms_root_path(), draft.file_path)
    
    try:
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # FR-161: Compress file if larger than 50MB
        final_abs_path, was_compressed = filesystem_utils.compress_file_if_large(full_path)
        if was_compressed:
            final_filename = os.path.basename(final_abs_path)
            # Update path in DB to point to new .zip file
            draft.file_path = os.path.join(os.path.dirname(draft.file_path), final_filename).replace("\\", "/")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to overwrite draft file: {str(e)}")

    # Release lock after successful upload
    draft.is_locked = False
    draft.locked_by = None
    draft.locked_at = None
    
    log_edit(db, "draft", str(draft_id), "reupload", actor_id, {"filename": file.filename})
    
    db.commit()
    
    return {"message": "Draft updated and unlocked successfully", "success": True}


# FR-044, FR-045: Modify Outward (Modify Mode)
@router.put("/modify/{folder_id}/{year}/{outward_no}")
def modify_outward(
    folder_id: str,
    year: int,
    outward_no: str,
    payload: DraftCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
    actor_id = current_user.get("user_id")

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
    record.actioned_by = actor_id
    record.template_type = payload.template_type
    old_links = record.linked_documents or []
    record.linked_documents = payload.linked_documents
    
    source_id = f"outward:{folder_id}:{year}:{outward_no}"
    sync_bidirectional_links(db, source_id, old_links, payload.linked_documents)

    # Recreate the file on disk
    full_path = os.path.join(get_iodms_root_path(), record.document_path)
    try:
        create_draft_document(full_path, payload.model_dump(), db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to overwrite file on disk: {str(e)}")

    changes = payload.model_dump()
    changes["actioned_by"] = actor_id
    log_edit(db, "outward", f"{folder_id}:{year}:{outward_no}", "edit", actor_id, changes)

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
    check_draft_locks(db)

    # Exclude drafts that are flagged in pending_deletions
    pending_deletes = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "draft_files",
        models.PendingDeletion.status == "Pending"
    ).all()
    pending_ids = [int(pd.record_id) for pd in pending_deletes]

    query = db.query(models.DraftFile).filter(models.DraftFile.file_path != "[Reserved]")
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
            "attachment_paths": d.attachment_paths or [],
            "template_type": d.template_type,
            "is_locked": d.is_locked,
            "locked_by": d.locked_by,
            "created_on": d.created_on.isoformat()
        })
    return output


# FR-052: Lock draft file for editing
@router.put("/drafts/{draft_id}/lock")
def lock_draft(
    draft_id: int,
    payload: DraftLockAction,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Locks the draft to prevent editing conflicts.
    
    Implements:
    - FR-052: Checks if locked by another user and rejects request.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    actor_id = current_user.get("user_id")
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.is_locked and draft.locked_by != actor_id:
        # Find locked user name
        locker = db.query(models.User).filter(models.User.user_id == draft.locked_by).first()
        locker_name = locker.name if locker else draft.locked_by
        raise HTTPException(
            status_code=400,
            detail=f"This draft is currently being edited by {locker_name}. Please try again later."
        )

    draft.is_locked = True
    draft.locked_by = actor_id
    draft.locked_at = datetime.datetime.now()
    
    log_edit(db, "draft", str(draft_id), "lock", actor_id)
    
    db.commit()
    return {"message": "Draft file locked for editing", "file_path": draft.file_path, "success": True}


# FR-053: Unlock draft file
@router.put("/drafts/{draft_id}/unlock")
def unlock_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Unlocks the draft file.
    
    Implements:
    - FR-053: Reset lock settings. Manual release available for Admin.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    actor_id = current_user.get("user_id")
    if draft.locked_by and draft.locked_by != actor_id and current_user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail=f"This draft is locked by {draft.locked_by}. Only that user or an Admin can release it.")
    locked_user = draft.locked_by
    draft.is_locked = False
    draft.locked_by = None
    draft.locked_at = None
    
    log_edit(db, "draft", str(draft_id), "unlock", actor_id, {"previously_locked_by": locked_user})
    
    db.commit()
    return {"message": "Draft file unlocked", "success": True}


# FR-054: Dispatch Draft
@router.post("/drafts/{draft_id}/dispatch")
def dispatch_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
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

    actor_id = current_user.get("user_id")
    year = draft.year
    folder_id = draft.folder_id
    
    # Auto-generate next sequential outward number (FR-054)
    # Note: the reserved number is draft.outward_no, but we re-fetch to make sure there are no gaps
    outward_no = draft.outward_no

    # If the reserved number is already used in register, fetch next
    register_conflict = db.query(models.OutwardRegister).filter(
        models.OutwardRegister.year == year,
        models.OutwardRegister.outward_no == outward_no
    ).first()
    if register_conflict:
         outward_no = get_next_outward_no(folder_id, year, db)

    # File rename & move (FR-054)
    # From: Drafts/{Year}/{FolderID}/fax-...{ext}
    # To: Outward/{Year}/{FolderID}/{OutwardNo}.{ext}
    old_relative_path = draft.file_path
    
    ext = os.path.splitext(old_relative_path)[1]
    if not ext:
        ext = ".doc"
    new_filename = f"{outward_no}{ext}"
    is_compressed = (ext.lower() == ".zip")
    
    try:
        new_relative_path, full_new_path = filesystem_utils.move_draft_to_outward(
            get_iodms_root_path(), old_relative_path, year, folder_id, new_filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move document on disk: {str(e)}")
        
    full_old_path = os.path.join(get_iodms_root_path(), old_relative_path)

    # If there are multiple files (from direct upload), move them all
    new_attachment_paths = []
    if draft.attachment_paths:
        for idx, p in enumerate(draft.attachment_paths):
            p_ext = os.path.splitext(p)[1]
            if len(draft.attachment_paths) > 1:
                p_filename = f"{outward_no}_{idx+1}{p_ext}"
            else:
                p_filename = f"{outward_no}{p_ext}"
            
            try:
                new_p, _ = filesystem_utils.move_draft_to_outward(
                    get_iodms_root_path(), p, year, folder_id, p_filename
                )
                new_attachment_paths.append(new_p)
            except Exception:
                pass
    else:
        new_attachment_paths = [new_relative_path]
    
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
        actioned_by=actor_id,
        document_path=new_attachment_paths[0] if new_attachment_paths else new_relative_path,
        attachment_paths=new_attachment_paths,
        template_type=draft.template_type,
        linked_documents=draft.linked_documents,
        is_compressed=is_compressed
    )
    
    db.add(new_outward)
    
    # Log dispatch action
    log_edit(db, "draft", str(draft_id), "dispatch", actor_id)
    log_edit(db, "outward", f"{folder_id}:{year}:{outward_no}", "create", actor_id)
    
    # Sync links
    source_id = f"outward:{folder_id}:{year}:{outward_no}"
    sync_bidirectional_links(db, source_id, [], draft.linked_documents)
    
    db.delete(draft)  # delete draft record (FR-054)
    db.commit()

    return {"message": "Document dispatched successfully", "outward_no": outward_no, "success": True}


# FR-056: Discard Draft
@router.delete("/drafts/{draft_id}")
def discard_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Requests draft discarding.
    
    Implements:
    - FR-056: Creates deletion request in pending_deletions; draft hidden immediately.
    """
    draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
    if not draft:
         raise HTTPException(status_code=404, detail="Draft not found")
    actor_id = current_user.get("user_id")

    new_del = models.PendingDeletion(
        source_table="draft_files",
        record_id=str(draft_id),
        requested_by=actor_id,
        status="Pending"
    )
    db.add(new_del)
    log_edit(db, "draft", str(draft_id), "discard", actor_id)
    db.commit()
    return {"message": "Draft discard requested. Awaiting Admin approval.", "success": True}


# FR-090, FR-091, FR-092, FR-093: View Outward Register
@router.get("/register")
def get_outward_register(
    year: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    search_folder_id: Optional[str] = None,
    search_prepared_by: Optional[str] = None,
    search_address_to: Optional[str] = None,
    search_subject: Optional[str] = None,
    search_status: Optional[str] = None,
    search_date_from: Optional[str] = None,
    search_date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves paginated outward logs filtered by year and advanced search keywords.
    
    Implements:
    - FR-090: Displays outward entries.
    - FR-091: Address To and CC To printed as comma-separated values in single cell.
    - FR-092: Year filter.
    - FR-093: Search filters: Folder ID, Prepared By, Address To (text search), Subject.
    - FR-095: Marks row with Pending Deletion badge.
    """
    query = db.query(models.OutwardRegister).filter(models.OutwardRegister.status != "Permanently Deleted")

    if year and year != "All":
        try:
            y = int(year)
            query = query.filter(models.OutwardRegister.year == y)
        except ValueError:
            pass

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
    if search_status:
        query = query.filter(models.OutwardRegister.status == search_status)
    if search_date_from:
        try:
            d_from = datetime.datetime.strptime(search_date_from, "%Y-%m-%d").date()
            query = query.filter(models.OutwardRegister.issuing_date >= d_from)
        except ValueError:
            pass
    if search_date_to:
        try:
            d_to = datetime.datetime.strptime(search_date_to, "%Y-%m-%d").date()
            query = query.filter(models.OutwardRegister.issuing_date <= d_to)
        except ValueError:
            pass
    
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
def view_document(path: str, db: Session = Depends(get_db)):
    """Serves the document file directly (PDF or DOC/DOCX) for in-browser viewer.
    
    Implements:
    - FR-094: In-Browser Document View
    """
    root_path = os.path.abspath(get_iodms_root_path())
    full_path = os.path.abspath(os.path.join(root_path, path.lstrip("/\\")))
    
    # Path traversal check
    if not full_path.startswith(root_path):
        raise HTTPException(status_code=403, detail="Forbidden: Path traversal detected")
        
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on server disk")
    return FileResponse(full_path)

# FR-058: Edit Audit Log Endpoint
@router.get("/edit-log/{record_type}/{record_id}")
def get_edit_log(record_type: str, record_id: str, db: Session = Depends(get_db)):
    """Gets the edit history for a specific record."""
    logs = db.query(models.EditLog).filter(
        models.EditLog.record_type == record_type,
        models.EditLog.record_id == record_id
    ).order_by(models.EditLog.edited_at.desc()).all()
    
    result = []
    for log in logs:
        editor = db.query(models.User).filter(models.User.user_id == log.edited_by).first()
        result.append({
            "action": log.action,
            "edited_by": editor.name if editor else log.edited_by,
            "edited_at": log.edited_at.isoformat(),
            "changes": log.changes
        })
    return result


# FR-095: Soft-delete outward register entry
@router.delete("/{folder_id}/{year}/{outward_no}")
def delete_outward_record(
    folder_id: str,
    year: int,
    outward_no: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Submits outward record deletion request.
    
    Implements:
    - FR-095: Logs request in pending_deletions.
    """
    key = f"{folder_id}:{year}:{outward_no}"
    actor_id = current_user.get("user_id")
    
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
        requested_by=actor_id,
        status="Pending"
    )
    db.add(new_del)
    log_edit(db, "outward", key, "delete_request", actor_id)
    db.commit()
    return {"message": "Deletion request submitted to Admin.", "success": True}
