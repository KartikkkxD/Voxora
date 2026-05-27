import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { GoogleMark } from './AuthBrand';
import { useAuth } from '../../context/AuthContext';

const authModes = {
  login: {
    alternatePath: '/signup',
    alternateText: 'Need an account?',
    alternateAction: 'Sign up',
    submitIdle: 'Sign in',
    submitLoading: 'Signing in',
    googleIdle: 'Continue with Google',
    googleLoading: 'Opening Google',
    success: 'Signed in. Opening your workspace.',
    passwordHint: 'Use the password connected to your Voxora account.'
  },
  signup: {
    alternatePath: '/login',
    alternateText: 'Have an account?',
    alternateAction: 'Log in',
    submitIdle: 'Create account',
    submitLoading: 'Creating account',
    googleIdle: 'Sign up with Google',
    googleLoading: 'Opening Google',
    success: 'Account created. Opening your workspace.',
    verifySuccess: 'Account created. Check your email to finish verification.',
    passwordHint: 'Use at least 8 characters.'
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFallbackSwitchPath = (pathname, mode) => {
  if (pathname === '/auth') {
    return mode === 'login' ? '/auth?mode=signup' : '/auth?mode=login';
  }

  return authModes[mode].alternatePath;
};

const getRedirectTarget = (location) => {
  const fromPath = location.state?.from?.pathname;
  const authPaths = new Set(['/auth', '/login', '/signup']);

  if (fromPath && !authPaths.has(fromPath)) {
    return fromPath;
  }

  return '/';
};

const getAuthErrorMessage = (error, mode) => {
  const message = error?.message || '';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login') || lowerMessage.includes('invalid credentials')) {
    return 'Those details do not match an account. Check the email and password, then try again.';
  }

  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'An account already exists for this email. Sign in instead.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'This email still needs verification. Check your inbox, then sign in again.';
  }

  if (lowerMessage.includes('password')) {
    return mode === 'signup'
      ? 'Choose a stronger password before creating your account.'
      : 'The password does not look right for this account.';
  }

  return message || 'Authentication could not be completed. Please try again.';
};

const Field = ({
  autoComplete,
  hint,
  icon: Icon,
  label,
  name,
  onChange,
  placeholder,
  type,
  value,
  children
}) => (
  <label className="group block">
    <span className="mb-2 block text-[12px] font-medium tracking-[0] text-brand-muted">{label}</span>
    <span className="relative block">
      <Icon
        size={16}
        strokeWidth={1.9}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted/75 transition-colors duration-200 group-focus-within:text-brand-accent"
      />
      <input
        autoComplete={autoComplete}
        className="h-12 w-full rounded-[8px] border border-brand-border/80 bg-brand-bg/72 px-10 text-[14px] text-brand-text outline-none transition-all duration-200 placeholder:text-brand-muted/48 hover:border-brand-text/18 focus:border-brand-accent/55 focus:bg-brand-card focus:ring-4 focus:ring-brand-accent/[0.08]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
      {children}
    </span>
    <span className="mt-2 block min-h-4 text-[11px] leading-4 text-brand-muted/78">{hint}</span>
  </label>
);

const StatusMessage = ({ status }) => (
  <AnimatePresence mode="wait">
    {status && (
      <motion.div
        key={`${status.type}-${status.message}`}
        initial={{ opacity: 0, y: 6, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`flex items-start gap-2.5 rounded-[8px] border px-3.5 py-3 text-[12px] leading-5 ${
          status.type === 'success'
            ? 'border-emerald-200/70 bg-emerald-50/75 text-emerald-800'
            : 'border-rose-200/70 bg-rose-50/80 text-rose-800'
        }`}
      >
        {status.type === 'success' ? (
          <CheckCircle2 size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
        )}
        <span>{status.message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const AuthForm = ({ mode }) => {
  const copy = authModes[mode];
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTarget = useMemo(() => getRedirectTarget(location), [location]);
  const switchPath = getFallbackSwitchPath(location.pathname, mode);
  const isBusy = submitLoading || googleLoading;

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [authLoading, navigate, redirectTarget, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextEmail = email.trim();
    setStatus(null);

    if (!emailPattern.test(nextEmail)) {
      setStatus({ type: 'error', message: 'Enter a valid email address to continue.' });
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setStatus({ type: 'error', message: 'Use at least 8 characters for your password.' });
      return;
    }

    if (mode === 'login' && password.length < 6) {
      setStatus({ type: 'error', message: 'Enter your account password to continue.' });
      return;
    }

    setSubmitLoading(true);

    try {
      if (mode === 'login') {
        await signIn(nextEmail, password);
        setStatus({ type: 'success', message: copy.success });
      } else {
        const data = await signUp(nextEmail, password);
        setStatus({
          type: 'success',
          message: data?.session ? copy.success : copy.verifySuccess
        });
      }
    } catch (error) {
      console.error('[AuthForm] Email auth failed:', error);
      setStatus({ type: 'error', message: getAuthErrorMessage(error, mode) });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setStatus(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      setStatus({ type: 'success', message: 'Redirecting to Google.' });
    } catch (error) {
      console.error('[AuthForm] Google auth failed:', error);
      setGoogleLoading(false);
      setStatus({ type: 'error', message: getAuthErrorMessage(error, mode) });
    }
  };

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isBusy}
        className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-[8px] border border-brand-border/80 bg-brand-bg/72 px-4 text-[13px] font-medium text-brand-text transition-all duration-200 hover:-translate-y-px hover:border-brand-text/18 hover:bg-brand-card focus:outline-none focus:ring-4 focus:ring-brand-accent/[0.08] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55"
      >
        {googleLoading ? (
          <Loader2 size={16} strokeWidth={1.9} className="animate-spin text-brand-muted" />
        ) : (
          <GoogleMark className="h-4 w-4" />
        )}
        <span>{googleLoading ? copy.googleLoading : copy.googleIdle}</span>
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-brand-border/75" />
        <span className="text-[11px] text-brand-muted/78">or</span>
        <span className="h-px flex-1 bg-brand-border/75" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          autoComplete="email"
          hint="Use the email you want connected to Voxora."
          icon={Mail}
          label="Email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@domain.com"
          type="email"
          value={email}
        />

        <Field
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          hint={copy.passwordHint}
          icon={Lock}
          label="Password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === 'login' ? 'Your password' : '8 characters minimum'}
          type={showPassword ? 'text' : 'password'}
          value={password}
        >
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[8px] text-brand-muted transition-all duration-200 hover:bg-brand-border/35 hover:text-brand-text focus:outline-none focus:ring-4 focus:ring-brand-accent/[0.08] active:scale-[0.94]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
          </button>
        </Field>

        <StatusMessage status={status} />

        <button
          type="submit"
          disabled={isBusy}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-brand-text px-4 text-[13px] font-semibold text-brand-bg transition-all duration-200 hover:-translate-y-px hover:bg-black focus:outline-none focus:ring-4 focus:ring-brand-text/[0.12] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55"
        >
          {submitLoading ? (
            <>
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              {copy.submitLoading}
            </>
          ) : (
            <>
              {copy.submitIdle}
              <ArrowRight size={15} strokeWidth={1.9} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="pt-2 text-center text-[12px] leading-5 text-brand-muted">
        {copy.alternateText}{' '}
        <Link
          to={switchPath}
          className="font-medium text-brand-text underline decoration-brand-border underline-offset-4 transition-colors duration-200 hover:text-brand-accent hover:decoration-brand-accent"
        >
          {copy.alternateAction}
        </Link>
      </p>
    </motion.div>
  );
};
