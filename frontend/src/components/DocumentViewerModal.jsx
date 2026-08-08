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

function rtfToPlainText(rtf) {
  return rtf
    .replace(/\\par[d]?\s?/g, '\n')
    .replace(/\\line\s?/g, '\n')
    .replace(/\\tab\s?/g, '\t')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\\\/g, '\\')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function DocumentViewerModal({ open, onClose, fileUrl, fileName, isPdf }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [docxBlob, setDocxBlob] = useState(null);
  const [legacyPreviewText, setLegacyPreviewText] = useState('');
  const docxPreviewRef = useRef(null);
  const isDocx = /\.docx$/i.test(fileName || '');
  const isLegacyWord = /\.(doc|rtf)$/i.test(fileName || '');
  
  useEffect(() => {
    if (!open || !fileUrl) {
      setBlobUrl('');
      setDocxBlob(null);
      setLegacyPreviewText('');
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
          type: isPdf ? 'application/pdf' : 'application/octet-stream' 
        });
        
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setDocxBlob(isDocx ? blob : null);

        if (isLegacyWord) {
          const documentText = await blob.text();
          if (documentText.startsWith('{\\rtf')) {
            setLegacyPreviewText(rtfToPlainText(documentText));
          } else {
            setLegacyPreviewText('');
          }
        } else {
          setLegacyPreviewText('');
        }
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
  }, [open, fileUrl, isPdf, isDocx, isLegacyWord]);

  useEffect(() => {
    if (!open || !isDocx || !docxBlob || !docxPreviewRef.current) return;

    let cancelled = false;
    const renderDocx = async () => {
      try {
        const { renderAsync } = await import('docx-preview');
        if (cancelled || !docxPreviewRef.current) return;
        docxPreviewRef.current.replaceChildren();
        await renderAsync(docxBlob, docxPreviewRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false
        });
      } catch (err) {
        if (!cancelled) setErrorMsg('Failed to preview this Word document. You can still download it.');
      }
    };

    renderDocx();
    return () => { cancelled = true; };
  }, [open, isDocx, docxBlob]);

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
              <Box ref={docxPreviewRef} sx={{ flex: 1, overflow: 'auto', bgcolor: '#f0f0f0', p: 2 }} />
            ) : legacyPreviewText ? (
              <Box
                component="pre"
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  m: 0,
                  p: 4,
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  bgcolor: '#fff',
                  color: '#111'
                }}
              >
                {legacyPreviewText}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Preview not available for this file format.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  This file is a binary Microsoft Word document. Please download it to view its contents in Microsoft Word.
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
