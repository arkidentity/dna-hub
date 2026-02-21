'use client';

import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import LandingNav from '@/components/landing/LandingNav';
import SiteFooter from '@/components/landing/SiteFooter';
import ToolkitHero from './components/ToolkitHero';
import ToolkitIntro from './components/ToolkitIntro';
import ToolkitTools from './components/ToolkitTools';
import ToolkitResult from './components/ToolkitResult';

export default function ToolkitPage() {
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
      <ToolkitHero />
      <ToolkitIntro />
      <ToolkitTools />
      <ToolkitResult />
      <SiteFooter />

      <style>{`
        @media (max-width: 900px) {
          .tk-hero { padding: 7rem 2rem 4rem !important; }
          .tk-intro { padding: 4rem 2rem !important; }
          .tk-tools { padding: 4rem 2rem !important; }
          .tk-result { padding: 4rem 2rem !important; }
          .tk-tool-card { grid-template-columns: 1fr !important; }
          .tk-result-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          nav { padding: 1rem 1.5rem !important; }
          .lp-site-footer { flex-direction: column !important; gap: 1rem !important; padding: 2rem 1.5rem !important; text-align: center !important; }
        }
        @media (max-width: 600px) {
          .tk-hero { padding: 6rem 1.5rem 3rem !important; }
          .tk-intro { padding: 3rem 1.5rem !important; }
          .tk-tools { padding: 3rem 1.5rem !important; }
          .tk-result { padding: 3rem 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
