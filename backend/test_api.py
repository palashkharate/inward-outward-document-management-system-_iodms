import pytest
import datetime
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
from database import Base, get_db, DATABASE_URL
from main import app

# Let's explain: This file runs automated tests against our API.
# It makes sure that our numbering systems, user logins, and administrative
# features work exactly as defined in the requirements.

# Set up a test database connection.
# We connect to the local PostgreSQL database server, but use a transaction
# so we can roll back all test inserts and keep our production database clean.
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Provides a database session that rolls back all transactions after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Yield the session to the test
    yield session
    
    # Rollback changes to clean up database
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    """Overrides the FastAPI get_db dependency with our test session."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    from auth_utils import get_current_user, require_admin
    
    def mock_get_current_user():
        return {"user_id": "test_officer", "role": "User"}
        
    def mock_require_admin():
        return {"user_id": "admin", "role": "Admin"}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[require_admin] = mock_require_admin
    yield TestClient(app)
    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_admin]

# --- Tests ---

# FR-010, FR-012: Test Login Endpoint
def test_login(client, db):
    # Create a test user in the database
    from routers.auth import get_password_hash
    test_user = models.User(
        user_id="test_officer",
        pb_no="PB-TEST",
        name="Test Officer",
        dob=datetime.date(1990, 5, 5),
        password_hash=get_password_hash("password123"),
        role="User",
        is_active=True
    )
    db.merge(test_user)
    db.commit()

    # Test successful login (FR-011)
    response = client.post("/api/auth/login", json={
        "user_id": "test_officer",
        "password": "password123"
    })
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["name"] == "Test Officer"

    # Test wrong password login (FR-012)
    response = client.post("/api/auth/login", json={
        "user_id": "test_officer",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid User ID or Password" in response.json()["detail"]


# FR-061: Test Inward Number Generation
def test_inward_no_generation(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    # Ensure folder type exists
    ft = models.FolderType(folder_id=test_folder, folder_name="Test Folder Gen 1")
    db.merge(ft)
    db.commit()

    # Get first inward number (should be 001)
    response = client.get(f"/api/inward/next-no?folder_id={test_folder}")
    assert response.status_code == 200
    assert response.json()["inward_no"] == "001"

    # Insert a fake log for 001
    inward1 = models.InwardRegister(
        inward_no="001",
        folder_id=test_folder,
        year=response.json()["year"],
        document_type="Query",
        status="Active"
    )
    db.add(inward1)
    db.commit()

    # Next number should now increment to 002
    response = client.get(f"/api/inward/next-no?folder_id={test_folder}")
    assert response.status_code == 200
    assert response.json()["inward_no"] == "002"

def test_outward_no_reservation(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    ft = models.FolderType(folder_id=test_folder, folder_name="Test Folder Gen 2")
    db.merge(ft)
    db.commit()

    # Get first reserved number (should be 001)
    response = client.get(f"/api/outward/next-no?folder_id={test_folder}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "001"
    
    # 001 is now marked as reserved. Request again.
    response = client.get(f"/api/outward/next-no?folder_id={test_folder}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "002"

    # Save a draft with Outward No 001
    draft = models.DraftFile(
        file_path=f"Drafts/2026/{test_folder}/test-draft.doc",
        outward_no="001",
        folder_id=test_folder,
        issuing_date=datetime.date(2026, 6, 21),
        template_type="Internal_Letter",
        is_locked=False,
        year=response.json()["year"]
    )
    db.add(draft)
    db.commit()

    # Even though draft is not dispatched, the next number must be reserved as 002
    response = client.get("/api/outward/next-no?folder_id=LCA")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "002"


# FR-052: Test Draft Editing Lock Checks
def test_draft_locking(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    # Setup test draft
    db.merge(models.FolderType(folder_id=test_folder, folder_name="Test Folder"))
    db.commit()
    draft = models.DraftFile(
        file_path=f"Drafts/2026/{test_folder}/fax-admin.doc",
        outward_no="001",
        folder_id=test_folder,
        issuing_date=datetime.date(2026, 6, 21),
        template_type="Internal_Letter",
        is_locked=False,
        year=2026
    )
    db.add(draft)
    db.commit()

    # User A locks the file
    response = client.put(f"/api/outward/drafts/{draft.draft_id}/lock", json={
        "user_id": "userA"
    })
    assert response.status_code == 200
    assert response.json()["success"] is True

    # User B tries to lock/edit the file and should be blocked (FR-052)
    response = client.put(f"/api/outward/drafts/{draft.draft_id}/lock", json={
        "user_id": "userB"
    })
    assert response.status_code == 400
    assert "currently being edited" in response.json()["detail"]


# FR-084: Test Soft Delete Request creation
def test_soft_delete_flow(client, db):
    # Create inward log
    db.merge(models.FolderType(folder_id="Su-30", folder_name="Sukhoi Su-30 MKI Fighter Upgrade"))
    db.commit()
    inward = models.InwardRegister(
        inward_no="005",
        folder_id="Su-30",
        year=2026,
        document_type="Query",
        status="Active"
    )
    db.add(inward)
    db.commit()

    # Request soft deletion
    response = client.delete("/api/inward/Su-30/2026/005?requester_id=officer1")
    assert response.status_code == 200
    
    # Check pending_deletions table
    pending = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "inward_register",
        models.PendingDeletion.record_id == "Su-30:2026:005"
    ).first()
    assert pending is not None
    assert pending.status == "Pending"

# FR-164: Test TrashBin Flow
def test_trash_bin_flow(client, db):
    test_user_id = f"usr{str(uuid.uuid4())[:4]}"
    test_user = models.User(
        user_id=test_user_id, 
        pb_no=str(uuid.uuid4())[:10],
        name="Test User 1", 
        dob=datetime.date(1990, 1, 1),
        password_hash="testhash",
        role="officer"
    )
    db.merge(test_user)
    db.commit()

    # 1. Create a fake pending deletion
    test_folder = f"Tst{str(uuid.uuid4())[:3]}"
    test_record = f"{test_folder}:2026:999"
    pending = models.PendingDeletion(
        source_table="inward_register",
        record_id=test_record,
        requested_by=test_user_id,
        status="Pending"
    )
    db.add(pending)
    db.commit()
    
    # Also create the actual inward record
    ft2 = models.FolderType(folder_id=test_folder, folder_name="Test Folder")
    db.merge(ft2)
    db.commit()

    inward = models.InwardRegister(
        inward_no="999",
        folder_id=test_folder,
        year=2026,
        document_type="Letter",
        status="Active"
    )
    db.add(inward)
    db.commit()

    # 2. Admin approves deletion
    response = client.put(f"/api/admin/pending-deletions/{pending.id}", json={"action": "Approve"})
    assert response.status_code == 200

    # 3. Check that it was moved to TrashBin
    trash_items = db.query(models.TrashBin).all()
    assert len(trash_items) == 1
    trash_entry = trash_items[0]
    assert trash_entry.source_table == "inward_register"
    assert trash_entry.is_permanently_deleted == False

    # 4. Restore from Trash
    restore_resp = client.put(f"/api/admin/trash-bin/{trash_entry.id}/restore")
    assert restore_resp.status_code == 200

    # 5. Verify it's back in inward_register and gone from TrashBin
    trash_items_after = db.query(models.TrashBin).all()
    assert len(trash_items_after) == 0

    restored = db.query(models.InwardRegister).filter(
        models.InwardRegister.folder_id == "TestFolder",
        models.InwardRegister.inward_no == "999"
    ).first()
    assert restored is not None

# FR-058: Test Edit Log Creation
def test_edit_log(client, db):
    # Log an edit directly
    from routers.inward import log_edit
    
    # Fake inward record
    ft = models.FolderType(folder_id="Audit", folder_name="Audit Folder")
    db.merge(ft)
    db.commit()

    inward = models.InwardRegister(
        inward_no="888",
        folder_id="Audit",
        year=2026,
        document_type="Audit",
        status="Active"
    )
    db.add(inward)
    db.commit()
    
    log_edit(db, "inward_register", "Audit:2026:888", "create", "admin", {"status": "Active"})
    
    # Check EditLog table
    logs = db.query(models.EditLog).all()
    assert len(logs) == 1
    assert logs[0].action == "create"
    assert logs[0].edited_by == "admin"
    assert logs[0].record_id == "Audit:2026:888"
