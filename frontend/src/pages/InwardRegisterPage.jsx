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
  CardContent
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../App.jsx';

function InwardRow({ row, onAction, user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

                {/* View File (FR-083) */}
                {row.attachment_path ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VisibilityIcon />}
                    href={`http://localhost:8000/api/inward/view-file?path=${row.attachment_path}`}
                    target="_blank"
                  >
                    View File
                  </Button>
                ) : (
                  <Button variant="contained" disabled startIcon={<VisibilityIcon />}>
                    No File
                  </Button>
                )}

                {/* Delete / Flag Request (FR-084) */}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onAction('delete', row)}
                  disabled={row.is_pending_deletion}
                >
                  Delete Log
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function InwardRegisterPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Search state (FR-082)
  const [searchAssign, setSearchAssign] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  
  // Master lists
  const [usersList, setUsersList] = useState([]);
  
  // Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2006 + 2 }, (_, i) => 2006 + i).reverse();

  // Load Users List for search dropdown
  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsersList(res.data)).catch(e => {});
  }, []);

  const fetchRegister = async () => {
    try {
      const response = await axios.get('/api/inward/register', {
        params: {
          year,
          page,
          limit: 15,
          search_assign_to: searchAssign || undefined,
          search_received_from: searchFrom || undefined,
          search_subject: searchSubject || undefined
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

  // Live search trigger (FR-082)
  useEffect(() => {
    setPage(1);
    fetchRegister();
  }, [searchAssign, searchFrom, searchSubject]);

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

      {/* Live Search Controls (FR-082) */}
      <Card sx={{ mb: 3, border: '1px solid #D1D5DB' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Assign To Dropdown */}
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Search Assign To"
                value={searchAssign}
                onChange={(e) => setSearchAssign(e.target.value)}
              >
                <MenuItem value="">-- All Officers --</MenuItem>
                {usersList.map(u => (
                  <MenuItem key={u.user_id} value={u.user_id}>{u.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Received From Text search */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Search Received From..."
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
              />
            </Grid>

            {/* Subject Text search */}
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                size="small"
                label="Search Subject..."
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paginated Data Grid */}
      <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#0284C7 !important' }}>
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
                <InwardRow key={row.inward_no} row={row} onAction={handleAction} user={user} />
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
    </Box>
  );
}
