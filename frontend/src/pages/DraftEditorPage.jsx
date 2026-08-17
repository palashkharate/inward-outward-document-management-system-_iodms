import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Divider,
  Collapse,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SubjectIcon from '@mui/icons-material/Subject';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '../App.jsx';
import OnlineDocumentEditor from '../components/OnlineDocumentEditor.jsx';

// FR-051: DraftEditorPage — Full draft editing with metadata + document body editor
export default function DraftEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { draft_id } = useParams();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [documentBody, setDocumentBody] = useState({ blocks: [] });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [lockedByOther, setLockedByOther] = useState(null);

  // FR-051: Editable draft metadata fields
  const [subject, setSubject] = useState('');
  const [remarks, setRemarks] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [addressTo, setAddressTo] = useState('');
  const [addressGroup, setAddressGroup] = useState('');
  const [ccList, setCcList] = useState([]);
  const [issuingDate, setIssuingDate] = useState('');

  // FR-051: Master data for dropdowns
  const [usersList, setUsersList] = useState([]);
  const [folderTypes, setFolderTypes] = useState([]);
  const [addressGroups, setAddressGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);

  // FR-051: UI state — collapsible metadata panel
  const [metadataExpanded, setMetadataExpanded] = useState(true);

  // FR-052: Lock ownership tracking
  const isLockOwner = useRef(false);

  // FR-051: Fetch master data for dropdowns
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [usersRes, foldersRes, groupsRes, addrRes, templatesRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/folder-types'),
          axios.get('/api/admin/address-groups'),
          axios.get('/api/admin/address-book?limit=1000'),
          axios.get('/api/admin/templates')
        ]);
        setUsersList(usersRes.data);
        setFolderTypes(foldersRes.data);
        setAddressGroups(groupsRes.data);
        setContacts(addrRes.data.results);
        setTemplates(templatesRes.data);
      } catch (e) {
        console.error('Failed to load master data', e);
      }
    };
    fetchMasterData();
  }, []);

  // FR-051, FR-052: Fetch draft data and acquire lock
  useEffect(() => {
    let isMounted = true;
    
    const fetchDraftAndLock = async () => {
      try {
        const response = await axios.get(`/api/outward/drafts/${draft_id}`);
        const data = response.data;
        if (!isMounted) return;

        setDraft(data);
        setDocumentBody(data.document_body || { blocks: [] });

        // FR-051: Pre-fill editable metadata from draft
        setSubject(data.subject || '');
        setRemarks(data.remarks || '');
        setPreparedBy(data.prepared_by || '');
        setFolderId(data.folder_id || '');
        setTemplateType(data.template_type || '');
        setIssuingDate(data.issuing_date || '');
        setCcList(data.cc_to || []);

        // FR-051: Resolve primary address contact to get group
        if (data.address_to?.length > 0) {
          setAddressTo(data.address_to[0]);
          // Try to find the contact's group
          try {
            const addrRes = await axios.get('/api/admin/address-book?limit=1000');
            const allContacts = addrRes.data.results;
            const primaryContact = allContacts.find(c => c.address_id === data.address_to[0]);
            if (primaryContact) {
              setAddressGroup(primaryContact.address_group);
            }
          } catch (e) { /* silent */ }
        }

        // FR-051: Resolve folder name
        try {
          const foldersRes = await axios.get('/api/admin/folder-types');
          const folder = foldersRes.data.find(f => f.folder_id === data.folder_id);
          if (folder) setFolderName(folder.folder_name);
        } catch (e) { /* silent */ }

        // FR-052: Handle locking
        if (data.is_locked && data.locked_by !== user?.user_id) {
          setIsReadOnly(true);
          setLockedByOther(data.locked_by);
        } else {
          await axios.put(`/api/outward/drafts/${draft_id}/lock`);
          isLockOwner.current = true;
        }
      } catch (err) {
        if (isMounted) setErrorMsg('Failed to load draft for editing.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDraftAndLock();

    // FR-053: Auto-unlock on page exit
    return () => {
      isMounted = false;
      if (isLockOwner.current) {
        axios.put(`/api/outward/drafts/${draft_id}/unlock`).catch(() => {});
      }
    };
  }, [draft_id, user?.user_id]);

  // FR-051: Save all draft fields + document body
  const handleSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const payload = {
        folder_id: folderId,
        issuing_date: issuingDate,
        address_to: addressTo ? [addressTo] : [],
        cc_to: ccList,
        subject: subject,
        remarks: remarks,
        prepared_by: preparedBy,
        actioned_by: user?.user_id,
        template_type: templateType,
        linked_documents: draft?.linked_documents || [],
        document_body: documentBody
      };
      await axios.put(`/api/outward/drafts/${draft_id}`, payload);
      setSuccessMsg('Draft saved successfully.');
      setHasUnsavedChanges(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save changes.');
    }
  };

  // FR-051: Back navigation with unsaved changes guard
  const handleGoBack = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    navigate('/drafts');
  };

  // FR-051: Get display text for the To address
  const getAddressToDisplayText = () => {
    if (!addressTo) return '';
    const contact = contacts.find(c => c.address_id === addressTo);
    if (!contact) return '';
    return [contact.name, contact.designation, contact.organisation, contact.address_line_1, contact.address_line_2].filter(Boolean).join('\n');
  };

  // FR-051: Get display text for CC recipients
  const getCcDisplayText = () => {
    if (!ccList || ccList.length === 0) return '';
    return ccList.map(id => {
      const c = contacts.find(ct => ct.address_id === id);
      return c ? c.name : '';
    }).filter(Boolean).join(', ');
  };

  // FR-051: Helper — mark form as dirty when any field changes
  const markDirty = () => setHasUnsavedChanges(true);

  // FR-037: Filter contacts by selected Address Group
  const filteredContacts = contacts.filter(c => c.address_group === addressGroup);

  // FR-039: Selected contact details
  const selectedContactDetails = contacts.find(c => c.address_id === addressTo);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!draft) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Alert severity="error">Draft not found or you do not have permission to access it.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mt: 2 }}>
          Back to Drafts
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mt: 2, mx: 'auto', px: 2 }}>
      {/* FR-051: Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
          >
            Back
          </Button>
          <Typography variant="h5" fontWeight={800}>
            Edit Draft: {subject || 'Untitled'}
          </Typography>
        </Box>

        {!isReadOnly && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            size="large"
          >
            Save All Changes
          </Button>
        )}
      </Box>

      {/* FR-052: Read-only lock warning */}
      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>View-Only Mode:</strong> User <strong>{lockedByOther}</strong> is currently editing this document. You cannot make changes until they release the lock.
        </Alert>
      )}

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* ===== COLLAPSIBLE METADATA PANEL ===== */}
      <Card sx={{ mb: 3, border: '1px solid #D5D8DC', borderRadius: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: 3, py: 1.5,
            bgcolor: '#F3F6F9',
            cursor: 'pointer',
            borderBottom: metadataExpanded ? '1px solid #D5D8DC' : 'none'
          }}
          onClick={() => setMetadataExpanded(!metadataExpanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: '#4472C4', fontSize: '1.2rem' }} />
            <Typography variant="subtitle1" fontWeight={700} color="#2B579A">
              Document Details
            </Typography>
            <Chip 
              label={isReadOnly ? "View Only" : "Editable"} 
              size="small" 
              color={isReadOnly ? "warning" : "success"} 
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 22 }}
            />
          </Box>
          <IconButton size="small">
            {metadataExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={metadataExpanded}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>

              {/* FR-033: Date */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Document"
                  value={issuingDate}
                  onChange={(e) => { setIssuingDate(e.target.value); markDirty(); }}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                />
              </Grid>

              {/* FR-032: Prepared By */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Prepared By"
                  value={preparedBy}
                  onChange={(e) => { setPreparedBy(e.target.value); markDirty(); }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                >
                  {usersList.map((u) => (
                    <MenuItem key={u.user_id} value={u.user_id}>
                      {u.name} ({u.user_id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* FR-034: Folder ID */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Folder"
                  value={folderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFolderId(id);
                    const found = folderTypes.find(f => f.folder_id === id);
                    if (found) setFolderName(found.folder_name);
                    markDirty();
                  }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                >
                  {folderTypes.map((f) => (
                    <MenuItem key={f.folder_id} value={f.folder_id}>
                      {f.folder_id} — {f.folder_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* FR-036: Template */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Template"
                  value={templateType}
                  onChange={(e) => { setTemplateType(e.target.value); markDirty(); }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                >
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id.toString()}>{t.name} ({t.template_type})</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* FR-031: Subject */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Subject"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); markDirty(); }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                />
              </Grid>

              {/* FR-037: Address Group */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Address Group"
                  value={addressGroup}
                  onChange={(e) => {
                    setAddressGroup(e.target.value);
                    setAddressTo('');
                    markDirty();
                  }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                >
                  <MenuItem value="">-- Select Group --</MenuItem>
                  {addressGroups.map((g) => (
                    <MenuItem key={g.group_id} value={g.group_name}>
                      {g.group_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* FR-038: Address To */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Address To"
                  value={addressTo}
                  onChange={(e) => { setAddressTo(e.target.value); markDirty(); }}
                  disabled={!addressGroup}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                >
                  <MenuItem value="">-- Select Contact --</MenuItem>
                  {filteredContacts.map((c) => (
                    <MenuItem key={c.address_id} value={c.address_id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* FR-039: Selected Address Preview */}
              {selectedContactDetails && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="primary" fontWeight={600}>Delivery Address:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <strong>{selectedContactDetails.name}</strong>
                      {selectedContactDetails.designation && `, ${selectedContactDetails.designation}`}
                      {selectedContactDetails.organisation && ` — ${selectedContactDetails.organisation}`}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* FR-040: CC Recipients */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CC:</Typography>
                  {ccList.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">None</Typography>
                  ) : (
                    ccList.map(id => {
                      const c = contacts.find(item => item.address_id === id);
                      return <Chip key={id} label={c ? c.name : id} size="small" variant="outlined" />;
                    })
                  )}
                </Box>
              </Grid>

              {/* FR-041: Remarks */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks"
                  value={remarks}
                  onChange={(e) => { setRemarks(e.target.value); markDirty(); }}
                  InputProps={{ readOnly: isReadOnly }}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>

      {/* ===== DOCUMENT BODY EDITOR ===== */}
      <Paper elevation={3} sx={{ p: 0, borderRadius: 3, overflow: 'hidden' }}>
        <OnlineDocumentEditor
          initialData={documentBody}
          onChange={(data) => {
            setDocumentBody(data);
            setHasUnsavedChanges(true);
          }}
          readOnly={isReadOnly}
          letterMeta={{
            subject: subject,
            addressToText: getAddressToDisplayText(),
            ccText: getCcDisplayText(),
            preparedBy: preparedBy,
            date: issuingDate,
            outwardReference: `HAL/NK/D/DAE/${folderId}/${draft?.year || new Date().getFullYear()}/Pending Dispatch`
          }}
        />
      </Paper>
    </Box>
  );
}
