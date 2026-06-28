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

function OutwardRow({ row, onAction, user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Summary Row (FR-090) */}
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
          {row.outward_no}
          {row.is_pending_deletion && (
            <Chip label="Pending Deletion" size="small" color="error" variant="outlined" sx={{ ml: 1, fontSize: '0.7rem', height: 20 }} />
          )}
        </TableCell>
        <TableCell>{row.folder_id}</TableCell>
        <TableCell>{row.folder_name}</TableCell>
        <TableCell>{row.issuing_date}</TableCell>
        {/* Address To (FR-091: comma separated list in single cell) */}
        <TableCell>{row.address_to_names.join(', ')}</TableCell>
        {/* CC To (FR-091: comma separated list in single cell) */}
        <TableCell>{row.cc_to_names.join(', ')}</TableCell>
        <TableCell>{row.subject}</TableCell>
        <TableCell>{row.prepared_by}</TableCell>
      </TableRow>

      {/* Row Expansion (FR-094) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.04)' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary">
                Detailed Dispatch Metadata:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Template Type:</Typography>
                  <Typography variant="body2">{row.template_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Remarks:</Typography>
                  <Typography variant="body2">{row.remarks || 'No remarks.'}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {/* Edit Details (FR-094) */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/compose-outward/modify/${row.folder_id}/${row.year}/${row.outward_no}`)}
                  disabled={row.is_pending_deletion}
                >
                  Edit Details
                </Button>

                {/* Open Document (FR-094) */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VisibilityIcon />}
                  href={`/api/outward/view-document?path=${row.document_path}`}
                  target="_blank"
                >
                  Open Document
                </Button>

                {/* Delete (FR-095) */}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onAction('delete', row)}
                  disabled={row.is_pending_deletion}
                >
                  Delete Record
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function OutwardRegisterPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Search state (FR-093)
  const [searchFolderId, setSearchFolderId] = useState('');
  const [searchPrep, setSearchPrep] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  
  // Master lists
  const [usersList, setUsersList] = useState([]);
  const [folderTypes, setFolderTypes] = useState([]);
  
  // Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2006 + 2 }, (_, i) => 2006 + i).reverse();

  // Load Folder Types and Users for search dropdowns
  useEffect(() => {
    axios.get('/api/admin/folder-types').then(res => setFolderTypes(res.data)).catch(e => {});
    axios.get('/api/admin/users').then(res => setUsersList(res.data)).catch(e => {});
  }, []);

  const fetchRegister = async () => {
    try {
      const response = await axios.get('/api/outward/register', {
        params: {
          year,
          page,
          limit: 15,
          search_folder_id: searchFolderId || undefined,
          search_prepared_by: searchPrep || undefined,
          search_address_to: searchTo || undefined,
          search_subject: searchSubject || undefined
        }
      });
      setResults(response.data.results);
      setTotal(response.data.total);
    } catch (e) {
      setErrorMsg('Failed to load Outward Register records.');
    }
  };

  useEffect(() => {
    fetchRegister();
  }, [year, page]);

  // Live search trigger (FR-093)
  useEffect(() => {
    setPage(1);
    fetchRegister();
  }, [searchFolderId, searchPrep, searchTo, searchSubject]);

  const handleAction = (action, row) => {
    if (action === 'delete') {
      setActiveRow(row);
      setDeleteConfirmOpen(true);
    }
  };

  const executeDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      // FR-095: soft-delete outward register record
      await axios.delete(`/api/outward/${activeRow.folder_id}/${activeRow.year}/${activeRow.outward_no}`, {
        params: { requester_id: user.user_id }
      });
      setSuccessMsg(`Deletion request for Outward No. ${activeRow.outward_no} submitted to Admin.`);
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
          Outward Register
        </Typography>

        {/* FR-092: Year Filter Dropdown */}
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

      {/* Live Search Controls (FR-093) */}
      <Card sx={{ mb: 3, border: '1px solid #D1D5DB' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Folder ID Dropdown */}
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filter Folder ID"
                value={searchFolderId}
                onChange={(e) => setSearchFolderId(e.target.value)}
              >
                <MenuItem value="">-- All Folders --</MenuItem>
                {folderTypes.map(f => (
                  <MenuItem key={f.folder_id} value={f.folder_id}>{f.folder_id}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Prepared By Dropdown */}
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Search Prepared By"
                value={searchPrep}
                onChange={(e) => setSearchPrep(e.target.value)}
              >
                <MenuItem value="">-- All Officers --</MenuItem>
                {usersList.map(u => (
                  <MenuItem key={u.user_id} value={u.user_id}>{u.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Address To Text search */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Address To..."
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
            </Grid>

            {/* Subject Text search */}
            <Grid item xs={12} sm={3}>
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
          <TableHead sx={{ bgcolor: '#1E5AA8 !important' }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 600 }}>Outward No.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Folder Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Issuing Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address To</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CC To</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prepared By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No outward records found matching the filter parameters.
                </TableCell>
              </TableRow>
            ) : (
              results.map((row) => (
                <OutwardRow key={row.outward_no} row={row} onAction={handleAction} user={user} />
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

      {/* FR-095: Soft delete confirmation dialogue */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Request Record Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to request deletion of Outward No. <strong>{activeRow?.outward_no}</strong>?<br />
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
