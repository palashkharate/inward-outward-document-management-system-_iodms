import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../App.jsx';

export default function ComposeOutwardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { folder_id, year, outward_no } = useParams();
  const isModifyMode = !!outward_no;

  // Form Fields
  const [outNo, setOutNo] = useState('');
  const [subject, setSubject] = useState('');
  const [preparedBy, setPreparedBy] = useState(user?.user_id || '');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [templateType, setTemplateType] = useState('Fax_With_GM_Sig');
  const [addressGroup, setAddressGroup] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [ccList, setCcList] = useState([]); // selected CC address IDs

  // Master Lists (fetched from API)
  const [usersList, setUsersList] = useState([]);
  const [folderTypes, setFolderTypes] = useState([]);
  const [addressGroups, setAddressGroups] = useState([]);
  const [contacts, setContacts] = useState([]); // all address book contacts

  // UI state
  const [ccDialogOpen, setCcDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial master data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, foldersRes, groupsRes, addrRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/folder-types'),
          axios.get('/api/admin/address-groups'),
          axios.get('/api/admin/address-book?limit=1000') // fetch all contacts
        ]);
        setUsersList(usersRes.data);
        setFolderTypes(foldersRes.data);
        setAddressGroups(groupsRes.data);
        setContacts(addrRes.data.results);

        // Pre-select first folder if available
        if (foldersRes.data.length > 0 && !isModifyMode) {
          const first = foldersRes.data[0];
          setFolderId(first.folder_id);
          setFolderName(first.folder_name);
          fetchReservedNo(first.folder_id);
        }
      } catch (e) {
        setErrorMsg('Failed to load initial form lists.');
      }
    };
    fetchData();
  }, [isModifyMode]);

  // If in Modify mode, prefill details from outward register
  useEffect(() => {
    if (isModifyMode && folder_id && year && outward_no) {
      const fetchRecord = async () => {
        try {
          const response = await axios.get('/api/outward/register', {
            params: { year: parseInt(year), limit: 100 }
          });
          const match = response.data.results.find(
            r => r.outward_no === outward_no && r.folder_id === folder_id
          );
          if (match) {
            setOutNo(match.outward_no);
            setFolderId(match.folder_id);
            setFolderName(match.folder_name);
            setSubject(match.subject);
            setPreparedBy(match.prepared_by);
            setDateVal(match.issuing_date);
            setRemarks(match.remarks);
            setTemplateType(match.template_type);
            
            // Map names back to IDs if contacts exist
            const fetchedContacts = await axios.get('/api/admin/address-book?limit=1000');
            const allc = fetchedContacts.data.results;
            
            // Reconstruct primary recipient
            const primaryName = match.address_to_names[0];
            const primaryContact = allc.find(c => c.name === primaryName);
            if (primaryContact) {
              setAddressGroup(primaryContact.address_group);
              setAddressTo(primaryContact.address_id);
            }
            
            // Reconstruct CC
            const ccIds = match.cc_to_names.map(name => {
              const c = allc.find(c => c.name === name);
              return c ? c.address_id : null;
            }).filter(id => id !== null);
            setCcList(ccIds);
          } else {
            setErrorMsg('Could not find record for editing.');
          }
        } catch (err) {
          setErrorMsg('Error prefilling record details.');
        }
      };
      fetchRecord();
    }
  }, [isModifyMode, folder_id, year, outward_no]);

  // Fetch reserved number (FR-055)
  const fetchReservedNo = async (fid) => {
    if (isModifyMode) return;
    try {
      const response = await axios.get('/api/outward/next-no', {
        params: { folder_id: fid }
      });
      setOutNo(response.data.outward_no);
    } catch (e) {
      console.error(e);
    }
  };

  // FR-034, FR-035: Bidirectional folder binds
  const handleFolderIdChange = (id) => {
    setFolderId(id);
    const found = folderTypes.find(f => f.folder_id === id);
    if (found) {
      setFolderName(found.folder_name);
      fetchReservedNo(id);
    }
  };

  const handleFolderNameChange = (name) => {
    setFolderName(name);
    const found = folderTypes.find(f => f.folder_name === name);
    if (found) {
      setFolderId(found.folder_id);
      fetchReservedNo(found.folder_id);
    }
  };

  // Reset form to blank state (FR-030)
  const handleNew = () => {
    setSubject('');
    setRemarks('');
    setAddressGroup('');
    setAddressTo('');
    setCcList([]);
    setSuccessMsg('');
    setErrorMsg('');
    if (folderTypes.length > 0) {
      setFolderId(folderTypes[0].folder_id);
      setFolderName(folderTypes[0].folder_name);
      fetchReservedNo(folderTypes[0].folder_id);
    }
    if (isModifyMode) {
      navigate('/compose-outward');
    }
  };

  // Filter contacts by selected Address Group (FR-037, FR-038)
  const filteredContacts = contacts.filter(c => c.address_group === addressGroup);

  // Selected Address Details (FR-039)
  const selectedContactDetails = contacts.find(c => c.address_id === addressTo);

  // Handle Add CC (FR-040)
  const handleAddCc = (id) => {
    if (!ccList.includes(id)) {
      setCcList([...ccList, id]);
    }
    setCcDialogOpen(false);
  };

  // Handle Remove CC (FR-040)
  const handleRemoveCc = (id) => {
    setCcList(ccList.filter(item => item !== id));
  };

  // Handle Save / Submit
  const handleSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!folderId || !subject || !addressTo) {
      setErrorMsg('Subject, Folder ID and Address To are required.');
      return;
    }

    const payload = {
      outward_no: outNo,
      folder_id: folderId,
      issuing_date: dateVal,
      address_to: [addressTo],
      cc_to: ccList,
      subject: subject,
      remarks: remarks,
      prepared_by: preparedBy,
      actioned_by: user.user_id,
      template_type: templateType
    };

    try {
      if (isModifyMode) {
        // FR-044: Save updates in Modify Mode
        await axios.put(`/api/outward/modify/${folder_id}/${year}/${outward_no}`, payload);
        setSuccessMsg(`Outward No. ${outward_no} modified successfully.`);
      } else {
        // FR-042: Save Draft
        await axios.post('/api/outward/draft', payload);
        setSuccessMsg(`Draft document for Outward No. ${outNo} generated successfully.`);
        // Reset form after successful save (FR-043)
        handleNew();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save document draft.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mt: 2 }}>
      {/* Page header and action toolbar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={800}>
          {isModifyMode ? 'Modify Outward Record' : 'Compose Outward Document'}
        </Typography>
        
        {/* FR-030: New Button */}
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
            {/* Outward Number - Read Only */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Outward No. (Reserved)"
                value={outNo}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>

            {/* Date Picker (FR-033) */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Date of Document"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Prepared By Dropdown (FR-032) */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Prepared By"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
              >
                {usersList.map((u) => (
                  <MenuItem key={u.user_id} value={u.user_id}>
                    {u.name} ({u.user_id})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Folder ID Dropdown (FR-034) */}
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

            {/* Folder Name Dropdown (FR-035) */}
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

            {/* Template Dropdown (FR-036) */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Layout Template"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
              >
                <MenuItem value="Fax_With_GM_Sig">Fax / Outside Letter (With GM Signature)</MenuItem>
                <MenuItem value="Fax_Without_GM_Sig">Fax / Outside Letter (Without GM Signature)</MenuItem>
                <MenuItem value="Internal_Letter">Internal Letter</MenuItem>
              </TextField>
            </Grid>

            {/* Subject (FR-031) */}
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

            {/* Address Group Dropdown (FR-037) */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Address Group"
                value={addressGroup}
                onChange={(e) => {
                  setAddressGroup(e.target.value);
                  setAddressTo('');
                }}
              >
                <MenuItem value="">-- Select Group --</MenuItem>
                {addressGroups.map((g) => (
                  <MenuItem key={g.group_id} value={g.group_name}>
                    {g.group_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Address To Dropdown (FR-038) */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Address To"
                value={addressTo}
                onChange={(e) => setAddressTo(e.target.value)}
                disabled={!addressGroup}
              >
                <MenuItem value="">-- Select Contact --</MenuItem>
                {filteredContacts.map((c) => (
                  <MenuItem key={c.address_id} value={c.address_id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Selected Address Display Card (FR-039) */}
            {selectedContactDetails && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
                      Delivery Address Details:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      <strong>{selectedContactDetails.name}</strong><br />
                      {selectedContactDetails.designation && `${selectedContactDetails.designation}, `}
                      {selectedContactDetails.organisation}<br />
                      {selectedContactDetails.address_line_1}<br />
                      {selectedContactDetails.address_line_2}<br />
                      {selectedContactDetails.fax_no && `Fax: ${selectedContactDetails.fax_no} | `}
                      {selectedContactDetails.email && `Email: ${selectedContactDetails.email}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* CC Multi-select Chips (FR-040) */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1.5, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Copy To (CC Recipients):
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCcDialogOpen(true)}
                  >
                    Add CC
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ccList.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No CC recipients selected.
                    </Typography>
                  ) : (
                    ccList.map((id) => {
                      const c = contacts.find(item => item.address_id === id);
                      return (
                        <Chip
                          key={id}
                          label={c ? c.name : id}
                          onDelete={() => handleRemoveCc(id)}
                          deleteIcon={<ClearIcon />}
                        />
                      );
                    })
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Remarks (FR-041) */}
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

            {/* Save Buttons (FR-042 or FR-044) */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {isModifyMode ? (
                // FR-045 Confirmation Trigger
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Modify Record
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
                  Save Draft
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* CC Contact Dialog selector */}
      <Dialog open={ccDialogOpen} onClose={() => setCcDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Select CC Recipient</DialogTitle>
        <DialogContent dividers>
          <List>
            {contacts.map((c) => (
              <ListItem key={c.address_id} disablePadding>
                <ListItemButton onClick={() => handleAddCc(c.address_id)} disabled={ccList.includes(c.address_id)}>
                  <ListItemText primary={c.name} secondary={`${c.designation || ''} - ${c.organisation || ''}`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCcDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* FR-045: Modify confirmation alert dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Modification</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to modify Outward No. {outward_no}. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            No
          </Button>
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
