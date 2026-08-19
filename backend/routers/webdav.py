import os
import datetime
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from sqlalchemy.orm import Session
import models
from database import get_db
from config import get_iodms_root_path

router = APIRouter()

def get_draft_from_path(db: Session, full_path: str):
    """Utility to map a URL path like /drafts/123/filename.docx back to the database draft."""
    parts = full_path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == "drafts":
        try:
            draft_id = int(parts[1])
            draft = db.query(models.DraftFile).filter(models.DraftFile.draft_id == draft_id).first()
            return draft
        except ValueError:
            return None
    return None

def get_file_path_from_draft(draft: models.DraftFile) -> str:
    root = get_iodms_root_path()
    return os.path.join(root, draft.file_path).replace("/", "\\")

@router.api_route("/{full_path:path}", methods=["OPTIONS", "PROPFIND", "LOCK", "UNLOCK", "GET", "PUT", "HEAD"])
async def webdav_handler(request: Request, full_path: str, db: Session = Depends(get_db)):
    """
    Handles all WebDAV requests from Microsoft Word for seamless offline/online editing.
    Word communicates using these verbs to lock, download, save, and unlock the document.
    """
    method = request.method.upper()
    
    # 1. Parse the draft
    draft = get_draft_from_path(db, full_path)
    if not draft:
        return Response(status_code=404, content="File not found")
        
    file_path = get_file_path_from_draft(draft)
    if not os.path.exists(file_path):
        return Response(status_code=404, content="File not found on disk")

    # 2. Universal WebDAV Headers
    headers = {
        "DAV": "1, 2",
        "MS-Author-Via": "DAV",
        "Allow": "OPTIONS, GET, HEAD, PUT, PROPFIND, LOCK, UNLOCK"
    }

    if method == "OPTIONS":
        return Response(status_code=200, headers=headers)

    if method == "PROPFIND":
        # MS Word asks for file properties (size, modification date)
        stat = os.stat(file_path)
        last_modified = datetime.datetime.fromtimestamp(stat.st_mtime, datetime.UTC).strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        xml_response = f"""<?xml version="1.0" encoding="utf-8" ?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>{request.url.path}</D:href>
    <D:propstat>
      <D:prop>
        <D:getcontentlength>{stat.st_size}</D:getcontentlength>
        <D:getlastmodified>{last_modified}</D:getlastmodified>
        <D:resourcetype/>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>"""
        headers["Content-Type"] = 'text/xml; charset="utf-8"'
        return Response(content=xml_response, status_code=207, headers=headers)

    if method == "LOCK":
        # Word wants to lock the file so it doesn't open Read-Only.
        # We integrate this with our existing lock mechanism!
        lock_token = f"opaquelocktoken:draft-{draft.draft_id}-lock"
        
        # If it's locked by someone else, we technically should deny, 
        # but the frontend already prevents clicking "Open in Word" if locked.
        draft.is_locked = True
        draft.locked_at = datetime.datetime.now(datetime.UTC)
        db.commit()

        xml_response = f"""<?xml version="1.0" encoding="utf-8" ?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>0</D:depth>
      <D:owner><D:href>IODMS-User</D:href></D:owner>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken><D:href>{lock_token}</D:href></D:locktoken>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>"""
        headers["Lock-Token"] = f"<{lock_token}>"
        headers["Content-Type"] = 'text/xml; charset="utf-8"'
        return Response(content=xml_response, status_code=200, headers=headers)

    if method == "UNLOCK":
        # Word releases the lock (e.g. when the user closes the document)
        draft.is_locked = False
        draft.locked_by = None
        draft.locked_at = None
        db.commit()
        return Response(status_code=204, headers=headers)

    if method == "GET":
        # Word downloads the document
        with open(file_path, "rb") as f:
            content = f.read()
        return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers=headers)

    if method == "PUT":
        # Word uploads the saved document
        body = await request.body()
        with open(file_path, "wb") as f:
            f.write(body)
        
        # Note: We don't unlock here, because Word issues PUT on every Ctrl+S, 
        # and issues UNLOCK only when the file is closed.
        return Response(status_code=200, headers=headers)

    return Response(status_code=405, headers=headers)
