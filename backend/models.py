from sqlalchemy import Column, String, Integer, Date, Boolean, Text, ForeignKey, TIMESTAMP, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

# Let's explain: In SQLAlchemy, each class below represents a table in the database.
# The class attributes (like Column) map to the database columns.
# We name the FR IDs that each table/model implements in their docstrings.

class FolderType(Base):
    """
    FR-034, FR-035, FR-071, FR-072, FR-130: Master folder categories.
    E.g. Folder ID: 'Su-30', Folder Name: 'Sukhoi Su-30 MKI'
    """
    __tablename__ = "folder_types"

    folder_id = Column(String(50), primary_key=True)
    folder_name = Column(String(255), nullable=False)


class AddressGroup(Base):
    """
    FR-037, FR-105, FR-131: Categories of contact addresses (e.g., IAF, BEL).
    Used to filter the Address To dropdown on Compose Outward form.
    """
    __tablename__ = "address_groups"

    group_id = Column(Integer, primary_key=True, autoincrement=True)
    group_name = Column(String(100), unique=True, nullable=False)


class AddressBook(Base):
    """
    FR-038, FR-039, FR-040, FR-073, FR-100, FR-102, FR-103:
    Addresses table storing client contacts.
    """
    __tablename__ = "address_book"

    address_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    designation = Column(String(255))
    organisation = Column(String(255))
    address_line_1 = Column(String(255))
    address_line_2 = Column(String(255))
    fax_no = Column(String(50))
    email = Column(String(255))
    address_group = Column(String(100), ForeignKey("address_groups.group_name", onupdate="CASCADE"))


class User(Base):
    """
    FR-010, FR-020, FR-110, FR-111, FR-150: User accounts.
    Includes role check: either 'User' or 'Admin'.
    """
    __tablename__ = "users"

    user_id = Column(String(100), primary_key=True)
    pb_no = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    dob = Column(Date, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # User or Admin
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(String(100), nullable=True)


class ReceivedFromList(Base):
    """
    FR-067, FR-082, FR-132: Inward letter origins (standalone list).
    """
    __tablename__ = "received_from_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)


class OriginatedByList(Base):
    """
    FR-068, FR-082, FR-133: Inward sender organizations (standalone list).
    """
    __tablename__ = "originated_by_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)


class InwardRegister(Base):
    """
    FR-060, FR-075, FR-077, FR-080, FR-081: Inward logs.
    Composite primary key: (folder_id, year, inward_no)
    """
    __tablename__ = "inward_register"

    inward_no = Column(String(10), primary_key=True)
    folder_id = Column(String(50), ForeignKey("folder_types.folder_id", onupdate="CASCADE"), primary_key=True)
    year = Column(Integer, primary_key=True)
    receiving_date = Column(Date, nullable=False, server_default=func.current_date())
    inward_letter_no = Column(String(255))
    inward_date = Column(Date)
    received_from = Column(String(255))
    originated_by = Column(String(255))
    subject = Column(Text)
    assign_to = Column(ARRAY(String(100)), default=[])
    cc_sent_to = Column(ARRAY(Integer), default=[])
    remarks = Column(Text)
    actioned_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    document_type = Column(String(50), nullable=False)  # 'Query', 'Snag', 'File'
    scanned_format = Column(String(50))  # FR-063: Image/Doc/PDF
    status = Column(String(50), nullable=False, default="Active")  # 'Active', 'Not Active', 'Permanently Deleted'
    attachment_path = Column(String(500)) # legacy single file
    attachment_original_ext = Column(String(50)) # legacy single file
    attachment_paths = Column(ARRAY(String(500)), default=[]) # FR-170
    linked_documents = Column(ARRAY(String(255)), default=[]) # FR-171
    # FR-160, FR-161: Timestamps and Compression
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.current_timestamp())
    is_compressed = Column(Boolean, default=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"), nullable=True)


class OutwardRegister(Base):
    """
    FR-054, FR-090, FR-091, FR-092: Outward register entries.
    Composite primary key: (folder_id, year, outward_no)
    """
    __tablename__ = "outward_register"

    outward_no = Column(String(10), primary_key=True)
    folder_id = Column(String(50), ForeignKey("folder_types.folder_id", onupdate="CASCADE"), primary_key=True)
    year = Column(Integer, primary_key=True)
    issuing_date = Column(Date, nullable=False)
    address_to = Column(ARRAY(Integer), default=[])
    cc_to = Column(ARRAY(Integer), default=[])
    subject = Column(Text)
    remarks = Column(Text)
    prepared_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    actioned_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    document_path = Column(String(500), nullable=False)
    template_type = Column(String(100), nullable=False)  # 'Fax_With_GM_Sig', 'Fax_Without_GM_Sig', 'Internal_Letter'
    linked_documents = Column(ARRAY(String(255)), default=[]) # FR-171
    attachment_paths = Column(ARRAY(String(500)), default=[]) # FR-170b
    status = Column(String(50), nullable=False, default="Active")  # 'Active', 'Not Active', 'Permanently Deleted'
    # FR-160: Timestamps
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.current_timestamp())
    is_compressed = Column(Boolean, default=False)
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    deleted_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"), nullable=True)


