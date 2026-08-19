import re
import os

# --- Outward Register Optimization ---
outward_path = r'backend/routers/outward.py'
with open(outward_path, 'r', encoding='utf-8') as f:
    c = f.read()

old_loop = """    output = []
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

        output.append({"""

new_loop = """    # FR-090: Batch fetch relationships to prevent N+1 queries
    folder_ids = list(set([r.folder_id for r in results]))
    folders = db.query(models.FolderType).filter(models.FolderType.folder_id.in_(folder_ids)).all()
    folder_map = {f.folder_id: f.folder_name for f in folders}

    address_ids = set()
    for r in results:
        address_ids.update(r.address_to or [])
        address_ids.update(r.cc_to or [])
    
    address_map = {}
    if address_ids:
        addresses = db.query(models.AddressBook).filter(models.AddressBook.address_id.in_(list(address_ids))).all()
        address_map = {a.address_id: a.name for a in addresses}

    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.outward_no}"
        folder_name = folder_map.get(r.folder_id, "")

        address_to_names = [address_map[a_id] for a_id in (r.address_to or []) if a_id in address_map]
        cc_to_names = [address_map[c_id] for c_id in (r.cc_to or []) if c_id in address_map]

        output.append({"""

if old_loop in c:
    c = c.replace(old_loop, new_loop)
    with open(outward_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Patched outward.py N+1 queries")
else:
    print("Could not find old loop in outward.py")

# --- Inward Register Optimization ---
inward_path = r'backend/routers/inward.py'
with open(inward_path, 'r', encoding='utf-8') as f:
    c_in = f.read()

old_loop_in = """    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.inward_no}"
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        folder_name = folder.folder_name if folder else ""
        
        assign_to_names = []
        for a_id in r.assign_to:
            addr = db.query(models.AddressBook).filter(models.AddressBook.address_id == a_id).first()
            if addr:
                assign_to_names.append(addr.name)
        
        output.append({"""

new_loop_in = """    # Batch fetch relationships to prevent N+1 queries
    folder_ids = list(set([r.folder_id for r in results]))
    folders = db.query(models.FolderType).filter(models.FolderType.folder_id.in_(folder_ids)).all()
    folder_map = {f.folder_id: f.folder_name for f in folders}

    address_ids = set()
    for r in results:
        address_ids.update(r.assign_to or [])
        
    address_map = {}
    if address_ids:
        addresses = db.query(models.AddressBook).filter(models.AddressBook.address_id.in_(list(address_ids))).all()
        address_map = {a.address_id: a.name for a in addresses}

    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.inward_no}"
        folder_name = folder_map.get(r.folder_id, "")
        
        assign_to_names = [address_map[a_id] for a_id in (r.assign_to or []) if a_id in address_map]
        
        output.append({"""

if old_loop_in in c_in:
    c_in = c_in.replace(old_loop_in, new_loop_in)
    with open(inward_path, 'w', encoding='utf-8') as f:
        f.write(c_in)
    print("Patched inward.py N+1 queries")
else:
    print("Could not find old loop in inward.py")
