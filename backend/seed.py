import os
import datetime
from sqlalchemy.orm import Session

import models
from database import engine, SessionLocal, get_iodms_root_path
from routers.auth import get_password_hash

# Let's explain: This script initializes our database with a default Admin account
# and seeds some initial folder names and address groups so the app works right out of the box.
# It also creates the physical directories for storing our documents.

def seed_database():
    db: Session = SessionLocal()
    try:
        print("Starting Database Seeding...")

        # 1. Seed default Admin account (FR-111, FR-020)
        # Check if the admin account already exists
        admin_user = db.query(models.User).filter(models.User.user_id == "admin").first()
        if not admin_user:
            print("Creating default Admin account...")
            admin_user = models.User(
                user_id="admin",
                pb_no="PB-001",
                name="Chief Administrator",
                dob=datetime.date(1980, 1, 1),
                password_hash=get_password_hash("admin123"), # default password
                role="Admin",
                is_active=True
            )
            db.add(admin_user)
        else:
            print("Admin account already exists. Skipping user seed.")

        # Seed a default User account for testing
        test_user = db.query(models.User).filter(models.User.user_id == "officer1").first()
        if not test_user:
            print("Creating default Officer account...")
            test_user = models.User(
                user_id="officer1",
                pb_no="PB-102",
                name="Wing Commander R. K. Singh",
                dob=datetime.date(1985, 6, 21), # set to today's date in context to test birthday banner!
                password_hash=get_password_hash("officer123"),
                role="User",
                is_active=True
            )
            db.add(test_user)

        # 2. Seed default Folder IDs and Names (FR-034, FR-071, FR-130)
        folders = [
            ("Su-30", "Sukhoi Su-30 MKI Fighter Upgrade"),
            ("LCA", "Tejas Light Combat Aircraft Design"),
            ("Jaguar", "Jaguar DARIN III Upgrade Programme"),
            ("MIG-29", "Mig-29 UPG Fighter Upgrade Programme")
        ]
        for fid, fname in folders:
            existing = db.query(models.FolderType).filter(models.FolderType.folder_id == fid).first()
            if not existing:
                print(f"Seeding Folder Type: {fid}...")
                db.add(models.FolderType(folder_id=fid, folder_name=fname))

        # 3. Seed default Address Groups (FR-037, FR-131)
        groups = ["IAF", "BEL", "HAL-HQ", "ADA", "Others"]
        for gname in groups:
            existing = db.query(models.AddressGroup).filter(models.AddressGroup.group_name == gname).first()
            if not existing:
                print(f"Seeding Address Group: {gname}...")
                db.add(models.AddressGroup(group_name=gname))
        db.flush()

        # 4. Seed default Received From dropdown values (FR-067, FR-132)
        received_origins = ["Air HQ", "HQ Maintenance Command", "BEL Bengaluru", "ADA Bengaluru", "HAL Helicopter Division"]
        for name in received_origins:
            existing = db.query(models.ReceivedFromList).filter(models.ReceivedFromList.name == name).first()
            if not existing:
                print(f"Seeding Received From Origin: {name}...")
                db.add(models.ReceivedFromList(name=name))

        # 5. Seed default Originated By dropdown values (FR-068, FR-133)
        originated_senders = ["Director DEA", "Project Director LCA", "Chief Test Pilot", "General Manager AURDC"]
        for name in originated_senders:
            existing = db.query(models.OriginatedByList).filter(models.OriginatedByList.name == name).first()
            if not existing:
                print(f"Seeding Originated By Sender: {name}...")
                db.add(models.OriginatedByList(name=name))

        # 6. Seed sample Address Book entries (FR-102)
        sample_contacts = [
            ("Air Marshal S. P. Sharma", "Aviation Director", "Air HQ", "Vayu Bhawan", "New Delhi", "011-23010231", "spsharma@iaf.nic.in", "IAF"),
            ("Dr. A. K. Ray", "Chief Scientist", "ADA", "Vimanpura", "Bengaluru", "080-25223344", "akray@ada.gov.in", "ADA"),
            ("V. K. Patil", "Senior Manager", "BEL", "Jalahalli", "Bengaluru", "080-28382012", "vkpatil@bel.co.in", "BEL")
        ]
        for name, desig, org, a1, a2, fax, email, grp in sample_contacts:
            existing = db.query(models.AddressBook).filter(models.AddressBook.name == name).first()
            if not existing:
                print(f"Seeding contact: {name}...")
                db.add(models.AddressBook(
                    name=name,
                    designation=desig,
                    organisation=org,
                    address_line_1=a1,
                    address_line_2=a2,
                    fax_no=fax,
                    email=email,
                    address_group=grp
                ))

        # Save all DB changes
        db.commit()
        print("Database seeded successfully!")

        # 7. Create physical folder directories in IODMS Root Path (FR-140)
        root_path = get_iodms_root_path()
        print(f"Setting up storage directories in: {root_path}...")
        for folder in ["Inward", "Outward", "Drafts"]:
            folder_path = os.path.join(root_path, folder)
            os.makedirs(folder_path, exist_ok=True)
            print(f"Created: {folder_path}")

        print("System setup is complete and ready.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Database seeding failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    # Create the database tables on execution if not exist
    models.Base.metadata.create_all(bind=engine)
    seed_database()