class DraftFile(Base):
    """
    FR-042, FR-050, FR-052, FR-055: Outward drafts.
    """
    __tablename__ = "draft_files"

    draft_id = Column(Integer, primary_key=True, autoincrement=True)
    file_path = Column(String(500), nullable=False)
    attachment_paths = Column(ARRAY(String(500)), default=[]) # FR-170b
    linked_documents = Column(ARRAY(String(255)), default=[]) # FR-171
    outward_no = Column(String(10), nullable=False)
    folder_id = Column(String(50), ForeignKey("folder_types.folder_id", onupdate="CASCADE"))
    issuing_date = Column(Date, nullable=False)
    address_to = Column(ARRAY(Integer), default=[])
    cc_to = Column(ARRAY(Integer), default=[])
    subject = Column(Text)
    remarks = Column(Text)
    prepared_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    actioned_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    template_type = Column(String(100), nullable=False)  # 'Fax_With_GM_Sig', 'Fax_Without_GM_Sig', 'Internal_Letter'
    is_locked = Column(Boolean, nullable=False, default=False)
    locked_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    locked_at = Column(TIMESTAMP, nullable=True)
    year = Column(Integer, nullable=False)
    created_on = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    # FR-160, FR-161: Timestamps and Compression
    updated_at = Column(TIMESTAMP, nullable=True, onupdate=func.current_timestamp())
    is_compressed = Column(Boolean, default=False)


class EditLog(Base):
    """
    FR-058: Edit Audit Log.
    Tracks every create, edit, lock, unlock, dispatch, or re-upload action.
    """
    __tablename__ = "edit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_type = Column(String(50), nullable=False)  # 'inward', 'outward', 'draft'
    record_id = Column(String(255), nullable=False)   # folder_id:year:number or draft_id
    action = Column(String(50), nullable=False)       # create, edit, lock, unlock, dispatch, reupload
    changes = Column(JSONB, nullable=True)            # Diff of before/after
    edited_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    edited_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())


class PendingDeletion(Base):
    """
    FR-056, FR-084, FR-095, FR-104, FR-120, FR-121:
    Tracks soft-deleted entries awaiting Admin confirmation.
    """
    __tablename__ = "pending_deletions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_table = Column(String(100), nullable=False)  # e.g., 'inward_register', 'outward_register', 'address_book', 'draft_files'
    record_id = Column(String(255), nullable=False)  # holds string representation of the record key (e.g. folder_id:year:inward_no or address_id)
    requested_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    requested_on = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    status = Column(String(50), nullable=False, default="Pending")  # 'Pending', 'Approved', 'Rejected'


class PendingProfileEdit(Base):
    """
    FR-125, FR-126, FR-151, FR-152:
    Tracks profile updates (name, DOB) waiting for Admin approval.
    """
    __tablename__ = "pending_profile_edits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    proposed_changes = Column(JSONB, nullable=False)  # e.g., {"name": "New Name", "dob": "YYYY-MM-DD"}
    requested_on = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    status = Column(String(50), nullable=False, default="Pending")  # 'Pending', 'Approved', 'Rejected'


class DocumentTemplate(Base):
    """
    FR-143: Template Management.
    """
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    template_type = Column(String(100), nullable=False) # e.g. General, Confidential, Secret
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    uploaded_on = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())


class LoginLog(Base):
    """FR-162: Security login audit log."""
    __tablename__ = "login_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False)  # attempted user_id (may not exist)
    ip_address = Column(String(45), nullable=False)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(255), nullable=True)  # e.g. "Invalid password", "Account deleted"
    logged_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())


class AllowedIP(Base):
    """
    FR-172: IP Address Configuration for Security Whitelisting.
    """
    __tablename__ = "allowed_ips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ip_address = Column(String(100), unique=True, nullable=False) # exact IP or wildcard like 192.168.1.*
    description = Column(String(255), nullable=True)
    added_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))
    added_on = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())


class TrashBin(Base):
    """FR-164: Temporary recycle bin for deleted records."""
    __tablename__ = "trash_bin"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_table = Column(String(100), nullable=False)     # 'inward_register', 'outward_register', 'draft_files'
    record_data = Column(JSONB, nullable=False)             # Full serialized record snapshot
    original_file_path = Column(String(500), nullable=True) # Original file location
    trash_file_path = Column(String(500), nullable=True)    # File location in Trash/
    deleted_by = Column(String(100), ForeignKey("users.user_id"))
    trashed_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    expires_at = Column(TIMESTAMP, nullable=False)          # trashed_at + 30 days
    is_permanently_deleted = Column(Boolean, default=False)



