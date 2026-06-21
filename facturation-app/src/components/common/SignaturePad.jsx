import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  IconButton, Tooltip, Tabs, Tab, TextField,
} from '@mui/material';
import { Close, Refresh, Save, Edit, TextFields } from '@mui/icons-material';

/**
 * Dialog de capture de signature numérique.
 *
 * Props :
 *  - open, onClose
 *  - onSave(dataUrl) — appelé avec la signature en base64 PNG
 *  - initialValue (optionnel) — data URL existante à pré-afficher
 *  - title (optionnel)
 */
export default function SignaturePad({ open, onClose, onSave, initialValue, title }) {
  const sigRef = useRef(null);
  const [tab, setTab] = useState(0); // 0 = dessiner, 1 = saisir
  const [typedName, setTypedName] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setTab(0);
      setTypedName('');
      setIsEmpty(true);
      setTimeout(() => {
        if (initialValue && sigRef.current) {
          try { sigRef.current.fromDataURL(initialValue); setIsEmpty(false); }
          catch (e) { /* ignore */ }
        }
      }, 100);
    }
  }, [open, initialValue]);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    setIsEmpty(sigRef.current?.isEmpty() ?? true);
  };

  /** Génère une signature à partir d'un nom tapé (style script). */
  const generateTypedSignature = (name) => {
    if (!name?.trim()) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.font = "italic 60px 'Brush Script MT', cursive, serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.trim(), canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    let dataUrl = null;
    if (tab === 0) {
      if (sigRef.current && !sigRef.current.isEmpty()) {
        // getTrimmedCanvas non disponible dans toutes les versions → fallback
        try {
          dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
        } catch {
          dataUrl = sigRef.current.toDataURL('image/png');
        }
      }
    } else {
      dataUrl = generateTypedSignature(typedName);
    }
    if (!dataUrl) return;
    onSave?.(dataUrl);
    onClose?.();
  };

  const canSave = (tab === 0 && !isEmpty) || (tab === 1 && typedName.trim().length > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.1)' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            bgcolor: 'rgba(37,99,235,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Edit sx={{ color: '#2563EB', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.05rem' }}>
            {title || 'Signature numérique'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'var(--app-text-secondary)' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2,
          '& .MuiTab-root': { color: '#94A3B8', textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: '#2563EB !important' },
          '& .MuiTabs-indicator': { backgroundColor: '#2563EB' },
        }}>
          <Tab icon={<Edit sx={{ fontSize: 18 }} />} iconPosition="start" label="Dessiner" />
          <Tab icon={<TextFields sx={{ fontSize: 18 }} />} iconPosition="start" label="Taper mon nom" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Box sx={{
              border: '2px dashed rgba(37,99,235,0.3)', borderRadius: 2,
              bgcolor: '#FFFFFF', position: 'relative', overflow: 'hidden',
            }}>
              <SignatureCanvas
                ref={sigRef}
                penColor="#111827"
                canvasProps={{
                  width: 500, height: 180,
                  style: { display: 'block', width: '100%', height: 180 },
                }}
                onEnd={handleEnd}
              />
              {isEmpty && (
                <Typography sx={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#64748B', pointerEvents: 'none', fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}>
                  Dessinez votre signature ici
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Tooltip title="Effacer">
                <IconButton onClick={handleClear} size="small" sx={{ color: '#94A3B8' }}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <TextField
              fullWidth
              label="Votre nom (apparaîtra en signature)"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="ex: Jean Dupont"
              autoFocus
            />
            {typedName.trim() && (
              <Box sx={{
                mt: 2, p: 3, bgcolor: '#FFFFFF', borderRadius: 2,
                textAlign: 'center', minHeight: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{
                  fontFamily: "'Brush Script MT', cursive, serif",
                  fontSize: '2.5rem', color: '#111827', fontStyle: 'italic',
                }}>
                  {typedName.trim()}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#94A3B8' }}>Annuler</Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          disabled={!canSave}
          onClick={handleSave}
          sx={{ bgcolor: '#2563EB', color: '#FFFFFF', '&:hover': { bgcolor: '#1D4ED8' } }}
        >
          Enregistrer la signature
        </Button>
      </DialogActions>
    </Dialog>
  );
}
