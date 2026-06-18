import React, { useState } from "react";
import { Box, Button, TextField, Typography, InputAdornment, IconButton, Divider, Link, Alert, CircularProgress, LinearProgress, Checkbox, FormControlLabel } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { registerWithEmail, signInWithGoogle, getAuthErrorMessage, createOrUpdateUser } from "../services/firebaseService";

const theme = createTheme({
  palette: { mode: "dark", primary: { main: "#818CF8" }, background: { default: "#0D0F14", paper: "#161B26" }, text: { primary: "#F1F5F9", secondary: "#94A3B8" } },
  typography: { fontFamily: "'DM Sans', sans-serif", h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 } },
  shape: { borderRadius: 14 },
});

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [{ label: "Très faible", color: "#EF4444" }, { label: "Faible", color: "#F97316" }, { label: "Moyen", color: "#EAB308" }, { label: "Fort", color: "#22C55E" }, { label: "Très fort", color: "#6EE7B7" }];
  return { score, ...levels[score] };
}

const rules = [
  { label: "8 caractères minimum", test: (p) => p.length >= 8 },
  { label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { label: "Un caractère spécial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// La redirection après inscription est gérée par <PublicOnly>/<HomeRedirect>
// dans AppRoutes via AuthContext.
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) { setError("Veuillez remplir tous les champs."); return; }
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (strength.score < 2) { setError("Veuillez choisir un mot de passe plus robuste."); return; }
    if (!agreed) { setError("Vous devez accepter les conditions."); return; }
    setLoading(true);
    try {
      const displayName = `${form.firstName} ${form.lastName}`.trim();
      const cred = await registerWithEmail(form.email, form.password, displayName);
      await createOrUpdateUser(cred.user.uid, form.email, displayName, 'user');
    } catch (err) { setError(getAuthErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const displayName = result.user.displayName || `${result.user.email.split('@')[0]}`;
      await createOrUpdateUser(result.user.uid, result.user.email, displayName, 'user');
    } catch (err) { setError(getAuthErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: "background.paper", borderRadius: 4, p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 480, boxShadow: "0 25px 60px rgba(0,0,0,0.5)", border: "1px solid #1E2D3D" }}>
          <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "rgba(129,140,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3, border: "1px solid rgba(129,140,248,0.3)" }}><PersonAddOutlinedIcon sx={{ color: "primary.main", fontSize: 24 }} /></Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Créer un compte ✨</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>Rejoignez-nous en quelques secondes</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}><TextField fullWidth label="Prénom" name="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /><TextField fullWidth label="Nom" name="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Box>
          <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Mot de passe" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ mb: 1 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
          {form.password && <Box sx={{ mb: 2 }}><LinearProgress variant="determinate" value={(strength.score / 4) * 100} sx={{ height: 5, borderRadius: 10, bgcolor: "#1E2536", '& .MuiLinearProgress-bar': { bgcolor: strength.color } }} /><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>{rules.map((r) => <Box key={r.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{r.test(form.password) ? <CheckCircleIcon sx={{ fontSize: 14, color: "#22C55E" }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: "#4B5563" }} />}<Typography variant="caption" sx={{ color: r.test(form.password) ? "#22C55E" : "#4B5563" }}>{r.label}</Typography></Box>)}</Box></Box>}
          <TextField fullWidth label="Confirmer" name="confirm" type={showConfirm ? "text" : "password"} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} sx={{ mb: 2 }} error={!!form.confirm && form.confirm !== form.password} helperText={form.confirm && form.confirm !== form.password ? "Les mots de passe ne correspondent pas" : ""} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
          <FormControlLabel control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} sx={{ color: "#2D3748" }} />} label={<Typography variant="body2">J'accepte les <Link href="#">conditions d'utilisation</Link></Typography>} sx={{ mb: 2 }} />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, mb: 2, bgcolor: "primary.main", color: "#fff", borderRadius: 3 }}>{loading ? <CircularProgress size={22} /> : "Créer mon compte"}</Button>
          <Divider sx={{ my: 2 }}>ou s'inscrire avec</Divider>
          <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} disabled={loading} onClick={handleGoogle} sx={{ borderColor: "#2D3748", color: "text.primary", py: 1.2, borderRadius: 3, mb: 3 }}>Continuer avec Google</Button>
          <Typography variant="body2" align="center">Vous avez déjà un compte ? <Link component={RouterLink} to="/login" underline="hover" sx={{ color: "primary.main", fontWeight: 600 }}>Se connecter</Link></Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}