'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BookingModalProps {
  onClose: () => void;
  /** The booking page URL to embed. Falls back to the default DNA scheduling link. */
  url?: string;
}

// Proper Google Calendar embed URL (calendar.google.com supports iframe embedding;
// calendar.app.google short links do NOT — they block X-Frame-Options).
const DEFAULT_BOOKING_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1E8bA8sb4SP7QBJw45-6zKwxVNFu6x7w4YMBABJ1qdiE9ALT7hGvOlJ2RUGcfV9LwopqFiGPGe?gv=true';

/**
 * Accepts either a plain URL or a raw <iframe> embed snippet (e.g. from Google Calendar).
 * If a snippet is detected, extracts and returns the src URL so it can be used in our modal.
 */
function extractBookingUrl(input: string): string {
  const trimmed = input?.trim() ?? '';
  if (!trimmed) return DEFAULT_BOOKING_URL;
  // If the input contains an <iframe>, pull the src attribute value
  if (trimmed.includes('<iframe')) {
    const match = trimmed.match(/\bsrc=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return trimmed;
}

export default function BookingModal({ onClose, url }: BookingModalProps) {
  const bookingUrl = extractBookingUrl(url ?? '');
  const [loaded, setLoaded] = useState(false);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(10,14,20,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '540px',
          height: '82vh',
          maxHeight: '720px',
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.925rem', color: '#0f0e0c' }}>
            Book a Discovery Call
          </span>
          <button
            onClick={onClose}
            aria-label="Close booking"
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Spinner while iframe loads */}
        {!loaded && (
          <div
            style={{
              position: 'absolute',
              inset: '56px 0 0 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              background: '#fafafa',
            }}
          >
            <style>{`@keyframes bm-spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '3px solid #eee',
                borderTopColor: '#2E7D5A',
                animation: 'bm-spin 0.7s linear infinite',
              }}
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.825rem', color: '#aaa' }}>
              Loading calendar…
            </span>
          </div>
        )}

        <iframe
          src={bookingUrl}
          title="Book a Discovery Call"
          style={{ flex: 1, border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
