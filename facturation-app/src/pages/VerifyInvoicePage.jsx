import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Card, CardContent, Typography, Chip, Divider,
  CircularProgress, Grid, Alert,
} from '@mui/material';
import {
  VerifiedUser, ErrorOutlineOutlined, Receipt, Person, CalendarMonth,
  Payments, Draw, CheckCircle, Cancel,
} from '@mui/icons-material';
import {
  getInvoiceById, getPublicVerifyRecord, subscribePublicVerify, db, ref, get,
} from '../services/firebaseService';
import { formatMoney } from '../utils/currency';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const STATUS_COLOR = {
  'Payée': { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  'Rejetée': { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  'En attente': { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' },
};

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
      <Box sx={{ color: '#2563EB', mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

/**
 * Page publique de vérification de facture (lecture seule).
 * Route : /verify-invoice/:invoiceId?token=secureToken
 */
export default function VerifyInvoicePage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('loading'); // loading | valid | invalid | error
  const [facture, setFacture] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Chargement initial + validation du token
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setStatus('loading');
      try {
        if (!invoiceId || !token) {
          setStatus('invalid');
          setErrorMsg('Lien incomplet : identifiant ou token manquant.');
          return;
        }

        // 1) Index public verify/ (lecture sans connexion)
        let record = null;
        try {
          record = await getPublicVerifyRecord(invoiceId);
        } catch (e) {
          if (e?.message?.includes('Permission')) {
            setStatus('error');
            setErrorMsg(
              'Accès Firebase refusé. Ajoutez la règle verify/.read = true dans Firebase Console (voir VERIFY_QR_SETUP.md).'
            );
            return;
          }
        }
        if (cancelled) return;

        if (record) {
          if (!record.secureToken || record.secureToken !== token) {
            setStatus('invalid');
            setErrorMsg('Token de vérification incorrect. Regénérez le PDF.');
            return;
          }
          setFacture({
            numero: record.numero,
            statut: record.statut,
            total_ttc: record.total_ttc,
            currency: record.currency,
            date_creation: record.date_creation,
            date_encaissement: record.date_encaissement,
            client_nom: record.client_nom,
            signature: record.signature,
          });
          setStatus('valid');
          return;
        }

        // 2) Fallback : lecture factures/ (nécessite auth ou règles ouvertes)
        const found = await getInvoiceById(invoiceId);
        if (cancelled) return;

        if (!found) {
          setStatus('invalid');
          setErrorMsg(
            'Facture introuvable. Regénérez le PDF (cela publie la fiche de vérification) puis rescannez.'
          );
          return;
        }

        if (!found.secureToken || found.secureToken !== token) {
          setStatus('invalid');
          setErrorMsg('Token incorrect. Téléchargez un nouveau PDF depuis l\'application.');
          return;
        }

        // Enrichir le nom client si besoin
        let enriched = { ...found };
        if (!enriched.client_nom && enriched.client_id) {
          try {
            const clientSnap = await get(ref(db, `clients/${enriched.client_id}`));
            if (clientSnap.exists()) {
              enriched = { ...enriched, ...clientSnap.val(), client_nom: clientSnap.val().nom };
            }
          } catch {
            /* ignore */
          }
        }
        if (!enriched.client_nom && enriched.client_snapshot?.nom) {
          enriched.client_nom = enriched.client_snapshot.nom;
        }

        setFacture(enriched);
        setStatus('valid');
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(
            e?.message?.includes('Permission')
              ? 'Accès refusé. Vérifiez les règles Firebase (lecture publique ou authentification).'
              : 'Erreur lors de la vérification.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [invoiceId, token]);

  // Écoute temps réel du statut (nœud verify/ public)
  useEffect(() => {
    if (status !== 'valid' || !invoiceId) return undefined;
    const unsub = subscribePublicVerify(invoiceId, (updated) => {
      setFacture((prev) => ({
        ...prev,
        numero: updated.numero ?? prev?.numero,
        statut: updated.statut ?? prev?.statut,
        total_ttc: updated.total_ttc ?? prev?.total_ttc,
        currency: updated.currency ?? prev?.currency,
        date_creation: updated.date_creation ?? prev?.date_creation,
        date_encaissement: updated.date_encaissement ?? prev?.date_encaissement,
        client_nom: updated.client_nom ?? prev?.client_nom,
        societe_nom: updated.societe_nom ?? prev?.societe_nom,
        signature: updated.signature ?? prev?.signature,
      }));
    });
    return unsub;
  }, [status, invoiceId]);

  const clientNom = facture?.client_nom || facture?.client_snapshot?.nom || '—';
  const statutStyle = STATUS_COLOR[facture?.statut] || STATUS_COLOR['En attente'];
  const hasSignature = Boolean(
    facture?.signature && typeof facture.signature === 'string' && facture.signature.startsWith('data:image')
  );

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: 'var(--app-bg-deep)',
      background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.08) 0%, transparent 55%)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="sm">
        {/* En-tête marque */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{
            fontWeight: 800, fontSize: '1.5rem', fontFamily: "'Syne', sans-serif",
            background: 'linear-gradient(135deg, #2563EB, #475569)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
          }}>
            FacturePro
          </Typography>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.85rem', mt: 0.5 }}>
            Vérification de facture
          </Typography>
        </Box>

        {loading && (
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 3, p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#2563EB', mb: 2 }} />
            <Typography sx={{ color: '#94A3B8' }}>Vérification en cours…</Typography>
          </Card>
        )}

        {!loading && status === 'invalid' && (
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ErrorOutlineOutlined sx={{ fontSize: 56, color: '#EF4444', mb: 2 }} />
              <Typography variant="h5" sx={{ color: 'var(--app-text-primary)', fontWeight: 700, mb: 1 }}>
                Lien invalide ou facture introuvable
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>{errorMsg}</Typography>
            </CardContent>
          </Card>
        )}

        {!loading && status === 'error' && (
          <Alert severity="error" sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {errorMsg}
          </Alert>
        )}

        {!loading && status === 'valid' && facture && (
          <Card sx={{
            bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 3,
            boxShadow: '0 0 40px rgba(34,197,94,0.12)',
          }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <VerifiedUser sx={{ fontSize: 56, color: '#22C55E', mb: 1 }} />
                <Typography variant="h5" sx={{ color: '#22C55E', fontWeight: 800, mb: 0.5 }}>
                  Facture authentique
                </Typography>
                <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.82rem' }}>
                  Ce document a été vérifié via un lien sécurisé FacturePro
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <InfoRow icon={<Receipt fontSize="small" />} label="Numéro de facture" value={facture.numero || '—'} />
                </Grid>
                <Grid item xs={12}>
                  <InfoRow icon={<Person fontSize="small" />} label="Client" value={clientNom} />
                </Grid>
                {facture.societe_nom && (
                  <Grid item xs={12}>
                    <InfoRow icon={<Receipt fontSize="small" />} label="Société émettrice" value={facture.societe_nom} />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<CalendarMonth fontSize="small" />} label="Date de création" value={fmtDate(facture.date_creation)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<Payments fontSize="small" />} label="Montant TTC" value={formatMoney(facture.total_ttc, facture.currency)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
                    <Box sx={{ color: '#2563EB', mt: 0.3 }}><Receipt fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Statut actuel</Typography>
                      <Chip
                        label={facture.statut || 'En attente'} size="small"
                        sx={{ mt: 0.5, bgcolor: statutStyle.bg, color: statutStyle.color, fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                {facture.date_encaissement && (
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<CalendarMonth fontSize="small" />} label="Date d'encaissement" value={fmtDate(facture.date_encaissement)} />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
                    <Box sx={{ color: '#2563EB', mt: 0.3 }}><Draw fontSize="small" /></Box>
                    <Box>
                      <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Signature numérique</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                        {hasSignature ? (
                          <>
                            <CheckCircle sx={{ fontSize: 18, color: '#22C55E' }} />
                            <Typography sx={{ color: '#22C55E', fontWeight: 600 }}>Valide</Typography>
                          </>
                        ) : (
                          <>
                            <Cancel sx={{ fontSize: 18, color: 'var(--app-text-secondary)' }} />
                            <Typography sx={{ color: 'var(--app-text-secondary)', fontWeight: 600 }}>Non disponible</Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{
                mt: 3, bgcolor: 'rgba(59,130,246,0.08)', color: '#94A3B8',
                border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.78rem',
                '& .MuiAlert-icon': { color: '#3B82F6' },
              }}>
                Page en lecture seule — aucune modification n&apos;est possible depuis ce lien.
                Le statut est synchronisé avec la base de données en temps réel.
              </Alert>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
