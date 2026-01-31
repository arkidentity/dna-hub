'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserJourney {
  current_stage: string;
  milestones: Record<string, { completed: boolean; completed_at?: string }>;
}

interface ContentUnlocks {
  flow_assessment: boolean;
  manual_session_1: boolean;
  manual_session_2: boolean;
  manual_session_3: boolean;
  manual_session_4: boolean;
  manual_session_5: boolean;
  manual_session_6: boolean;
  launch_guide: boolean;
  toolkit_90day: boolean;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  journey: UserJourney;
  unlocks: ContentUnlocks;
  flowAssessment: {
    exists: boolean;
    completed: boolean;
    completedAt: string | null;
    canRetake: boolean;
    daysUntilRetake: number | null;
  } | null;
}

export default function TrainingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/training/dashboard');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load dashboard');
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
      <div className="training-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your dashboard...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="training-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Something went wrong loading your dashboard.'}</p>
          <Link href="/login" className="btn-primary">
            Log In Again
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'there';
  const flowAssessmentComplete = user.flowAssessment?.completed || false;

  return (
    <div className="training-page">
      {/* Page Title */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>DNA Training</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h2>Welcome back, {firstName}!</h2>
            <p className="stage-label">
              Stage: <span>{formatStage(user.journey.current_stage)}</span>
            </p>
          </section>

          {/* Journey Progress */}
          <section className="journey-section">
            <h3>Your Journey</h3>

            {/* Flow Assessment Card */}
            <div className={`journey-card ${flowAssessmentComplete ? 'completed' : 'current'}`}>
              <div className="card-icon">
                {flowAssessmentComplete ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </div>
              <div className="card-content">
                <h4>Flow Assessment</h4>
                <p>
                  {flowAssessmentComplete
                    ? 'Completed! Identify your roadblocks and create an action plan.'
                    : 'Identify internal roadblocks that could hinder your effectiveness as a leader.'}
                </p>
                {user.flowAssessment?.completedAt && (
                  <p className="completed-date">
                    Completed {new Date(user.flowAssessment.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="card-action">
                {flowAssessmentComplete ? (
                  <>
                    <Link href="/training/assessment/results" className="btn-secondary">
                      View Results
                    </Link>
                    {user.flowAssessment?.canRetake && (
                      <Link href="/training/assessment" className="btn-tertiary">
                        Retake
                      </Link>
                    )}
                    {!user.flowAssessment?.canRetake && user.flowAssessment?.daysUntilRetake && (
                      <p className="retake-note">
                        Retake available in {user.flowAssessment.daysUntilRetake} days
                      </p>
                    )}
                  </>
                ) : (
                  <Link href="/training/assessment" className="btn-primary">
                    Begin Assessment
                  </Link>
                )}
              </div>
            </div>

            {/* DNA Manual Card */}
            <div className={`journey-card ${!flowAssessmentComplete ? 'locked' : user.journey.milestones.manual_complete?.completed ? 'completed' : 'unlocked'}`}>
              <div className="card-icon">
                {!flowAssessmentComplete ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                )}
              </div>
              <div className="card-content">
                <h4>DNA Manual</h4>
                <p>
                  {!flowAssessmentComplete
                    ? 'Complete the Flow Assessment to unlock'
                    : '6 sessions covering the heart and theology of multiplication discipleship.'}
                </p>
              </div>
              <div className="card-action">
                {flowAssessmentComplete ? (
                  <Link href="/training/manual" className="btn-primary">
                    Start Manual
                  </Link>
                ) : (
                  <span className="locked-label">Locked</span>
                )}
              </div>
            </div>

            {/* Launch Guide Card */}
            <div className={`journey-card ${!user.journey.milestones.manual_complete?.completed ? 'locked' : 'unlocked'}`}>
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="card-content">
                <h4>Launch Guide</h4>
                <p>
                  {!user.journey.milestones.manual_complete?.completed
                    ? 'Complete the DNA Manual to unlock'
                    : '5 phases to prepare for launching your first DNA group.'}
                </p>
              </div>
              <div className="card-action">
                {user.journey.milestones.manual_complete?.completed ? (
                  <Link href="/training/launch-guide" className="btn-primary">
                    View Guide
                  </Link>
                ) : (
                  <span className="locked-label">Locked</span>
                )}
              </div>
            </div>

            {/* Create Group Card */}
            <div className={`journey-card ${!user.journey.milestones.launch_guide_reviewed?.completed ? 'locked' : 'unlocked'}`}>
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="card-content">
                <h4>Create Your DNA Group</h4>
                <p>
                  {!user.journey.milestones.launch_guide_reviewed?.completed
                    ? 'Complete the Launch Guide to unlock'
                    : 'Start leading your first DNA discipleship group!'}
                </p>
              </div>
              <div className="card-action">
                {user.journey.milestones.launch_guide_reviewed?.completed ? (
                  <Link href="/groups/new" className="btn-primary">
                    Create Group
                  </Link>
                ) : (
                  <span className="locked-label">Locked</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

function formatStage(stage: string): string {
  const stages: Record<string, string> = {
    onboarding: 'Getting Started',
    training: 'In Training',
    launching: 'Preparing to Launch',
    growing: 'Growing',
    multiplying: 'Multiplying'
  };
  return stages[stage] || stage;
}

const styles = `
  .training-page {
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
    display: inline-block;
    padding: 14px 28px;
    background: #D4A853;
    color: #1A2332;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
  }

  /* Page Title Header */
  .dashboard-header {
    background: #242D3D;
    border-bottom: 1px solid #3D4A5C;
    padding: 16px 24px;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-content h1 {
    color: #D4A853;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  /* Main */
  .dashboard-main {
    padding: 32px 24px;
  }

  .dashboard-container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Welcome Section */
  .welcome-section {
    margin-bottom: 32px;
  }

  .welcome-section h2 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }

  .stage-label {
    color: #A0AEC0;
    font-size: 16px;
    margin: 0;
  }

  .stage-label span {
    color: #D4A853;
    font-weight: 600;
  }

  /* Journey Section */
  .journey-section h3 {
    font-size: 18px;
    font-weight: 600;
    color: #A0AEC0;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Journey Cards */
  .journey-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    align-items: center;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }

  .journey-card.current {
    border-color: #D4A853;
  }

  .journey-card.completed {
    border-color: #4A9E7F;
  }

  .journey-card.locked {
    opacity: 0.6;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1A2332;
  }

  .journey-card.current .card-icon {
    background: rgba(212, 168, 83, 0.1);
    color: #D4A853;
  }

  .journey-card.completed .card-icon {
    background: rgba(74, 158, 127, 0.1);
    color: #4A9E7F;
  }

  .journey-card.locked .card-icon {
    color: #5A6577;
  }

  .journey-card.unlocked .card-icon {
    background: rgba(212, 168, 83, 0.1);
    color: #D4A853;
  }

  .card-content h4 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #FFFFFF;
  }

  .card-content p {
    font-size: 14px;
    color: #A0AEC0;
    margin: 0;
    line-height: 1.5;
  }

  .completed-date {
    color: #4A9E7F !important;
    font-size: 13px !important;
    margin-top: 8px !important;
  }

  .card-action {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
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
    color: #D4A853;
    border: 2px solid #D4A853;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-secondary:hover {
    background: #D4A853;
    color: #1A2332;
  }

  .btn-tertiary {
    display: inline-block;
    padding: 8px 16px;
    background: transparent;
    color: #A0AEC0;
    border: 1px solid #3D4A5C;
    border-radius: 6px;
    font-size: 13px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .btn-tertiary:hover {
    border-color: #A0AEC0;
    color: #FFFFFF;
  }

  .locked-label {
    color: #5A6577;
    font-size: 14px;
    font-weight: 500;
  }

  .retake-note {
    color: #5A6577;
    font-size: 12px;
    margin: 0;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .journey-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .card-icon {
      margin: 0 auto;
    }

    .card-action {
      align-items: center;
      margin-top: 8px;
    }

    .welcome-section h2 {
      font-size: 24px;
    }
  }
`;
