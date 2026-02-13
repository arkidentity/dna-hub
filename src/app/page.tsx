'use client';

import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import WhatDNA from '@/components/landing/WhatDNA';
import Tools from '@/components/landing/Tools';
import Phases from '@/components/landing/Phases';
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
          .hero-section { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hero-right { min-height: 380px; }
          .hero-left { padding: 4rem 2rem !important; }
          .lp-problem, .lp-what, .lp-tools, .lp-phases, .lp-manual, .lp-partner, .lp-faq {
            padding: 4rem 2rem !important;
          }
          .lp-problem-inner { grid-template-columns: 1fr !important; gap: 3rem !important; }
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
      `}</style>
    </div>
  );
}
