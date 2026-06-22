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
