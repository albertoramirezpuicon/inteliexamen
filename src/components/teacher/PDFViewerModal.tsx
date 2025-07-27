'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close,
  PictureAsPdf,
  Description,
  Download
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface PDFViewerModalProps {
  open: boolean;
  source: any;
  onClose: () => void;
}

export default function PDFViewerModal({
  open,
  source,
  onClose
}: PDFViewerModalProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  
  const [activeTab, setActiveTab] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && source) {
      fetchPDFData();
    }
    
    // Cleanup blob URL when component unmounts or modal closes
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [open, source]);

  const fetchPDFData = async () => {
    if (!source.pdf_s3_key) {
      setError('No PDF file available for this source');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get presigned URL for PDF download
      const response = await fetch(`/api/teacher/sources/download?key=${encodeURIComponent(source.pdf_s3_key)}`, {
        headers: {
          'x-user-id': '1', // Add user ID for authentication
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received presigned URL:', data.url);
        setPdfUrl(data.url);
        
        // Try to fetch the PDF as a blob to create a blob URL for the iframe
        try {
          const pdfResponse = await fetch(data.url);
          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPdfBlobUrl(blobUrl);
          }
        } catch (blobError) {
          console.error('Failed to create blob URL:', blobError);
          // Continue with presigned URL as fallback
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to get presigned URL:', errorData);
        setError(errorData.error || 'Failed to get PDF download URL');
      }

      // Get PDF content if available
      if (source.pdf_content_embeddings) {
        try {
          const embeddings = JSON.parse(source.pdf_content_embeddings);
          if (embeddings && embeddings.length > 0) {
            const content = embeddings.map((chunk: any) => chunk.content).join('\n\n');
            setPdfContent(content);
          }
        } catch (parseError) {
          console.error('Error parsing PDF content:', parseError);
        }
      }
    } catch (error) {
      console.error('Error fetching PDF data:', error);
      setError('Failed to load PDF data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${source.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!source) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" noWrap sx={{ maxWidth: 600 }}>
              {source.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {source.authors && `${source.authors}`}
              {source.publication_year && ` (${source.publication_year})`}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab 
                  icon={<PictureAsPdf />} 
                  label="PDF Viewer" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<Description />} 
                  label="Content" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 0 && (
                <Box sx={{ height: '100%', p: 2 }}>
                  {pdfUrl ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          PDF Viewer (if the PDF doesn't load, use the download button below)
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          onClick={handleDownload}
                        >
                          Download PDF
                        </Button>
                      </Box>
                      <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                        <iframe
                          src={pdfBlobUrl || pdfUrl}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          title={source.title}
                          onError={() => setError('Failed to load PDF in viewer. Please use the download button.')}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        PDF viewer not available
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ height: '100%', p: 2, overflow: 'auto' }}>
                  {pdfContent ? (
                    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
                      <Typography variant="body1" component="pre" sx={{ 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'inherit',
                        lineHeight: 1.6
                      }}>
                        {pdfContent}
                      </Typography>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No content available for this source
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {tCommon('close')}
        </Button>
        {pdfUrl && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            {tCommon('download')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 