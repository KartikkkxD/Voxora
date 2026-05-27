import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { VoxoraGlyph } from './AuthBrand';
import { useTheme } from '../../hooks/useTheme';

const pageCopy = {
  login: {
    switchText: 'New to Voxora?',
    switchAction: 'Create an account',
    visualTitle: 'Return to the room where your voice becomes text.',
    visualBody:
      'A quiet workspace for recordings, uploads, and transcripts that stay close to the words themselves.',
    formTitle: 'Welcome back.',
    formBody: 'Sign in to continue to your transcription workspace.',
    detailOne: 'Saved transcripts',
    detailTwo: 'Secure sessions',
    detailThree: 'Calm workspace'
  },
  signup: {
    switchText: 'Already have an account?',
    switchAction: 'Sign in',
    visualTitle: 'Begin with a clean space for every spoken thought.',
    visualBody:
      'Create your account and keep each recording connected to a simple, focused transcript history.',
    formTitle: 'Create your account.',
    formBody: 'Start with email or continue with Google.',
    detailOne: 'Capture',
    detailTwo: 'Transcribe',
    detailThree: 'Return'
  }
};

const scrambleGlyphs = 'aeiourstlnmvx0123456789';

const getAlternatePath = (pathname, mode) => {
  const alternate = mode === 'login' ? 'signup' : 'login';
  return pathname === '/auth' ? `/auth?mode=${alternate}` : `/${alternate}`;
};

const ScrambleText = ({ text, className = '' }) => {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const duration = 720;
    const startTime = performance.now();
    let frameId;

    const resolveCharacter = (character, index, progress) => {
      if (character === ' ' || /[.,]/.test(character)) {
        return character;
      }

      const revealPoint = index / Math.max(text.length, 1);
      const resolved = progress > revealPoint * 0.58 + 0.28;

      if (resolved || progress > 0.92) {
        return character;
      }

      if (Math.random() > 0.34 + progress * 0.42) {
        return character;
      }

      return scrambleGlyphs[(index + Math.floor(progress * 48) + Math.floor(Math.random() * 5)) % scrambleGlyphs.length];
    };

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplayText(
        text
          .split('')
          .map((character, index) => resolveCharacter(character, index, progress))
          .join('')
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [reduceMotion, text]);

  return (
    <span aria-label={text} className={className}>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
};

const TravellingWave = ({ mode }) => {
  const reduceMotion = useReducedMotion();
  const wavePath = 'M 4 47 C 29 16 55 16 80 47 S 131 78 156 47 207 16 232 47 283 78 308 47 359 16 384 47';
  const accentPath = 'M 4 49 C 34 34 55 34 80 49 S 132 64 158 49 208 34 234 49 284 64 310 49 358 34 384 49';
  const transition = {
    duration: mode === 'signup' ? 4.8 : 4.35,
    repeat: Infinity,
    ease: [0.45, 0, 0.25, 1]
  };

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: reduceMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.08, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-7 h-[92px] overflow-hidden rounded-[8px] border border-brand-border/45 bg-brand-card/42 px-4 dark:border-white/[0.08] dark:bg-white/[0.035]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.34),transparent_24%,transparent_76%,rgba(255,255,255,0.2))] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.035),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
      <svg viewBox="0 0 388 94" className="relative h-full w-full overflow-visible text-brand-text dark:text-white">
        <motion.path
          d={wavePath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="7"
          className="opacity-[0.12] dark:opacity-[0.14]"
          animate={reduceMotion ? undefined : { x: [-34, 34, -34] }}
          transition={{ ...transition, duration: transition.duration + 1.2 }}
        />
        <motion.path
          d={accentPath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4.5"
          strokeDasharray="46 310"
          className="opacity-[0.34] dark:opacity-[0.46]"
          animate={reduceMotion ? undefined : { strokeDashoffset: [260, -170], x: [-14, 14] }}
          transition={transition}
        />
        <motion.path
          d={wavePath}
          fill="none"
          stroke="var(--brand-accent)"
          strokeLinecap="round"
          strokeWidth="3"
          strokeDasharray="18 230"
          className="opacity-[0.44] dark:opacity-[0.6]"
          animate={reduceMotion ? undefined : { strokeDashoffset: [180, -160], x: [-20, 20] }}
          transition={{ ...transition, delay: 0.18, duration: transition.duration + 0.45 }}
        />
        <motion.circle
          r="3.4"
          cy="47"
          fill="var(--brand-accent)"
          className="opacity-60"
          animate={reduceMotion ? undefined : { cx: [18, 370], opacity: [0, 0.58, 0] }}
          transition={{ duration: transition.duration, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
        />
      </svg>
    </motion.div>
  );
};

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group absolute right-5 top-5 z-30 inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-brand-border/65 bg-brand-card/55 text-brand-muted shadow-[0_14px_38px_rgba(17,17,17,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-px hover:border-brand-text/20 hover:bg-brand-card/80 hover:text-brand-text active:scale-[0.94] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-400 dark:shadow-[0_16px_42px_rgba(0,0,0,0.28)] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="relative grid h-4 w-4 place-items-center">
        <Sun
          size={16}
          strokeWidth={1.9}
          className={`absolute transition-all duration-300 ${
            isDark ? 'rotate-45 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          size={16}
          strokeWidth={1.9}
          className={`absolute transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-45 scale-75 opacity-0'
          }`}
        />
      </span>
    </button>
  );
};

const AuthVisual = ({ mode }) => {
  const reduceMotion = useReducedMotion();
  const copy = pageCopy[mode];
  const isSignup = mode === 'signup';

  return (
    <motion.aside
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={`relative min-h-[420px] overflow-hidden rounded-[8px] border border-brand-border/70 bg-[#f7f4ef] p-7 shadow-[0_24px_80px_rgba(17,17,17,0.05)] md:p-9 lg:h-full lg:min-h-0 dark:border-white/[0.08] dark:bg-[#151514] dark:shadow-[0_28px_90px_rgba(0,0,0,0.36)] ${
        isSignup ? 'lg:order-2' : ''
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.05),transparent_32%),radial-gradient(circle_at_82%_78%,rgba(17,17,17,0.04),transparent_30%)] dark:bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.13),transparent_34%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.05),transparent_30%)]" />
      <div className="absolute inset-x-8 top-1/2 h-px bg-brand-text/[0.055] dark:bg-white/[0.055]" />
      <div className="absolute bottom-7 left-7 right-7 top-20 rounded-[8px] border border-brand-border/42 bg-white/[0.16] dark:border-white/[0.055] dark:bg-white/[0.025]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-brand-text transition-colors duration-200 hover:text-brand-accent dark:text-zinc-100 dark:hover:text-brand-accent"
            aria-label="Voxora workspace"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[8px] border border-brand-border/80 bg-brand-card/80 shadow-[0_8px_24px_rgba(17,17,17,0.04)] transition-transform duration-200 group-hover:scale-[0.96] dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-[0_10px_28px_rgba(0,0,0,0.24)]">
              <VoxoraGlyph className="h-[17px] w-[17px] text-brand-accent" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-[0]">Voxora</span>
          </Link>

          <div className="hidden items-center gap-2 text-[12px] text-brand-muted sm:flex">
            <span>{copy.switchText}</span>
            <ArrowRight size={13} strokeWidth={1.8} />
          </div>
        </div>

        <div className="max-w-[560px]">
          <TravellingWave mode={mode} />

          <h1 className="max-w-[620px] font-display text-[clamp(2.25rem,4.35vw,4.05rem)] font-semibold leading-[1.02] tracking-[0] text-brand-text dark:text-zinc-50">
            <ScrambleText key={`${mode}-visual-title`} text={copy.visualTitle} />
          </h1>
          <p className="mt-5 max-w-[430px] text-[14px] leading-6 text-brand-muted dark:text-zinc-400">
            <ScrambleText key={`${mode}-visual-body`} text={copy.visualBody} />
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[copy.detailOne, copy.detailTwo, copy.detailThree].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[8px] border border-brand-border/55 bg-brand-card/46 px-3.5 py-2.5 shadow-[0_8px_26px_rgba(17,17,17,0.025)] backdrop-blur-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
            >
              <span className="block text-[11px] font-medium text-brand-muted dark:text-zinc-500">0{index + 1}</span>
              <span className="mt-1 block text-[13px] font-medium text-brand-text dark:text-zinc-200">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
};

