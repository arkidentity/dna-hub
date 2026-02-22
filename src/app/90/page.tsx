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
        /* ── TABLET (≤ 900px) ── */
        @media (max-width: 900px) {
          /* Section padding */
          .tk-hero   { padding: 7rem 1.5rem 4rem !important; }
          .tk-intro  { padding: 4rem 1.5rem !important; }
          .tk-tools  { padding: 4rem 1.5rem !important; }
          .tk-result { padding: 4rem 1.5rem !important; }
          .tk-cta    { padding: 4rem 1.5rem !important; }

          /* Hero stats wrap naturally — already flex-wrap */

          /* Intro timeline: drop to 2-col (dot line + content) */
          .tk-timeline-row  { grid-template-columns: 20px 1fr !important; gap: 0 1rem !important; }
          .tk-timeline-time { display: none !important; }
          .tk-timeline-line { width: 100% !important; }

          /* Tool card container: prevent inner overflow */
          .tk-tools-list { margin-left: 0 !important; margin-right: 0 !important; }

          /* Tool cards */
          .tk-card-header { padding: 1.75rem 1.25rem 0 !important; }
          .tk-week-badge  { display: none !important; }
          .tk-card-body   { padding: 0 1.25rem !important; grid-template-columns: 1fr !important; }
          .tk-card-image  { display: none !important; }
          .tk-accordion-btn  { padding: 0.9rem 1.25rem !important; }
          .tk-accordion-body { padding: 1rem 1.25rem 1.25rem !important; }

          /* Result grid */
          .tk-result-grid { grid-template-columns: 1fr !important; }

          /* Pull quote */
          .tk-pull-quote { padding: 1.75rem 1.5rem !important; }

          /* Nav + footer */
          nav { padding: 1rem 1.25rem !important; }
          .lp-site-footer {
            flex-direction: column !important;
            gap: 1rem !important;
            padding: 2rem 1.25rem !important;
            text-align: center !important;
          }
        }

        /* ── MOBILE (≤ 600px) ── */
        @media (max-width: 600px) {
          .tk-hero   { padding: 6rem 1rem 3rem !important; }
          .tk-intro  { padding: 3rem 1rem !important; }
          .tk-tools  { padding: 3rem 1rem !important; }
          .tk-result { padding: 3rem 1rem !important; }
          .tk-cta    { padding: 3rem 1rem !important; }

          /* Tool cards */
          .tk-card-body   { padding: 0 1rem !important; }
          .tk-card-header { padding: 1.5rem 1rem 0 !important; }
          .tk-accordion-btn  { padding: 0.9rem 1rem !important; }
          .tk-accordion-body { padding: 1rem 1rem 1.25rem !important; }

          /* Pull quote tighter on small screens */
          .tk-pull-quote { padding: 1.25rem 1rem !important; margin-top: 2.5rem !important; }

          /* Result grid items tighter */
          .tk-result-grid > div { padding: 1.25rem 1rem !important; }

          /* CTA buttons stack */
          .tk-cta-buttons { flex-direction: column !important; align-items: stretch !important; }
          .tk-cta-buttons a { text-align: center !important; }
        }
      `}</style>
    </div>
  );
}
