import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Paper, Chip,
  LinearProgress, useTheme, useMediaQuery, Skeleton, IconButton,
  Tooltip, Alert, Snackbar,
} from '@mui/material';
import {
  Paid, Pending, Cancel, AttachMoney, ReceiptLong, CheckCircle,
  Warning, Refresh, TrendingUp, TrendingDown, TrendingFlat, BugReport,
} from '@mui/icons-material';
import { db, ref, get } from '../../services/firebaseService';
import { getInvoiceAmountMad, formatMoney } from '../../utils/currency';
import AdminLayout from '../../components/common/AdminLayout';
import { useCompany } from '../../contexts/CompanyContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

// ─── Skeletons ────────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          </Box>
          <Skeleton variant="rounded" width={48} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }) {
  return (
    <Skeleton variant="rectangular" width="100%" height={height}
      sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
  );
}

// ─── Trend indicator ──────────────────────────────────────────────────────────
function TrendIndicator({ value }) {
  if (value === null || value === undefined) return null;
  if (value > 0) return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: '#22C55E', fontSize: '0.7rem', gap: 0.3 }}>
      <TrendingUp sx={{ fontSize: 12 }} />+{value.toFixed(1)}%
    </Box>
  );
  if (value < 0) return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: '#EF4444', fontSize: '0.7rem', gap: 0.3 }}>
      <TrendingDown sx={{ fontSize: 12 }} />{value.toFixed(1)}%
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontSize: '0.7rem', gap: 0.3 }}>
      <TrendingFlat sx={{ fontSize: 12 }} />Stable
    </Box>
  );
}

