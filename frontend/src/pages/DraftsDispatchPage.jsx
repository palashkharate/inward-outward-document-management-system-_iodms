import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  Grid
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useAuth } from '../App.jsx';

function DraftRow({ row, onAction, user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Draft Summary Row (FR-050) */}
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
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
          {row.is_locked ? (
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
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {/* 1. Open / Edit in MS Word (FR-051, FR-052) */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => onAction('edit', row)}
                >
                  Open / Edit in Word
                </Button>

                {/* 2. Dispatch (FR-051, FR-054) */}
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendIcon />}
                  onClick={() => onAction('dispatch', row)}
                  disabled={row.is_locked}
                >
                  Dispatch Document
                </Button>

                {/* 3. Discard Draft (FR-056) */}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onAction('discard', row)}
                >
                  Discard Draft
                </Button>

                {/* Admin-only manual lock release (FR-053) */}
                {row.is_locked && user?.role === 'Admin' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => onAction('release_lock', row)}
                  >
                    Admin: Release Lock
                  </Button>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function DraftsDispatchPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lock Dialog state
  const [lockOpen, setLockOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);

  // Dispatch Confirm dialog
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);

  // Discard Confirm dialog
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

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
      await axios.delete(`/api/outward/drafts/${activeDraft.draft_id}`, {
        params: { requester_id: user.user_id }
      });
      setSuccessMsg('Draft discard requested. Awaiting Admin approval.');
      fetchDrafts(); // Draft gets hidden immediately
    } catch (err) {
      setErrorMsg('Failed to request draft discard.');
    }
  };

  const releaseMyLock = async () => {
    setLockOpen(false);
    try {
      await axios.put(`/api/outward/drafts/${activeDraft.draft_id}/unlock`);
      setSuccessMsg('Lock released and changes synced.');
      fetchDrafts();
    } catch (e) {
      setErrorMsg('Failed to release lock.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        Drafts & Dispatch Register
      </Typography>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1E5AA8 !important' }}>
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
            {drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No active drafts waiting for dispatch.
                </TableCell>
              </TableRow>
            ) : (
              drafts.map((row) => (
                <DraftRow key={row.draft_id} row={row} onAction={handleAction} user={user} />
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
            4. Once you have closed Microsoft Word, click <strong>Release Lock & Save</strong> below to release the edit lock.
          </Typography>
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
            Release Lock & Save
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
            This will submit a discard request to the Admin. The draft will be hidden from this list immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardConfirmOpen(false)}>Cancel</Button>
          <Button onClick={executeDiscard} color="error" variant="contained">Confirm Discard</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
