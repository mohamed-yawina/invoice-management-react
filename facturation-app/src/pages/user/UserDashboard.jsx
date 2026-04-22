import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress, Paper, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton,
  Tooltip, Skeleton, Divider,
} from '@mui/material';
import {
  Receipt, Paid, Pending, Cancel, People as PeopleIcon, Add,
  PictureAsPdf, ArrowForward, AutoAwesome, Bolt, Insights, CalendarMonth,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db, ref, get, getAllFacturesFlat, auth } from '../../services/firebaseService';
import { generateInvoicePDF } from '../../services/pdfService';
import Layout from '../../components/common/Layout';
import { palette, gradients } from '../../theme/darkTheme';

const STATUT_STYLES = {
  'Payée': { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  'Rejetée': { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  'En attente': { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' },
};

const fmtMoney = (n) => `${(Number(n) || 0).toLocaleString('fr-FR')} DH`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

// Sparkline SVG léger (sans dépendance)
function Sparkline({ values = [], color = '#6EE7B7', height = 40, width = 120 }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polygon fill="url(#sparkFill)" points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const currentUser = auth.currentUser;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, clientsSnap] = await Promise.all([
        getAllFacturesFlat(),
        get(ref(db, 'clients')),
      ]);
      setFactures(list || []);
      const cmap = {};
      if (clientsSnap.exists()) {
        const raw = clientsSnap.val();
        Object.keys(raw).forEach((id) => { cmap[id] = { id, ...raw[id] }; });
      }
      setClientsMap(cmap);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const total = factures.length;
    const payees = factures.filter((f) => f.statut === 'Payée');
    const enAttente = factures.filter((f) => f.statut === 'En attente');
    const rejetees = factures.filter((f) => f.statut === 'Rejetée');
    const encaisse = payees.reduce((s, f) => s + (f.total_ttc || 0), 0);
    const montantAttente = enAttente.reduce((s, f) => s + (f.total_ttc || 0), 0);
    const moyenne = total ? factures.reduce((s, f) => s + (f.total_ttc || 0), 0) / total : 0;
    const nbClients = Object.keys(clientsMap).length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const caMois = factures
      .filter((f) => {
        if (!f.date_creation) return false;
        const d = new Date(f.date_creation);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((s, f) => s + (f.total_ttc || 0), 0);

    // 6 derniers mois pour sparkline
    const monthly = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(currentYear, currentMonth - (5 - idx), 1);
      const mm = d.getMonth(); const yy = d.getFullYear();
      return factures
        .filter((f) => {
          if (!f.date_creation) return false;
          const fd = new Date(f.date_creation);
          return fd.getMonth() === mm && fd.getFullYear() === yy;
        })
        .reduce((s, f) => s + (f.total_ttc || 0), 0);
    });

    return {
      total, encaisse, enAttente: enAttente.length, rejetees: rejetees.length,
      montantAttente, moyenne, nbClients, caMois, nbPayees: payees.length, monthly,
    };
  }, [factures, clientsMap]);

  const recentInvoices = useMemo(
    () => factures.slice()
      .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))
      .slice(0, 5),
    [factures]
  );

  const getClientName = (inv) => {
    const c = clientsMap[inv.client_id];
    return c ? c.nom : (inv.client_id || '—');
  };

  const getStatusChip = (statut) => {
    const style = STATUT_STYLES[statut] || STATUT_STYLES['En attente'];
    return <Chip label={statut || 'En attente'} size="small"
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }} />;
  };

  const handleDownloadPDF = (inv) => {
    try {
      const client = clientsMap[inv.client_id] || null;
      generateInvoicePDF(inv, client, { autoSave: true });
    } catch (e) { console.error(e); }
  };

  // Cards de stats (disposées en "highlights" + "secondary")
  const highlights = [
    {
      title: 'Total Encaissé',
      value: fmtMoney(stats.encaisse),
      sub: `${stats.nbPayees} factures payées`,
      icon: <Paid />,
      gradient: gradients.success,
      iconBg: 'rgba(34,197,94,0.2)',
      iconColor: '#22C55E',
      spark: stats.monthly,
      sparkColor: '#22C55E',
    },
    {
      title: 'En Attente',
      value: stats.enAttente,
      sub: fmtMoney(stats.montantAttente),
      icon: <Pending />,
      gradient: gradients.warning,
      iconBg: 'rgba(234,179,8,0.2)',
      iconColor: '#EAB308',
    },
    {
      title: 'CA du mois',
      value: fmtMoney(stats.caMois),
      sub: `Moyenne: ${fmtMoney(stats.moyenne)}`,
      icon: <Insights />,
      gradient: gradients.brand,
      iconBg: 'rgba(110,231,183,0.2)',
      iconColor: '#6EE7B7',
      spark: stats.monthly,
      sparkColor: '#6EE7B7',
    },
  ];

  const secondary = [
    { title: 'Total Factures', value: stats.total, icon: <Receipt />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { title: 'Rejetées', value: stats.rejetees, icon: <Cancel />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    { title: 'Clients', value: stats.nbClients, icon: <PeopleIcon />, color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
    { title: 'Factures payées', value: stats.nbPayees, icon: <Paid />, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  ];

  // Calcul heure du jour pour salutation
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur';

  return (
    <Layout>
      {/* ─── HERO ──────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 3,
          background: gradients.hero,
          border: '1px solid rgba(110,231,183,0.15)',
          '&::before': {
            content: '""', position: 'absolute', top: -80, right: -80,
            width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(110,231,183,0.15), transparent 60%)',
            filter: 'blur(20px)',
          },
          '&::after': {
            content: '""', position: 'absolute', bottom: -60, left: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 60%)',
            filter: 'blur(20px)',
          },
        }}
      >
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesome sx={{ color: palette.accent.mint, fontSize: 18 }} />
              <Typography sx={{ color: palette.accent.mint, fontWeight: 600, letterSpacing: '0.1em', fontSize: 12, textTransform: 'uppercase' }}>
                Tableau de bord
              </Typography>
            </Box>
            <Typography variant="h3" sx={{
              color: palette.text.primary, fontWeight: 800, mb: 1,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
            }}>
              {greeting}, <span style={{
                background: gradients.brand,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{userName}</span>
            </Typography>
            <Typography sx={{ color: palette.text.secondary, fontSize: 15, maxWidth: 600 }}>
              Voici un aperçu de votre activité de facturation. Vous avez <strong style={{ color: palette.accent.mint }}>
              {stats.enAttente} facture{stats.enAttente !== 1 ? 's' : ''}</strong> en attente de paiement.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/invoices/new')}>
                Nouvelle facture
              </Button>
              <Button variant="outlined" startIcon={<PeopleIcon />}
                onClick={() => navigate('/app/clients')}
                sx={{
                  color: palette.text.primary,
                  borderColor: 'rgba(255,255,255,0.15)',
                  '&:hover': { borderColor: palette.accent.mint, bgcolor: 'rgba(110,231,183,0.05)' },
                }}>
                Mes clients
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{
              position: 'relative', textAlign: 'center',
              p: 3, borderRadius: 3,
              background: 'rgba(13,17,23,0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(110,231,183,0.15)',
            }}>
              <Box sx={{
                width: 64, height: 64, mx: 'auto', mb: 1.5, borderRadius: '50%',
                background: gradients.brand,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(110,231,183,0.4)',
              }}>
                <Bolt sx={{ color: '#0D0F14', fontSize: 32 }} />
              </Box>
              <Typography sx={{ color: palette.text.secondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Activité du mois
              </Typography>
              <Typography variant="h4" sx={{ color: palette.text.primary, fontWeight: 800, my: 0.5 }}>
                {fmtMoney(stats.caMois)}
              </Typography>
              <Sparkline values={stats.monthly} color={palette.accent.mint} height={40} width={160} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── HIGHLIGHTS ─────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {highlights.map((h) => (
          <Grid item xs={12} md={4} key={h.title}>
            {loading ? (
              <Skeleton variant="rounded" height={150} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            ) : (
              <Card sx={{
                position: 'relative', overflow: 'hidden', borderRadius: 3,
                background: gradients.card,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: 'rgba(110,231,183,0.4)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                },
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: h.gradient,
                },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                        {h.title}
                      </Typography>
                      <Typography variant="h4" sx={{ color: palette.text.primary, fontWeight: 800, mt: 0.5 }}>
                        {h.value}
                      </Typography>
                    </Box>
                    <Box sx={{
                      bgcolor: h.iconBg, borderRadius: 2, p: 1.25, color: h.iconColor,
                      display: 'flex',
                    }}>{h.icon}</Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Typography sx={{ color: palette.text.secondary, fontSize: 13 }}>{h.sub}</Typography>
                    {h.spark && <Sparkline values={h.spark} color={h.sparkColor} height={32} width={90} />}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>

      {/* ─── SECONDARY STATS ───────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {secondary.map((card) => (
          <Grid item xs={6} md={3} key={card.title}>
            {loading ? (
              <Skeleton variant="rounded" height={96} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            ) : (
              <Card sx={{
                borderRadius: 3,
                '&:hover': { borderColor: 'rgba(110,231,183,0.25)', transform: 'translateY(-2px)' },
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Box>
                    <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: card.bg, borderRadius: 2, p: 1, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>

      {/* ─── RECENT INVOICES ───────────────────────────── */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', background: gradients.card }}>
        <Box sx={{
          p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${palette.line.subtle}`,
          background: 'linear-gradient(90deg, rgba(110,231,183,0.05), transparent)',
        }}>
          <Box>
            <Typography variant="h6" sx={{ color: palette.text.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt sx={{ color: palette.accent.mint, fontSize: 20 }} />
              Factures récentes
            </Typography>
            <Typography variant="caption" sx={{ color: palette.text.muted }}>
              Les 5 dernières factures créées
            </Typography>
          </Box>
          <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/app/invoices')}
            sx={{ color: palette.accent.mint }}>
            Voir tout
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ p: 3 }}><LinearProgress /></Box>
        ) : recentInvoices.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box sx={{
              width: 80, height: 80, mx: 'auto', mb: 2,
              borderRadius: '50%', bgcolor: 'rgba(110,231,183,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt sx={{ fontSize: 40, color: palette.accent.mint }} />
            </Box>
            <Typography sx={{ color: palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Aucune facture pour le moment
            </Typography>
            <Typography sx={{ color: palette.text.secondary, mb: 2, fontSize: 14 }}>
              Commencez par créer votre première facture
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/invoices/new')}>
              Créer une facture
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Facture</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices.map((inv) => {
                  const client = clientsMap[inv.client_id];
                  const initials = (client?.nom || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
                  return (
                    <TableRow key={inv._path || inv.id} hover>
                      <TableCell sx={{ color: palette.accent.mint, fontWeight: 600 }}>{inv.numero || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{
                            width: 28, height: 28, fontSize: 11, fontWeight: 700,
                            bgcolor: 'rgba(110,231,183,0.15)', color: palette.accent.mint,
                          }}>{initials || 'C'}</Avatar>
                          <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>
                            {getClientName(inv)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: palette.text.secondary, fontSize: 13 }}>
                          <CalendarMonth sx={{ fontSize: 14 }} />
                          {fmtDate(inv.date_creation)}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ color: palette.text.primary, fontWeight: 700 }}>
                        {fmtMoney(inv.total_ttc)}
                      </TableCell>
                      <TableCell>{getStatusChip(inv.statut)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Télécharger PDF">
                          <IconButton size="small" onClick={() => handleDownloadPDF(inv)}
                            sx={{
                              color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)',
                              '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' },
                            }}>
                            <PictureAsPdf fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Divider sx={{ my: 3, opacity: 0 }} />
    </Layout>
  );
}
