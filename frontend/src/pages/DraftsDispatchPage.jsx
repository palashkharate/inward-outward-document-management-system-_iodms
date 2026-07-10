import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Collapse,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useAuth } from '../App.jsx';
import UnifiedSearchBar from '../components/UnifiedSearchBar.jsx';
import DocumentViewerModal from '../components/DocumentViewerModal.jsx';
import EditHistoryModal from '../components/EditHistoryModal.jsx';

function DraftRow({ row, onAction, user, onViewFile }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleAction = (action, row) => {
    if (action === 'history') {
      setHistoryOpen(true);
    } else {
      onAction(action, row);
    }
  };

  return (
    <>
      {/* Draft Summary Row (FR-050) */}
      <TableRow
        hover
        sx={{
          '& > *': { borderBottom: 'unset' },
          bgcolor: row.is_pending_deletion ? 'rgba(0,0,0,0.04)' : row.is_locked ? 'rgba(255, 152, 0, 0.08)' : 'inherit',
          opacity: row.is_pending_deletion ? 0.5 : 1
        }}
      >
        <TableCell>
          <IconButton size="small" aria-label="expand row" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" fontWeight={600}>
          {row.outward_no}
        </TableCell>
        <TableCell>{row.folder_id}</TableCell>
        <TableCell>{row.folder_name}</TableCell>
        <TableCell>{row.issuing_date}</TableCell>
        <TableCell>{row.recipient_name || '-'}</TableCell>
        <TableCell>{row.subject}</TableCell>
        <TableCell>{row.prepared_by}</TableCell>
        <TableCell>
          {row.is_pending_deletion ? (
            <Chip size="small" color="default" label="Deletion Pending" />
          ) : row.is_locked ? (
            <Alert icon={<LockIcon fontSize="inherit" />} severity="warning" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0 } }}>
              Locked by {row.locked_by}
            </Alert>
          ) : (
            <Alert icon={<LockOpenIcon fontSize="inherit" />} severity="success" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0 } }}>
              Available
            </Alert>
          )}
        </TableCell>
      </TableRow>

      {/* Row Expansion showing Actions (FR-051) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.04)' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary">
                Actions & Metadata:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Remarks:</Typography>
                  <Typography variant="body2">{row.remarks || 'No remarks.'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Document Format:</Typography>
                  <Typography variant="body2">MS Word 97-2003 (.doc)</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Created On:</Typography>
                  <Typography variant="body2">{new Date(row.created_on).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Files:</Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {([row.file_path, ...(row.attachment_paths || []).filter(p => p !== row.file_path)]).filter(Boolean).map((path, idx) => {
                      const name = path.split('\\').pop().split('/').pop();
                      const isMainDraft = path === row.file_path;
                      return (
                        <Box key={`${path}-${idx}`} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => onViewFile(path)}
                          >
                            {isMainDraft ? `Main: ${name}` : name}
                          </Button>
                          {!isMainDraft && (
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`delete ${name}`}
                              onClick={() => handleAction('delete_attachment', { ...row, attachmentPath: path })}
                              disabled={row.is_pending_deletion}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      );
                    })}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FileUploadIcon />}
                      onClick={() => handleAction('upload_attachments', row)}
                      disabled={row.is_pending_deletion}
                    >
                      Upload More Files
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {/* View Draft Document (FR-059) */}
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onViewFile(row.file_path)}
                >
                  View Document
                </Button>

                {/* 1. Open / Edit in MS Word (FR-051, FR-052) */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleAction('edit', row)}
                  disabled={row.is_pending_deletion}
                >
                  Open / Edit in Word
                </Button>

                {/* 2. Dispatch (FR-051, FR-054) */}
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendIcon />}
                  onClick={() => handleAction('dispatch', row)}
                  disabled={row.is_locked || row.is_pending_deletion}
                >
                  Dispatch Document
                </Button>

                {/* 3. Discard Draft (FR-056) */}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleAction('discard', row)}
                  disabled={row.is_pending_deletion}
                >
                  Discard Draft
                </Button>

                {/* Admin-only manual lock release (FR-053) */}
                {row.is_locked && user?.role === 'Admin' && !row.is_pending_deletion && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleAction('release_lock', row)}
                  >
                    Admin: Release Lock
                  </Button>
                )}
                
                {/* Edit History (FR-058) */}
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<HistoryIcon />}
                  onClick={() => handleAction('history', row)}
                >
                  Edit History
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <EditHistoryModal 
        open={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        recordType="draft" 
        recordId={row.draft_id} 
      />
    </>
  );
}

