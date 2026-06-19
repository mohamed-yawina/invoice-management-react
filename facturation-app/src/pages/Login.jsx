import React, { useState } from "react";
import { Box, Button, TextField, Typography, InputAdornment, IconButton, Divider, Link, Alert, CircularProgress } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { ThemeToggleIcon } from "../components/common/ThemeToggle";
import { logInWithEmail, signInWithGoogle, sendPasswordReset, getAuthErrorMessage, createOrUpdateUser } from "../services/firebaseService";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    try {
      const cred = await logInWithEmail(form.email, form.password);
      await createOrUpdateUser(cred.user.uid, cred.user.email, cred.user.displayName);
    } catch (err) { setError(getAuthErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const displayName = result.user.displayName || `${result.user.email.split('@')[0]}`;
      await createOrUpdateUser(result.user.uid, result.user.email, displayName);
    } catch (err) { setError(getAuthErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) { setError("Indiquez votre email pour recevoir le lien."); return; }
    setLoading(true);
    try {
      await sendPasswordReset(form.email.trim());
      alert("Un email de réinitialisation a été envoyé.");
    } catch (err) { setError(getAuthErrorMessage(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 2, position: "relative" }}>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggleIcon />
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{
        bgcolor: "background.paper", borderRadius: 4, p: { xs: 3, sm: 5 },
        width: "100%", maxWidth: 440,
        boxShadow: (t) => t.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
        border: "1px solid var(--app-line-subtle)",
      }}>
        <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "rgba(37,99,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3, border: "1px solid rgba(37,99,235,0.3)" }}>
          <LockOutlinedIcon sx={{ color: "primary.main", fontSize: 24 }} />
        </Box>
        <Typography variant="h4" sx={{ mb: 0.5, color: "text.primary" }}>Bon retour 👋</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>Connectez-vous à votre compte</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Mot de passe" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ mb: 1 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
        <Box sx={{ textAlign: "right", mb: 3 }}><Link component="button" type="button" onClick={handleForgotPassword} underline="hover" sx={{ fontSize: "0.82rem", color: "primary.main" }}>Mot de passe oublié ?</Link></Box>
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, mb: 2, borderRadius: 3 }}>{loading ? <CircularProgress size={22} sx={{ color: "#FFFFFF" }} /> : "Se connecter"}</Button>
        <Divider sx={{ my: 2 }}>ou continuer avec</Divider>
        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} disabled={loading} onClick={handleGoogle} sx={{ borderColor: "var(--app-line-subtle)", color: "text.primary", py: 1.2, borderRadius: 3, mb: 3 }}>Continuer avec Google</Button>
        <Typography variant="body2" align="center" sx={{ color: "text.secondary" }}>Pas encore de compte ? <Link component={RouterLink} to="/register" underline="hover" sx={{ color: "primary.main", fontWeight: 600 }}>S'inscrire</Link></Typography>
        <Typography variant="body2" align="center" sx={{ color: "text.secondary", mt: 2 }}><Link component={RouterLink} to="/" underline="hover" sx={{ fontSize: "0.82rem" }}>← Retour à l'accueil</Link></Typography>
      </Box>
    </Box>
  );
}
