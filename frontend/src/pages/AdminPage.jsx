import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../App.jsx';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  // SUB-TAB 1.5: DELETED ACCOUNTS
  // ----------------------------------------------------
  const [deletedUsers, setDeletedUsers] = useState([]);

  const fetchDeletedUsers = async () => {
    try {
      const res = await axios.get('/api/admin/deleted-users');
      setDeletedUsers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSoftDeleteUser = async (user_id) => {
    if (!window.confirm(`Are you sure you want to delete user ${user_id}?`)) return;
    try {
      await axios.delete(`/api/admin/users/${user_id}`, {
        params: { admin_id: user.user_id }
      });
      setSuccessMsg('User deleted successfully.');
      fetchUsers();
      fetchDeletedUsers();
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const handleRestoreUser = async (user_id) => {
    try {
      await axios.put(`/api/admin/users/${user_id}/restore`);
      setSuccessMsg('User restored successfully.');
      fetchUsers();
      fetchDeletedUsers();
    } catch (e) {
      setErrorMsg('Failed to restore user.');
    }
  };

  const handleHardDeleteUser = async (user_id) => {
    if (!window.confirm(`WARNING: This will permanently delete user ${user_id} and cannot be undone. Are you sure?`)) return;
    try {
      await axios.delete(`/api/admin/users/${user_id}/permanent`);
      setSuccessMsg('User permanently deleted.');
      fetchDeletedUsers();
    } catch (e) {
      setErrorMsg('Failed to permanently delete user.');
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
  // SUB-TAB 6: TEMPLATES (FR-143)
  // ----------------------------------------------------
  const [templates, setTemplates] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('General');
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/admin/templates');
      setTemplates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadTemplate = async () => {
    if (!templateFile || !templateName) {
      setErrorMsg('Please select a file and enter a name.');
      return;
    }
    setUploadingTemplate(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('name', templateName);
      formData.append('template_type', templateType);
      formData.append('file', templateFile);
      formData.append('uploaded_by', user.user_id);
      
      await axios.post('/api/admin/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Template uploaded successfully.');
      setTemplateFile(null);
      setTemplateName('');
      fetchTemplates();
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Failed to upload template.');
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`/api/admin/templates/${templateId}`);
      setSuccessMsg('Template deleted successfully.');
      fetchTemplates();
    } catch (e) {
      setErrorMsg('Failed to delete template.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 7: RECYCLE BIN (FR-164/165)
  // ----------------------------------------------------
  const [trashBinItems, setTrashBinItems] = useState([]);

  const fetchTrashBin = async () => {
    try {
      const res = await axios.get('/api/admin/trash-bin');
      setTrashBinItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreTrash = async (id) => {
    if (!window.confirm('Are you sure you want to restore this record?')) return;
    setSuccessMsg('');
    try {
      const res = await axios.put(`/api/admin/trash-bin/${id}/restore`);
      setSuccessMsg(res.data.message);
      fetchTrashBin();
    } catch (e) {
      setErrorMsg('Failed to restore record.');
    }
  };

  const handlePermanentDeleteTrash = async (id) => {
    if (!window.confirm('WARNING: This action will permanently delete the record and its file. It cannot be undone. Are you sure?')) return;
    setSuccessMsg('');
    try {
      const res = await axios.delete(`/api/admin/trash-bin/${id}`);
      setSuccessMsg(res.data.message);
      fetchTrashBin();
    } catch (e) {
      setErrorMsg('Failed to permanently delete record.');
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 8: PERMANENTLY DELETED / LOST NUMBERS
  // ----------------------------------------------------
  const [lostNumbers, setLostNumbers] = useState([]);

  const fetchLostNumbers = async () => {
    try {
      const res = await axios.get('/api/admin/permanently-deleted');
      setLostNumbers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 9: SECURITY SETTINGS (IP WHITELIST)
  // ----------------------------------------------------
  const [allowedIps, setAllowedIps] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');

  const fetchAllowedIps = async () => {
    try {
      const res = await axios.get('/api/admin/allowed-ips');
      setAllowedIps(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAllowedIp = async () => {
    if (!newIp.trim()) {
      setErrorMsg('IP address is required.');
      return;
    }
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await axios.post('/api/admin/allowed-ips', {
        ip_address: newIp.trim(),
        description: newIpDesc.trim()
      });
      setSuccessMsg('IP address added to whitelist.');
      setNewIp('');
      setNewIpDesc('');
      fetchAllowedIps();
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Failed to add IP address.');
    }
  };

  const handleDeleteAllowedIp = async (id) => {
    if (!window.confirm('Are you sure you want to remove this IP from the whitelist?')) return;
    setSuccessMsg('');
    try {
      await axios.delete(`/api/admin/allowed-ips/${id}`);
      setSuccessMsg('IP address removed.');
      fetchAllowedIps();
    } catch (e) {
      setErrorMsg('Failed to remove IP address.');
    }
  };

  // ----------------------------------------------------
  // TAB SELECTION CONTROLS
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 0) {
      fetchUsers();
    }
    if (activeTab === 1) {
      fetchDeletedUsers();
    }
    if (activeTab === 2) fetchDeletions();
    if (activeTab === 3) fetchProfileEdits();
    if (activeTab === 4) {
      fetchFolders();
      fetchAddressGroups();
      fetchRF();
      fetchOB();
    }
    if (activeTab === 5) fetchSettings();
    if (activeTab === 6) fetchTemplates();
    if (activeTab === 7) fetchTrashBin();
    if (activeTab === 8) fetchLostNumbers();
    if (activeTab === 9) fetchAllowedIps();
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
          <Tab label="Deleted Accounts" sx={{ fontWeight: 600 }} />
          <Tab label="Pending Deletions" sx={{ fontWeight: 600 }} />
          <Tab label="Profile Edit Approvals" sx={{ fontWeight: 600 }} />
          <Tab label="Master Lists" sx={{ fontWeight: 600 }} />
          <Tab label="System Settings" sx={{ fontWeight: 600 }} />
          <Tab label="Templates" sx={{ fontWeight: 600 }} />
          <Tab label="Recycle Bin" sx={{ fontWeight: 600 }} />
          <Tab label="Permanently Deleted / Lost Numbers" sx={{ fontWeight: 600 }} />
          <Tab label="Security Settings" sx={{ fontWeight: 600 }} />
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

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
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
                      {row.user_id !== 'admin' && (
                        <Button
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                          onClick={() => handleSoftDeleteUser(row.user_id)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: DELETED ACCOUNTS (FR-116) */}
      {activeTab === 1 && (
        <Box>
          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>PB No.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deletedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No deleted accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  deletedUsers.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell fontWeight={600}>{row.user_id}</TableCell>
                      <TableCell>{row.pb_no}</TableCell>
                      <TableCell fontWeight={600}>{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.deleted_at ? new Date(row.deleted_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{row.deleted_by}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="primary" onClick={() => handleRestoreUser(row.user_id)} sx={{ mr: 1 }}>
                          Restore
                        </Button>
                        <Button size="small" color="error" onClick={() => handleHardDeleteUser(row.user_id)}>
                          Perm. Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: PENDING DELETIONS (9B) */}
      {activeTab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Folder / Year</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Files & Links</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deletions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No deletion requests awaiting approval.
                    </TableCell>
                  </TableRow>
                ) : (
                  deletions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{row.document_type}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.document_no}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Key: {row.source_table}:{row.record_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.folder_id || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.folder_name || '-'} / {row.year || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>{row.subject || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: row.linked_documents?.length ? 1 : 0 }}>
                          {(row.files || []).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">No file attached</Typography>
                          ) : (
                            row.files.map((file) => (
                              <Button
                                key={file.path}
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                href={`/api/outward/view-document?path=${encodeURIComponent(file.path)}`}
                                target="_blank"
                              >
                                {file.name}
                              </Button>
                            ))
                          )}
                        </Box>
                        {row.linked_documents?.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {row.linked_documents.map((doc) => (
                              <Chip
                                key={doc.id}
                                size="small"
                                label={`${doc.type} ${doc.number} / ${doc.folder_id} / ${doc.year}`}
                                title={doc.subject || doc.id}
                              />
                            ))}
                          </Box>
                        )}
                      </TableCell>
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

      {/* TAB 3: PENDING PROFILE EDITS (9C) */}
      {activeTab === 3 && (
        <Box>
          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
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

      {/* TAB 4: MASTER LISTS (9D) */}
      {activeTab === 4 && (
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
          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            {masterSubtab === 0 ? (
              // Folders (FR-130)
              <Table size="small">
                <TableHead>
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
                <TableHead>
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

      {/* TAB 5: SYSTEM SETTINGS (9E) */}
      {activeTab === 5 && (
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

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Previous Year Entry (FR-144) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  4. Previous Year Document Entry:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item>
                    <Button variant="outlined" color="primary" onClick={() => navigate('/log-inward?target_year=true')}>
                      Log Inward (Previous Year)
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button variant="outlined" color="primary" onClick={() => navigate('/compose-outward?target_year=true')}>
                      Compose Outward (Previous Year)
                    </Button>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Create manual entries in previous years. You will be prompted to select the target year on the respective forms.
                </Typography>
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

      {/* TAB 6: TEMPLATES (FR-143) */}
      {activeTab === 6 && (
        <Box>
          <Card sx={{ mb: 3, border: '1px solid #D1D5DB' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Upload New Template</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Template Name" 
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Template Type"
                    value={templateType}
                    onChange={e => setTemplateType(e.target.value)}
                  >
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="Confidential">Confidential</MenuItem>
                    <MenuItem value="Secret">Secret</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    fullWidth
                  >
                    {templateFile ? templateFile.name : 'Select .docx File'}
                    <input type="file" hidden accept=".docx" onChange={e => setTemplateFile(e.target.files[0])} />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleUploadTemplate}
                    disabled={uploadingTemplate || !templateFile || !templateName}
                  >
                    {uploadingTemplate ? 'Uploading...' : 'Upload'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Uploaded By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No templates uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell fontWeight={600}>{row.name}</TableCell>
                      <TableCell>
                        <Chip label={row.template_type} size="small" color={
                          row.template_type === 'Secret' ? 'error' : row.template_type === 'Confidential' ? 'warning' : 'default'
                        } />
                      </TableCell>
                      <TableCell>{row.uploaded_by}</TableCell>
                      <TableCell>{new Date(row.uploaded_on).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => handleDeleteTemplate(row.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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

      {/* TAB 7: RECYCLE BIN */}
      {activeTab === 7 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Recycle Bin (30 Days)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Records deleted by Admin are kept here for 30 days before being permanently removed.
          </Typography>

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Source Table</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Record ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expires On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trashBinItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Trash Bin is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  trashBinItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.source_table}</TableCell>
                      <TableCell fontWeight={600}>{item.record_id}</TableCell>
                      <TableCell>{item.deleted_by}</TableCell>
                      <TableCell>{new Date(item.trashed_at).toLocaleString()}</TableCell>
                      <TableCell color="error.main">{new Date(item.expires_at).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          sx={{ mr: 1 }}
                          onClick={() => handleRestoreTrash(item.id)}
                        >
                          Restore
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={() => handlePermanentDeleteTrash(item.id)}
                        >
                          Delete Permanently
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 8: PERMANENTLY DELETED / LOST NUMBERS */}
      {activeTab === 8 && (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Permanently Deleted / Lost Numbers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            These are sequence numbers that were permanently deleted. New files cannot be created on these numbers.
          </Typography>

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Record ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Deleted On</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lostNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No lost numbers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  lostNumbers.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell fontWeight={600} color="error.main">{item.record_id}</TableCell>
                      <TableCell>{item.deleted_by}</TableCell>
                      <TableCell>{new Date(item.trashed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 9: SECURITY SETTINGS (FR-172) */}
      {activeTab === 9 && (
        <Box>
          <Card sx={{ mb: 3, border: '1px solid #D1D5DB' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Whitelist IP Address</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter IP addresses that are allowed to access this system. You can enter exact IPs (e.g. 192.168.1.50), subnets in CIDR notation (e.g. 192.168.1.0/24), or wildcards (e.g. 192.168.1.*). If the list is empty, ALL IPs are allowed.
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="IP Address or Wildcard" 
                    value={newIp}
                    onChange={e => setNewIp(e.target.value)}
                    placeholder="192.168.1.*"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    label="Description (Optional)" 
                    value={newIpDesc}
                    onChange={e => setNewIpDesc(e.target.value)}
                    placeholder="e.g. Server Room Subnet"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button variant="contained" fullWidth onClick={handleAddAllowedIp}>
                    Whitelist
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Added On</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allowedIps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No IP addresses whitelisted. The system is currently accessible from any IP on the network.
                    </TableCell>
                  </TableRow>
                ) : (
                  allowedIps.map(ip => (
                    <TableRow key={ip.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{ip.ip_address}</TableCell>
                      <TableCell>{ip.description || '-'}</TableCell>
                      <TableCell>{new Date(ip.added_at).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" onClick={() => handleDeleteAllowedIp(ip.id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

    </Box>
  );
}
