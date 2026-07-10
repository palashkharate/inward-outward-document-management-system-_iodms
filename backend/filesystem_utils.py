import os
import shutil
import datetime

def ensure_folder_path(base_path: str, register_type: str, year: int, folder_id: str) -> tuple[str, str]:
    """
    Creates the required directory structure for IODMS files if it doesn't exist.
    Args:
        base_path: The IODMS_DATA root path.
        register_type: "Inward", "Outward", or "Drafts"
        year: The effective year (e.g., 2026).
        folder_id: The specific folder identifier.
    Returns:
        (relative_path, absolute_path)
    """
    relative_folder = os.path.join(register_type, str(year), folder_id).replace("\\", "/")
    full_folder_path = os.path.join(base_path, relative_folder)
    os.makedirs(full_folder_path, exist_ok=True)
    return relative_folder, full_folder_path

def move_draft_to_outward(base_path: str, draft_relative_path: str, year: int, folder_id: str, new_filename: str) -> tuple[str, str]:
    """
    Moves a file from the Drafts folder to the final Outward folder upon dispatch.
    Returns:
        (new_relative_path, new_absolute_path)
    """
    draft_full_path = os.path.join(base_path, draft_relative_path)
    
    # Target outward folder
    outward_relative_folder, outward_full_folder = ensure_folder_path(base_path, "Outward", year, folder_id)
    
    new_relative_path = os.path.join(outward_relative_folder, new_filename).replace("\\", "/")
    new_absolute_path = os.path.join(outward_full_folder, new_filename)
    
    if os.path.exists(draft_full_path):
        shutil.move(draft_full_path, new_absolute_path)
    
    return new_relative_path, new_absolute_path

def move_to_trash(base_path: str, file_relative_path: str) -> tuple[str, str]:
    """
    FR-164: Moves a deleted file to the Trash/ directory.
    Returns: (trash_relative_path, trash_absolute_path)
    """
    if not file_relative_path:
        return None, None
        
    original_full_path = os.path.join(base_path, file_relative_path)
    if not os.path.exists(original_full_path):
        return None, None
        
    filename = os.path.basename(file_relative_path)
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    trash_filename = f"{timestamp}_{filename}"
    
    trash_relative_folder = "Trash"
    trash_full_folder = os.path.join(base_path, trash_relative_folder)
    os.makedirs(trash_full_folder, exist_ok=True)
    
    trash_relative_path = os.path.join(trash_relative_folder, trash_filename).replace("\\", "/")
    trash_absolute_path = os.path.join(trash_full_folder, trash_filename)
    
    shutil.move(original_full_path, trash_absolute_path)
    return trash_relative_path, trash_absolute_path

def compress_file_if_large(absolute_file_path: str, max_size_mb: int = 50) -> tuple[str, bool]:
    """
    FR-161: Checks if a file is larger than max_size_mb. 
    If so, compresses it into a .zip archive, deletes the original, 
    and returns the new .zip absolute path.
    Returns: (new_absolute_path, was_compressed_boolean)
    """
    import zipfile
    
    if not os.path.exists(absolute_file_path):
        return absolute_file_path, False
        
    size_bytes = os.path.getsize(absolute_file_path)
    if size_bytes > (max_size_mb * 1024 * 1024):
        # Compress it
        dir_name = os.path.dirname(absolute_file_path)
        base_name = os.path.basename(absolute_file_path)
        name_no_ext, ext = os.path.splitext(base_name)
        
        # Don't zip a zip
        if ext.lower() == '.zip':
            return absolute_file_path, False
            
        zip_path = os.path.join(dir_name, f"{name_no_ext}.zip")
        
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
                zipf.write(absolute_file_path, arcname=base_name)
            
            # Delete original
            os.remove(absolute_file_path)
            return zip_path, True
        except Exception as e:
            # If compression fails, just return original
            print(f"Failed to compress {absolute_file_path}: {e}")
            if os.path.exists(zip_path):
                os.remove(zip_path)
            return absolute_file_path, False
            
    return absolute_file_path, False
