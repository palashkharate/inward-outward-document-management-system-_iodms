import re
import os

inward_path = r'backend/routers/inward.py'
with open(inward_path, 'r', encoding='utf-8') as f:
    c_in = f.read()

old_loop_in = """    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.inward_no}"
        # Fetch folder name
        folder = db.query(models.FolderType).filter(models.FolderType.folder_id == r.folder_id).first()
        folder_name = folder.folder_name if folder else ""
        
        output.append({"""

new_loop_in = """    # Batch fetch folders to prevent N+1 queries
    folder_ids = list(set([r.folder_id for r in results]))
    folders = db.query(models.FolderType).filter(models.FolderType.folder_id.in_(folder_ids)).all()
    folder_map = {f.folder_id: f.folder_name for f in folders}

    output = []
    for r in results:
        key = f"{r.folder_id}:{r.year}:{r.inward_no}"
        folder_name = folder_map.get(r.folder_id, "")
        
        output.append({"""

if old_loop_in in c_in:
    c_in = c_in.replace(old_loop_in, new_loop_in)
    with open(inward_path, 'w', encoding='utf-8') as f:
        f.write(c_in)
    print("Patched inward.py N+1 queries")
else:
    print("Could not find old loop in inward.py")
