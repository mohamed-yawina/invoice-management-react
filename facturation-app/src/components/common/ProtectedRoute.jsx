import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebaseService';
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0D0F14' }}>
        <CircularProgress sx={{ color: '#6EE7B7' }} />
      </Box>
    );
  }

  return user ? <Outlet /> : <Navigate to="/" />;
}