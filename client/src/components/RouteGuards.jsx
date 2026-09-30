import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { PageLoader } from './ui';

// Requires a logged-in user with one of `roles`; otherwise redirects to login (or the user's own home).
export function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><PageLoader label="Restoring your session…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

// Login/register pages bounce signed-in users to their dashboard.
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><PageLoader /></div>;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
