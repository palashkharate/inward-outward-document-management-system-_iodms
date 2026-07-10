import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../App.jsx';
import EditHistoryModal from '../components/EditHistoryModal.jsx';
import UnifiedSearchBar from '../components/UnifiedSearchBar.jsx';
import DocumentViewerModal from '../components/DocumentViewerModal.jsx';
import VisualFamilyTree from '../components/VisualFamilyTree.jsx';

function InwardRow({ row, onAction, onViewFile, setTreeDocId }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action, row) => {
    if (action === 'history') {
      setHistoryOpen(true);
    } else {
      onAction(action, row);
    }
  };

  return (
    <>
      {/* Summary Row (FR-080) */}
      <TableRow sx={{ 
        '& > *': { borderBottom: 'unset' }, 
        opacity: row.is_pending_deletion ? 0.45 : 1,
        bgcolor: row.is_pending_deletion ? 'rgba(255,255,255,0.01)' : 'transparent'
      }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" fontWeight={600}>
          {row.inward_no}
          {row.is_pending_deletion && (
            <Chip label="Pending Deletion" size="small" color="error" variant="outlined" sx={{ ml: 1, fontSize: '0.7rem', height: 20 }} />
          )}
        </TableCell>
        <TableCell>{row.receiving_date}</TableCell>
        <TableCell>{row.inward_letter_no || '-'}</TableCell>
        <TableCell>{row.inward_date || '-'}</TableCell>
        <TableCell>{row.folder_id}</TableCell>
        <TableCell>{row.received_from || '-'}</TableCell>
        <TableCell>{row.subject}</TableCell>
        <TableCell>{row.document_type}</TableCell>
        <TableCell>
          <Chip
            label={row.status}
            size="small"
            color={row.status === 'Active' ? 'success' : 'default'}
          />
        </TableCell>
      </TableRow>

      {/* Row Expansion (FR-083) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.04)' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary">
                Detailed Log Metadata:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Folder Name:</Typography>
                  <Typography variant="body2">{row.folder_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Originated By:</Typography>
                  <Typography variant="body2">{row.originated_by || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Assign To:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {row.assign_to.length === 0 ? '-' : row.assign_to.map(u => (
                      <Chip key={u} label={u} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Remarks:</Typography>
                  <Typography variant="body2">{row.remarks || 'No remarks.'}</Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Attachments:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {row.attachment_paths && row.attachment_paths.length > 0 ? (
                      row.attachment_paths.map((path, idx) => (
                        <Chip
                          key={idx}
                          label={path.split('/').pop()}
                          size="small"
                          color="primary"
                          icon={<VisibilityIcon />}
                          onClick={() => onViewFile(path)}
                          clickable
                        />
                      ))
                    ) : row.attachment_path ? (
                        <Chip
                          label={row.attachment_path.split('/').pop()}
                          size="small"
                          color="primary"
                          icon={<VisibilityIcon />}
                          onClick={() => onViewFile(row.attachment_path)}
                          clickable
                        />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No attachments</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Linked Documents:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {row.linked_documents && row.linked_documents.length > 0 ? (
                      row.linked_documents.map((docId, idx) => (
                        <Chip key={idx} label={docId} size="small" variant="outlined" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No linked documents</Typography>
                    )}
                  </Box>
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => setTreeDocId(`inward:${row.folder_id}:${row.year}:${row.inward_no}`)}
                    sx={{ mt: 1 }}
                  >
                    View Visual Family Tree
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {/* Edit Details (FR-083) */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/log-inward/modify/${row.folder_id}/${row.year}/${row.inward_no}`)}
                  disabled={row.is_pending_deletion}
                >
                  Edit Details
                </Button>


                {/* Delete / Flag Request (FR-084) */}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleAction('delete', row)}
                  disabled={row.is_pending_deletion}
                >
                  Delete Log
                </Button>

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
        recordType="inward" 
        recordId={`${row.folder_id}:${row.year}:${row.inward_no}`} 
      />
    </>
  );
}

export default function InwardRegisterPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  // Advanced Search state
  const [advSearchOpen, setAdvSearchOpen] = useState(false);
  const [searchFolder, setSearchFolder] = useState('');
  const [searchAssignTo, setSearchAssignTo] = useState('');
  const [searchReceivedFrom, setSearchReceivedFrom] = useState('');
  const [searchOriginatedBy, setSearchOriginatedBy] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  
  // Master lists
  const [usersList, setUsersList] = useState([]);
  const [foldersList, setFoldersList] = useState([]);
  
  // Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  
  // Visual Family Tree state
  const [treeDocId, setTreeDocId] = useState(null);
  
  // Document Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerName, setViewerName] = useState('');
  const [isPdf, setIsPdf] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentYear = new Date().getFullYear();
  const years = ["All", ...Array.from({ length: currentYear - 2006 + 2 }, (_, i) => 2006 + i).reverse()];

  // Load Master Lists
  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsersList(res.data)).catch(e => {});
    axios.get('/api/admin/folder-types').then(res => setFoldersList(res.data)).catch(e => {});
  }, []);

  const fetchRegister = async () => {
    try {
      const response = await axios.get('/api/inward/register', {
        params: {
          year,
          page,
          limit: 15,
          search_folder_id: searchFolder || undefined,
          search_assign_to: searchAssignTo || undefined,
          search_received_from: searchReceivedFrom || undefined,
          search_originated_by: searchOriginatedBy || undefined,
          search_subject: searchSubject || undefined,
          search_status: searchStatus || undefined,
          search_date_from: searchDateFrom || undefined,
          search_date_to: searchDateTo || undefined
        }
      });
      setResults(response.data.results);
      setTotal(response.data.total);
    } catch (e) {
      setErrorMsg('Failed to load Inward Register logs.');
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [year, page]);

  const handleApplySearch = () => {
    setPage(1);
    fetchRegister();
  };

  const handleClearSearch = () => {
    setSearchFolder('');
    setSearchAssignTo('');
    setSearchReceivedFrom('');
    setSearchOriginatedBy('');
    setSearchSubject('');
    setSearchStatus('');
    setSearchDateFrom('');
    setSearchDateTo('');
    setYear(new Date().getFullYear().toString());
    setPage(1);
    // Let useEffect handle the fetch on next render after state clears, 
    // or we can call fetchRegister immediately (but state updates are async).
    // Using a timeout is a simple way, or just let another useEffect handle it.
  };

  // Trigger search when clearing if needed
  useEffect(() => {
    if (!searchFolder && !searchAssignTo && !searchReceivedFrom && !searchOriginatedBy && !searchSubject && !searchStatus && !searchDateFrom && !searchDateTo) {
      fetchRegister();
    }
  }, [searchFolder, searchAssignTo, searchReceivedFrom, searchOriginatedBy, searchSubject, searchStatus, searchDateFrom, searchDateTo]);

  const handleAction = (action, row) => {
    if (action === 'delete') {
      setActiveRow(row);
      setDeleteConfirmOpen(true);
    }
  };

  const executeDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      // FR-084: soft-delete inward register entry
      await axios.delete(`/api/inward/${activeRow.folder_id}/${activeRow.year}/${activeRow.inward_no}`, {
        params: { requester_id: user.user_id }
      });
      setSuccessMsg(`Deletion request for Inward No. ${activeRow.inward_no} submitted to Admin.`);
      fetchRegister();
    } catch (err) {
      setErrorMsg('Failed to request deletion.');
    }
  };

  const handleViewFile = (path) => {
    const filename = path.split('\\').pop().split('/').pop();
    const isPdfFile = filename.toLowerCase().endsWith('.pdf');
    setViewerUrl(`/api/inward/view-file?path=${encodeURIComponent(path)}`);
    setViewerName(filename);
    setIsPdf(isPdfFile);
    setViewerOpen(true);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
      {/* Header bar and year filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={800}>
          Inward Register
        </Typography>

        {/* FR-081: Year Filter Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Year:</Typography>
          <TextField
            select
            size="small"
            value={year}
            onChange={(e) => {
              setYear(parseInt(e.target.value));
              setPage(1);
            }}
            sx={{ width: 110 }}
          >
            {years.map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* Advanced Search Controls */}
      <Card sx={{ mb: 3, border: '1px solid #E8EAED', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer' }} onClick={() => setAdvSearchOpen(!advSearchOpen)}>
          <Typography variant="subtitle1" fontWeight={600}>Advanced Search & Filters</Typography>
          {advSearchOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Box>
        <Collapse in={advSearchOpen}>
          <Divider />
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Folder" value={searchFolder} onChange={(e) => setSearchFolder(e.target.value)}>
                  <MenuItem value="">-- All --</MenuItem>
                  {foldersList.map(f => <MenuItem key={f.folder_id} value={f.folder_id}>{f.folder_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Status" value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
                  <MenuItem value="">-- All --</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Not Active">Not Active</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField type="date" fullWidth size="small" label="Date From" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField type="date" fullWidth size="small" label="Date To" value={searchDateTo} onChange={(e) => setSearchDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Assign To" value={searchAssignTo} onChange={(e) => setSearchAssignTo(e.target.value)}>
                  <MenuItem value="">-- All --</MenuItem>
                  {usersList.map(u => <MenuItem key={u.user_id} value={u.user_id}>{u.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Received From" value={searchReceivedFrom} onChange={(e) => setSearchReceivedFrom(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Originated By" value={searchOriginatedBy} onChange={(e) => setSearchOriginatedBy(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Subject" value={searchSubject} onChange={(e) => setSearchSubject(e.target.value)} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleClearSearch}>Clear</Button>
              <Button variant="contained" color="primary" onClick={handleApplySearch}>Search</Button>
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      {/* Paginated Data Grid */}
      <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 600 }}>Inward No.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date of Receipt</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Letter Ref No.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Letter Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Received From</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No inward logs found matching the filter parameters.
                </TableCell>
              </TableRow>
            ) : (
              results.map((row) => (
                <InwardRow key={`${row.folder_id}-${row.year}-${row.inward_no}`} row={row} onAction={handleAction} user={user} onViewFile={handleViewFile} setTreeDocId={setTreeDocId} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(total / 15)}
          page={page}
          onChange={(e, val) => setPage(val)}
          color="primary"
        />
      </Box>

      {/* FR-084: Soft delete confirmation dialogue */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Request Log Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to request deletion of Inward No. <strong>{activeRow?.inward_no}</strong>?<br />
            This will flag the record for Admin review. It will remain greyed out in the register until approved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={executeDelete} color="error" variant="contained">Request Delete</Button>
        </DialogActions>
      </Dialog>

      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileUrl={viewerUrl}
        fileName={viewerName}
        isPdf={isPdf}
      />

      {/* Visual Family Tree Dialog */}
      <VisualFamilyTree
        open={Boolean(treeDocId)}
        onClose={() => setTreeDocId(null)}
        docId={treeDocId}
      />
    </Box>
  );
}