// ─── Tooltip recharts ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <Box sx={{
      bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.2)',
      borderRadius: '10px', p: 1.5, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    }}>
      <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', mb: 0.5, fontWeight: 600 }}>
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
          <Typography sx={{ color: 'var(--app-text-primary)', fontSize: '0.75rem' }}>
            {entry.name}: <strong>{Number(entry.value).toLocaleString('fr-FR')}</strong>
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── Extraction factures (gère structure plate ET imbriquée par userId) ────────
function extractFactures(snapshot) {
  const raw = snapshot.val();
  if (!raw) return [];

  const isFacture = (v) =>
    v && typeof v === 'object' && (
      'statut' in v || 'total_ttc' in v || 'numero' in v || 'date_creation' in v
    );

  const values = Object.values(raw);

  // Cas 1 : toutes les valeurs sont des factures directement
  if (values.every(isFacture)) return values;

  // Cas 2 : valeurs imbriquées par userId
  const factures = [];
  values.forEach((group) => {
    if (group && typeof group === 'object' && !isFacture(group)) {
      Object.values(group).forEach((f) => { if (isFacture(f)) factures.push(f); });
    } else if (isFacture(group)) {
      factures.push(group);
    }
  });
  return factures;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { filterItems } = useCompany();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [allFactures, setAllFactures] = useState([]);

  const [stats, setStats] = useState({
    totalFactures: 0, totalEncaisse: 0, facturesEnAttente: 0,
    facturesRejetees: 0, montantMoyenParFacture: 0,
  });
  const [trends, setTrends] = useState({});
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await get(ref(db, 'factures'));
      const rawVal = snapshot.val();

      if (!rawVal) {
        setDebugInfo({ message: 'Le nœud "factures" est vide ou inexistant dans Firebase.' });
        setLoading(false);
        return;
      }

      const factures = extractFactures(snapshot);

      if (factures.length === 0) {
        setDebugInfo({
          message: 'Nœud "factures" trouvé mais aucune facture extraite. Vérifiez la structure.',
          rawKeys: Object.keys(rawVal).slice(0, 5),
        });
        setLoading(false);
        return;
      }

      setDebugInfo(null);
      setAllFactures(factures);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError(`Erreur Firebase : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const factures = filterItems(allFactures);
    if (allFactures.length === 0) return;

      // ── KPIs ──────────────────────────────────────────────────────────────
      const facturesPayees    = factures.filter(f => f.statut === 'Payée');
      const facturesEnAttente = factures.filter(f => f.statut === 'En attente');
      const facturesRejetees  = factures.filter(f => f.statut === 'Rejetée');
      const totalEncaisse     = facturesPayees.reduce((s, f) => s + getInvoiceAmountMad(f), 0);

      setStats({
        totalFactures: factures.length,
        totalEncaisse,
        facturesEnAttente: facturesEnAttente.length,
        facturesRejetees: facturesRejetees.length,
        montantMoyenParFacture: factures.length > 0 ? totalEncaisse / factures.length : 0,
      });

      // ── Tendances ─────────────────────────────────────────────────────────
      const now = new Date();
      const toMK = (d) => { const dt = new Date(d); return isNaN(dt) ? null : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; };
      const curMK  = toMK(now);
      const prevMK = toMK(new Date(now.getFullYear(), now.getMonth() - 1));
      const calcTrend = (cur, prev) => prev > 0 ? ((cur - prev) / prev) * 100 : null;

      const curEnc  = facturesPayees.filter(f => toMK(f.date_creation) === curMK).reduce((s, f) => s + getInvoiceAmountMad(f), 0);
      const prevEnc = facturesPayees.filter(f => toMK(f.date_creation) === prevMK).reduce((s, f) => s + getInvoiceAmountMad(f), 0);
      const curCnt  = factures.filter(f => toMK(f.date_creation) === curMK).length;
      const prevCnt = factures.filter(f => toMK(f.date_creation) === prevMK).length;

      setTrends({ encaisse: calcTrend(curEnc, prevEnc), count: calcTrend(curCnt, prevCnt) });

      // ── Données mensuelles ────────────────────────────────────────────────
      const monthlyMap = new Map();
      factures.forEach(f => {
        const mk = toMK(f.date_creation);
        if (!mk) return;
        const label = new Date(f.date_creation).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        if (!monthlyMap.has(mk)) {
          monthlyMap.set(mk, { month: label, key: mk, ca: 0, nombreFactures: 0, encaisse: 0, enAttente: 0 });
        }
        const e = monthlyMap.get(mk);
        e.ca += getInvoiceAmountMad(f);
        e.nombreFactures++;
        if (f.statut === 'Payée')      e.encaisse  += getInvoiceAmountMad(f);
        if (f.statut === 'En attente') e.enAttente++;
      });

      setMonthlyChartData(
        Array.from(monthlyMap.values())
          .sort((a, b) => a.key.localeCompare(b.key))
          .slice(-6)
      );

      // ── Distribution statuts ──────────────────────────────────────────────
      setStatusDistribution([
        { name: 'Payée',      value: facturesPayees.length,    color: '#22C55E' },
        { name: 'En attente', value: facturesEnAttente.length, color: '#EAB308' },
        { name: 'Rejetée',    value: facturesRejetees.length,  color: '#EF4444' },
      ].filter(d => d.value > 0));

      // ── Factures récentes ─────────────────────────────────────────────────
      setRecentInvoices(
        [...factures]
          .filter(f => f.date_creation)
          .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
          .slice(0, 6)
      );
  }, [allFactures, filterItems]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleRefresh = async () => {
    await loadDashboardData();
    setSnackbar({ open: true, message: 'Données actualisées', severity: 'success' });
  };

  const kpiCards = [
    { title: 'Total Factures',      value: stats.totalFactures,                                 icon: <ReceiptLong />, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  trend: trends.count },
    { title: 'Total Encaissé',      value: formatMoney(stats.totalEncaisse, 'MAD'), icon: <Paid />,        color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   trend: trends.encaisse },
    { title: 'En attente',          value: stats.facturesEnAttente,                             icon: <Pending />,     color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
    { title: 'Factures rejetées',   value: stats.facturesRejetees,                              icon: <Cancel />,      color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const getStatusStyle = (statut) => {
    if (statut === 'Payée')   return { bg: 'rgba(34,197,94,0.15)',  color: '#22C55E' };
    if (statut === 'Rejetée') return { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' };
    return                           { bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' };
  };

  const tauxValidation = stats.totalFactures > 0
    ? ((stats.totalFactures - stats.facturesEnAttente - stats.facturesRejetees) / stats.totalFactures) * 100
    : 0;

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: 'var(--app-text-primary)', mb: 0.5, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', md: '1.9rem' } }}>
            Tableau de bord
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Tooltip title="Actualiser">
          <span>
            <IconButton onClick={handleRefresh} disabled={loading} sx={{
              color: '#2563EB', bgcolor: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px',
              '&:hover': { bgcolor: 'rgba(37,99,235,0.2)' },
              '&:disabled': { color: '#4B5563', border: '1px solid transparent' },
            }}>
              <Refresh sx={{
                fontSize: 20,
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Erreur */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Diagnostic Firebase */}
      {debugInfo && !loading && (
        <Alert severity="warning" icon={<BugReport />} onClose={() => setDebugInfo(null)}
          sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#EAB308' }}>
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Diagnostic Firebase</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8' }}>{debugInfo.message}</Typography>
          {debugInfo.rawKeys && (
            <Typography sx={{ fontSize: '0.78rem', color: 'var(--app-text-secondary)', mt: 0.5 }}>
              Clés trouvées : <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 3 }}>{debugInfo.rawKeys.join(', ')}</code>
            </Typography>
          )}
          <Typography sx={{ fontSize: '0.78rem', color: 'var(--app-text-secondary)', mt: 0.5 }}>
            Chemin attendu : <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 3 }}>/factures/{'{id}'}</code> avec champ <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 3 }}>statut</code> ou <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 3 }}>total_ttc</code>.
          </Typography>
        </Alert>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        {loading
          ? Array(4).fill(null).map((_, i) => <Grid item xs={6} md={3} key={i}><StatCardSkeleton /></Grid>)
          : kpiCards.map((card) => (
            <Grid item xs={6} md={3} key={card.title}>
              <Card sx={{
                bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 40px ${card.color}20`, borderColor: `${card.color}30` },
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: { xs: '0.65rem', sm: '0.72rem' }, fontWeight: 600, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {card.title}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: { xs: '1.15rem', sm: '1.4rem', md: '1.65rem' }, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                        {card.value}
                      </Typography>
                      {(card.trend !== undefined && card.trend !== null) && (
                        <Box sx={{ mt: 0.5 }}><TrendIndicator value={card.trend} /></Box>
                      )}
                    </Box>
                    <Box sx={{ bgcolor: card.bg, borderRadius: '10px', p: { xs: 0.8, sm: 1.2 }, color: card.color, '& .MuiSvgIcon-root': { fontSize: { xs: 20, sm: 26 } } }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* ── KPIs secondaires ───────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              {loading ? <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} /> : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: 'rgba(37,99,235,0.1)', borderRadius: '10px', p: 1.2, color: '#2563EB', flexShrink: 0 }}>
                    <AttachMoney sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Montant moyen / Facture</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                      {formatMoney(Math.round(stats.montantMoyenParFacture), 'MAD')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              {loading ? <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} /> : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Taux de validation</Typography>
                    <Chip label={`${Math.round(tauxValidation)}%`} size="small" sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: '0.7rem', height: 20 }} />
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(tauxValidation, 100)}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB', borderRadius: 3 } }} />
                  <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.7rem', mt: 0.8 }}>
                    {stats.totalFactures - stats.facturesEnAttente - stats.facturesRejetees} / {stats.totalFactures} validées
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              {loading ? <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} /> : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: 'rgba(234,179,8,0.1)', borderRadius: '10px', p: 1.2, color: '#EAB308', flexShrink: 0 }}>
                    <Warning sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>À traiter</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>{stats.facturesEnAttente}</Typography>
                    <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.7rem' }}>Factures en attente</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Graphiques ligne + camembert ───────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ color: 'var(--app-text-primary)', mb: 2, fontWeight: 700, fontSize: '0.95rem' }}>Évolution mensuelle</Typography>
            {loading ? <ChartSkeleton height={isMobile ? 220 : 300} /> : monthlyChartData.length === 0 ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune donnée disponible</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: isMobile ? 220 : 300 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: '#64748B', fontSize: isMobile ? 10 : 12 }} />
                    <YAxis yAxisId="left"  stroke="transparent" tick={{ fill: '#64748B', fontSize: isMobile ? 10 : 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="transparent" tick={{ fill: '#64748B', fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: 12 }} />
                    <Line yAxisId="left"  type="monotone" dataKey="ca"             name="CA (DH)"       stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
                    <Line yAxisId="left"  type="monotone" dataKey="encaisse"       name="Encaissé (DH)" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }} />
                    <Line yAxisId="right" type="monotone" dataKey="nombreFactures" name="Nb factures"    stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ color: 'var(--app-text-primary)', mb: 2, fontWeight: 700, fontSize: '0.95rem' }}>Répartition des statuts</Typography>
            {loading ? <ChartSkeleton height={isMobile ? 200 : 240} /> : statusDistribution.length === 0 ? (
              <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune donnée</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ width: '100%', height: isMobile ? 190 : 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%"
                        innerRadius={isMobile ? 45 : 58} outerRadius={isMobile ? 72 : 88}
                        paddingAngle={4} dataKey="value" strokeWidth={0}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}
                      >
                        {statusDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, fontSize: 13 }}
                        formatter={(v, n) => [`${v} factures`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
                  {statusDistribution.map((item) => {
                    const total = statusDistribution.reduce((s, d) => s + d.value, 0);
                    return (
                      <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>{item.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.75rem' }}>
                            {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                          </Typography>
                          <Typography sx={{ color: 'var(--app-text-primary)', fontSize: '0.8rem', fontWeight: 600, minWidth: 20, textAlign: 'right' }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── BarChart : en attente vs total ─────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12}>
          <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
            <Typography sx={{ color: 'var(--app-text-primary)', mb: 2, fontWeight: 700, fontSize: '0.95rem' }}>
              Factures en attente vs Total par mois
            </Typography>
            {loading ? <ChartSkeleton height={260} /> : monthlyChartData.length === 0 ? (
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune donnée disponible</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: '#64748B', fontSize: isMobile ? 10 : 12 }} />
                    <YAxis stroke="transparent" tick={{ fill: '#64748B', fontSize: isMobile ? 10 : 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13, paddingTop: 12 }} />
                    <Bar dataKey="nombreFactures" name="Total factures"       fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="enAttente"      name="Factures en attente"  fill="#EAB308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Factures récentes ──────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: { xs: 2, sm: 2.5 }, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Factures récentes</Typography>
              {!loading && <Chip label={`${recentInvoices.length} dernières`} size="small" sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB', fontSize: '0.7rem', height: 22 }} />}
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Array(4).fill(null).map((_, i) => <Skeleton key={i} variant="rectangular" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 }} />)}
              </Box>
            ) : recentInvoices.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <ReceiptLong sx={{ color: 'var(--app-text-primary)', fontSize: 44, mb: 1 }} />
                <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune facture récente</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['N° Facture', 'Date', 'Devise', 'Montant TTC', 'Statut', 'Validation'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--app-text-secondary)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice, idx) => {
                      const s = getStatusStyle(invoice.statut);
                      return (
                        <tr key={invoice.id || idx}
                          style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.15s', cursor: 'default' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '11px 12px', color: '#2563EB', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'monospace' }}>
                            {invoice.numero || `#${String(idx + 1).padStart(4, '0')}`}
                          </td>
                          <td style={{ padding: '11px 12px', color: 'var(--app-text-secondary)', fontSize: '0.8rem' }}>
                            {invoice.date_creation ? new Date(invoice.date_creation).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td style={{ padding: '11px 12px', color: 'var(--app-text-secondary)', fontSize: '0.8rem' }}>
                            {invoice.currency || 'MAD'}
                          </td>
                          <td style={{ padding: '11px 12px', color: 'var(--app-text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                            {formatMoney(invoice.total_ttc, invoice.currency)}
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
                              {invoice.statut || 'En attente'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            {invoice.validated_by_admin
                              ? <CheckCircle sx={{ color: '#22C55E', fontSize: 18 }} />
                              : <Pending sx={{ color: '#EAB308', fontSize: 18 }} />
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}