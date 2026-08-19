import React, { useEffect, useState } from 'react';
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
import mammoth from 'mammoth';

// FR-059: Helper to strip RTF control codes into plain text for legacy .doc/.rtf previews
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

// FR-059: DocumentViewerModal — previews PDF, .docx, and legacy .doc/.rtf files in-browser
export default function DocumentViewerModal({ open, onClose, fileUrl, fileName, isPdf }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [docxHtml, setDocxHtml] = useState('');
  const [legacyPreviewText, setLegacyPreviewText] = useState('');

  const isDocx = /\.docx$/i.test(fileName || '');
  const isLegacyWord = /\.(doc|rtf)$/i.test(fileName || '') && !isDocx;

  useEffect(() => {
    if (!open || !fileUrl) {
      setBlobUrl('');
      setDocxHtml('');
      setLegacyPreviewText('');
      return;
    }

    let isMounted = true;
    const fetchDocument = async () => {
      setLoading(true);
      setErrorMsg('');
      setDocxHtml('');
      setLegacyPreviewText('');
      try {
        // FR-059: Fetch the file as binary blob from the backend
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        if (!isMounted) return;

        const arrayBuffer = response.data;

        if (isPdf) {
          // FR-059: PDF — render via iframe using blob URL
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          setBlobUrl(URL.createObjectURL(blob));
        } else if (isDocx) {
          // FR-059: .docx — convert to styled HTML using mammoth.js for in-browser preview
          const result = await mammoth.convertToHtml(
            { arrayBuffer: arrayBuffer },
            {
              styleMap: [
                "p[style-name='Title'] => h1:fresh",
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh"
              ]
            }
          );
          if (isMounted) {
            setDocxHtml(result.value);
            // Also create a blob URL for the download button
            const blob = new Blob([arrayBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            setBlobUrl(URL.createObjectURL(blob));
          }
        } else if (isLegacyWord) {
          // FR-059: Legacy .doc/.rtf — attempt plain-text extraction from RTF header
          const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
          setBlobUrl(URL.createObjectURL(blob));
          const documentText = await blob.text();
          if (documentText.startsWith('{\\rtf')) {
            setLegacyPreviewText(rtfToPlainText(documentText));
          }
        } else {
          // FR-059: Unknown format — just provide download
          const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
          setBlobUrl(URL.createObjectURL(blob));
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

  // FR-059: Download the file to the user's PC
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

        {/* FR-059: PDF preview via embedded iframe */}
        {!loading && !errorMsg && isPdf && blobUrl && (
          <Box
            component="iframe"
            src={blobUrl}
            title={fileName}
            sx={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}

        {/* FR-059: .docx preview rendered as styled HTML by mammoth.js */}
        {!loading && !errorMsg && isDocx && docxHtml && (
          <Box sx={{ flex: 1, overflow: 'auto', p: 4, bgcolor: '#e0e0e0', display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: '210mm',
                minHeight: '297mm',
                bgcolor: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                p: '1.5cm 2.5cm 2cm 2.5cm',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Simulated HAL Letterhead Header */}
              <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '1px solid #003366', pb: 2 }}>
                <img src="/images/hal_logo.jpg" alt="HAL Logo" style={{ width: '60px', marginBottom: '8px' }} />
                <Typography sx={{ fontFamily: 'Arial', fontWeight: 'bold', fontSize: '16pt', color: '#003366', lineHeight: 1 }}>
                  HINDUSTAN AERONAUTICS LIMITED
                </Typography>
                <Typography sx={{ fontFamily: 'Arial', fontSize: '10pt', color: '#505050', mt: 0.5 }}>
                  Aircraft Research &amp; Design Centre, Nashik Division
                </Typography>
              </Box>

              {/* Document Body (Mammoth Output) */}
              <Box
            sx={{
                flex: 1,
                // Style the mammoth-generated HTML to look like a printed document
              '& h1': {
                fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
                fontSize: '22pt',
                fontWeight: 700,
                color: '#1F3864',
                borderBottom: '2px solid #4472C4',
                paddingBottom: '8px',
                marginBottom: '12px'
              },
              '& h2': {
                fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
                fontSize: '16pt',
                fontWeight: 600,
                color: '#2E75B6'
              },
              '& h3': {
                fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
                fontSize: '13pt',
                fontWeight: 600,
                color: '#4472C4'
              },
              '& p': {
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '12pt',
                lineHeight: 1.8,
                color: '#1a1a1a',
                marginBottom: '6px'
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                margin: '12px 0',
                fontFamily: '"Calibri", Arial, sans-serif',
                fontSize: '10pt'
              },
              '& td, & th': {
                border: '1px solid #8DB4E2',
                padding: '6px 10px'
              },
              '& img': {
                maxWidth: '200px',
                height: 'auto'
              }
            }}
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />

              {/* Simulated HAL Letterhead Footer */}
              <Box sx={{ textAlign: 'center', mt: 'auto', pt: 2, borderTop: '1px solid #003366' }}>
                <Typography sx={{ fontFamily: 'Arial', fontSize: '7pt', color: '#787878' }}>
                  HAL AURDC, Ojhar Township, Nashik — 422 207, Maharashtra, India  |  Phone: 0253-2384000  |  www.hal-india.co.in
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* FR-059: Legacy .doc/.rtf plain text preview */}
        {!loading && !errorMsg && !isPdf && !isDocx && legacyPreviewText && (
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
        )}

        {/* FR-059: Fallback for truly unsupported formats (e.g. raw binary .doc without RTF header) */}
        {!loading && !errorMsg && !isPdf && !isDocx && !legacyPreviewText && blobUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Preview not available for this file format.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This file cannot be rendered in the browser. Please download it to view in Microsoft Word.
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
