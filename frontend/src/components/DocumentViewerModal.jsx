import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import * as docx from 'docx-preview';

export default function DocumentViewerModal({ open, onClose, fileUrl, fileName, isPdf }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [fileBlob, setFileBlob] = useState(null);
  
  const containerRef = useRef(null);
  const isDocx = fileName?.toLowerCase().endsWith('.docx');

  useEffect(() => {
    if (!open || !fileUrl) {
      setBlobUrl('');
      setFileBlob(null);
      return;
    }

    let isMounted = true;
    const fetchDocument = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await axios.get(fileUrl, { responseType: 'blob' });
        if (!isMounted) return;
        
        const blob = new Blob([response.data], { 
          type: isPdf ? 'application/pdf' : 
                isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                'application/octet-stream' 
        });
        
        setFileBlob(blob);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        if (isMounted) setErrorMsg('Failed to load document. It may be missing or access is denied.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [open, fileUrl, isPdf, isDocx]);

  useEffect(() => {
    if (isDocx && fileBlob && containerRef.current) {
      try {
        docx.renderAsync(fileBlob, containerRef.current)
          .catch(err => {
            console.error("docx-preview error:", err);
            setErrorMsg("Failed to render DOCX file.");
          });
      } catch (err) {
        console.error("docx render exception:", err);
      }
    }
  }, [isDocx, fileBlob, containerRef]);

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {fileName}
        </Typography>
        <IconButton onClick={onClose} aria-label="close viewer">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && errorMsg && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error">{errorMsg}</Typography>
          </Box>
        )}
        
        {!loading && !errorMsg && blobUrl && (
          <>
            {isPdf ? (
              <Box
                component="iframe"
                src={blobUrl}
                title={fileName}
                sx={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : isDocx ? (
              <Box 
                ref={containerRef} 
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  overflowY: 'auto',
                  bgcolor: '#f5f5f5' // docx-preview adds white pages on top of background
                }} 
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Preview not available for this file format.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Please download the file to view its contents.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                >
                  Download {fileName}
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        {blobUrl && (
          <Button onClick={handleDownload} startIcon={<DownloadIcon />} color="primary">
            Download
          </Button>
        )}
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
