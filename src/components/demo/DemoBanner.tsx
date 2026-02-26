'use client';

import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import BookingModal from '@/components/demo/BookingModal';

/**
 * DemoBanner
 *
 * A fixed top banner shown when a prospect is viewing the Hub in demo mode.
 * Demo mode is signalled by localStorage keys set by HubDemoClient after
 * the auth session is established:
 *   - dna_demo_mode = '1'
 *   - dna_demo_church = '<church name>'
 *   - dna_demo_page_url = '/demo/<slug>'
 *
 * Dismissing the banner clears all keys so it doesn't reappear.
 */
export default function DemoBanner() {
  const [show, setShow] = useState(false);
  const [churchName, setChurchName] = useState('');
  const [demoPageUrl, setDemoPageUrl] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    try {
      const mode = localStorage.getItem('dna_demo_mode');
      const church = localStorage.getItem('dna_demo_church');
      const pageUrl = localStorage.getItem('dna_demo_page_url');
      if (mode === '1') {
        setShow(true);
        setChurchName(church ?? '');
        setDemoPageUrl(pageUrl ?? '');
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
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div
        style={{
          background: '#1a3a52',
          borderBottom: '1px solid rgba(232,181,98,0.3)',
          padding: '0.625rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <Info
          className="w-4 h-4 flex-shrink-0"
          style={{ color: '#e8b562' }}
        />
        <span style={{ color: '#f5f0e8', fontSize: '0.875rem', fontWeight: 500 }}>
          You&apos;re previewing a demo of{churchName ? ` ${churchName}'s` : ''} DNA Hub.{' '}
          <span style={{ opacity: 0.7 }}>This is sample data only.</span>
        </span>
        {demoPageUrl && (
          <a
            href={demoPageUrl}
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8rem',
              fontWeight: 500,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.3)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              paddingBottom: '1px',
            }}
          >
            ← Back to demo
          </a>
        )}
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
            position: 'absolute',
            right: '1rem',
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

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </>
  );
}
