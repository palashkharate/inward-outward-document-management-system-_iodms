import pytest
import datetime
import uuid
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
from database import Base, get_db, DATABASE_URL
from main import app
from routers.outward import build_lan_document_open_info

# Let's explain: This file runs automated tests against our API.
# It makes sure that our numbering systems, user logins, and administrative
# features work exactly as defined in the requirements.

# Set up a test database connection.
# We connect to the local PostgreSQL database server, but use a transaction
# so we can roll back all test inserts and keep our production database clean.
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def make_user(user_id: str, role: str = "User") -> models.User:
    return models.User(
        user_id=user_id,
        pb_no=f"PB-{user_id}-{str(uuid.uuid4())[:8]}",
        name=f"Test {user_id}",
        dob=datetime.date(1990, 1, 1),
        password_hash="testhash",
        role=role,
        is_active=True
    )

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
    
    for user in [
        make_user("test_officer"),
        make_user("admin", "Admin"),
        make_user("officer1"),
        make_user("userA"),
        make_user("userB")
    ]:
        db.merge(user)
    db.commit()

    def mock_get_current_user(request: Request):
        user_id = request.headers.get("X-Test-User", "test_officer")
        role = "Admin" if user_id == "admin" else "User"
        return {"user_id": user_id, "role": role}
        
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
    test_user_id = f"login_{str(uuid.uuid4())[:8]}"
    test_user = models.User(
        user_id=test_user_id,
        pb_no=f"PB-{str(uuid.uuid4())[:10]}",
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
        "user_id": test_user_id,
        "password": "password123"
    })
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["name"] == "Test Officer"

    # Test wrong password login (FR-012)
    response = client.post("/api/auth/login", json={
        "user_id": test_user_id,
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid User ID or Password" in response.json()["detail"]


# FR-061: Test Inward Number Generation
def test_inward_no_generation(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    other_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    target_year = 2197
    first_user = f"in_{str(uuid.uuid4())[:8]}"
    second_user = f"in_{str(uuid.uuid4())[:8]}"
    db.merge(make_user(first_user))
    db.merge(make_user(second_user))
    # Ensure folder type exists
    ft = models.FolderType(folder_id=test_folder, folder_name="Test Folder Gen 1")
    ft2 = models.FolderType(folder_id=other_folder, folder_name="Test Folder Gen 2")
    db.merge(ft)
    db.merge(ft2)
    db.commit()

    # First user reserves 001.
    response = client.get(
        f"/api/inward/next-no?folder_id={test_folder}&target_year={target_year}",
        headers={"X-Test-User": first_user}
    )
    assert response.status_code == 200
    assert response.json()["inward_no"] == "001"

    # Same user gets the same reserved number back, not a new number.
    response = client.get(
        f"/api/inward/next-no?folder_id={test_folder}&target_year={target_year}",
        headers={"X-Test-User": first_user}
    )
    assert response.status_code == 200
    assert response.json()["inward_no"] == "001"
    assert response.json()["reused"] is True

    # A different user gets the next office-wide sequence number, even in another folder.
    response = client.get(
        f"/api/inward/next-no?folder_id={other_folder}&target_year={target_year}",
        headers={"X-Test-User": second_user}
    )
    assert response.status_code == 200
    assert response.json()["inward_no"] == "002"

def test_outward_no_preview_ignores_drafts_until_dispatch(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    target_year = 2199
    ft = models.FolderType(folder_id=test_folder, folder_name="Test Folder Gen 2")
    db.merge(ft)
    db.commit()

    # Previewing the next number does not reserve it.
    response = client.get(f"/api/outward/next-no?folder_id={test_folder}&target_year={target_year}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "001"
    assert response.json()["reserved"] is False
    
    response = client.get(f"/api/outward/next-no?folder_id={test_folder}&target_year={target_year}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "001"

    # Draft markers do not consume official outward sequence numbers.
    draft = models.DraftFile(
        file_path=f"Drafts/2026/{test_folder}/test-draft.doc",
        outward_no="DRAFT",
        folder_id=test_folder,
        issuing_date=datetime.date(2026, 6, 21),
        template_type="Internal_Letter",
        is_locked=False,
        year=target_year
    )
    db.add(draft)
    db.commit()

    response = client.get(f"/api/outward/next-no?folder_id={test_folder}&target_year={target_year}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "001"

    outward = models.OutwardRegister(
        outward_no="001",
        folder_id=test_folder,
        year=target_year,
        issuing_date=datetime.date(2026, 6, 21),
        prepared_by="test_officer",
        actioned_by="test_officer",
        document_path=f"Outward/{target_year}/{test_folder}/001.doc",
        template_type="Internal_Letter",
        status="Active"
    )
    db.add(outward)
    db.commit()

    response = client.get(f"/api/outward/next-no?folder_id={test_folder}&target_year={target_year}")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "002"


# FR-052: Test Draft Editing Lock Checks
def test_draft_locking(client, db):
    test_folder = f"TestGen-{str(uuid.uuid4())[:4]}"
    # Setup test draft
    db.merge(models.FolderType(folder_id=test_folder, folder_name="Test Folder"))
    db.commit()
    draft = models.DraftFile(
        file_path=f"Drafts/2026/{test_folder}/draft-admin.doc",
        outward_no="DRAFT",
        folder_id=test_folder,
        issuing_date=datetime.date(2026, 6, 21),
        template_type="Internal_Letter",
        is_locked=False,
        year=2026,
        prepared_by="test_officer",
        actioned_by="test_officer"
    )
    db.add(draft)
    db.commit()

    # User A locks the file
    response = client.put(
        f"/api/outward/drafts/{draft.draft_id}/lock",
        json={"user_id": "userA"},
        headers={"X-Test-User": "userA"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # User B tries to lock/edit the file and should be blocked (FR-052)
    response = client.put(
        f"/api/outward/drafts/{draft.draft_id}/lock",
        json={"user_id": "userB"},
        headers={"X-Test-User": "userB"}
    )
    assert response.status_code == 400
    assert "currently being edited" in response.json()["detail"]


# FR-052, EIR-003, EIR-004: Test LAN path details for direct Word editing
def test_lan_word_open_info(monkeypatch):
    monkeypatch.setattr("routers.outward.get_iodms_lan_share_path", lambda: r"\\Server\IODMS_DATA")

    open_info = build_lan_document_open_info("Drafts/2026/Su-30/draft-admin.doc")

    assert open_info["lan_shared_path"] == r"\\Server\IODMS_DATA\Drafts\2026\Su-30\draft-admin.doc"
    assert open_info["lan_file_uri"] == "file://Server/IODMS_DATA/Drafts/2026/Su-30/draft-admin.doc"
    assert open_info["word_launcher_uri"] == "iodms-word://open?path=%5C%5CServer%5CIODMS_DATA%5CDrafts%5C2026%5CSu-30%5Cdraft-admin.doc"
    assert open_info["word_open_uri"].startswith("ms-word:ofe|u|file://")
    assert "Drafts/2026/Su-30/draft-admin.doc" in open_info["word_open_uri"]


def test_lan_word_open_info_without_share(monkeypatch):
    monkeypatch.setattr("routers.outward.get_iodms_lan_share_path", lambda: "")

    open_info = build_lan_document_open_info("Drafts/2026/Su-30/draft-admin.doc")

    assert open_info == {
        "lan_shared_path": None,
        "lan_file_uri": None,
        "word_launcher_uri": None,
        "word_open_uri": None,
    }


def test_local_word_open_info(monkeypatch):
    monkeypatch.setattr("routers.outward.get_iodms_lan_share_path", lambda: r"C:\IODMS_DATA")

    open_info = build_lan_document_open_info("Drafts/2026/Su-30/draft-admin.doc")

    assert open_info["lan_shared_path"] == r"C:\IODMS_DATA\Drafts\2026\Su-30\draft-admin.doc"
    assert open_info["lan_file_uri"] == "file:///C:/IODMS_DATA/Drafts/2026/Su-30/draft-admin.doc"


# FR-084: Test Soft Delete Request creation
def test_soft_delete_flow(client, db):
    test_folder = f"Soft{str(uuid.uuid4())[:5]}"
    inward_no = "005"
    # Create inward log
    db.merge(models.FolderType(folder_id=test_folder, folder_name="Soft Delete Test Folder"))
    db.commit()
    inward = models.InwardRegister(
        inward_no=inward_no,
        folder_id=test_folder,
        year=2026,
        document_type="Query",
        status="Active",
        actioned_by="test_officer"
    )
    db.add(inward)
    db.commit()

    # Request soft deletion
    response = client.delete(f"/api/inward/{test_folder}/2026/{inward_no}?requester_id=officer1")
    assert response.status_code == 200
    
    # Check pending_deletions table
    pending = db.query(models.PendingDeletion).filter(
        models.PendingDeletion.source_table == "inward_register",
        models.PendingDeletion.record_id == f"{test_folder}:2026:{inward_no}"
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
        status="Active",
        actioned_by=test_user_id
    )
    db.add(inward)
    db.commit()

    # 2. Admin approves deletion
    response = client.put(f"/api/admin/pending-deletions/{pending.id}", json={"action": "Approve"})
    assert response.status_code == 200

    # 3. Check that it was moved to TrashBin
    trash_items = db.query(models.TrashBin).filter(
        models.TrashBin.source_table == "inward_register",
        models.TrashBin.record_data["folder_id"].astext == test_folder
    ).all()
    assert len(trash_items) == 1
    trash_entry = trash_items[0]
    assert trash_entry.source_table == "inward_register"
    assert trash_entry.is_permanently_deleted == False

    # 4. Restore from Trash
    restore_resp = client.put(f"/api/admin/trash-bin/{trash_entry.id}/restore")
    assert restore_resp.status_code == 200

    # 5. Verify it's back in inward_register and gone from TrashBin
    trash_items_after = db.query(models.TrashBin).filter(models.TrashBin.id == trash_entry.id).all()
    assert len(trash_items_after) == 0

    restored = db.query(models.InwardRegister).filter(
        models.InwardRegister.folder_id == test_folder,
        models.InwardRegister.inward_no == "999"
    ).first()
    assert restored is not None
    assert restored.status == "Active"

# FR-058: Test Edit Log Creation
def test_edit_log(client, db):
    # Log an edit directly
    from routers.inward import log_edit
    
    # Fake inward record
    test_folder = f"Audit{str(uuid.uuid4())[:5]}"
    record_id = f"{test_folder}:2026:888"
    ft = models.FolderType(folder_id=test_folder, folder_name="Audit Folder")
    db.merge(ft)
    db.commit()

    inward = models.InwardRegister(
        inward_no="888",
        folder_id=test_folder,
        year=2026,
        document_type="Audit",
        status="Active",
        actioned_by="admin"
    )
    db.add(inward)
    db.commit()
    
    log_edit(db, "inward_register", record_id, "create", "admin", {"status": "Active"})
    
    # Check EditLog table
    logs = db.query(models.EditLog).filter(models.EditLog.record_id == record_id).all()
    assert len(logs) == 1
    assert logs[0].action == "create"
    assert logs[0].edited_by == "admin"
    assert logs[0].record_id == record_id


def test_document_link_search_filters_active_records(client, db):
    folder_active = f"Link{str(uuid.uuid4())[:5]}"
    folder_deleted = f"Del{str(uuid.uuid4())[:5]}"
    db.merge(models.FolderType(folder_id=folder_active, folder_name="Link Folder"))
    db.merge(models.FolderType(folder_id=folder_deleted, folder_name="Deleted Folder"))
    address = models.AddressBook(
        name="DAE Link Recipient",
        organisation="DAE",
        address_group=None
    )
    db.add(address)
    db.commit()

    active_inward = models.InwardRegister(
        inward_no="777",
        folder_id=folder_active,
        year=2198,
        received_from="BEL Link Sender",
        subject="Radar Link Subject",
        document_type="Letter",
        status="Active",
        actioned_by="test_officer"
    )
    reserved_inward = models.InwardRegister(
        inward_no="778",
        folder_id=folder_active,
        year=2198,
        subject="Reserved Link Subject",
        document_type="Reserved",
        status="Reserved",
        actioned_by="test_officer"
    )
    deleted_inward = models.InwardRegister(
        inward_no="779",
        folder_id=folder_deleted,
        year=2198,
        subject="Deleted Link Subject",
        document_type="Letter",
        status="Permanently Deleted",
        actioned_by="test_officer"
    )
    active_outward = models.OutwardRegister(
        outward_no="888",
        folder_id=folder_active,
        year=2198,
        issuing_date=datetime.date(2026, 6, 21),
        address_to=[address.address_id],
        subject="Dispatch Link Subject",
        prepared_by="test_officer",
        actioned_by="test_officer",
        document_path=f"Outward/2198/{folder_active}/888.doc",
        template_type="Internal_Letter",
        status="Active"
    )
    pending = models.PendingDeletion(
        source_table="inward_register",
        record_id=f"{folder_active}:2198:777",
        requested_by="test_officer",
        status="Pending"
    )
    db.add_all([active_inward, reserved_inward, deleted_inward, active_outward, pending])
    db.commit()

    response = client.get("/api/dashboard/search-documents", params={"year": 2198, "limit": 20})
    assert response.status_code == 200
    ids = {row["id"] for row in response.json()}
    assert f"inward:{folder_active}:2198:777" not in ids
    assert f"inward:{folder_active}:2198:778" not in ids
    assert f"inward:{folder_deleted}:2198:779" not in ids
    assert f"outward:{folder_active}:2198:888" in ids

    response = client.get("/api/dashboard/search-documents", params={
        "doc_type": "outward",
        "year": 2198,
        "party": "DAE Link",
        "number": "888"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["label"].startswith("OUTWARD | 2198/888")
