import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { fadeIn, slideUpFade } from '../../animations';

export const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleTabChange = (loginTab) => {
    setIsLogin(loginTab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        setSuccessMsg('Signup successful! Check your email for verification link.');
        // Optionally auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      console.error('[AuthModal] Submission error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/55 backdrop-blur-[1px]"
        >
          {/* Backdrop click closer */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            variants={slideUpFade}
            className="w-full max-w-[360px] relative z-10"
          >
            <Card className="p-6 relative border border-brand-border bg-brand-card shadow-lg select-none">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-brand-muted hover:text-brand-text rounded-md hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              {/* Title & Description */}
              <div className="mb-5 text-center mt-2">
                <h2 className="font-display font-medium text-lg tracking-tight text-brand-text">
                  Welcome to Voxora
                </h2>
                <p className="text-xs text-brand-muted mt-1 font-sans">
                  Sign in or create an account to persist recordings
                </p>
              </div>

              {/* Simple Tab Control */}
              <div className="flex border-b border-brand-border mb-4 font-sans text-xs">
                <button
                  type="button"
                  onClick={() => handleTabChange(true)}
                  className={`flex-1 pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    isLogin
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-brand-muted hover:text-brand-text'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange(false)}
                  className={`flex-1 pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    !isLogin
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-brand-muted hover:text-brand-text'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-3.5 font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    className="w-full text-sm px-3 py-2 bg-brand-bg text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full text-sm px-3 py-2 bg-brand-bg text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/25 transition-all"
                  />
                </div>

                {/* Info and Error Banners */}
                {errorMsg && (
                  <div className="flex items-start space-x-2 text-rose-600 dark:text-rose-450 p-2 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/60 dark:border-rose-900/35 rounded-lg text-xs">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-start space-x-2 text-emerald-600 dark:text-emerald-450 p-2 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/35 rounded-lg text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 text-xs tracking-wide uppercase font-semibold mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  ) : isLogin ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
