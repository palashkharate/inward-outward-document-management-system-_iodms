import pytest
import datetime
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
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

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
    db.add(test_user)
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
    # Ensure folder type exists
    ft = models.FolderType(folder_id="Su-30", folder_name="Sukhoi Su-30")
    db.add(ft)
    db.commit()

    # Get first inward number (should be 001)
    response = client.get("/api/inward/next-no?folder_id=Su-30")
    assert response.status_code == 200
    assert response.json()["inward_no"] == "001"

    # Insert a fake log for 001
    inward1 = models.InwardRegister(
        inward_no="001",
        folder_id="Su-30",
        year=response.json()["year"],
        document_type="Query",
        status="Active"
    )
    db.add(inward1)
    db.commit()

    # Next number should now increment to 002
    response = client.get("/api/inward/next-no?folder_id=Su-30")
    assert response.status_code == 200
    assert response.json()["inward_no"] == "002"


# FR-055: Test Outward Number Concurrency Reservation
def test_outward_no_reservation(client, db):
    ft = models.FolderType(folder_id="LCA", folder_name="Tejas LCA")
    db.add(ft)
    db.commit()

    # Get first reserved number (should be 001)
    response = client.get("/api/outward/next-no?folder_id=LCA")
    assert response.status_code == 200
    assert response.json()["outward_no"] == "001"

    # Save a draft with Outward No 001
    draft = models.DraftFile(
        file_path="Drafts/2026/LCA/fax-admin.doc",
        outward_no="001",
        folder_id="LCA",
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
    # Setup test draft
    db.add(models.FolderType(folder_id="LCA", folder_name="Tejas Light Combat Aircraft Design"))
    db.commit()
    draft = models.DraftFile(
        file_path="Drafts/2026/LCA/fax-admin.doc",
        outward_no="001",
        folder_id="LCA",
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
    db.add(models.FolderType(folder_id="Su-30", folder_name="Sukhoi Su-30 MKI Fighter Upgrade"))
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
