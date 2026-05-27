import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { VoxoraGlyph } from './AuthBrand';

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

const waveformBars = [34, 52, 26, 68, 42, 88, 56, 73, 38, 62, 46, 78, 31, 58, 44, 66, 36];

const getAlternatePath = (pathname, mode) => {
  const alternate = mode === 'login' ? 'signup' : 'login';
  return pathname === '/auth' ? `/auth?mode=${alternate}` : `/${alternate}`;
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
      className={`relative min-h-[420px] overflow-hidden rounded-[8px] border border-brand-border/70 bg-[#f7f4ef] p-7 shadow-[0_24px_80px_rgba(17,17,17,0.05)] md:p-10 lg:min-h-0 ${
        isSignup ? 'lg:order-2' : ''
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.055),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(17,17,17,0.045),transparent_30%)]" />
      <div className="absolute inset-x-8 top-1/2 h-px bg-brand-text/[0.06]" />
      <div className="absolute bottom-8 left-8 right-8 top-24 rounded-[8px] border border-brand-border/45 bg-white/[0.18]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-12">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-brand-text transition-colors duration-200 hover:text-brand-accent"
            aria-label="Voxora workspace"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[8px] border border-brand-border/80 bg-brand-card/80 transition-transform duration-200 group-hover:scale-[0.97]">
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
          <motion.div
            initial={{ opacity: 0, scaleX: reduceMotion ? 1 : 0.92 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex h-28 items-center gap-2 rounded-[8px] border border-brand-border/45 bg-brand-card/45 px-5"
            aria-hidden="true"
          >
            {waveformBars.map((height, index) => (
              <motion.span
                key={`${mode}-wave-${index}`}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        height: [`${Math.max(18, height - 18)}%`, `${height}%`, `${Math.max(16, height - 10)}%`],
                        opacity: [0.34, 0.72, 0.44]
                      }
                }
                transition={{
                  duration: 4.4 + index * 0.08,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                  delay: index * 0.06
                }}
                className="w-full rounded-full bg-brand-text/35"
                style={{ height: `${height}%` }}
              />
            ))}
          </motion.div>

          <h1 className="max-w-[620px] font-display text-[clamp(2.35rem,6vw,5.6rem)] font-semibold leading-[1.02] tracking-[0] text-brand-text">
            {copy.visualTitle}
          </h1>
          <p className="mt-6 max-w-[430px] text-[15px] leading-7 text-brand-muted">{copy.visualBody}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[copy.detailOne, copy.detailTwo, copy.detailThree].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[8px] border border-brand-border/55 bg-brand-card/50 px-3.5 py-3"
            >
              <span className="block text-[11px] font-medium text-brand-muted">0{index + 1}</span>
              <span className="mt-1 block text-[13px] font-medium text-brand-text">{item}</span>
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
    <main className="relative min-h-screen overflow-hidden bg-brand-bg px-4 py-4 text-brand-text sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.66),rgba(250,249,246,0)_38%),radial-gradient(circle_at_52%_12%,rgba(37,99,235,0.045),transparent_30%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1380px] gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-5">
        {!isSignup && <AuthVisual mode={mode} />}

        <section className="flex min-h-[620px] items-center justify-center rounded-[8px] border border-brand-border/60 bg-brand-card/82 px-5 py-8 shadow-[0_22px_70px_rgba(17,17,17,0.045)] sm:px-8 lg:min-h-0">
          <div className="w-full max-w-[410px] lg:-mt-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-[13px] font-semibold text-brand-text lg:hidden"
                aria-label="Voxora workspace"
              >
                <VoxoraGlyph className="h-4 w-4 text-brand-accent" />
                Voxora
              </Link>
              <Link
                to={alternatePath}
                className="group ml-auto inline-flex items-center gap-2 rounded-[8px] border border-brand-border/70 bg-brand-bg/70 px-3 py-2 text-[12px] font-medium text-brand-muted transition-all duration-200 hover:-translate-y-px hover:border-brand-text/20 hover:text-brand-text active:scale-[0.98]"
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
              <h2 className="font-display text-[clamp(2rem,4vw,2.65rem)] font-semibold leading-[1.04] tracking-[0] text-brand-text">
                {copy.formTitle}
              </h2>
              <p className="mt-4 max-w-[330px] text-[14px] leading-6 text-brand-muted">{copy.formBody}</p>
            </motion.div>

            {children}
          </div>
        </section>

        {isSignup && <AuthVisual mode={mode} />}
      </div>
    </main>
  );
};
