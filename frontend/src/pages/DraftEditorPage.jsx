import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../App.jsx';
import OnlineDocumentEditor from '../components/OnlineDocumentEditor.jsx';

export default function DraftEditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { draft_id } = useParams();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [documentBody, setDocumentBody] = useState({ blocks: [] });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [lockedByOther, setLockedByOther] = useState(null);

  // We need to keep a ref to the lock status to unlock on unmount if we own it
  const isLockOwner = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDraftAndLock = async () => {
      try {
        const response = await axios.get(`/api/outward/drafts/${draft_id}`);
        const data = response.data;
        if (!isMounted) return;

        setDraft(data);
        setDocumentBody(data.document_body || { blocks: [] });

        if (data.is_locked && data.locked_by !== user?.user_id) {
          // Locked by someone else
          setIsReadOnly(true);
          setLockedByOther(data.locked_by);
        } else {
          // It's either locked by us already, or not locked.
          // If not locked, or locked by us, we establish ownership of the lock.
          // The lock endpoint will just succeed if we already hold it.
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

    return () => {
      isMounted = false;
      // Auto-unlock if we are leaving the page and we own the lock
      if (isLockOwner.current) {
        axios.put(`/api/outward/drafts/${draft_id}/unlock`).catch(() => {
          // Silent catch on unmount
        });
      }
    };
  }, [draft_id, user?.user_id]);

  const handleSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await axios.put(`/api/outward/drafts/${draft_id}`, {
        ...draft,
        document_body: documentBody
      });
      setSuccessMsg('Changes saved successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save changes.');
    }
  };

  const handleGoBack = () => {
    navigate('/drafts');
  };

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
    <Box sx={{ width: '100%', maxWidth: 1000, mt: 2, mx: 'auto' }}>
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
            Edit Draft: {draft.subject || 'Untitled'}
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
            Save Document
          </Button>
        )}
      </Box>

      {isReadOnly && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>View-Only Mode:</strong> User <strong>{lockedByOther}</strong> is currently editing this document. You cannot make changes until they release the lock.
        </Alert>
      )}

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      <Paper elevation={3} sx={{ p: 0, borderRadius: 3, overflow: 'hidden' }}>
        <OnlineDocumentEditor
          initialData={documentBody}
          onChange={setDocumentBody}
          readOnly={isReadOnly}
        />
      </Paper>
    </Box>
  );
}
