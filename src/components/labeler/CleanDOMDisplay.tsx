import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';

interface DOMElement {
  tag: string;
  text: string;
  children?: DOMElement[];
}

interface DOMChunk {
  context: string;
  elements: DOMElement[];
}

interface CleanDOMDisplayProps {
  chunks?: DOMChunk[];
}

export function CleanDOMDisplay({ chunks }: CleanDOMDisplayProps) {
  if (!chunks) return null;

  const renderElement = (element: DOMElement, depth: number = 0): JSX.Element => {
    const indent = '  '.repeat(depth);
    return (
      <Box component="span" sx={{ display: 'block', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {`${indent}<${element.tag}>`}
        {element.text && (
          <Box 
            component="span" 
            sx={{ 
              color: 'text.secondary',
              ml: 1,
              fontStyle: 'italic'
            }}
          >
            {element.text.length > 50 ? `${element.text.slice(0, 50)}...` : element.text}
          </Box>
        )}
        {element.children?.map((child, index) => (
          <React.Fragment key={index}>
            {renderElement(child, depth + 1)}
          </React.Fragment>
        ))}
        {element.children?.length ? `\n${indent}` : ''}{`</${element.tag}>`}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Cleaned DOM Structure
      </Typography>
      {chunks.map((chunk, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          <Typography variant="subtitle1" color="primary" gutterBottom>
            {chunk.context}
          </Typography>
          <Box 
            sx={{ 
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              maxHeight: '300px',
              overflow: 'auto'
            }}
          >
            {chunk.elements.map((element, elemIndex) => (
              <React.Fragment key={elemIndex}>
                {elemIndex > 0 && '\n'}
                {renderElement(element)}
              </React.Fragment>
            ))}
          </Box>
        </React.Fragment>
      ))}
    </Paper>
  );
} 