import React, { useState, useEffect } from 'react';
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
  IconButton,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../App.jsx';

export default function AddressBookPage() {
  const { user } = useAuth();
  
  // Data State
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Search State (FR-101)
  const [searchField, setSearchField] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Master lists
  const [groups, setGroups] = useState([]);

  // Drawer / Form state (FR-102, FR-104)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [faxNo, setFaxNo] = useState('');
  const [email, setEmail] = useState('');
  const [addressGroup, setAddressGroup] = useState('');

  // Delete Confirm Dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/api/admin/address-book', {
        params: {
          page,
          limit,
          search_field: searchField,
          search_query: searchQuery || undefined
        }
      });
      setResults(response.data.results);
      setTotal(response.data.total);
    } catch (e) {
      setErrorMsg('Failed to load address book contacts.');
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/address-groups');
      setGroups(response.data);
      if (response.data.length > 0) {
        setAddressGroup(response.data[0].group_name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page]);

  // Live search trigger (FR-101)
  useEffect(() => {
    setPage(1);
    fetchContacts();
  }, [searchQuery, searchField]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const openAddDrawer = () => {
    setIsEditMode(false);
    setActiveId(null);
    setName('');
    setDesignation('');
    setOrganisation('');
    setAddressLine1('');
    setAddressLine2('');
    setFaxNo('');
    setEmail('');
    if (groups.length > 0) {
      setAddressGroup(groups[0].group_name);
    }
    setDrawerOpen(true);
  };

  const openEditDrawer = (row) => {
    setIsEditMode(true);
    setActiveId(row.address_id);
    setName(row.name);
    setDesignation(row.designation || '');
    setOrganisation(row.organisation || '');
    setAddressLine1(row.address_line_1 || '');
    setAddressLine2(row.address_line_2 || '');
    setFaxNo(row.fax_no || '');
    setEmail(row.email || '');
    setAddressGroup(row.address_group);
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !addressGroup) {
      setErrorMsg('Name and Address Group are required fields.');
      return;
    }

    const payload = {
      name,
      designation,
      organisation,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      fax_no: faxNo,
      email,
      address_group: addressGroup
    };

    try {
      if (isEditMode) {
        // FR-104: Edit Entry
        await axios.put(`/api/admin/address-book/${activeId}`, payload);
        setSuccessMsg(`Contact "${name}" updated successfully.`);
      } else {
        // FR-102, FR-103: Create Entry
        await axios.post('/api/admin/address-book', payload);
        setSuccessMsg(`Contact "${name}" added to Address Book.`);
      }
      setDrawerOpen(false);
      fetchContacts();
    } catch (err) {
      setErrorMsg('Failed to save contact entry.');
    }
  };

  const handleDeleteClick = (row) => {
    setActiveRow(row);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      // FR-104: Soft delete via pending_deletions
      await axios.delete(`/api/admin/address-book/${activeRow.address_id}`, {
        params: { requester_id: user.user_id }
      });
      setSuccessMsg(`Deletion request for contact "${activeRow.name}" submitted to Admin.`);
      fetchContacts();
    } catch (err) {
      setErrorMsg('Failed to request deletion.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={800}>
          Address Book Registry
        </Typography>

        {/* FR-102: Add Entry button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openAddDrawer}
          sx={{ borderRadius: 2 }}
        >
          Add Contact Entry
        </Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* Field-Selector Search Control (FR-101) */}
      <Card sx={{ mb: 3, border: '1px solid #D1D5DB' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Field selector */}
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Choose Search Field"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setSearchQuery('');
                }}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="designation">Designation</MenuItem>
                <MenuItem value="organisation">Organisation</MenuItem>
                <MenuItem value="fax_no">Fax No.</MenuItem>
                <MenuItem value="email">Email</MenuItem>
              </TextField>
            </Grid>
            {/* Query input */}
            <Grid item xs={12} sm={8} md={9}>
              <TextField
                fullWidth
                size="small"
                label={`Search contacts by ${searchField.replace('_', ' ')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paginated Grid (FR-100) */}
      <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#0F766E !important' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Organisation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address Line 1</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address Line 2</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fax No.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              results.map((row) => (
                <TableRow key={row.address_id} hover>
                  <TableCell fontWeight={600}>{row.address_id}</TableCell>
                  <TableCell fontWeight={600} color="primary.main">{row.name}</TableCell>
                  <TableCell>{row.designation || '-'}</TableCell>
                  <TableCell>{row.organisation || '-'}</TableCell>
                  <TableCell>{row.address_line_1 || '-'}</TableCell>
                  <TableCell>{row.address_line_2 || '-'}</TableCell>
                  <TableCell>{row.fax_no || '-'}</TableCell>
                  <TableCell>{row.email || '-'}</TableCell>
                  <TableCell>
                    <Chip label={row.address_group} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell align="right">
                    {/* FR-104 Actions */}
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => openEditDrawer(row)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(row)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(total / limit)}
          page={page}
          onChange={(e, val) => setPage(val)}
          color="primary"
        />
      </Box>

      {/* Side Slide-out Panel Drawer for Add / Edit (FR-102, FR-104) */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box
          component="form"
          onSubmit={handleSave}
          sx={{ width: { xs: 280, sm: 380 }, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            {isEditMode ? 'Edit Contact Details' : 'Add New Contact'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            Address Book entries are used for primary recipients and CC listings.
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5} sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Organisation"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address Line 2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Fax No."
                value={faxNo}
                onChange={(e) => setFaxNo(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            {/* Group dropdown (FR-105) */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Address Group"
                value={addressGroup}
                onChange={(e) => setAddressGroup(e.target.value)}
              >
                {groups.map((g) => (
                  <MenuItem key={g.group_id} value={g.group_name}>
                    {g.group_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              Save Contact
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Soft delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Request Contact Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to request deletion of <strong>{activeRow?.name}</strong> from the Address Book?<br />
            This will create a request in pending approvals. The contact will be removed once Admin approves.
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
