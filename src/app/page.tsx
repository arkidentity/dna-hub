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
        nav { padding: 1rem 1.5rem !important; }
        .lp-site-footer { flex-direction: column !important; gap: 1rem !important; padding: 2rem 1.5rem !important; text-align: center !important; }
        @media (min-width: 600px) {
          .lp-site-footer { flex-direction: row !important; }
        }
        /* Nav CTA label switching */
        .nav-cta-short { display: none; }
        .nav-cta-full { display: inline; }
        @media (max-width: 480px) {
          .nav-cta-short { display: inline; }
          .nav-cta-full { display: none; }
        }
      `}</style>
    </div>
  );
}
