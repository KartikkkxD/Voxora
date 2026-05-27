import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { VoxoraGlyph } from './AuthBrand';

/**
 * Route guard restricting access to authenticated users only.
 * Displays a minimal, calm breathing indicator while loading.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-text">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[8px] border border-brand-border bg-brand-card shadow-[0_12px_42px_rgba(17,17,17,0.06)]">
            <VoxoraGlyph className="h-5 w-5 text-brand-accent" />
          </span>
          <span className="font-display text-[13px] font-semibold tracking-[0] text-brand-muted">Voxora</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
};
