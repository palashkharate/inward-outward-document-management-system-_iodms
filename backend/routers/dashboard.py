import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Any

import models
from database import get_db, get_iodms_settings
from routers.inward import get_effective_year
from auth_utils import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """FR-166: Get high-level stats for the dashboard."""
    current_year = datetime.date.today().year

    total_inward = db.query(models.InwardRegister).filter(models.InwardRegister.year == current_year).count()
    total_outward = db.query(models.OutwardRegister).filter(models.OutwardRegister.year == current_year).count()
    total_drafts = db.query(models.DraftFile).count()
    
    pending_deletions = db.query(models.PendingDeletion).filter(models.PendingDeletion.status == "Pending").count()
    pending_profile_edits = db.query(models.PendingProfileEdit).filter(models.PendingProfileEdit.status == "Pending").count()
    
    total_users = db.query(models.User).filter(models.User.is_deleted == False).count()
    
    # Optional: Catch errors if TrashBin doesn't exist yet in the DB schema
    try:
        total_trashed = db.query(models.TrashBin).filter(models.TrashBin.is_permanently_deleted == False).count()
    except Exception:
        total_trashed = 0

    return {
        "total_inward_this_year": total_inward,
        "total_outward_this_year": total_outward,
        "total_active_drafts": total_drafts,
        "total_pending_deletions": pending_deletions,
        "total_pending_profile_edits": pending_profile_edits,
        "total_users": total_users,
        "total_trashed": total_trashed
    }

@router.get("/charts")
def get_dashboard_charts(db: Session = Depends(get_db)):
    """FR-167, FR-168: Get chart data and recent activity."""
    current_year = datetime.date.today().year

    # 1. Monthly Trend
    inward_records = db.query(models.InwardRegister.receiving_date).filter(models.InwardRegister.year == current_year).all()
    outward_records = db.query(models.OutwardRegister.issuing_date).filter(models.OutwardRegister.year == current_year).all()

    monthly_counts = {m: {"month": datetime.date(2000, m, 1).strftime('%b'), "inward": 0, "outward": 0} for m in range(1, 13)}
    
    for r in inward_records:
        if r.receiving_date:
            monthly_counts[r.receiving_date.month]["inward"] += 1
            
    for r in outward_records:
        if r.issuing_date:
            monthly_counts[r.issuing_date.month]["outward"] += 1

    monthly_trend = [monthly_counts[m] for m in range(1, 13)]

    # 2. By Folder
    inward_folders = db.query(models.InwardRegister.folder_id, func.count(models.InwardRegister.inward_no)).filter(models.InwardRegister.year == current_year).group_by(models.InwardRegister.folder_id).all()
    outward_folders = db.query(models.OutwardRegister.folder_id, func.count(models.OutwardRegister.outward_no)).filter(models.OutwardRegister.year == current_year).group_by(models.OutwardRegister.folder_id).all()
    
    folder_map = {}
    folders = db.query(models.FolderType).all()
    for f in folders:
        folder_map[f.folder_id] = {"folder_id": f.folder_id, "folder_name": f.folder_name, "inward": 0, "outward": 0}
        
    for fid, count in inward_folders:
        if fid in folder_map:
            folder_map[fid]["inward"] = count
            
    for fid, count in outward_folders:
        if fid in folder_map:
            folder_map[fid]["outward"] = count
            
    by_folder = [f for f in folder_map.values() if f["inward"] > 0 or f["outward"] > 0]

    # 3. By Officer
    outward_officers = db.query(models.OutwardRegister.prepared_by, func.count(models.OutwardRegister.outward_no)).filter(models.OutwardRegister.year == current_year).group_by(models.OutwardRegister.prepared_by).all()
    inward_officers = db.query(models.InwardRegister.actioned_by, func.count(models.InwardRegister.inward_no)).filter(models.InwardRegister.year == current_year).group_by(models.InwardRegister.actioned_by).all()
    
    officer_map = {}
    users = db.query(models.User).all()
    for u in users:
        officer_map[u.user_id] = {"user_id": u.user_id, "name": u.name, "inward_count": 0, "outward_count": 0}
        
    for uid, count in outward_officers:
        if uid in officer_map:
            officer_map[uid]["outward_count"] = count
            
    for uid, count in inward_officers:
        if uid in officer_map:
            officer_map[uid]["inward_count"] = count
            
    by_officer = sorted(officer_map.values(), key=lambda x: (x["outward_count"] + x["inward_count"]), reverse=True)[:5]
    by_officer = [o for o in by_officer if (o["outward_count"] + o["inward_count"]) > 0]

    # 4. Recent Activity
    recent_activity = []
    try:
        recent_logs = db.query(models.EditLog).order_by(models.EditLog.edited_at.desc()).limit(10).all()
        for log in recent_logs:
            recent_activity.append({
                "type": log.record_type,
                "action": log.action,
                "record_id": log.record_id,
                "by": log.edited_by,
                "at": log.edited_at.isoformat() if log.edited_at else None
            })
    except Exception:
        pass

    return {
        "monthly_trend": monthly_trend,
        "by_folder": by_folder,
        "by_officer": by_officer,
        "recent_activity": recent_activity
    }