export const AuthFrame = ({ mode, children }) => {
  const location = useLocation();
  const copy = pageCopy[mode];
  const alternatePath = getAlternatePath(location.pathname, mode);
  const isSignup = mode === 'signup';

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FAF9F6] px-4 py-4 text-brand-text transition-colors duration-300 dark:bg-[#10100F] dark:text-zinc-50 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.66),rgba(250,249,246,0)_38%),radial-gradient(circle_at_52%_12%,rgba(37,99,235,0.045),transparent_30%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.035),rgba(16,16,15,0)_42%),radial-gradient(circle_at_52%_12%,rgba(59,130,246,0.085),transparent_32%)]" />
      <ThemeToggle />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1380px] gap-4 lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:grid-cols-[1.08fr_0.92fr] lg:gap-5">
        {!isSignup && <AuthVisual mode={mode} />}

        <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden rounded-[8px] border border-white/60 bg-white/[0.54] px-5 py-8 shadow-[0_24px_90px_rgba(17,17,17,0.07),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition-colors duration-300 sm:px-8 lg:h-full lg:min-h-0 dark:border-white/[0.08] dark:bg-[#171717]/[0.58] dark:shadow-[0_28px_94px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.055)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.6),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.28),transparent_48%)] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.055),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_50%)]" />
          <div className="relative z-10 w-full max-w-[410px]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-[13px] font-semibold text-brand-text transition-colors duration-200 hover:text-brand-accent dark:text-zinc-100 lg:hidden"
                aria-label="Voxora workspace"
              >
                <VoxoraGlyph className="h-4 w-4 text-brand-accent" />
                Voxora
              </Link>
              <Link
                to={alternatePath}
                className="group ml-auto inline-flex items-center gap-2 rounded-[8px] border border-brand-border/70 bg-brand-bg/68 px-3 py-2 text-[12px] font-medium text-brand-muted shadow-[0_10px_28px_rgba(17,17,17,0.035)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-brand-text/20 hover:bg-brand-card/82 hover:text-brand-text active:scale-[0.97] dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-zinc-400 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.075] dark:hover:text-zinc-100"
              >
                {copy.switchAction}
                <ArrowRight size={13} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <motion.div
              key={`${mode}-copy`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
              className="mb-5"
            >
              <h2 className="font-display text-[clamp(1.95rem,3.6vw,2.42rem)] font-semibold leading-[1.04] tracking-[0] text-brand-text dark:text-zinc-50">
                <ScrambleText key={`${mode}-form-title`} text={copy.formTitle} />
              </h2>
              <p className="mt-3 max-w-[330px] text-[13px] leading-6 text-brand-muted dark:text-zinc-400">
                <ScrambleText key={`${mode}-form-body`} text={copy.formBody} />
              </p>
            </motion.div>

            {children}
          </div>
        </section>

        {isSignup && <AuthVisual mode={mode} />}
      </div>
    </main>
  );
};
