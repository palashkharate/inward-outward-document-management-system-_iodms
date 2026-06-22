from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
# We import the functions from inward and outward to avoid code duplication! (NFR-012: minimum file count, maintainable)
from routers.inward import get_inward_register
from routers.outward import get_outward_register

router = APIRouter()

# FR-000, FR-001, FR-002: Auditor View Inward Register
@router.get("/inward")
def auditor_get_inward(
    year: int,
    page: int = 1,
    limit: int = 20,
    search_assign_to: Optional[str] = None,
    search_received_from: Optional[str] = None,
    search_originated_by: Optional[str] = None,
    search_subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Exposes public read-only access to Inward Register for Auditors.
    
    Implements:
    - FR-001, FR-002: Read-only tab showing identical columns, pagination, and year filtering.
    """
    return get_inward_register(
        year=year,
        page=page,
        limit=limit,
        search_assign_to=search_assign_to,
        search_received_from=search_received_from,
        search_originated_by=search_originated_by,
        search_subject=search_subject,
        db=db
    )


# FR-000, FR-001, FR-002: Auditor View Outward Register
@router.get("/outward")
def auditor_get_outward(
    year: int,
    page: int = 1,
    limit: int = 20,
    search_folder_id: Optional[str] = None,
    search_prepared_by: Optional[str] = None,
    search_address_to: Optional[str] = None,
    search_subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Exposes public read-only access to Outward Register for Auditors.
    
    Implements:
    - FR-001, FR-002: Read-only tab showing identical columns, pagination, and year filtering.
    """
    return get_outward_register(
        year=year,
        page=page,
        limit=limit,
        search_folder_id=search_folder_id,
        search_prepared_by=search_prepared_by,
        search_address_to=search_address_to,
        search_subject=search_subject,
        db=db
    )
