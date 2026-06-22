import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../App.jsx';

export default function LogInwardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { folder_id, year, inward_no } = useParams();
  const isModifyMode = !!inward_no;

  // Form Fields
  const [inNo, setInNo] = useState('');
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split('T')[0]);
  const [scannedFormat, setScannedFormat] = useState('PDF');
  const [inwardLetterNo, setInwardLetterNo] = useState('');
  const [inwardDate, setInwardDate] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [originatedBy, setOriginatedBy] = useState('');
  const [subject, setSubject] = useState('');
  const [remarks, setRemarks] = useState('');
  const [docType, setDocType] = useState('Query');
  const [statusVal, setStatusVal] = useState('Active');
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [assignTo, setAssignTo] = useState([]); // user IDs
  const [ccSentTo, setCcSentTo] = useState([]); // address IDs
  const [uploadedFile, setUploadedFile] = useState(null);

  // Master Lists
  const [usersList, setUsersList] = useState([]);
  const [folderTypes, setFolderTypes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [receivedFromList, setReceivedFromList] = useState([]);
  const [originatedByList, setOriginatedByList] = useState([]);

  // UI state
  const [rfDialogOpen, setRfDialogOpen] = useState(false);
  const [obDialogOpen, setObDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [ccDialogOpen, setCcDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Inline List Editor helper states
  const [newItemName, setNewItemName] = useState('');

  const fetchRFList = async () => {
    const res = await axios.get('/api/admin/received-from-list');
    setReceivedFromList(res.data);
  };

  const fetchOBList = async () => {
    const res = await axios.get('/api/admin/originated-by-list');
    setOriginatedByList(res.data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, foldersRes, addrRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/folder-types'),
          axios.get('/api/admin/address-book?limit=1000')
        ]);
        setUsersList(usersRes.data);
        setFolderTypes(foldersRes.data);
        setContacts(addrRes.data.results);
        await Promise.all([fetchRFList(), fetchOBList()]);

        if (foldersRes.data.length > 0 && !isModifyMode) {
          const first = foldersRes.data[0];
          setFolderId(first.folder_id);
          setFolderName(first.folder_name);
          fetchNextInwardNo(first.folder_id);
        }
      } catch (e) {
        setErrorMsg('Failed to load form master lists.');
      }
    };
    fetchData();
  }, [isModifyMode]);

  // If in modify mode, fetch details
  useEffect(() => {
    if (isModifyMode && folder_id && year && inward_no) {
      const fetchRecord = async () => {
        try {
          const response = await axios.get('/api/inward/register', {
            params: { year: parseInt(year), limit: 100 }
          });
          const match = response.data.results.find(
            r => r.inward_no === inward_no && r.folder_id === folder_id
          );
          if (match) {
            setInNo(match.inward_no);
            setFolderId(match.folder_id);
            setFolderName(match.folder_name);
            setReceivingDate(match.receiving_date);
            setInwardLetterNo(match.inward_letter_no || '');
            setInwardDate(match.inward_date || '');
            setReceivedFrom(match.received_from || '');
            setOriginatedBy(match.originated_by || '');
            setSubject(match.subject || '');
            setRemarks(match.remarks || '');
            setDocType(match.document_type);
            setStatusVal(match.status);
            setAssignTo(match.assign_to || []);
            
            // Map CC names to IDs
            const fetchedContacts = await axios.get('/api/admin/address-book?limit=1000');
            const allc = fetchedContacts.data.results;
            const ccIds = match.cc_sent_to.map(name => {
              const c = allc.find(c => c.name === name || c.address_id === name);
              return c ? c.address_id : name;
            });
            setCcSentTo(ccIds);
          }
        } catch (e) {
          setErrorMsg('Error loading record for modification.');
        }
      };
      fetchRecord();
    }
  }, [isModifyMode, folder_id, year, inward_no]);

  // Fetch next Inward No. (FR-060)
  const fetchNextInwardNo = async (fid) => {
    if (isModifyMode) return;
    try {
      const response = await axios.get('/api/inward/next-no', {
        params: { folder_id: fid }
      });
      setInNo(response.data.inward_no);
    } catch (e) {
      console.error(e);
    }
  };

  // FR-071, FR-072: Bidirectional folder binds
  const handleFolderIdChange = (id) => {
    setFolderId(id);
    const found = folderTypes.find(f => f.folder_id === id);
    if (found) {
      setFolderName(found.folder_name);
      fetchNextInwardNo(id);
    }
  };

  const handleFolderNameChange = (name) => {
    setFolderName(name);
    const found = folderTypes.find(f => f.folder_name === name);
    if (found) {
      setFolderId(found.folder_id);
      fetchNextInwardNo(found.folder_id);
    }
  };

  const handleNew = () => {
    setInwardLetterNo('');
    setInwardDate('');
    setReceivedFrom('');
    setOriginatedBy('');
    setSubject('');
    setRemarks('');
    setAssignTo([]);
    setCcSentTo([]);
    setUploadedFile(null);
    setSuccessMsg('');
    setErrorMsg('');
    if (folderTypes.length > 0) {
      setFolderId(folderTypes[0].folder_id);
      setFolderName(folderTypes[0].folder_name);
      fetchNextInwardNo(folderTypes[0].folder_id);
    }
    if (isModifyMode) {
      navigate('/log-inward');
    }
  };

  // FR-064: react-dropzone integration
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  // Inline List Add helpers (FR-067, FR-068)
  const handleAddRFItem = async () => {
    if (!newItemName) return;
    try {
      const res = await axios.post('/api/admin/received-from-list', { name: newItemName });
      setReceivedFrom(res.data.name);
      setNewItemName('');
      fetchRFList();
    } catch (e) {
      setErrorMsg('Item already exists or creation failed.');
    }
  };

  const handleAddOBItem = async () => {
    if (!newItemName) return;
    try {
      const res = await axios.post('/api/admin/originated-by-list', { name: newItemName });
      setOriginatedBy(res.data.name);
      setNewItemName('');
      fetchOBList();
    } catch (e) {
      setErrorMsg('Item already exists or creation failed.');
    }
  };

  // Save / Submit Form
  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!folderId || !inNo || !subject) {
      setErrorMsg('Folder ID, Inward No., and Subject are required fields.');
      return;
    }

    if (!isModifyMode && !uploadedFile) {
      setErrorMsg('Please upload a scanned document attachment.');
      return;
    }

    const formData = new FormData();
    formData.append('inward_no', inNo);
    formData.append('folder_id', folderId);
    formData.append('receiving_date', receivingDate);
    formData.append('inward_letter_no', inwardLetterNo);
    if (inwardDate) formData.append('inward_date', inwardDate);
    formData.append('received_from', receivedFrom);
    formData.append('originated_by', originatedBy);
    formData.append('subject', subject);
    formData.append('remarks', remarks);
    formData.append('document_type', docType);
    formData.append('status', statusVal);

    assignTo.forEach(uid => formData.append('assign_to', uid));
    ccSentTo.forEach(cid => formData.append('cc_sent_to', cid));

    if (uploadedFile) {
      formData.append('file', uploadedFile);
    }

    try {
      if (isModifyMode) {
        // FR-078: Modify record
        await axios.put(`/api/inward/${folder_id}/${year}/${inward_no}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg(`Inward No. ${inward_no} updated successfully.`);
      } else {
        // FR-077: Save record
        await axios.post('/api/inward', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg(`Inward document registered successfully! Assigned Inward No: ${inNo}`);
        handleNew();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save inward log.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mt: 2 }}>
      {/* Header toolbar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={800}>
          {isModifyMode ? 'Modify Inward Details' : 'Log Inward Document'}
        </Typography>
        
        {/* FR-060: New Button */}
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RefreshIcon />}
          onClick={handleNew}
          sx={{ borderRadius: 2 }}
        >
          New / Reset
        </Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      <Card sx={{ border: '1px solid #D1D5DB' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Inward Number - Read Only */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Inward No. (Auto-gen)"
                value={inNo}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>

            {/* Date of Receipt (FR-062) */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Date of Receipt"
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Format Descriptive Label (FR-063) */}
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Scanned Format"
                value={scannedFormat}
                onChange={(e) => setScannedFormat(e.target.value)}
              >
                <MenuItem value="PDF">PDF</MenuItem>
                <MenuItem value="Image">Image (JPG / PNG / JPEG)</MenuItem>
                <MenuItem value="Document">Document (DOC / DOCX)</MenuItem>
              </TextField>
            </Grid>

            {/* Doc Type Dropdown (FR-075) */}
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Document Type"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <MenuItem value="Query">Query</MenuItem>
                <MenuItem value="Snag">Snag</MenuItem>
                <MenuItem value="File">File</MenuItem>
              </TextField>
            </Grid>

            {/* Letter Ref No. (FR-065) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Inward Letter Ref No."
                value={inwardLetterNo}
                onChange={(e) => setInwardLetterNo(e.target.value)}
              />
            </Grid>

            {/* Letter Date picker (FR-066) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Letter Date"
                value={inwardDate}
                onChange={(e) => setInwardDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Received From with Inline Edit button (FR-067) */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                select
                fullWidth
                label="Received From"
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
              >
                <MenuItem value="">-- Select Origin --</MenuItem>
                {receivedFromList.map(item => (
                  <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => setRfDialogOpen(true)}
                sx={{ height: 56, borderRadius: 2, minWidth: 90 }}
              >
                Edit List
              </Button>
            </Grid>

            {/* Originated By with Inline Edit (FR-068) */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                select
                fullWidth
                label="Originated By"
                value={originatedBy}
                onChange={(e) => setOriginatedBy(e.target.value)}
              >
                <MenuItem value="">-- Select Sender --</MenuItem>
                {originatedByList.map(item => (
                  <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                onClick={() => setObDialogOpen(true)}
                sx={{ height: 56, borderRadius: 2, minWidth: 90 }}
              >
                Edit List
              </Button>
            </Grid>

            {/* Folder ID Dropdown (FR-071) */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Folder ID"
                value={folderId}
                onChange={(e) => handleFolderIdChange(e.target.value)}
              >
                {folderTypes.map((f) => (
                  <MenuItem key={f.folder_id} value={f.folder_id}>
                    {f.folder_id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Folder Name Dropdown (FR-072) */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Folder Name"
                value={folderName}
                onChange={(e) => handleFolderNameChange(e.target.value)}
              >
                {folderTypes.map((f) => (
                  <MenuItem key={f.folder_name} value={f.folder_name}>
                    {f.folder_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Subject (FR-069) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Grid>

            {/* Assign To (FR-070) */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">Assign To (Officers):</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setAssignDialogOpen(true)}>Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {assignTo.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No assignees selected.</Typography>
                  ) : (
                    assignTo.map(uid => (
                      <Chip key={uid} label={uid} onDelete={() => setAssignTo(assignTo.filter(u => u !== uid))} />
                    ))
                  )}
                </Box>
              </Box>
            </Grid>

            {/* CC Sent To (FR-073) */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">CC Sent To:</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setCcDialogOpen(true)}>Add CC</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ccSentTo.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No CC recipients.</Typography>
                  ) : (
                    ccSentTo.map(id => {
                      const c = contacts.find(item => item.address_id === id);
                      return (
                        <Chip key={id} label={c ? c.name : id} onDelete={() => setCcSentTo(ccSentTo.filter(item => item !== id))} />
                      );
                    })
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Remarks (FR-074) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>

            {/* Status Switch Toggle (FR-076) */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={statusVal === 'Active'}
                    onChange={(e) => setStatusVal(e.target.checked ? 'Active' : 'Not Active')}
                  />
                }
                label={`Status: ${statusVal}`}
              />
            </Grid>

            {/* Dropzone File Upload Area (FR-064) */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Scanned Attachment Document (Required):
              </Typography>
              <div {...getRootProps()} className={`dropzone-container ${isDragActive ? 'dropzone-active' : ''}`}>
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
                {uploadedFile ? (
                  <Typography variant="body1" fontWeight={600} color="secondary.main">
                    Selected File: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                ) : (
                  <Typography variant="body1">
                    Drag and drop your file here, or click to browse.
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Supports PDF, DOC, DOCX, and Images (JPG / PNG / JPEG). Max 50 MB.
                </Typography>
              </div>
            </Grid>

            {/* Submit Toolbar (FR-077 or FR-078) */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isModifyMode ? (
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Modify Inward
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Save Inward Entry
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Received From List Editor Panel (FR-067) */}
      <Dialog open={rfDialogOpen} onClose={() => setRfDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Received From Origins</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              size="small"
              fullWidth
              label="Add New Origin"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddRFItem}>Add</Button>
          </Box>
          <List>
            {receivedFromList.map(item => (
              <ListItem key={item.id} secondaryAction={
                <IconButton edge="end" onClick={async () => {
                  await axios.delete(`/api/admin/received-from-list/${item.id}`);
                  fetchRFList();
                }}><ClearIcon /></IconButton>
              }>
                <ListItemText primary={item.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRfDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Originated By List Editor Panel (FR-068) */}
      <Dialog open={obDialogOpen} onClose={() => setObDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Originated By Senders</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              size="small"
              fullWidth
              label="Add New Sender"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddOBItem}>Add</Button>
          </Box>
          <List>
            {originatedByList.map(item => (
              <ListItem key={item.id} secondaryAction={
                <IconButton edge="end" onClick={async () => {
                  await axios.delete(`/api/admin/originated-by-list/${item.id}`);
                  fetchOBList();
                }}><ClearIcon /></IconButton>
              }>
                <ListItemText primary={item.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign To dialogue list */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Select Officer</DialogTitle>
        <DialogContent dividers>
          <List>
            {usersList.map((u) => (
              <ListItem key={u.user_id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (!assignTo.includes(u.user_id)) {
                      setAssignTo([...assignTo, u.user_id]);
                    }
                    setAssignDialogOpen(false);
                  }}
                  disabled={assignTo.includes(u.user_id)}
                >
                  <ListItemText primary={u.name} secondary={u.role} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* CC list dialogue */}
      <Dialog open={ccDialogOpen} onClose={() => setCcDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Select CC Recipient</DialogTitle>
        <DialogContent dividers>
          <List>
            {contacts.map((c) => (
              <ListItem key={c.address_id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (!ccSentTo.includes(c.address_id)) {
                      setCcSentTo([...ccSentTo, c.address_id]);
                    }
                    setCcDialogOpen(false);
                  }}
                  disabled={ccSentTo.includes(c.address_id)}
                >
                  <ListItemText primary={c.name} secondary={c.organisation} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCcDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm modification (FR-078) */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Modification</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to modify Inward No. {inward_no}. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">No</Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              handleSave();
            }}
            color="warning"
            variant="contained"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
