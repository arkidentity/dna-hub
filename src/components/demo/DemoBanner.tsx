'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import BookingModal from '@/components/demo/BookingModal';

/**
 * DemoBanner
 *
 * A top banner shown when a prospect is viewing the Hub in demo mode.
 * Shows only "Back to demo" + "Book a Call" — minimal and unobtrusive.
 * Hidden on narrow viewports (mobile / iframe embed widths).
 *
 * Demo mode is signalled by localStorage keys set by HubDemoClient:
 *   - dna_demo_mode = '1'
 *   - dna_demo_page_url = '/demo/<slug>'
 *   - dna_demo_booking_url = '<booking URL>' (optional)
 *
 * Dismissing the banner clears all keys so it doesn't reappear.
 */
export default function DemoBanner() {
  const [show, setShow] = useState(false);
  const [demoPageUrl, setDemoPageUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    try {
      const mode = localStorage.getItem('dna_demo_mode');
      const pageUrl = localStorage.getItem('dna_demo_page_url');
      const bUrl = localStorage.getItem('dna_demo_booking_url');
      if (mode === '1') {
        setShow(true);
        setDemoPageUrl(pageUrl ?? '');
        setBookingUrl(bUrl ?? '');
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.removeItem('dna_demo_mode');
      localStorage.removeItem('dna_demo_church');
      localStorage.removeItem('dna_demo_page_url');
      localStorage.removeItem('dna_demo_booking_url');
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @media (max-width: 500px) {
          .demo-banner-top { display: none !important; }
        }
      `}</style>
      <div
        className="demo-banner-top"
        style={{
          background: '#1a3a52',
          borderBottom: '1px solid rgba(232,181,98,0.3)',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {demoPageUrl && (
            <a
              href={demoPageUrl}
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.8rem',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to demo
            </a>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={() => setBookingOpen(true)}
            style={{
              background: '#e8b562',
              color: '#1a2332',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.25rem 0.875rem',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Book a Call →
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss demo banner"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.25rem',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} url={bookingUrl} />}
    </>
  );
}