@router.get("/search-documents")
def search_documents(query: str, limit: int = 20, db: Session = Depends(get_db)):
    """FR-171: Search existing Inward/Outward documents for linking."""
    q = query.strip().lower() if query else ""
    results = []

    # Search Inward
    if q:
        inward_records = db.query(models.InwardRegister).filter(
            (func.lower(models.InwardRegister.inward_no).contains(q)) |
            (func.lower(models.InwardRegister.subject).contains(q)) |
            (func.lower(models.InwardRegister.received_from).contains(q))
        ).order_by(models.InwardRegister.created_at.desc()).limit(limit).all()
    else:
        inward_records = db.query(models.InwardRegister).order_by(models.InwardRegister.created_at.desc()).limit(limit).all()

    for ir in inward_records:
        results.append({
            "id": f"inward:{ir.folder_id}:{ir.year}:{ir.inward_no}",
            "type": "INWARD",
            "subject": ir.subject,
            "folder_name": ir.folder_id,
            "date": ir.receiving_date.isoformat() if ir.receiving_date else "",
            "title": ir.subject,
            "label": f"INWARD - {ir.inward_no} - {ir.subject} (From: {ir.received_from})"
        })

    # Search Outward
    if q:
        outward_records = db.query(models.OutwardRegister).filter(
            (func.lower(models.OutwardRegister.outward_no).contains(q)) |
            (func.lower(models.OutwardRegister.subject).contains(q))
        ).order_by(models.OutwardRegister.created_at.desc()).limit(limit).all()
    else:
        outward_records = db.query(models.OutwardRegister).order_by(models.OutwardRegister.created_at.desc()).limit(limit).all()

    for or_rec in outward_records:
        address_names = []
        for address_id in or_rec.address_to or []:
            address = db.query(models.AddressBook).filter(models.AddressBook.address_id == address_id).first()
            if address:
                address_names.append(address.name)
        address_label = ", ".join(address_names) if address_names else "No recipient"
        results.append({
            "id": f"outward:{or_rec.folder_id}:{or_rec.year}:{or_rec.outward_no}",
            "type": "OUTWARD",
            "subject": or_rec.subject,
            "folder_name": or_rec.folder_id,
            "date": or_rec.issuing_date.isoformat() if or_rec.issuing_date else "",
            "title": or_rec.subject,
            "label": f"OUTWARD - {or_rec.outward_no} - {or_rec.subject} (To: {address_label})"
        })

    # Sort results to put exact matches higher, and limit the total list
    return sorted(results, key=lambda x: (not x['id'].lower().startswith(q), x['id']))[:limit]


@router.get("/network-graph/{doc_type}/{folder_id}/{year}/{doc_no}")
def get_network_graph(doc_type: str, folder_id: str, year: int, doc_no: str, db: Session = Depends(get_db)):
    """FR-171b: Returns a visual family tree network graph of linked documents."""
    
    start_id = f"{doc_type}:{folder_id}:{year}:{doc_no}"
    visited = set()
    nodes = []
    edges = []
    
    # Queue for BFS: stores (doc_id, depth)
    queue = [(start_id, 0)]
    max_depth = 3 # Prevent infinite sprawling
    
    from .link_utils import _get_document_record
    
    while queue:
        current_id, depth = queue.pop(0)
        
        if current_id in visited or depth > max_depth:
            continue
            
        visited.add(current_id)
        
        record = _get_document_record(db, current_id)
        if not record:
            continue
            
        # Add node
        if current_id.startswith("inward:"):
            title = record.subject
            sender = record.received_from
            label = f"Inward {record.inward_no}"
        else:
            title = record.subject
            recipient = None
            if record.address_to:
                address = db.query(models.AddressBook).filter(models.AddressBook.address_id == record.address_to[0]).first()
                recipient = address.name if address else record.address_to[0]
            sender = f"To: {recipient}" if recipient else "Outward"
            label = f"Outward {record.outward_no}"
            
        nodes.append({
            "id": current_id,
            "label": label,
            "title": title,
            "sender": sender,
            "isRoot": depth == 0
        })
        
        # Add edges and enqueue neighbors
        links = record.linked_documents or []
        for target_id in links:
            # We don't want duplicate undirected edges, but since it's a tree visualization,
            # we just provide all directed edges and the frontend will render it.
            edges.append({
                "source": current_id,
                "target": target_id
            })
            if target_id not in visited:
                queue.append((target_id, depth + 1))
                
    return {"nodes": nodes, "edges": edges}
