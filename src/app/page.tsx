'use client';

import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import WhatDNA from '@/components/landing/WhatDNA';
import Tools from '@/components/landing/Tools';
import Phases from '@/components/landing/Phases';
import Manual from '@/components/landing/Manual';
import Partner from '@/components/landing/Partner';
import Pullquote from '@/components/landing/Pullquote';
import FAQ from '@/components/landing/FAQ';
import FooterCTA from '@/components/landing/FooterCTA';
import SiteFooter from '@/components/landing/SiteFooter';

export default function Home() {
  useScrollFadeIn();

  return (
    <div
      className="landing-page"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: 'var(--lp-paper)',
        color: 'var(--lp-ink)',
        overflowX: 'hidden',
      }}
    >
      <LandingNav />
      <Hero />
      <Manual />
      <Problem />
      <WhatDNA />
      <Tools />
      <Phases />
      <Partner />
      <Pullquote />
      <FAQ />
      <FooterCTA />
      <SiteFooter />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .hero-section { padding: 7rem 2rem 4rem !important; max-width: 100% !important; }
          .lp-problem, .lp-what, .lp-tools, .lp-phases, .lp-manual, .lp-partner, .lp-faq {
            padding: 4rem 2rem !important;
          }
          .lp-problem-inner, .lp-manual-inner { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .lp-what-header { grid-template-columns: 1fr !important; gap: 2rem !important; }
          #lp-pillars, #lp-partner-steps { grid-template-columns: 1fr !important; }
          .lp-pillar { border-right: none !important; border-bottom: 1px solid var(--lp-rule) !important; }
          #lp-tools-grid { grid-template-columns: 1fr !important; }
          .lp-step-arrow { display: none !important; }
          #lp-partner-cta { flex-direction: column !important; padding: 2.5rem 2rem !important; align-items: flex-start !important; }
          .lp-footer-form { flex-direction: column !important; }
          nav { padding: 1rem 1.5rem !important; }
          .lp-site-footer { flex-direction: column !important; gap: 1rem !important; padding: 2rem 1.5rem !important; text-align: center !important; }
        }
        /* Minimum readable font size for small print across all screen sizes */
        .lp-trust-line, .lp-form-hint { font-size: 0.875rem !important; }
        @media (max-width: 600px) {
          .lp-trust-line, .lp-form-hint { font-size: 0.9rem !important; }
        }
      `}</style>
    </div>
  );
}
