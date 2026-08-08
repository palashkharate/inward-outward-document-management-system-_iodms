import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import { Box, Paper, Typography, Divider } from '@mui/material';

export default function OnlineDocumentEditor({ initialData, onChange, readOnly = false }) {
  const editorInstance = useRef(null);
  const editorHolder = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorInstance.current && editorHolder.current) {
      editorInstance.current = new EditorJS({
        holder: editorHolder.current,
        data: initialData || { blocks: [] },
        readOnly,
        placeholder: 'Start typing your document body here...',
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a heading',
              levels: [2, 3, 4],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          }
        },
        onReady: () => {
          setIsReady(true);
        },
        onChange: async () => {
          if (onChange) {
            const data = await editorInstance.current.save();
            onChange(data);
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

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        variant="outlined" 
        sx={{ 
          minHeight: 400, 
          bgcolor: readOnly ? '#f9f9f9' : '#fff',
          p: 3,
          border: '1px solid #E8EAED',
          borderRadius: 2,
          '& .ce-block__content': {
            maxWidth: '100%',
            fontFamily: '"Times New Roman", Times, serif', // Official Defense font look
            fontSize: '1.1rem'
          }
        }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, borderBottom: '1px solid #E8EAED', pb: 1 }}>
          Document Body Editor
        </Typography>
        <Box ref={editorHolder} sx={{ width: '100%' }} />
      </Paper>
    </Box>
  );
}
