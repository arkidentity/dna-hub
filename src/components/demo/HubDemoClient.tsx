'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Church {
  name: string;
  subdomain: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string;
}

interface HubDemoClientProps {
  church: Church;
  events: CalEvent[];
  demoPageUrl: string;
  bookingUrl?: string;
  embed?: boolean;
}

// ─── Auth states ──────────────────────────────────────────────────────────────

type AuthState = 'loading' | 'redirecting' | 'error';

// ─── Loading / Entry Screen ───────────────────────────────────────────────────

function LoadingScreen({ church }: { church: Church }) {
  const primary = church.primary_color ?? '#143348';
  const accent = church.accent_color ?? '#e8b562';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f5f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        fontFamily: "'DM Sans', sans-serif",
        padding: '2rem',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <div style={{ textAlign: 'center' }}>
        {church.logo_url ? (
          <img src={church.logo_url} alt={church.name} style={{ height: '56px', objectFit: 'contain', marginBottom: '0.75rem' }} />
        ) : (
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 auto 0.75rem',
          }}>
            {church.name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f0e0c' }}>{church.name}</div>
        <div style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>DNA Hub · Leader Dashboard</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <Loader2
          className="animate-spin"
          style={{ width: '32px', height: '32px', color: accent }}
        />
        <div style={{ fontSize: '0.875rem', color: '#888' }}>Preparing your personalized demo…</div>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '1rem' }}>
        Powered by DNA Discipleship
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * HubDemoClient
 *
 * Authenticates as the Hub demo leader (via hub-session endpoint) and redirects
 * to the real /groups page. Works in both embed mode (inside demo page iframe)
 * and standalone mode (full page "Explore the full leader dashboard" link).
 *
 * The hub-session endpoint automatically falls back to the global demo church
 * credentials if the requesting church hasn't been individually hub-seeded.
 */
export default function HubDemoClient({ church, events: _events, demoPageUrl, bookingUrl, embed }: HubDemoClientProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    async function establishSession() {
      try {
        const res = await fetch(`/api/demo/hub-session/${church.subdomain}`);
        const data = await res.json();

        if (!data.demo_auth) {
          console.error('[DEMO] Hub session not available');
          setAuthState('error');
          return;
        }

        const supabase = createClientSupabase();
        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) {
          console.error('[DEMO] setSession error:', error.message);
          setAuthState('error');
          return;
        }

        setAuthState('redirecting');
        setTimeout(() => {
          window.location.href = '/groups';
        }, 600);
      } catch (err) {
        console.error('[DEMO] Hub session error:', err);
        setAuthState('error');
      }
    }

    void establishSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [church.subdomain, church.name, demoPageUrl, bookingUrl]);

  if (authState === 'loading' || authState === 'redirecting') {
    return <LoadingScreen church={church} />;
  }

  // Error fallback — minimal message
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f5f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: "'DM Sans', sans-serif",
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f0e0c' }}>Dashboard preview unavailable</div>
      <div style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.6 }}>
        The leader dashboard demo is being set up.
      </div>
      {!embed && demoPageUrl && (
        <a
          href={demoPageUrl}
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: church.primary_color ?? '#143348',
            fontWeight: 600,
            textDecoration: 'none',
            borderBottom: `1px solid ${church.primary_color ?? '#143348'}`,
          }}
        >
          ← Back to demo page
        </a>
      )}
    </div>
  );
}
