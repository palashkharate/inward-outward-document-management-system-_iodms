import os
import re

path = r'backend/routers/outward.py'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add sqlalchemy import if missing
if "from sqlalchemy.exc import IntegrityError" not in c:
    c = c.replace("from sqlalchemy.orm import Session", "from sqlalchemy.orm import Session\nfrom sqlalchemy.exc import IntegrityError")

# Replace dispatch_draft logic
old_dispatch = """    outward_no = get_next_outward_no(folder_id, year, db)

    # File rename & move (FR-054)
    # From: Drafts/{Year}/{FolderID}/draft-...{ext}
    # To: Outward/{Year}/{FolderID}/{OutwardNo}.{ext}
    old_relative_path = draft.file_path
    
    ext = os.path.splitext(old_relative_path)[1]
    if not ext:
        ext = ".docx"
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
    new_attachment_paths = [new_relative_path]
    if draft.attachment_paths:
        supporting_paths = [p for p in draft.attachment_paths if p and p != draft.file_path]
        for idx, p in enumerate(supporting_paths):
            p_ext = os.path.splitext(p)[1]
            p_filename = f"{outward_no}_attachment_{idx+1}{p_ext}"
            
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
            "year": year,
            "issuing_date": datetime.date.today().isoformat(),
            "folder_id": folder_id,
            "template_type": draft.template_type,
            "prepared_by": draft.prepared_by,
            "address_to": draft.address_to,
            "cc_to": draft.cc_to,
            "subject": draft.subject,
            "remarks": draft.remarks,
            "document_body": draft.document_body
        }, db)

    stamp_outward_reference(full_new_path, {
        "outward_no": outward_no,
        "year": year,
        "issuing_date": draft.issuing_date.isoformat(),
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
        issuing_date=draft.issuing_date,
        address_to=draft.address_to,
        cc_to=draft.cc_to,
        subject=draft.subject,
        remarks=draft.remarks,
        prepared_by=draft.prepared_by,
        actioned_by=actor_id,
        document_path=new_relative_path,
        template_type=draft.template_type,
        linked_documents=draft.linked_documents,
        attachment_paths=new_attachment_paths,
        document_body=draft.document_body,
        status="Active",
        is_compressed=is_compressed
    )
    db.add(new_outward)
    
    # Remove from drafts
    db.delete(draft)
    
    db.commit()"""

new_dispatch = """    # FR-055/FR-054: Assign official outward number only at dispatch.
    # We use a retry loop to prevent race conditions where two users dispatch simultaneously
    # and try to claim the same next outward number. We claim the number in DB first.
    MAX_RETRIES = 5
    for attempt in range(MAX_RETRIES):
        outward_no = get_next_outward_no(folder_id, year, db)
        
        # Determine file extensions before insert to set is_compressed
        old_relative_path = draft.file_path
        ext = os.path.splitext(old_relative_path)[1]
        if not ext:
            ext = ".docx"
        is_compressed = (ext.lower() == ".zip")

        new_outward = models.OutwardRegister(
            outward_no=outward_no,
            folder_id=folder_id,
            year=year,
            issuing_date=draft.issuing_date,
            address_to=draft.address_to,
            cc_to=draft.cc_to,
            subject=draft.subject,
            remarks=draft.remarks,
            prepared_by=draft.prepared_by,
            actioned_by=actor_id,
            document_path="PENDING_MOVE", # Temporary placeholder
            template_type=draft.template_type,
            linked_documents=draft.linked_documents,
            attachment_paths=[], # Temporary placeholder
            document_body=draft.document_body,
            status="Active",
            is_compressed=is_compressed
        )
        db.add(new_outward)
        
        try:
            db.commit()
            break # Successfully reserved the outward number!
        except IntegrityError:
            db.rollback()
            if attempt == MAX_RETRIES - 1:
                raise HTTPException(status_code=409, detail="High concurrency: failed to allocate outward number. Please try again.")

    # We now safely own `outward_no`. Move the files on disk!
    new_filename = f"{outward_no}{ext}"
    try:
        new_relative_path, full_new_path = filesystem_utils.move_draft_to_outward(
            get_iodms_root_path(), old_relative_path, year, folder_id, new_filename
        )
    except Exception as e:
        # If moving fails, we should really rollback the OutwardRegister DB entry to avoid a phantom record.
        db.delete(new_outward)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to move document on disk: {str(e)}")
        
    full_old_path = os.path.join(get_iodms_root_path(), old_relative_path)

    # Move attachments
    new_attachment_paths = [new_relative_path]
    if draft.attachment_paths:
        supporting_paths = [p for p in draft.attachment_paths if p and p != draft.file_path]
        for idx, p in enumerate(supporting_paths):
            p_ext = os.path.splitext(p)[1]
            p_filename = f"{outward_no}_attachment_{idx+1}{p_ext}"
            try:
                new_p, _ = filesystem_utils.move_draft_to_outward(
                    get_iodms_root_path(), p, year, folder_id, p_filename
                )
                new_attachment_paths.append(new_p)
            except Exception:
                pass

    # Ensure document exists on disk
    if not os.path.exists(full_old_path) and not os.path.exists(full_new_path):
        create_draft_document(full_new_path, {
            "outward_no": outward_no,
            "year": year,
            "issuing_date": datetime.date.today().isoformat(),
            "folder_id": folder_id,
            "template_type": draft.template_type,
            "prepared_by": draft.prepared_by,
            "address_to": draft.address_to,
            "cc_to": draft.cc_to,
            "subject": draft.subject,
            "remarks": draft.remarks,
            "document_body": draft.document_body
        }, db)

    # Stamp the new number on the word document
    stamp_outward_reference(full_new_path, {
        "outward_no": outward_no,
        "year": year,
        "issuing_date": draft.issuing_date.isoformat(),
        "folder_id": folder_id,
        "template_type": draft.template_type,
        "prepared_by": draft.prepared_by,
        "address_to": draft.address_to,
        "cc_to": draft.cc_to,
        "subject": draft.subject,
        "remarks": draft.remarks
    }, db)

    # Update the OutwardRegister record with the final paths
    new_outward.document_path = new_relative_path
    new_outward.attachment_paths = new_attachment_paths
    
    # Remove from drafts
    db.delete(draft)
    db.commit()"""

c = c.replace(old_dispatch, new_dispatch)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Outward race condition patched successfully!')
