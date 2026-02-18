'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dnaManualData, getSessionCount, getTotalLessons } from '@/lib/dna-manual-data';

interface SessionProgress {
  sessionId: number;
  completed: boolean;
  completedAt: string | null;
  lessonsCompleted: number[];
}

interface ManualProgress {
  sessions: SessionProgress[];
  currentSession: number;
  totalCompleted: number;
  isManualComplete: boolean;
}

interface UserData {
  name: string | null;
  progress: ManualProgress;
}

export default function DNAManualPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/training/manual');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load manual');
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="manual-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading manual...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="manual-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Something went wrong loading the manual.'}</p>
          <Link href="/training" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const { progress } = user;
  const progressPercent = Math.round((progress.totalCompleted / getSessionCount()) * 100);

  function getSessionStatus(sessionId: number): 'completed' | 'current' | 'locked' {
    const sessionProgress = progress.sessions.find(s => s.sessionId === sessionId);
    if (sessionProgress?.completed) return 'completed';
    if (sessionId === progress.currentSession) return 'current';
    if (sessionId < progress.currentSession) return 'completed';
    return 'locked';
  }

  return (
    <div className="manual-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1>{dnaManualData.title}</h1>
          <p className="subtitle">{dnaManualData.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="manual-main">
        <div className="manual-container">
          {/* Progress Overview */}
          <section className="progress-section">
            <div className="progress-card">
              <div className="progress-info">
                <span className="progress-label">Your Progress</span>
                <span className="progress-count">
                  {progress.totalCompleted} of {getSessionCount()} sessions complete
                </span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
              {progress.isManualComplete && (
                <div className="completion-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Manual Complete!
                </div>
              )}
            </div>
          </section>

          {/* Epigraph */}
          <section className="epigraph-section">
            <blockquote>
              <p>{dnaManualData.epigraph.text}</p>
              <cite>— {dnaManualData.epigraph.reference}</cite>
            </blockquote>
          </section>

          {/* Teleios Definition */}
          <section className="teleios-section">
            <div className="teleios-card">
              <h3>
                <span className="greek-term">{dnaManualData.teleiosDefinition.term}</span>
                <span className="greek-label">{dnaManualData.teleiosDefinition.language}</span>
              </h3>
              <ol className="teleios-definitions">
                {dnaManualData.teleiosDefinition.definitions.map((def, i) => (
                  <li key={i}>{def}</li>
                ))}
              </ol>
            </div>
          </section>

          {/* Sessions List */}
          <section className="sessions-section">
            <h2>6 Sessions</h2>
            <div className="sessions-grid">
              {dnaManualData.sessions.map((session) => {
                const status = getSessionStatus(session.id);
                const lessonCount = session.lessons.length;
                const sessionProgress = progress.sessions.find(s => s.sessionId === session.id);
                const lessonsCompleted = sessionProgress?.lessonsCompleted?.length || 0;

                return (
                  <div key={session.id} className={`session-card ${status}`}>
                    <div className="session-number">
                      {status === 'completed' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : status === 'locked' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <span>{session.id}</span>
                      )}
                    </div>
                    <div className="session-content">
                      <h3>{session.title}</h3>
                      <p className="session-verse">"{session.verse.substring(0, 80)}..."</p>
                      <div className="session-meta">
                        <span className="lesson-count">{lessonCount} lessons</span>
                        {status === 'current' && lessonsCompleted > 0 && (
                          <span className="lessons-progress">
                            {lessonsCompleted}/{lessonCount} complete
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="session-action">
                      {status === 'locked' ? (
                        <span className="locked-label">Locked</span>
                      ) : status === 'completed' ? (
                        <Link href={`/training/manual/${session.id}`} className="btn-secondary">
                          Review
                        </Link>
                      ) : (
                        <Link href={`/training/manual/${session.id}`} className="btn-primary">
                          {lessonsCompleted > 0 ? 'Continue' : 'Start'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Exponential Growth Visual */}
          <section className="exponential-section">
            <h3>Let's Get Exponential</h3>
            <div className="exponential-grid">
              {[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536].map((num, i) => (
                <div key={num} className="exponential-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  {num.toLocaleString()}
                </div>
              ))}
            </div>
            <p className="exponential-caption">This is the math of multiplication discipleship.</p>
          </section>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .manual-page {
    min-height: 100vh;
    background: #1A2332;
    color: #FFFFFF;
  }

  .loading-container,
  .error-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }

  .loading-container .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #3D4A5C;
    border-top-color: #D4A853;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-container p,
  .error-container p {
    color: #A0AEC0;
    font-size: 16px;
  }

  .error-container h1 {
    color: #D4A853;
    font-size: 32px;
    margin-bottom: 16px;
  }

  .error-container .btn-primary {
    margin-top: 24px;
  }

  /* Page Header */
  .page-header {
    background: #242D3D;
    border-bottom: 1px solid #3D4A5C;
    padding: 24px;
  }

  .header-content {
    max-width: 900px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #A0AEC0;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 16px;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #D4A853;
  }

  .header-content h1 {
    color: #D4A853;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }

  .subtitle {
    color: #A0AEC0;
    font-size: 16px;
    margin: 0;
  }

  /* Main */
  .manual-main {
    padding: 32px 24px;
  }

  .manual-container {
    max-width: 900px;
    margin: 0 auto;
  }

  /* Progress Section */
  .progress-section {
    margin-bottom: 32px;
  }

  .progress-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .progress-label {
    font-size: 14px;
    font-weight: 600;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .progress-count {
    font-size: 14px;
    color: #D4A853;
    font-weight: 600;
  }

  .progress-bar-container {
    height: 8px;
    background: #1A2332;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #D4A853, #E5B964);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .completion-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 8px 16px;
    background: rgba(74, 158, 127, 0.1);
    color: #4A9E7F;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  /* Epigraph */
  .epigraph-section {
    margin-bottom: 32px;
  }

  .epigraph-section blockquote {
    background: #242D3D;
    border-left: 4px solid #D4A853;
    border-radius: 0 12px 12px 0;
    padding: 24px 28px;
    margin: 0;
  }

  .epigraph-section blockquote p {
    font-size: 15px;
    line-height: 1.7;
    color: #E2E8F0;
    font-style: italic;
    margin: 0 0 12px 0;
  }

  .epigraph-section cite {
    font-size: 13px;
    color: #D4A853;
    font-style: normal;
    font-weight: 600;
  }

  /* Teleios Section */
  .teleios-section {
    margin-bottom: 40px;
  }

  .teleios-card {
    background: linear-gradient(135deg, #242D3D 0%, #2D3748 100%);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #3D4A5C;
  }

  .teleios-card h3 {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0 0 16px 0;
  }

  .greek-term {
    font-size: 24px;
    color: #D4A853;
    font-weight: 700;
  }

  .greek-label {
    font-size: 14px;
    color: #A0AEC0;
    font-weight: 400;
  }

  .teleios-definitions {
    margin: 0;
    padding-left: 20px;
    color: #E2E8F0;
  }

  .teleios-definitions li {
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 1.5;
  }

  .teleios-definitions li:last-child {
    margin-bottom: 0;
  }

  /* Sessions Section */
  .sessions-section {
    margin-bottom: 48px;
  }

  .sessions-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 20px 0;
  }

  .sessions-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .session-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    align-items: center;
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.2s;
  }

  .session-card:hover:not(.locked) {
    transform: translateY(-2px);
  }

  .session-card.current {
    border-color: #D4A853;
  }

  .session-card.completed {
    border-color: #4A9E7F;
  }

  .session-card.locked {
    opacity: 0.6;
  }

  .session-number {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
  }

  .session-card.current .session-number {
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
  }

  .session-card.completed .session-number {
    background: rgba(74, 158, 127, 0.15);
    color: #4A9E7F;
  }

  .session-card.locked .session-number {
    background: #1A2332;
    color: #5A6577;
  }

  .session-content h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 6px 0;
    color: #FFFFFF;
  }

  .session-verse {
    font-size: 14px;
    color: #A0AEC0;
    font-style: italic;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .session-meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
  }

  .lesson-count {
    color: #5A6577;
  }

  .lessons-progress {
    color: #D4A853;
  }

  .session-action {
    display: flex;
    align-items: center;
  }

  .btn-primary {
    display: inline-block;
    padding: 12px 24px;
    background: #D4A853;
    color: #1A2332;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-primary:hover {
    background: #E5B964;
  }

  .btn-secondary {
    display: inline-block;
    padding: 10px 20px;
    background: transparent;
    color: #4A9E7F;
    border: 2px solid #4A9E7F;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-secondary:hover {
    background: #4A9E7F;
    color: #1A2332;
  }

  .locked-label {
    color: #5A6577;
    font-size: 14px;
    font-weight: 500;
  }

  /* Exponential Section */
  .exponential-section {
    background: #242D3D;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
  }

  .exponential-section h3 {
    font-size: 20px;
    color: #D4A853;
    margin: 0 0 24px 0;
  }

  .exponential-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .exponential-item {
    padding: 8px 16px;
    background: #1A2332;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #E2E8F0;
    animation: fadeIn 0.5s ease forwards;
    opacity: 0;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  .exponential-caption {
    color: #A0AEC0;
    font-size: 14px;
    font-style: italic;
    margin: 0;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .session-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .session-number {
      margin: 0 auto;
    }

    .session-meta {
      justify-content: center;
    }

    .session-action {
      justify-content: center;
      margin-top: 8px;
    }

    .header-content h1 {
      font-size: 24px;
    }

    .progress-info {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
  }
`;
