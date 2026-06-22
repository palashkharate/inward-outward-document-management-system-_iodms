import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  MenuItem,
  Switch,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Divider,
  Alert,
  List,
  ListItem,
  Chip,
  IconButton,
  ListItemText
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import StorageIcon from '@mui/icons-material/Storage';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useAuth } from '../App.jsx';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  
  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ----------------------------------------------------
  // SUB-TAB 1: USER MANAGEMENT
  // ----------------------------------------------------
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditUser, setIsEditUser] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // User form fields
  const [uId, setUId] = useState('');
  const [pbNo, setPbNo] = useState('');
  const [uName, setUName] = useState('');
  const [uDob, setUDob] = useState('');
  const [uRole, setURole] = useState('User');
  const [uPassword, setUPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddUser = () => {
    setIsEditUser(false);
    setUId('');
    setPbNo('');
    setUName('');
    setUDob('');
    setURole('User');
    setUPassword('');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (row) => {
    setIsEditUser(true);
    setSelectedUser(row);
    setUId(row.user_id);
    setPbNo(row.pb_no);
    setUName(row.name);
    setUDob(row.dob);
    setURole(row.role);
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (isEditUser) {
        // FR-112: Edit User
        await axios.put(`/api/admin/users/${uId}`, {
          name: uName,
          dob: uDob,
          role: uRole
        });
        setSuccessMsg(`User ${uName} updated successfully.`);
      } else {
        // FR-111: Add User
        await axios.post('/api/admin/users', {
          user_id: uId,
          pb_no: pbNo,
          name: uName,
          dob: uDob,
          role: uRole,
          password: uPassword
        });
        setSuccessMsg(`User ${uName} registered successfully.`);
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save user account.');
    }
  };

  const handleToggleUser = async (user_id) => {
    try {
      // FR-113: Toggle active status
      const res = await axios.put(`/api/admin/users/${user_id}/toggle`);
      setSuccessMsg(res.data.message);
      fetchUsers();
    } catch (e) {
      setErrorMsg('Failed to change user status.');
    }
  };

  const handleResetPassword = async () => {
    try {
      // FR-114: Admin resets password
      await axios.put(`/api/admin/users/${selectedUser.user_id}/reset-password`, {
        password: uPassword
      });
      setSuccessMsg(`Password reset successfully for ${selectedUser.name}.`);
      setPwModalOpen(false);
      setUPassword('');
    } catch (e) {
      setErrorMsg('Failed to reset password.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 2: PENDING DELETIONS
  // ----------------------------------------------------
  const [deletions, setDeletions] = useState([]);

  const fetchDeletions = async () => {
    try {
      const res = await axios.get('/api/admin/pending-deletions');
      setDeletions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovalDeletion = async (id, action) => {
    setSuccessMsg('');
    try {
      // FR-121: Approve/Reject Deletions
      const res = await axios.put(`/api/admin/pending-deletions/${id}`, { action });
      setSuccessMsg(res.data.message);
      fetchDeletions();
    } catch (e) {
      setErrorMsg('Approval action failed.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 3: PENDING PROFILE EDITS
  // ----------------------------------------------------
  const [profileEdits, setProfileEdits] = useState([]);

  const fetchProfileEdits = async () => {
    try {
      const res = await axios.get('/api/admin/pending-profile-edits');
      setProfileEdits(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovalProfileEdit = async (id, action) => {
    setSuccessMsg('');
    try {
      // FR-126: Approve/Reject Profile Edits
      const res = await axios.put(`/api/admin/pending-profile-edits/${id}`, { action });
      setSuccessMsg(res.data.message);
      fetchProfileEdits();
    } catch (e) {
      setErrorMsg('Approval action failed.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 4: MASTER LIST MANAGEMENT
  // ----------------------------------------------------
  const [masterSubtab, setMasterSubtab] = useState(0);
  const [folderTypes, setFolderTypes] = useState([]);
  const [addressGroups, setAddressGroups] = useState([]);
  const [rfList, setRfList] = useState([]);
  const [obList, setObList] = useState([]);

  // Editor states
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [masterEditMode, setMasterEditMode] = useState(false);
  const [keyField, setKeyField] = useState(''); // e.g. folder_id
  const [valField, setValField] = useState(''); // e.g. folder_name
  const [activeItemId, setActiveItemId] = useState(null);

  const fetchFolders = async () => {
    const res = await axios.get('/api/admin/folder-types');
    setFolderTypes(res.data);
  };
  const fetchAddressGroups = async () => {
    const res = await axios.get('/api/admin/address-groups');
    setAddressGroups(res.data);
  };
  const fetchRF = async () => {
    const res = await axios.get('/api/admin/received-from-list');
    setRfList(res.data);
  };
  const fetchOB = async () => {
    const res = await axios.get('/api/admin/originated-by-list');
    setObList(res.data);
  };

  const handleOpenMasterAdd = () => {
    setMasterEditMode(false);
    setKeyField('');
    setValField('');
    setMasterModalOpen(true);
  };

  const handleOpenMasterEdit = (item) => {
    setMasterEditMode(true);
    if (masterSubtab === 0) {
      // Folders
      setKeyField(item.folder_id);
      setValField(item.folder_name);
      setActiveItemId(item.folder_id);
    } else {
      // Groups / Origin / Sender
      setKeyField(item.name || item.group_name);
      setActiveItemId(item.id || item.group_id);
    }
    setMasterModalOpen(true);
  };

  const handleSaveMaster = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (masterSubtab === 0) {
        // Folder Types (FR-130)
        if (masterEditMode) {
          await axios.put(`/api/admin/folder-types/${activeItemId}`, {
            folder_id: keyField,
            folder_name: valField
          });
        } else {
          await axios.post('/api/admin/folder-types', {
            folder_id: keyField,
            folder_name: valField
          });
        }
        fetchFolders();
      } else if (masterSubtab === 1) {
        // Address Groups (FR-131)
        if (masterEditMode) {
          await axios.put(`/api/admin/address-groups/${activeItemId}`, { name: keyField });
        } else {
          await axios.post('/api/admin/address-groups', { name: keyField });
        }
        fetchAddressGroups();
      } else if (masterSubtab === 2) {
        // Received From Origins (FR-132)
        if (masterEditMode) {
          await axios.put(`/api/admin/received-from-list/${activeItemId}`, { name: keyField });
        } else {
          await axios.post('/api/admin/received-from-list', { name: keyField });
        }
        fetchRF();
      } else if (masterSubtab === 3) {
        // Originated By Senders (FR-133)
        if (masterEditMode) {
          await axios.put(`/api/admin/originated-by-list/${activeItemId}`, { name: keyField });
        } else {
          await axios.post('/api/admin/originated-by-list', { name: keyField });
        }
        fetchOB();
      }
      setSuccessMsg('Master list item saved successfully.');
      setMasterModalOpen(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save master list item.');
    }
  };

  const handleDeleteMaster = async (idOrCode) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (masterSubtab === 0) {
        await axios.delete(`/api/admin/folder-types/${idOrCode}`);
        fetchFolders();
      } else if (masterSubtab === 1) {
        await axios.delete(`/api/admin/address-groups/${idOrCode}`);
        fetchAddressGroups();
      } else if (masterSubtab === 2) {
        await axios.delete(`/api/admin/received-from-list/${idOrCode}`);
        fetchRF();
      } else if (masterSubtab === 3) {
        await axios.delete(`/api/admin/originated-by-list/${idOrCode}`);
        fetchOB();
      }
      setSuccessMsg('Item deleted successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to delete. Item may be in active use.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 5: SYSTEM SETTINGS
  // ----------------------------------------------------
  const [iodmsPath, setIodmsPath] = useState('');
  const [cutoverDate, setCutoverDate] = useState('');
  const [dbeaverDialogOpen, setDbeaverDialogOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings');
      setIodmsPath(res.data.iodms_root_path);
      setCutoverDate(res.data.cutover_override_date || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      // FR-140, FR-141: Save settings
      await axios.put('/api/admin/settings', {
        iodms_root_path: iodmsPath,
        cutover_override_date: cutoverDate || null
      });
      setSuccessMsg('System configurations updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update system settings.');
    }
  };

  // ----------------------------------------------------
  // TAB SELECTION CONTROLS
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 0) fetchUsers();
    if (activeTab === 1) fetchDeletions();
    if (activeTab === 2) fetchProfileEdits();
    if (activeTab === 3) {
      fetchFolders();
      fetchAddressGroups();
      fetchRF();
      fetchOB();
    }
    if (activeTab === 4) fetchSettings();
  }, [activeTab]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        Administrative Control Panel
      </Typography>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* Main Administrative Sub-tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => {
          setActiveTab(val);
          setSuccessMsg('');
          setErrorMsg('');
        }} variant="scrollable" scrollButtons="auto">
          <Tab label="User Management" sx={{ fontWeight: 600 }} />
          <Tab label="Pending Deletions" sx={{ fontWeight: 600 }} />
          <Tab label="Profile Edit Approvals" sx={{ fontWeight: 600 }} />
          <Tab label="Master Lists" sx={{ fontWeight: 600 }} />
          <Tab label="System Settings" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* TAB 0: USER MANAGEMENT (9A) */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddUser}>
              Add User Account
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0F766E !important' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>PB No.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DOB</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell fontWeight={600}>{row.user_id}</TableCell>
                    <TableCell>{row.pb_no}</TableCell>
                    <TableCell fontWeight={600} color="primary.main">{row.name}</TableCell>
                    <TableCell>{row.dob}</TableCell>
                    <TableCell>
                      <Chip label={row.role} size="small" color={row.role === 'Admin' ? 'secondary' : 'default'} />
                    </TableCell>
                    <TableCell>
                      {/* FR-113: Toggle Status */}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={row.is_active}
                            onChange={() => handleToggleUser(row.user_id)}
                            size="small"
                          />
                        }
                        label={row.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {/* FR-112: Edit & FR-114: Reset PW */}
                      <Button size="small" onClick={() => handleOpenEditUser(row)} sx={{ mr: 1 }}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="warning"
                        startIcon={<LockResetIcon />}
                        onClick={() => {
                          setSelectedUser(row);
                          setUPassword('');
                          setPwModalOpen(true);
                        }}
                      >
                        Reset PW
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: PENDING DELETIONS (9B) */}
      {activeTab === 1 && (
        <Box>
          <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0F766E !important' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Source Table</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Record ID / Key</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deletions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No deletion requests awaiting approval.
                    </TableCell>
                  </TableRow>
                ) : (
                  deletions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell fontWeight={600}>{row.source_table}</TableCell>
                      <TableCell>{row.record_id}</TableCell>
                      <TableCell>{row.requested_by}</TableCell>
                      <TableCell>{new Date(row.requested_on).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {/* FR-121: Approve / Reject Actions */}
                        <IconButton color="success" onClick={() => handleApprovalDeletion(row.id, 'Approve')}>
                          <CheckIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleApprovalDeletion(row.id, 'Reject')}>
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: PENDING PROFILE EDITS (9C) */}
      {activeTab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0F766E !important' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Proposed Updates</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profileEdits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No profile modification requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  profileEdits.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell fontWeight={600}>{row.user_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2">Name: {row.proposed_changes.name}</Typography>
                        <Typography variant="body2">DOB: {row.proposed_changes.dob}</Typography>
                      </TableCell>
                      <TableCell>{new Date(row.requested_on).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {/* FR-126 Actions */}
                        <IconButton color="success" onClick={() => handleApprovalProfileEdit(row.id, 'Approve')}>
                          <CheckIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleApprovalProfileEdit(row.id, 'Reject')}>
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 3: MASTER LISTS (9D) */}
      {activeTab === 3 && (
        <Box>
          {/* Subtabs for Master list types */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
            <Tabs value={masterSubtab} onChange={(e, val) => setMasterSubtab(val)} size="small" textColor="secondary" indicatorColor="secondary">
              <Tab label="Folder Categories" />
              <Tab label="Address Groups" />
              <Tab label="Received From Origins" />
              <Tab label="Originated By Senders" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenMasterAdd}>
              Add Entry
            </Button>
          </Box>

          {/* Subtab tables */}
          <TableContainer component={Paper} sx={{ border: '1px solid #D1D5DB' }}>
            {masterSubtab === 0 ? (
              // Folders (FR-130)
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F766E !important' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Folder ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Folder Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {folderTypes.map(f => (
                    <TableRow key={f.folder_id}>
                      <TableCell fontWeight={600} color="primary.main">{f.folder_id}</TableCell>
                      <TableCell>{f.folder_name}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleOpenMasterEdit(f)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteMaster(f.folder_id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              // Generic Name lists
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F766E !important' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Entry Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(masterSubtab === 1 ? addressGroups : masterSubtab === 2 ? rfList : obList).map(item => (
                    <TableRow key={item.id || item.group_id}>
                      <TableCell>{item.name || item.group_name}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleOpenMasterEdit(item)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteMaster(item.id || item.group_id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Box>
      )}

      {/* TAB 4: SYSTEM SETTINGS (9E) */}
      {activeTab === 4 && (
        <Card sx={{ border: '1px solid #D1D5DB' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* IODMS Root Path configuration (FR-140) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  1. Configure base file system path where documents are stored:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="IODMS Root Path"
                  value={iodmsPath}
                  onChange={(e) => setIodmsPath(e.target.value)}
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Example: D:/IODMS_DATA (Ensure the backend has write permissions to this directory).
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Year Cutover Override Date picker (FR-141) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  2. Manual Year Cutover Override Date:
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  label="Override Cutover Date"
                  value={cutoverDate}
                  onChange={(e) => setCutoverDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 1, mb: 1, width: 220 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  If set, the system keeps using the previous year's numbering and subfolders until this date is crossed. Leave blank for automatic cutover on January 1.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Direct DB Access - Open in DBeaver instructions (FR-142, EIR-005) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  3. Direct Database Access:
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<StorageIcon />}
                  onClick={() => setDbeaverDialogOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Open in DBeaver
                </Button>
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveSettings} sx={{ px: 4 }}>
                  Save Configuration
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* User Edit/Add Dialogue (FR-111, FR-112) */}
      <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{isEditUser ? 'Edit User Details' : 'Add New User Account'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="User ID"
                value={uId}
                onChange={(e) => setUId(e.target.value)}
                disabled={isEditUser}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="PB No. (Personnel Book)"
                value={pbNo}
                onChange={(e) => setPbNo(e.target.value)}
                disabled={isEditUser}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Name"
                value={uName}
                onChange={(e) => setUName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="date"
                label="DOB"
                value={uDob}
                onChange={(e) => setUDob(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Access Role"
                value={uRole}
                onChange={(e) => setURole(e.target.value)}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </TextField>
            </Grid>
            {!isEditUser && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type="password"
                  label="Password"
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialogue (FR-114) */}
      <Dialog open={pwModalOpen} onClose={() => setPwModalOpen(false)}>
        <DialogTitle>Reset Password for {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Enter a new password for user {selectedUser?.user_id}:</Typography>
          <TextField
            required
            fullWidth
            type="password"
            label="New Password"
            value={uPassword}
            onChange={(e) => setUPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwModalOpen(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} color="warning" variant="contained">Reset Password</Button>
        </DialogActions>
      </Dialog>

      {/* Master lists Editor Modal (9D) */}
      <Dialog open={masterModalOpen} onClose={() => setMasterModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {masterEditMode ? 'Edit List Item' : 'Add List Item'}
        </DialogTitle>
        <DialogContent dividers>
          {masterSubtab === 0 ? (
            // Folder category
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Folder ID Code (e.g. Su-30)"
                  value={keyField}
                  onChange={(e) => setKeyField(e.target.value)}
                  disabled={masterEditMode}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Folder Name Description"
                  value={valField}
                  onChange={(e) => setValField(e.target.value)}
                />
              </Grid>
            </Grid>
          ) : (
            // Generic list item name
            <TextField
              required
              fullWidth
              label="Name"
              value={keyField}
              onChange={(e) => setKeyField(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMasterModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMaster} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* DBeaver instructions dialogue (FR-142, EIR-005) */}
      <Dialog open={dbeaverDialogOpen} onClose={() => setDbeaverDialogOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon color="secondary" /> Launch DBeaver Connection
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Requirements Note:</strong> Browser security sandboxes do not allow web applications to launch desktop executables like DBeaver directly.
          </Typography>
          <Typography variant="body2">
            To view the database directly:<br />
            1. Open <strong>DBeaver</strong> from your desktop.<br />
            2. Connect to the local PostgreSQL server (<strong>localhost:5432</strong>).<br />
            3. Database name is <strong>iodms_db</strong>.<br />
            4. You can write custom SQL queries on all 11 tables here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDbeaverDialogOpen(false)} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