export default function DraftsDispatchPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Document Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [isPdf, setIsPdf] = useState(false);

  // Search state
  const [searchField, setSearchField] = useState('subject');
  const [searchQuery, setSearchQuery] = useState('');
  const draftSearchFields = [
    { value: 'subject', label: 'Subject' },
    { value: 'folder_id', label: 'Folder ID' },
    { value: 'prepared_by', label: 'Prepared By' }
  ];

  // FR-052 Re-upload State
  const [reuploadFile, setReuploadFile] = useState(null);
  const [attachmentUploadFiles, setAttachmentUploadFiles] = useState([]);

  // Lock Dialog state
  const [lockOpen, setLockOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);

  // Dispatch Confirm dialog
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);

  // Discard Confirm dialog
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Supporting file management dialog
  const [attachmentUploadOpen, setAttachmentUploadOpen] = useState(false);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get('/api/outward/drafts');
      setDrafts(response.data);
    } catch (e) {
      setErrorMsg('Failed to load drafts.');
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleAction = async (action, row) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActiveDraft(row);

    if (action === 'edit') {
      try {
        // FR-052: Lock the draft for current user
        await axios.put(`/api/outward/drafts/${row.draft_id}/lock`, {
          user_id: user.user_id
        });
        // Reload table
        fetchDrafts();
        // Open edit local instructions modal
        setLockOpen(true);
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || 'Failed to lock draft.');
      }
    } else if (action === 'release_lock') {
      try {
        // FR-053: Unlock draft
        await axios.put(`/api/outward/drafts/${row.draft_id}/unlock`);
        setSuccessMsg('Lock released successfully.');
        fetchDrafts();
      } catch (err) {
        setErrorMsg('Failed to release lock.');
      }
    } else if (action === 'dispatch') {
      setDispatchConfirmOpen(true);
    } else if (action === 'discard') {
      setDiscardConfirmOpen(true);
    } else if (action === 'upload_attachments') {
      setAttachmentUploadFiles([]);
      setAttachmentUploadOpen(true);
    } else if (action === 'delete_attachment') {
      await deleteAttachment(row);
    }
  };

  const deleteAttachment = async (row) => {
    const filename = row.attachmentPath?.split('\\').pop().split('/').pop();
    if (!row.attachmentPath || !window.confirm(`Delete supporting file "${filename}" from this draft?`)) {
      return;
    }
    try {
      await axios.delete(`/api/outward/drafts/${row.draft_id}/attachments`, {
        params: { path: row.attachmentPath }
      });
      setSuccessMsg('Supporting file deleted successfully.');
      fetchDrafts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to delete supporting file.');
    }
  };

  const uploadMoreAttachments = async () => {
    if (!activeDraft || attachmentUploadFiles.length === 0) {
      setErrorMsg('Please select at least one file to upload.');
      return;
    }
    const formData = new FormData();
    attachmentUploadFiles.forEach(file => formData.append('files', file));
    try {
      await axios.post(`/api/outward/drafts/${activeDraft.draft_id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Supporting files uploaded successfully.');
      setAttachmentUploadOpen(false);
      setAttachmentUploadFiles([]);
      fetchDrafts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload supporting files.');
    }
  };

  const executeDispatch = async () => {
    setDispatchConfirmOpen(false);
    try {
      // FR-054: Dispatch the draft
      const response = await axios.post(`/api/outward/drafts/${activeDraft.draft_id}/dispatch`);
      setSuccessMsg(`Document dispatched successfully! Outward No: ${response.data.outward_no}`);
      fetchDrafts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch document.');
    }
  };

  const executeDiscard = async () => {
    setDiscardConfirmOpen(false);
    try {
      // FR-056: Discard draft (soft-delete)
      await axios.delete(`/api/outward/drafts/${activeDraft.draft_id}`);
      setSuccessMsg('Draft discard requested. It will remain greyed out until Admin approval.');
      fetchDrafts();
    } catch (err) {
      setErrorMsg('Failed to request draft discard.');
    }
  };

  const releaseMyLock = async () => {
    setLockOpen(false);
    setReuploadFile(null);
    try {
      await axios.put(`/api/outward/drafts/${activeDraft.draft_id}/unlock`);
      setSuccessMsg('Lock released and changes synced.');
      fetchDrafts();
    } catch (e) {
      setErrorMsg('Failed to release lock.');
    }
  };

  const handleReupload = async () => {
    if (!reuploadFile) {
      setErrorMsg('Please select a file to re-upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', reuploadFile);
    try {
      await axios.put(`/api/outward/drafts/${activeDraft.draft_id}/reupload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Draft re-uploaded and unlocked successfully.');
      setLockOpen(false);
      setReuploadFile(null);
      fetchDrafts();
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Failed to re-upload draft file.');
    }
  };

  const handleViewFile = (path) => {
    if (!path) return;
    const filename = path.split('\\').pop().split('/').pop();
    const isPdfFile = filename.toLowerCase().endsWith('.pdf');
    setViewerUrl(`/api/outward/view-document?path=${encodeURIComponent(path)}`);
    setViewerName(filename);
    setIsPdf(isPdfFile);
    setViewerOpen(true);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Drafts & Dispatch Register
        </Typography>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}
      
      <Box sx={{ mb: 3 }}>
        <UnifiedSearchBar 
          searchField={searchField} 
          setSearchField={setSearchField} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          fieldOptions={draftSearchFields}
          onSearch={() => fetchDrafts()}
        />
      </Box>

      <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 600 }}>Outward No.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Folder Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address To</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prepared By</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Lock Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drafts.filter(d => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              if (searchField === 'folder_id') return d.folder_id?.toLowerCase().includes(q);
              if (searchField === 'prepared_by') return d.prepared_by?.toLowerCase().includes(q);
              if (searchField === 'subject') return d.subject?.toLowerCase().includes(q);
              return true;
            }).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No active drafts waiting for dispatch.
                </TableCell>
              </TableRow>
            ) : (
              drafts.filter(d => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                if (searchField === 'folder_id') return d.folder_id?.toLowerCase().includes(q);
                if (searchField === 'prepared_by') return d.prepared_by?.toLowerCase().includes(q);
                if (searchField === 'subject') return d.subject?.toLowerCase().includes(q);
                return true;
              }).map((row) => (
                <DraftRow key={row.draft_id} row={row} onAction={handleAction} user={user} onViewFile={handleViewFile} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Lock Info dialog (FR-052, EIR-004) */}
      <Dialog open={lockOpen} onClose={releaseMyLock} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'warning.main', fontWeight: 'bold' }}>Draft Locked for Editing</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You have successfully locked Outward No. <strong>{activeDraft?.outward_no}</strong>.
          </Typography>
          
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 1.5, mb: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="caption" color="text.secondary">LAN Shared Path of the Draft File:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5, wordBreak: 'break-all' }}>
              \\Server\IODMS_DATA\{activeDraft?.file_path}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            <strong>How to edit:</strong><br />
            1. Copy the path above or navigate to the shared drafts folder.<br />
            2. Double-click the file to open it in your local <strong>Microsoft Word</strong> editor.<br />
            3. Make your revisions, save, and exit Word.<br />
            4. If edited directly via LAN, click <strong>Release Lock</strong> below.<br />
            5. Alternatively, download the draft, edit, and re-upload here.
          </Typography>
          
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Re-upload Edited Draft:</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
                Select File
                <input type="file" hidden accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx" onChange={(e) => setReuploadFile(e.target.files[0])} />
              </Button>
              {reuploadFile && <Typography variant="body2">{reuploadFile.name}</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            href={`/api/outward/view-document?path=${activeDraft?.file_path}`}
            target="_blank"
            variant="outlined"
          >
            Download Draft
          </Button>
          <Button onClick={releaseMyLock} color="warning" variant="contained">
            Release Lock
          </Button>
          <Button onClick={handleReupload} color="primary" variant="contained" disabled={!reuploadFile}>
            Upload Re-edited File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch confirmation (FR-054) */}
      <Dialog open={dispatchConfirmOpen} onClose={() => setDispatchConfirmOpen(false)}>
        <DialogTitle>Confirm Dispatch</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to dispatch Outward No. <strong>{activeDraft?.outward_no}</strong>?<br />
            This will sequentialize the document, move it to the final Outward Register, and clear the draft.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchConfirmOpen(false)}>Cancel</Button>
          <Button onClick={executeDispatch} color="success" variant="contained">Confirm Dispatch</Button>
        </DialogActions>
      </Dialog>

      {/* Discard confirmation (FR-056) */}
      <Dialog open={discardConfirmOpen} onClose={() => setDiscardConfirmOpen(false)}>
        <DialogTitle>Confirm Discard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to discard Outward No. <strong>{activeDraft?.outward_no}</strong>?<br />
            This will submit a discard request to the Admin. The draft will remain greyed out in this list until approved or rejected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardConfirmOpen(false)}>Cancel</Button>
          <Button onClick={executeDiscard} color="error" variant="contained">Request Discard</Button>
        </DialogActions>
      </Dialog>

      {/* FR-170b: Upload additional supporting files to an active draft */}
      <Dialog open={attachmentUploadOpen} onClose={() => setAttachmentUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Supporting Files</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add more files to Outward No. <strong>{activeDraft?.outward_no}</strong>. The main draft document remains unchanged.
          </Typography>
          <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
            Select Files
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={(e) => setAttachmentUploadFiles(Array.from(e.target.files || []))}
            />
          </Button>
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachmentUploadFiles.map((file) => (
              <Chip key={`${file.name}-${file.size}`} label={file.name} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentUploadOpen(false)}>Cancel</Button>
          <Button onClick={uploadMoreAttachments} variant="contained" disabled={attachmentUploadFiles.length === 0}>
            Upload Files
          </Button>
        </DialogActions>
      </Dialog>
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileUrl={viewerUrl}
        fileName={viewerName}
        isPdf={isPdf}
      />
    </Box>
  );
}
