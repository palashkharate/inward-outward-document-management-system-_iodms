from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import logging

logger = logging.getLogger(__name__)

def sync_bidirectional_links(db: Session, source_id: str, old_links: list[str], new_links: list[str]):
    """
    DO-178C Compliant Link Synchronization
    Synchronizes document links bidirectionally to ensure structural integrity and traceability.
    
    Args:
        db (Session): Database session
        source_id (str): The globally unique ID of the document being edited (e.g. inward:Folder:Year:No)
        old_links (list): The list of globally unique IDs previously linked
        new_links (list): The new list of globally unique IDs to be linked
    """
    old_set = set(old_links or [])
    new_set = set(new_links or [])
    
    added_links = new_set - old_set
    removed_links = old_set - new_set
    
    # Process additions
    for target_id in added_links:
        _add_link_to_target(db, source_id, target_id)
        
    # Process removals
    for target_id in removed_links:
        _remove_link_from_target(db, source_id, target_id)

def _add_link_to_target(db: Session, source_id: str, target_id: str):
    record = _get_document_record(db, target_id)
    if record:
        current_links = record.linked_documents or []
        if source_id not in current_links:
            # Create a new list to ensure SQLAlchemy detects the modification (for PostgreSQL ARRAY)
            updated_links = list(current_links)
            updated_links.append(source_id)
            record.linked_documents = updated_links
            
            # Note: We do not call db.commit() here; the calling route manages the transaction for atomicity.

def _remove_link_from_target(db: Session, source_id: str, target_id: str):
    record = _get_document_record(db, target_id)
    if record:
        current_links = record.linked_documents or []
        if source_id in current_links:
            updated_links = list(current_links)
            updated_links.remove(source_id)
            record.linked_documents = updated_links

def _get_document_record(db: Session, target_id: str):
    """
    Parses a globally unique document ID and retrieves the corresponding database record.
    Expected format: type:folder_id:year:number
    """
    try:
        parts = target_id.split(":")
        if len(parts) != 4:
            return None
            
        doc_type, folder_id, year, doc_no = parts
        year_int = int(year)
        
        if doc_type == "inward":
            return db.query(models.InwardRegister).filter(
                models.InwardRegister.folder_id == folder_id,
                models.InwardRegister.year == year_int,
                models.InwardRegister.inward_no == doc_no
            ).first()
        elif doc_type == "outward":
            return db.query(models.OutwardRegister).filter(
                models.OutwardRegister.folder_id == folder_id,
                models.OutwardRegister.year == year_int,
                models.OutwardRegister.outward_no == doc_no
            ).first()
    except Exception as e:
        logger.error(f"Error parsing document target ID {target_id}: {str(e)}")
        
    return None
