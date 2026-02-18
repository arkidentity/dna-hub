'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  launchGuideData,
  getPhaseCount,
  getTotalChecklistItems,
} from '@/lib/launch-guide-data';

interface PhaseProgress {
  phaseId: number;
  completed: boolean;
  completedAt: string | null;
  checklistCompleted: string[];
  sectionChecks: string[];
}

interface LaunchGuideProgress {
  phases: PhaseProgress[];
  currentPhase: number;
  totalChecklistCompleted: number;
  isGuideComplete: boolean;
}

interface UserData {
  name: string | null;
  progress: LaunchGuideProgress;
}

export default function LaunchGuidePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/training/launch-guide');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load launch guide');
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
      <div className="launch-guide-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading launch guide...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="launch-guide-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Something went wrong loading the launch guide.'}</p>
          <Link href="/training" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const { progress } = user;
  const totalItems = getTotalChecklistItems();
  const progressPercent = Math.round(
    (progress.totalChecklistCompleted / totalItems) * 100
  );

  function getPhaseStatus(
    phaseId: number
  ): 'completed' | 'current' | 'locked' | 'accessible' {
    const phaseProgress = progress.phases.find((p) => p.phaseId === phaseId);
    if (phaseProgress?.completed) return 'completed';
    if (phaseId === progress.currentPhase) return 'current';
    if (phaseId < progress.currentPhase) return 'completed';

    // Check if previous phase has enough progress to allow "look ahead"
    if (phaseId > 0) {
      const prevPhaseProgress = progress.phases.find((p) => p.phaseId === phaseId - 1);
      const prevPhase = launchGuideData.phases.find((p) => p.id === phaseId - 1);
      const prevTotalSectionChecks = prevPhase?.sections.filter(s => s.sectionCheck).length || 0;
      const prevCompletedChecks = prevPhaseProgress?.sectionChecks?.length || 0;

      if (prevTotalSectionChecks > 0 && prevCompletedChecks >= Math.ceil(prevTotalSectionChecks * 0.5)) {
        return 'accessible';
      }
    }

    return 'locked';
  }

  function getPhaseChecklistProgress(phaseId: number): {
    completed: number;
    total: number;
  } {
    const phase = launchGuideData.phases.find((p) => p.id === phaseId);
    const phaseProgress = progress.phases.find((p) => p.phaseId === phaseId);
    return {
      completed: phaseProgress?.checklistCompleted?.length || 0,
      total: phase?.checklist.length || 0,
    };
  }

  return (
    <div className="launch-guide-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training" className="back-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1>{launchGuideData.title}</h1>
          <p className="subtitle">{launchGuideData.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="guide-main">
        <div className="guide-container">
          {/* Progress Overview */}
          <section className="progress-section">
            <div className="progress-card">
              <div className="progress-info">
                <span className="progress-label">Your Progress</span>
                <span className="progress-count">
                  {progress.totalChecklistCompleted} of {totalItems} items
                  complete
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {progress.isGuideComplete && (
                <div className="completion-badge">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Launch Guide Complete!
                </div>
              )}
            </div>
          </section>

          {/* Introduction */}
          <section className="intro-section">
            <div className="intro-card">
              <p>{launchGuideData.introduction.split('\n\n')[0]}</p>
              <p className="intro-highlight">
                <strong>Remember:</strong> Discipleship is both flow and
                structure. This guide provides the structure, but the Holy
                Spirit provides the life.
              </p>
            </div>
          </section>

          {/* Key Reminders */}
          <section className="reminders-section">
            <h2>Key Reminders</h2>
            <div className="reminders-grid">
              {launchGuideData.keyReminders.map((reminder, i) => (
                <div key={i} className="reminder-card">
                  <h4>{reminder.title}</h4>
                  <p>{reminder.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Phases List */}
          <section className="phases-section">
            <h2>{getPhaseCount()} Phases</h2>
            <div className="phases-grid">
              {launchGuideData.phases.map((phase) => {
                const status = getPhaseStatus(phase.id);
                const checklistProgress = getPhaseChecklistProgress(phase.id);
                const timelineInfo = launchGuideData.timeline.find(
                  (t) => t.phase === phase.id
                );

                return (
                  <div key={phase.id} className={`phase-card ${status}`}>
                    <div className="phase-number">
                      {status === 'completed' ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : status === 'locked' ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <span>{phase.id}</span>
                      )}
                    </div>
                    <div className="phase-content">
                      <h3>{phase.title}</h3>
                      <p className="phase-tagline">{phase.tagline}</p>
                      {timelineInfo && (
                        <div className="phase-details">
                          <p className="phase-focus">
                            <strong>Focus:</strong> {timelineInfo.focus}
                          </p>
                          <p className="phase-milestone">
                            <strong>Milestone:</strong> {timelineInfo.milestone}
                          </p>
                        </div>
                      )}
                      <div className="phase-meta">
                        <span className="phase-duration">{phase.duration}</span>
                        {(status !== 'locked' && status !== 'accessible') && (
                          <span className="checklist-progress">
                            {checklistProgress.completed}/
                            {checklistProgress.total} checklist items
                          </span>
                        )}
                        {status === 'accessible' && (
                          <span className="preview-label">Preview available</span>
                        )}
                      </div>
                    </div>
                    <div className="phase-action">
                      {status === 'locked' ? (
                        <span className="locked-label">Locked</span>
                      ) : status === 'completed' ? (
                        <Link
                          href={`/training/launch-guide/${phase.id}`}
                          className="btn-secondary"
                        >
                          Review
                        </Link>
                      ) : status === 'accessible' ? (
                        <Link
                          href={`/training/launch-guide/${phase.id}`}
                          className="btn-tertiary"
                        >
                          Preview
                        </Link>
                      ) : (
                        <Link
                          href={`/training/launch-guide/${phase.id}`}
                          className="btn-primary"
                        >
                          {checklistProgress.completed > 0
                            ? 'Continue'
                            : 'Start'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Final Thoughts Preview */}
          {progress.isGuideComplete && (
            <section className="final-thoughts-section">
              <h2>{launchGuideData.finalThoughts.title}</h2>
              <div className="final-thoughts-grid">
                {launchGuideData.finalThoughts.items.map((item, i) => (
                  <div key={i} className="thought-card">
                    <h4>{item.title}</h4>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
              <p className="closing-statement">
                {launchGuideData.finalThoughts.closing}
              </p>
            </section>
          )}
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .launch-guide-page {
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
  .guide-main {
    padding: 32px 24px;
  }

  .guide-container {
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

  /* Intro Section */
  .intro-section {
    margin-bottom: 32px;
  }

  .intro-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
  }

  .intro-card p {
    color: #E2E8F0;
    line-height: 1.7;
    margin: 0 0 16px 0;
  }

  .intro-card p:last-child {
    margin-bottom: 0;
  }

  .intro-highlight {
    padding: 16px;
    background: rgba(212, 168, 83, 0.1);
    border-left: 4px solid #D4A853;
    border-radius: 0 8px 8px 0;
    font-style: italic;
  }

  /* Reminders Section */
  .reminders-section {
    margin-bottom: 32px;
  }

  .reminders-section h2 {
    font-size: 18px;
    font-weight: 600;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
  }

  .reminders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .reminder-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 20px;
    border-left: 4px solid #D4A853;
  }

  .reminder-card h4 {
    color: #D4A853;
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .reminder-card p {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }

  /* Phases Section */
  .phases-section {
    margin-bottom: 48px;
  }

  .phases-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 20px 0;
  }

  .phases-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .phase-card {
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

  .phase-card:hover:not(.locked) {
    transform: translateY(-2px);
  }

  .phase-card.current {
    border-color: #D4A853;
  }

  .phase-card.completed {
    border-color: #4A9E7F;
  }

  .phase-card.locked {
    opacity: 0.6;
  }

  .phase-card.accessible {
    border-color: rgba(45, 106, 106, 0.5);
    opacity: 0.85;
  }

  .phase-number {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
  }

  .phase-card.current .phase-number {
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
  }

  .phase-card.completed .phase-number {
    background: rgba(74, 158, 127, 0.15);
    color: #4A9E7F;
  }

  .phase-card.locked .phase-number {
    background: #1A2332;
    color: #5A6577;
  }

  .phase-card.accessible .phase-number {
    background: rgba(45, 106, 106, 0.15);
    color: #2D6A6A;
  }

  .phase-content h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #FFFFFF;
  }

  .phase-tagline {
    font-size: 14px;
    color: #A0AEC0;
    font-style: italic;
    margin: 0 0 8px 0;
  }

  .phase-meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
  }

  .phase-duration {
    color: #5A6577;
  }

  .checklist-progress {
    color: #D4A853;
  }

  .preview-label {
    color: #2D6A6A;
    font-style: italic;
  }

  .phase-details {
    margin: 12px 0;
    padding: 12px;
    background: #1A2332;
    border-radius: 8px;
  }

  .phase-focus,
  .phase-milestone {
    font-size: 13px;
    color: #A0AEC0;
    margin: 0 0 6px 0;
    line-height: 1.5;
  }

  .phase-focus:last-child,
  .phase-milestone:last-child {
    margin-bottom: 0;
  }

  .phase-focus strong,
  .phase-milestone strong {
    color: #D4A853;
  }

  .phase-action {
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

  .btn-tertiary {
    display: inline-block;
    padding: 10px 20px;
    background: transparent;
    color: #2D6A6A;
    border: 2px solid #2D6A6A;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-tertiary:hover {
    background: rgba(45, 106, 106, 0.1);
  }

  .locked-label {
    color: #5A6577;
    font-size: 14px;
    font-weight: 500;
  }

  /* Final Thoughts Section */
  .final-thoughts-section {
    background: #242D3D;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
  }

  .final-thoughts-section h2 {
    color: #D4A853;
    font-size: 24px;
    margin: 0 0 24px 0;
  }

  .final-thoughts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .thought-card {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px;
    text-align: left;
  }

  .thought-card h4 {
    color: #D4A853;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .thought-card p {
    color: #A0AEC0;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }

  .closing-statement {
    color: #D4A853;
    font-size: 20px;
    font-weight: 700;
    font-style: italic;
    margin: 0;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .phase-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .phase-number {
      margin: 0 auto;
    }

    .phase-meta {
      justify-content: center;
    }

    .phase-action {
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

    .meeting-segment {
      flex-direction: column;
      text-align: center;
    }
  }
`;
