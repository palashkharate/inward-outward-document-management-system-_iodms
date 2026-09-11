import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  ButtonGroup,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
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

// FR-059: DocumentViewerModal — previews PDF, images (PNG/JPG/JPEG/WEBP/GIF/BMP/SVG), .docx, and legacy files in-browser
export default function DocumentViewerModal({ open, onClose, fileUrl, fileName, isPdf }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [docxHtml, setDocxHtml] = useState('');
  const [legacyPreviewText, setLegacyPreviewText] = useState('');
  
  // Image viewer controls (Zoom & Rotate)
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const cleanFileName = fileName || '';
  const isDocx = /\.docx$/i.test(cleanFileName);
  const isLegacyWord = /\.(doc|rtf)$/i.test(cleanFileName) && !isDocx;
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|tiff?)$/i.test(cleanFileName);
  const isPdfDoc = Boolean(isPdf) || /\.pdf$/i.test(cleanFileName);
  const isPlainText = /\.txt$/i.test(cleanFileName);

  useEffect(() => {
    if (!open || !fileUrl) {
      setBlobUrl('');
      setDocxHtml('');
      setLegacyPreviewText('');
      setZoomScale(1);
      setRotation(0);
      return;
    }

    let isMounted = true;
    const fetchDocument = async () => {
      setLoading(true);
      setErrorMsg('');
      setDocxHtml('');
      setLegacyPreviewText('');
      setZoomScale(1);
      setRotation(0);
      try {
        // FR-059: Fetch the file as binary blob from the backend
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        if (!isMounted) return;

        const arrayBuffer = response.data;

        if (isPdfDoc) {
          // FR-059: PDF — render via iframe using blob URL
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          setBlobUrl(URL.createObjectURL(blob));
        } else if (isImage) {
          // FR-059: Scanned images and photos (PNG, JPG, JPEG, WEBP, etc.)
          let imgType = 'image/png';
          const lower = cleanFileName.toLowerCase();
          if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) imgType = 'image/jpeg';
          else if (lower.endsWith('.gif')) imgType = 'image/gif';
          else if (lower.endsWith('.webp')) imgType = 'image/webp';
          else if (lower.endsWith('.bmp')) imgType = 'image/bmp';
          else if (lower.endsWith('.svg')) imgType = 'image/svg+xml';
          else if (lower.endsWith('.tif') || lower.endsWith('.tiff')) imgType = 'image/tiff';

          const blob = new Blob([arrayBuffer], { type: imgType });
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
        } else if (isPlainText) {
          const blob = new Blob([arrayBuffer], { type: 'text/plain;charset=utf-8' });
          setBlobUrl(URL.createObjectURL(blob));
          const textContent = await blob.text();
          setLegacyPreviewText(textContent);
        } else {
          // FR-059: Unknown format — provide direct download
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
  }, [open, fileUrl, cleanFileName, isPdfDoc, isDocx, isLegacyWord, isImage, isPlainText]);

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

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isImage && <ImageIcon color="primary" />}
          {isPdfDoc && <PictureAsPdfIcon color="error" />}
          {(isDocx || isLegacyWord) && <DescriptionIcon color="info" />}
          <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {fileName}
          </Typography>
          {isImage && <Chip label="Image / Scanned Copy" size="small" color="primary" variant="outlined" />}
          {isPdfDoc && <Chip label="PDF Document" size="small" color="error" variant="outlined" />}
          {isDocx && <Chip label="Word Document" size="small" color="info" variant="outlined" />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Image Zoom and Rotation Controls */}
          {isImage && blobUrl && (
            <ButtonGroup size="small" variant="outlined" sx={{ mr: 1 }}>
              <Tooltip title="Zoom Out">
                <IconButton size="small" onClick={handleZoomOut} disabled={zoomScale <= 0.5}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button size="small" onClick={handleResetZoom} sx={{ px: 1, minWidth: '50px', fontSize: '0.75rem' }}>
                {Math.round(zoomScale * 100)}%
              </Button>
              <Tooltip title="Zoom In">
                <IconButton size="small" onClick={handleZoomIn} disabled={zoomScale >= 3}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate 90°">
                <IconButton size="small" onClick={handleRotate}>
                  <RotateRightIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset View">
                <IconButton size="small" onClick={handleResetZoom}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          )}
          <IconButton onClick={onClose} aria-label="close viewer" size="small">
            <CloseIcon />
          </IconButton>
        </Box>
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
        {!loading && !errorMsg && isPdfDoc && blobUrl && (
          <Box
            component="iframe"
            src={blobUrl}
            title={fileName}
            sx={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}

        {/* FR-059: Scanned Image preview with zoom & rotation */}
        {!loading && !errorMsg && isImage && blobUrl && (
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: '#1a1d24',
              minHeight: '400px',
              userSelect: 'none'
            }}
          >
            <Box
              component="img"
              src={blobUrl}
              alt={fileName}
              sx={{
                maxWidth: '95%',
                maxHeight: '95%',
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                objectFit: 'contain',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                borderRadius: 1,
                bgcolor: '#ffffff'
              }}
            />
          </Box>
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

        {/* FR-059: Legacy .doc/.rtf or plain text preview */}
        {!loading && !errorMsg && !isPdfDoc && !isDocx && !isImage && legacyPreviewText && (
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

        {/* FR-059: Fallback for unsupported binary formats */}
        {!loading && !errorMsg && !isPdfDoc && !isDocx && !isImage && !legacyPreviewText && blobUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Preview not available for this file format.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This file cannot be rendered in the browser. Please download it to view in Microsoft Office or its native application.
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
