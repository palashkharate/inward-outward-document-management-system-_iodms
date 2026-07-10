import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Alert,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useAuth } from '../App.jsx';

const MIN_DOCUMENT_DATE = '1947-08-15';
const todayIsoDate = () => new Date().toISOString().split('T')[0];

export default function ComposeOutwardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { folder_id, year, outward_no } = useParams();
  const isModifyMode = !!outward_no;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isTargetYearMode = searchParams.get('target_year') === 'true';

  // Form Fields
  const [targetYearVal, setTargetYearVal] = useState(new Date().getFullYear() - 1);
  const [outNo, setOutNo] = useState('');
  const [subject, setSubject] = useState('');
  const [preparedBy, setPreparedBy] = useState(user?.user_id || '');
  const [dateVal, setDateVal] = useState(todayIsoDate());
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [addressGroup, setAddressGroup] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [ccList, setCcList] = useState([]); // selected CC address IDs
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // Master Lists (fetched from API)
  const [usersList, setUsersList] = useState([]);
  const [folderTypes, setFolderTypes] = useState([]);
  const [addressGroups, setAddressGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]); // all address book contacts

  // UI state
  const [ccDialogOpen, setCcDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // FR-055: Track whether outward number has been explicitly reserved
  const [isReserved, setIsReserved] = useState(false);
  const autosaveKey = `compose_outward_draft_${user?.user_id || 'guest'}`;

  // Fetch initial master data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, foldersRes, groupsRes, addrRes, templatesRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/folder-types'),
          axios.get('/api/admin/address-groups'),
          axios.get('/api/admin/address-book?limit=1000'), // fetch all contacts
          axios.get('/api/admin/templates')
        ]);
        setUsersList(usersRes.data);
        setFolderTypes(foldersRes.data);
        setAddressGroups(groupsRes.data);
        setContacts(addrRes.data.results);
        setTemplates(templatesRes.data);
        
        const docsRes = await axios.get('/api/dashboard/search-documents?query=');
        setAvailableDocuments(docsRes.data);
        
        if (templatesRes.data.length > 0 && !isModifyMode) {
           setTemplateType(templatesRes.data[0].id.toString());
        }

        // Pre-select first folder only when the form was not restored from tab-safe autosave.
        const hasSavedDraft = Boolean(sessionStorage.getItem(autosaveKey));
        if (foldersRes.data.length > 0 && !isModifyMode && !hasSavedDraft) {
          const first = foldersRes.data[0];
          setFolderId(first.folder_id);
          setFolderName(first.folder_name);
          setOutNo('');
          setIsReserved(false);
        }
      } catch (e) {
        setErrorMsg('Failed to load initial form lists.');
      }
    };
    fetchData();
  }, [isModifyMode]);

  useEffect(() => {
    if (isModifyMode) return;
    const saved = sessionStorage.getItem(autosaveKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setTargetYearVal(data.targetYearVal ?? new Date().getFullYear() - 1);
      setOutNo(data.outNo || '');
      setSubject(data.subject || '');
      setPreparedBy(data.preparedBy || user?.user_id || '');
      const savedDate = data.dateVal || todayIsoDate();
      setDateVal(savedDate >= MIN_DOCUMENT_DATE && savedDate <= todayIsoDate() ? savedDate : todayIsoDate());
      setFolderId(data.folderId || '');
      setFolderName(data.folderName || '');
      setTemplateType(data.templateType || '');
      setAddressGroup(data.addressGroup || '');
      setAddressTo(data.addressTo || '');
      setRemarks(data.remarks || '');
      setCcList(data.ccList || []);
      setLinkedDocuments(data.linkedDocuments || []);
      setIsReserved(Boolean(data.isReserved));
    } catch (e) {
      sessionStorage.removeItem(autosaveKey);
    }
  }, [autosaveKey, isModifyMode, user?.user_id]);

  useEffect(() => {
    if (isModifyMode) return;
    const hasTypedData = Boolean(
      outNo || subject || remarks || addressGroup || addressTo || ccList.length || linkedDocuments.length
    );
    if (!hasTypedData) {
      sessionStorage.removeItem(autosaveKey);
      return;
    }
    sessionStorage.setItem(autosaveKey, JSON.stringify({
      targetYearVal,
      outNo,
      subject,
      preparedBy,
      dateVal,
      folderId,
      folderName,
      templateType,
      addressGroup,
      addressTo,
      remarks,
      ccList,
      linkedDocuments,
      isReserved
    }));
  }, [
    autosaveKey,
    isModifyMode,
    targetYearVal,
    outNo,
    subject,
    preparedBy,
    dateVal,
    folderId,
    folderName,
    templateType,
    addressGroup,
    addressTo,
    remarks,
    ccList,
    linkedDocuments,
    isReserved
  ]);

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
            setSubject(match.subject || '');
            setPreparedBy(match.prepared_by || '');
            setRemarks(match.remarks || '');
            setTemplateType(match.template_type || '');
            setAddressTo(match.address_to.length > 0 ? match.address_to[0] : '');
            setCcList(match.cc_to || []);
            setLinkedDocuments(match.linked_documents || []);
            
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

  // FR-055: Actually reserve the number (called when officer clicks "Get Number")
  const reserveOutwardNo = async () => {
    if (isModifyMode || isReserved) return;
    try {
      const params = { folder_id: folderId };
      if (isTargetYearMode) {
        params.target_year = targetYearVal;
      }
      const response = await axios.get('/api/outward/next-no', { params });
      setOutNo(response.data.outward_no);
      setIsReserved(true);
      setErrorMsg('');
      setSuccessMsg(`Outward No. ${response.data.outward_no} has been reserved for you.`);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 400) {
        setErrorMsg(e.response.data.detail);
        setOutNo('');
      } else {
        setErrorMsg('Failed to reserve Outward number. Please try again.');
      }
    }
  };

  // FR-034, FR-035: Bidirectional folder binds
  const handleFolderIdChange = (id) => {
    setFolderId(id);
    const found = folderTypes.find(f => f.folder_id === id);
    if (found) {
      setFolderName(found.folder_name);
    }
  };

  const handleFolderNameChange = (name) => {
    setFolderName(name);
    const found = folderTypes.find(f => f.folder_name === name);
    if (found) {
      setFolderId(found.folder_id);
    }
  };

  const handleDocumentDateChange = (value) => {
    const today = todayIsoDate();
    if (!value) {
      setDateVal(today);
      return;
    }
    if (value < MIN_DOCUMENT_DATE) {
      setDateVal(MIN_DOCUMENT_DATE);
      return;
    }
    if (value > today) {
      setDateVal(today);
      return;
    }
    setDateVal(value);
  };

  // Reset form to blank state (FR-030)
  const handleNew = () => {
    setSubject('');
    setRemarks('');
    setTemplateType(templates.length > 0 ? templates[0].id.toString() : '');
    setAddressGroup('');
    setAddressTo('');
    setCcList([]);
    setLinkedDocuments([]);
    setAttachmentFiles([]);
    setSuccessMsg('');
    setErrorMsg('');
    setIsReserved(false);
    setOutNo('');
    sessionStorage.removeItem(autosaveKey);
    if (folderTypes.length > 0) {
      setFolderId(folderTypes[0].folder_id);
      setFolderName(folderTypes[0].folder_name);
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

    const today = todayIsoDate();
    if (!dateVal || dateVal < MIN_DOCUMENT_DATE || dateVal > today) {
      setErrorMsg(`Date of Document must be between ${MIN_DOCUMENT_DATE} and ${today}.`);
      return;
    }
    
    // FR-055: If user hasn't clicked "Get Number" yet, reserve now before saving
    let actualOutNo = outNo;
    if (!isModifyMode && !isReserved) {
      try {
        const params = { folder_id: folderId };
        if (isTargetYearMode) params.target_year = targetYearVal;
        const reserveRes = await axios.get('/api/outward/next-no', { params });
        actualOutNo = reserveRes.data.outward_no;
        setOutNo(actualOutNo);
        setIsReserved(true);
      } catch (e) {
        if (e.response && e.response.status === 400) {
          setErrorMsg(e.response.data.detail);
        } else {
          setErrorMsg('Failed to reserve Outward number before saving.');
        }
        return;
      }
    }

    const payload = {
      outward_no: actualOutNo,
      folder_id: folderId,
      issuing_date: dateVal,
      address_to: [addressTo],
      cc_to: ccList,
      subject: subject,
      remarks: remarks,
      prepared_by: preparedBy,
      actioned_by: user.user_id,
      template_type: templateType,
      linked_documents: linkedDocuments,
      target_year: isTargetYearMode ? targetYearVal : undefined
    };

    try {
      if (isModifyMode) {
        // FR-044: Save updates in Modify Mode
        await axios.put(`/api/outward/modify/${folder_id}/${year}/${outward_no}`, payload);
        setSuccessMsg(`Outward No. ${outward_no} modified successfully.`);
      } else {
        // FR-042: Save Draft
        const response = await axios.post('/api/outward/draft', payload);
        if (attachmentFiles.length > 0) {
          const fileData = new FormData();
          attachmentFiles.forEach(file => fileData.append('files', file));
          await axios.post(`/api/outward/drafts/${response.data.draft_id}/attachments`, fileData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        setSuccessMsg(`Draft document for Outward No. ${response.data.outward_no} generated successfully.`);
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

      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {isTargetYearMode && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Previous Year Entry Mode</strong> - You are composing a draft for a previous year.
              <TextField
                select
                size="small"
                value={targetYearVal}
                onChange={(e) => {
                  setTargetYearVal(e.target.value);
                  setIsReserved(false);
                  setOutNo('');
                }}
                sx={{ ml: 2, minWidth: 100 }}
              >
                {[...Array(10)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <MenuItem key={y} value={y}>{y}</MenuItem>;
                })}
              </TextField>
            </Alert>
          )}
          <Grid container spacing={3}>
            {/* Outward Number - Read Only */}
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label={isReserved || isModifyMode ? 'Outward No.' : 'Outward No.'}
                  value={outNo || 'Pending...'}
                  InputProps={{ readOnly: true }}
                  disabled={isModifyMode}
                  helperText={!isModifyMode && !isReserved ? 'Click "Get Number" to assign' : ''}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 700,
                      color: isReserved || isModifyMode ? '#2e7d32' : '#b0b0b0',
                      fontSize: '1.1rem'
                    }
                  }}
                />
                {!isModifyMode && !isReserved && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={reserveOutwardNo}
                    sx={{ 
                      minWidth: 110, 
                      height: 40, 
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Get Number
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Date Picker (FR-033) */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Date of Document"
                value={dateVal}
                onChange={(e) => handleDocumentDateChange(e.target.value)}
                onBlur={(e) => handleDocumentDateChange(e.target.value)}
                inputProps={{
                  min: MIN_DOCUMENT_DATE,
                  max: todayIsoDate(),
                  step: 1
                }}
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
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id.toString()}>{t.name} ({t.template_type})</MenuItem>
                ))}
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
                <Card variant="outlined" sx={{ bgcolor: '#F8F9FA', border: '1px solid #E8EAED', borderRadius: 2 }}>
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
              <Box sx={{ border: '1px solid #E8EAED', borderRadius: 2, p: 2 }}>
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

            {/* Linked Documents Autocomplete (FR-171) */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={availableDocuments}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    const doc = availableDocuments.find(d => d.id === option);
                    if (doc) return `${doc.type.toUpperCase()}: ${doc.subject} (${doc.id})`;
                    return option;
                  }
                  return `${option.type.toUpperCase()}: ${option.subject} (${option.id})`;
                }}
                value={linkedDocuments.map(id => availableDocuments.find(d => d.id === id) || id)}
                onChange={(event, newValue) => {
                  setLinkedDocuments(newValue.map(v => typeof v === 'string' ? v : v.id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Link to existing Documents"
                    placeholder="Search by ID, Subject, Name"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {option.type.toUpperCase()} - {option.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.subject} | {option.folder_name} | {option.date}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
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

            {/* Supporting Uploads (FR-170b) */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid #E8EAED', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Supporting Files
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Attach PDF, PPT, DOC, XLS, or image files to this draft.
                    </Typography>
                  </Box>
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                    Add Files
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => setAttachmentFiles([...attachmentFiles, ...Array.from(e.target.files || [])])}
                    />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attachmentFiles.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No supporting files selected.
                    </Typography>
                  ) : (
                    attachmentFiles.map((file, idx) => (
                      <Chip
                        key={`${file.name}-${idx}`}
                        label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                        onDelete={() => setAttachmentFiles(attachmentFiles.filter((_, i) => i !== idx))}
                        color="secondary"
                        variant="outlined"
                      />
                    ))
                  )}
                </Box>
              </Box>
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
