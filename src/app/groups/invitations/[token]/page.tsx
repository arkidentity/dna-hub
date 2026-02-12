'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface InvitationData {
  id: string;
  status: string;
  expires_at: string;
  group: { id: string; group_name: string };
  invited_leader: { id: string; name: string; email: string };
  invited_by: { id: string; name: string; email: string };
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/groups/invitations/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invitation not found');
          setErrorStatus(data.status || null);
        } else {
          setInvitation(data.invitation);
        }
      } catch {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    fetchInvitation();
  }, [token]);

  const handleRespond = async (action: 'accept' | 'decline') => {
    setResponding(true);
    try {
      const res = await fetch(`/api/groups/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (res.status === 401 && data.requiresLogin) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/groups/invitations/${token}`);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to respond to invitation');
        setResponding(false);
        return;
      }

      setDone(action === 'accept' ? 'accepted' : 'declined');
    } catch {
      setError('Something went wrong. Please try again.');
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (done === 'accepted') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconSuccess}>✓</div>
          <h1 style={styles.heading}>You&apos;re in!</h1>
          <p style={styles.body}>
            You&apos;ve joined <strong>{invitation?.group.group_name}</strong> as co-leader.
          </p>
          <Link href="/groups" style={styles.btnPrimary}>Go to My Groups</Link>
        </div>
      </div>
    );
  }

  if (done === 'declined') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconMuted}>✕</div>
          <h1 style={styles.heading}>Invitation Declined</h1>
          <p style={styles.body}>
            You&apos;ve declined the co-leader invitation for <strong>{invitation?.group.group_name}</strong>.
          </p>
          <Link href="/groups" style={styles.btnSecondary}>Go to My Groups</Link>
        </div>
      </div>
    );
  }

  if (error) {
    const statusMessages: Record<string, string> = {
      accepted: 'This invitation has already been accepted.',
      declined: 'This invitation was already declined.',
      cancelled: 'This invitation was cancelled by the group leader.',
      expired: 'This invitation has expired.',
    };

    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconWarning}>!</div>
          <h1 style={styles.heading}>Invitation Unavailable</h1>
          <p style={styles.body}>
            {errorStatus ? statusMessages[errorStatus] || error : error}
          </p>
          <Link href="/groups" style={styles.btnSecondary}>Go to My Groups</Link>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconInvite}>✉</div>
        <h1 style={styles.heading}>Co-Leader Invitation</h1>
        <p style={styles.body}>
          <strong>{invitation.invited_by.name || invitation.invited_by.email}</strong> has invited you to
          co-lead the DNA group <strong>{invitation.group.group_name}</strong>.
        </p>
        <p style={styles.subText}>
          As co-leader, you&apos;ll have full access to manage the group alongside the primary leader.
        </p>

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.actions}>
          <button
            onClick={() => handleRespond('accept')}
            disabled={responding}
            style={styles.btnPrimary}
          >
            {responding ? 'Processing...' : 'Accept Invitation'}
          </button>
          <button
            onClick={() => handleRespond('decline')}
            disabled={responding}
            style={styles.btnDecline}
          >
            Decline
          </button>
        </div>

        <p style={styles.expiry}>
          Expires {new Date(invitation.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1A2332',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#242D3D',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #3D4A5C',
    borderTopColor: '#D4A853',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#A0AEC0',
    fontSize: '16px',
  },
  iconSuccess: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(74, 158, 127, 0.15)',
    color: '#4A9E7F',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  iconMuted: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(90, 101, 119, 0.2)',
    color: '#5A6577',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  iconWarning: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(212, 168, 83, 0.15)',
    color: '#D4A853',
    fontSize: '28px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  iconInvite: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(212, 168, 83, 0.15)',
    color: '#D4A853',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  body: {
    color: '#CBD5E0',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  subText: {
    color: '#A0AEC0',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '32px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  btnPrimary: {
    display: 'inline-block',
    padding: '14px 28px',
    background: '#D4A853',
    color: '#1A2332',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    display: 'inline-block',
    padding: '14px 28px',
    background: 'transparent',
    color: '#D4A853',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    border: '2px solid #D4A853',
    cursor: 'pointer',
  },
  btnDecline: {
    display: 'inline-block',
    padding: '14px 28px',
    background: 'transparent',
    color: '#A0AEC0',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    border: '1px solid #3D4A5C',
    cursor: 'pointer',
  },
  expiry: {
    color: '#5A6577',
    fontSize: '13px',
  },
  errorText: {
    color: '#FC8181',
    fontSize: '14px',
    marginBottom: '16px',
  },
};
