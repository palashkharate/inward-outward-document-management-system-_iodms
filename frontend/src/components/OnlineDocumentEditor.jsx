import React, { useEffect, useRef, useState, useCallback } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import Delimiter from '@editorjs/delimiter';
import { Box, Paper, Typography, IconButton, Tooltip, Divider, Chip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TitleIcon from '@mui/icons-material/Title';
import TableChartIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import HighlightIcon from '@mui/icons-material/Highlight';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

// FR-051: OnlineDocumentEditor — Word-like rich text editing experience
export default function OnlineDocumentEditor({ initialData, onChange, readOnly = false, letterMeta }) {
  const editorInstance = useRef(null);
  const editorHolder = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [blockCount, setBlockCount] = useState(0);

  // FR-051: Helper to count approximate words in the editor data
  const countWords = useCallback((data) => {
    if (!data || !data.blocks) return 0;
    let text = '';
    data.blocks.forEach(block => {
      if (block.data?.text) text += ' ' + block.data.text;
      if (block.data?.items) {
        block.data.items.forEach(item => {
          if (typeof item === 'string') text += ' ' + item;
          else if (item?.content) text += ' ' + item.content;
        });
      }
    });
    // Strip HTML tags for accurate count
    const plain = text.replace(/<[^>]*>/g, '').trim();
    return plain ? plain.split(/\s+/).length : 0;
  }, []);

  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!editorInstance.current && editorHolder.current) {
      editorInstance.current = new EditorJS({
        holder: editorHolder.current,
        data: initialData || { blocks: [] },
        readOnly,
        placeholder: 'Click here and start typing your document...',
        minHeight: 600,
        tools: {
          // FR-051: Header block — like Word's heading styles
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a heading',
              levels: [1, 2, 3, 4],
              defaultLevel: 2
            },
            shortcut: 'CMD+SHIFT+H'
          },
          // FR-051: Ordered and unordered lists
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            },
            shortcut: 'CMD+SHIFT+L'
          },
          // FR-051: Paragraph with inline formatting (Bold, Italic, etc.)
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            config: {
              preserveBlank: true
            }
          },
          // FR-051: Table support — like Word tables
          table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 3,
              cols: 3,
              withHeadings: true
            }
          },
          // FR-051: Text highlight (like Word's highlight marker)
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M'
          },
          // FR-051: Underline inline tool
          underline: {
            class: Underline,
            shortcut: 'CMD+U'
          },
          // FR-051: Horizontal rule divider (like Word's page break line)
          delimiter: {
            class: Delimiter
          }
        },
        onReady: () => {
          setIsReady(true);
          if (initialData) {
            setBlockCount(initialData.blocks?.length || 0);
            setWordCount(countWords(initialData));
          }
        },
        onChange: async (api) => {
          if (onChange && editorInstance.current) {
            try {
              const data = await editorInstance.current.save();
              onChange(data);
              setBlockCount(data.blocks?.length || 0);
              setWordCount(countWords(data));
            } catch (e) {
              // Editor may be destroyed during rapid changes
            }
          }
        }
      });
    }

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
        } catch (e) {
          console.error("Editor.js destroy error:", e);
        }
        editorInstance.current = null;
      }
    };
  }, [initialData, readOnly]);

  // FR-051: Toolbar button handler — executes browser commands for inline formatting
  const execCommand = (command) => {
    document.execCommand(command, false, null);
  };

  // FR-051: Insert a new block of a given type via Editor.js API
  const insertBlock = async (type) => {
    if (!editorInstance.current || readOnly) return;
    try {
      const currentIndex = editorInstance.current.blocks.getCurrentBlockIndex();
      // Insert after current block
      if (type === 'header') {
        await editorInstance.current.blocks.insert('header', { text: '', level: 2 }, {}, currentIndex + 1, true);
      } else if (type === 'list') {
        await editorInstance.current.blocks.insert('list', { style: 'unordered', items: [''] }, {}, currentIndex + 1, true);
      } else if (type === 'orderedList') {
        await editorInstance.current.blocks.insert('list', { style: 'ordered', items: [''] }, {}, currentIndex + 1, true);
      } else if (type === 'table') {
        await editorInstance.current.blocks.insert('table', { withHeadings: true, content: [['', '', ''], ['', '', ''], ['', '', '']] }, {}, currentIndex + 1, true);
      } else if (type === 'delimiter') {
        await editorInstance.current.blocks.insert('delimiter', {}, {}, currentIndex + 1, true);
      }
    } catch (e) {
      console.error("Insert block error:", e);
    }
  };

  // FR-051: Toolbar button component with tooltip
  const ToolbarButton = ({ icon, label, onClick, disabled = false }) => (
    <Tooltip title={label} arrow placement="bottom">
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled || readOnly}
          sx={{
            borderRadius: 1,
            color: '#444',
            '&:hover': {
              bgcolor: 'rgba(68, 114, 196, 0.12)',
              color: '#4472C4'
            },
            '&.Mui-disabled': {
              color: '#ccc'
            }
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  // FR-051: Vertical separator between toolbar groups
  const ToolbarSeparator = () => (
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#D5D8DC' }} />
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ===== TOOLBAR RIBBON (like Word's Home ribbon) ===== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 2,
          py: 1,
          bgcolor: '#F3F6F9',
          borderBottom: '1px solid #D5D8DC',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        {/* Document icon + mode label */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
          {readOnly ? (
            <Chip
              icon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
              label="Read Only"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          ) : (
            <Chip
              icon={<EditIcon sx={{ fontSize: '1rem' }} />}
              label="Editing"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        <ToolbarSeparator />

        {/* Undo / Redo */}
        <ToolbarButton icon={<UndoIcon fontSize="small" />} label="Undo (Ctrl+Z)" onClick={() => execCommand('undo')} />
        <ToolbarButton icon={<RedoIcon fontSize="small" />} label="Redo (Ctrl+Y)" onClick={() => execCommand('redo')} />

        <ToolbarSeparator />

        {/* Text Formatting Group */}
        <ToolbarButton icon={<FormatBoldIcon fontSize="small" />} label="Bold (Ctrl+B)" onClick={() => execCommand('bold')} />
        <ToolbarButton icon={<FormatItalicIcon fontSize="small" />} label="Italic (Ctrl+I)" onClick={() => execCommand('italic')} />
        <ToolbarButton icon={<FormatUnderlinedIcon fontSize="small" />} label="Underline (Ctrl+U)" onClick={() => execCommand('underline')} />
        <ToolbarButton icon={<HighlightIcon fontSize="small" />} label="Highlight Text" onClick={() => execCommand('hiliteColor')} />

        <ToolbarSeparator />

        {/* Insert Blocks Group */}
        <ToolbarButton icon={<TitleIcon fontSize="small" />} label="Insert Heading" onClick={() => insertBlock('header')} />
        <ToolbarButton icon={<FormatListBulletedIcon fontSize="small" />} label="Bullet List" onClick={() => insertBlock('list')} />
        <ToolbarButton icon={<FormatListNumberedIcon fontSize="small" />} label="Numbered List" onClick={() => insertBlock('orderedList')} />
        <ToolbarButton icon={<TableChartIcon fontSize="small" />} label="Insert Table" onClick={() => insertBlock('table')} />
        <ToolbarButton icon={<HorizontalRuleIcon fontSize="small" />} label="Insert Divider" onClick={() => insertBlock('delimiter')} />
      </Box>

      {/* ===== DOCUMENT PAGE AREA (A4 paper simulation) ===== */}
      <Box
        sx={{
          bgcolor: '#E8EAED',
          display: 'flex',
          justifyContent: 'center',
          py: 4,
          px: 2,
          minHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: '100%',
            maxWidth: 816, // ~8.5 inches at 96 DPI (A4-ish)
            minHeight: 1056, // ~11 inches at 96 DPI
            bgcolor: readOnly ? '#FAFAFA' : '#FFFFFF',
            px: { xs: 4, sm: 8 }, // ~1 inch margins
            py: { xs: 4, sm: 6 }, // ~0.75 inch top/bottom
            borderRadius: 0.5,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            position: 'relative',
            // --- Editor.js content styling to look like Word ---
            '& .codex-editor': {
              fontFamily: '"Times New Roman", Times, "Noto Serif", serif',
              fontSize: '12pt',
              lineHeight: 1.6,
              color: '#1a1a1a'
            },
            '& .ce-block__content': {
              maxWidth: '100%',
              margin: 0,
              padding: 0,
            },
            '& .ce-toolbar__content': {
              maxWidth: '100%',
            },
            '& .ce-toolbar__plus': {
              left: -40,
              color: '#4472C4'
            },
            '& .ce-toolbar__actions': {
              right: -40,
            },
            // Paragraph blocks
            '& .ce-paragraph': {
              fontFamily: '"Times New Roman", Times, "Noto Serif", serif',
              fontSize: '12pt',
              lineHeight: 1.8,
              padding: '4px 0',
              color: '#1a1a1a'
            },
            // Heading blocks styled like Word headings
            '& .ce-header': {
              fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
              color: '#1F3864',
              padding: '8px 0 4px 0',
              borderBottom: 'none',
            },
            '& h1.ce-header': {
              fontSize: '22pt',
              fontWeight: 700,
              borderBottom: '2px solid #4472C4',
              paddingBottom: 8,
              marginBottom: 8,
            },
            '& h2.ce-header': {
              fontSize: '16pt',
              fontWeight: 600,
              color: '#2E75B6'
            },
            '& h3.ce-header': {
              fontSize: '13pt',
              fontWeight: 600,
              color: '#4472C4'
            },
            '& h4.ce-header': {
              fontSize: '12pt',
              fontWeight: 600,
              fontStyle: 'italic',
              color: '#4472C4'
            },
            // List items
            '& .cdx-list': {
              fontFamily: '"Times New Roman", Times, "Noto Serif", serif',
              fontSize: '12pt',
              lineHeight: 1.8,
              paddingLeft: 24,
            },
            '& .cdx-list__item': {
              padding: '2px 0',
            },
            // Tables styled like Word tables
            '& .tc-table': {
              borderCollapse: 'collapse',
              width: '100%',
              fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
              fontSize: '10pt',
            },
            '& .tc-table td, & .tc-table th': {
              border: '1px solid #8DB4E2',
              padding: '6px 10px',
            },
            '& .tc-row--heading': {
              backgroundColor: '#4472C4',
              color: '#fff',
              fontWeight: 600,
            },
            '& .tc-row--heading .tc-cell': {
              color: '#fff',
            },
            // Delimiter
            '& .ce-delimiter': {
              lineHeight: '1.6em',
              '&::before': {
                content: '"• • •"',
                color: '#999',
                letterSpacing: '0.3em',
              }
            },
            // Highlight marker
            '& .cdx-marker': {
              backgroundColor: '#FFFF00',
              padding: '2px 0',
            },
            // Placeholder text
            '& .ce-paragraph[data-placeholder]::before': {
              color: '#B0B0B0',
              fontStyle: 'italic',
            },
            // Remove the default bottom border on blocks
            '& .ce-block': {
              padding: '2px 0',
            },
          }}
        >
          {/* FR-051: Document letterhead context */}
          {letterMeta && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box component="img" src="/images/hal_logo.jpg" alt="HAL Logo" sx={{ height: 40, mr: 2 }} />
                <Box>
                  <Typography sx={{ color: '#003366', fontWeight: 'bold', fontSize: '16px', lineHeight: 1.2 }}>
                    HINDUSTAN AERONAUTICS LIMITED
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '11px', lineHeight: 1 }}>
                    Aircraft Research & Design Centre, Nashik Division
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ borderBottom: '2px solid #003366', mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontSize: '10pt' }}><strong>Ref:</strong> {letterMeta.outwardReference}</Typography>
                <Typography sx={{ fontSize: '10pt' }}><strong>Date:</strong> {letterMeta.date}</Typography>
              </Box>
              <Typography sx={{ fontSize: '12pt', whiteSpace: 'pre-line', mb: 2 }}>
                To,{"\n"}{letterMeta.addressToText}
              </Typography>
              <Typography sx={{ fontSize: '12pt', fontWeight: 'bold', mb: 2 }}>
                Sub: {letterMeta.subject}
              </Typography>
              <Typography sx={{ fontSize: '12pt', mb: 2 }}>
                Sir / Madam,
              </Typography>
            </Box>
          )}

          {/* The actual Editor.js mount point */}
          <Box ref={editorHolder} sx={{ width: '100%', minHeight: 400 }} />

          {/* FR-051: Document signature context */}
          {letterMeta && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                {letterMeta.ccText && (
                  <Typography sx={{ fontSize: '12pt', whiteSpace: 'pre-line' }}>
                    CC: {letterMeta.ccText}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'left', minWidth: 250 }}>
                <Typography sx={{ fontSize: '12pt', mb: 4 }}>Yours faithfully,</Typography>
                <Typography sx={{ fontSize: '12pt' }}>{letterMeta.preparedBy}</Typography>
                <Typography sx={{ fontSize: '12pt' }}>For General Manager</Typography>
                <Typography sx={{ fontSize: '12pt' }}>HAL, AURDC Nashik</Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ===== STATUS BAR (like Word's bottom bar) ===== */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          bgcolor: '#2B579A',
          color: '#fff',
          fontSize: '0.72rem',
          fontFamily: '"Segoe UI", "Calibri", Arial, sans-serif'
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <span>Blocks: {blockCount}</span>
          <span>Words: {wordCount}</span>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span>{readOnly ? '🔒 VIEW ONLY' : '✏️ EDITING'}</span>
          <span>IODMS Document Editor</span>
        </Box>
      </Box>
    </Box>
  );
}
