import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Typography,
} from '@mui/material';
import { Close, Download, PictureAsPdf } from '@mui/icons-material';
import { generateInvoicePDF } from '../../services/pdfService';

export default function PdfPreviewDialog({
  open,
  onClose,
  facture,
  client = null,
  title = 'Aperçu PDF',
}) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    const loadPreview = async () => {
      if (!open || !facture) return;
      setLoading(true);
      setError('');
      setPdfUrl('');
      try {
        const doc = await generateInvoicePDF(facture, client, { autoSave: false });
        const blob = doc.output('blob');
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setPdfUrl(objectUrl);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Impossible de générer l’aperçu PDF.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, facture, client]);

  const handleDownload = async () => {
    if (!facture) return;
    await generateInvoicePDF(facture, client, { autoSave: true });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdf sx={{ color: '#EF4444' }} />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              {facture?.numero || 'Facture'} - QR visible dans le document
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: { xs: 420, md: 650 }, p: 0 }}>
        {loading && (
          <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
            <CircularProgress />
            <Typography sx={{ color: 'text.secondary' }}>Génération de l’aperçu...</Typography>
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && pdfUrl && (
          <Box
            component="iframe"
            title="Aperçu de la facture PDF"
            src={pdfUrl}
            sx={{
              border: 0,
              width: '100%',
              height: { xs: 420, md: 650 },
              display: 'block',
              bgcolor: '#FFFFFF',
            }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleDownload}
          disabled={!facture || loading}
        >
          Télécharger
        </Button>
      </DialogActions>
    </Dialog>
  );
}
