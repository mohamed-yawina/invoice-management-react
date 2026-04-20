import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import {
  auth,
  logInWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  getAuthErrorMessage,
} from "../services/firebaseService";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6EE7B7" },
    background: { default: "#0D0F14", paper: "#161B26" },
    text: { primary: "#F1F5F9", secondary: "#94A3B8" },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#1E2536",
            "& fieldset": { borderColor: "#2D3748" },
            "&:hover fieldset": { borderColor: "#6EE7B7" },
            "&.Mui-focused fieldset": { borderColor: "#6EE7B7" },
          },
          "& .MuiInputLabel-root.Mui-focused": { color: "#6EE7B7" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontSize: "0.95rem" },
      },
    },
  },
});

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/app", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await logInWithEmail(form.email, form.password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/app", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!form.email.trim()) {
      setError("Indiquez votre email pour recevoir le lien de réinitialisation.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(form.email.trim());
      setError("");
      alert("Un email de réinitialisation a été envoyé si cette adresse est enregistrée.");
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(110,231,183,0.12) 0%, transparent 70%)",
            top: -150,
            right: -150,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
            bottom: -100,
            left: -100,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: "background.paper",
            borderRadius: 4,
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 440,
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            border: "1px solid #1E2D3D",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: "rgba(110,231,183,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              border: "1px solid rgba(110,231,183,0.3)",
            }}
          >
            <LockOutlinedIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>

          <Typography variant="h4" sx={{ mb: 0.5, color: "text.primary" }}>
            Bon retour 👋
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Connectez-vous à votre compte
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Adresse email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            sx={{ mb: 1 }}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: "text.secondary" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ textAlign: "right", mb: 3 }}>
            <Link
              component="button"
              type="button"
              onClick={handleForgotPassword}
              underline="hover"
              sx={{ fontSize: "0.82rem", color: "primary.main", cursor: "pointer", border: 0, background: "none", p: 0, font: "inherit" }}
            >
              Mot de passe oublié ?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              mb: 2,
              bgcolor: "primary.main",
              color: "#0D0F14",
              "&:hover": { bgcolor: "#4ADE80" },
              borderRadius: 3,
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "#0D0F14" }} />
            ) : (
              "Se connecter"
            )}
          </Button>

          <Divider sx={{ my: 2, color: "text.secondary", fontSize: "0.8rem" }}>
            ou continuer avec
          </Divider>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            disabled={loading}
            onClick={handleGoogle}
            sx={{
              borderColor: "#2D3748",
              color: "text.primary",
              "&:hover": { borderColor: "#6EE7B7", bgcolor: "#1E2536" },
              py: 1.2,
              borderRadius: 3,
              mb: 3,
            }}
          >
            Continuer avec Google
          </Button>

          <Typography
            variant="body2"
            align="center"
            sx={{ color: "text.secondary" }}
          >
            Pas encore de compte ?{" "}
            <Link
              component={RouterLink}
              to="/register"
              underline="hover"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              S'inscrire
            </Link>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
