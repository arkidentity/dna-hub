'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dnaManualData, getSession, Session, Lesson, ContentBlock } from '@/lib/dna-manual-data';

interface SessionProgress {
  completed: boolean;
  lessonsCompleted: number[];
}

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = parseInt(resolvedParams.sessionId);
  const router = useRouter();
  const [session, setSessionData] = useState<Session | null>(null);
  const [progress, setProgress] = useState<SessionProgress>({ completed: false, lessonsCompleted: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLessons, setExpandedLessons] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get session data
        const sessionData = getSession(sessionId);
        if (!sessionData) {
          setError('Session not found');
          setIsLoading(false);
          return;
        }
        setSessionData(sessionData);

        // Expand first lesson by default
        setExpandedLessons([1]);

        // Fetch progress from API
        const response = await fetch(`/api/training/manual/sessions/${sessionId}`);

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          router.push('/training/manual');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
          // If there's progress, expand the next incomplete lesson
          if (data.progress.lessonsCompleted.length > 0) {
            const nextLesson = data.progress.lessonsCompleted.length + 1;
            if (nextLesson <= sessionData.lessons.length) {
              setExpandedLessons([nextLesson]);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [sessionId, router]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const markLessonComplete = async (lessonId: number) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/training/manual/sessions/${sessionId}/lessons/${lessonId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);

        // If there's a next lesson, expand it
        const nextLessonId = lessonId + 1;
        if (session && nextLessonId <= session.lessons.length) {
          setExpandedLessons([nextLessonId]);
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const result = await response.json().catch(() => ({}));
        setSaveError(result.error || 'Failed to save progress. Please try again.');
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      setSaveError('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const completeSession = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/training/manual/sessions/${sessionId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        // Navigate to next session or back to manual
        const nextSessionId = sessionId + 1;
        if (nextSessionId <= dnaManualData.sessions.length) {
          router.push(`/training/manual/${nextSessionId}`);
        } else {
          router.push('/training/manual');
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const result = await response.json().catch(() => ({}));
        setSaveError(result.error || 'Failed to complete session. Please try again.');
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
      setSaveError('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="session-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading session...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="session-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Session not found.'}</p>
          <Link href="/training/manual" className="btn-primary">
            Back to Manual
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const allLessonsComplete = session.lessons.every(l => progress.lessonsCompleted.includes(l.id));
  const progressPercent = Math.round((progress.lessonsCompleted.length / session.lessons.length) * 100);

  return (
    <div className="session-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training/manual" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Manual
          </Link>
          <div className="session-badge">Session {session.id}</div>
          <h1>{session.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="session-main">
        <div className="session-container">
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">Lesson Progress</span>
              <span className="progress-count">{progress.lessonsCompleted.length}/{session.lessons.length}</span>
            </div>
            <div className="progress-bar-container">
              <div className={`progress-bar ${progressPercent === 100 ? 'complete' : ''}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Session Verse */}
          <div className="session-verse-card">
            <blockquote>
              <p>"{session.verse}"</p>
              <cite>— {session.verseRef}</cite>
            </blockquote>
          </div>

          {/* Warm Up Questions */}
          <div className="warmup-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Warm Up
            </h3>
            <ul className="warmup-questions">
              {session.warmUp.map((question, i) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </div>

          {/* Lessons */}
          <div className="lessons-section">
            <h2>Lessons</h2>
            {saveError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#FCA5A5', fontSize: '14px' }}>
                {saveError}
              </div>
            )}
            <div className="lessons-list">
              {session.lessons.map((lesson) => {
                const isComplete = progress.lessonsCompleted.includes(lesson.id);
                const isExpanded = expandedLessons.includes(lesson.id);
                const isPreviousComplete = lesson.id === 1 || progress.lessonsCompleted.includes(lesson.id - 1);

                return (
                  <div key={lesson.id} className={`lesson-card ${isComplete ? 'completed' : ''} ${!isPreviousComplete ? 'locked' : ''}`}>
                    <button
                      className="lesson-header"
                      onClick={() => isPreviousComplete && toggleLesson(lesson.id)}
                      disabled={!isPreviousComplete}
                    >
                      <div className="lesson-number">
                        {isComplete ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        ) : !isPreviousComplete ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ) : (
                          <span>{lesson.id}</span>
                        )}
                      </div>
                      <div className="lesson-info">
                        <h4>{lesson.title}</h4>
                        <span className="lesson-duration">{lesson.duration}</span>
                      </div>
                      <div className="lesson-toggle">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && isPreviousComplete && (
                      <div className="lesson-content">
                        {lesson.content.map((block, i) => (
                          <ContentBlockRenderer key={i} block={block} />
                        ))}

                        {!isComplete && (
                          <button
                            className="btn-complete"
                            onClick={() => markLessonComplete(lesson.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Mark as Complete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Complete Button */}
          {allLessonsComplete && !progress.completed && (
            <div className="session-complete-section">
              <button className="btn-session-complete" onClick={completeSession} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Complete Session & Continue'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="session-navigation">
            {sessionId > 1 && (
              <Link href={`/training/manual/${sessionId - 1}`} className="nav-link prev">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Previous Session
              </Link>
            )}
            {sessionId < dnaManualData.sessions.length && progress.completed && (
              <Link href={`/training/manual/${sessionId + 1}`} className="nav-link next">
                Next Session
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="content-paragraph">{block.text}</p>;

    case 'scripture':
      return (
        <div className="scripture-block">
          <p className="scripture-text">"{block.text}"</p>
          <cite className="scripture-ref">— {block.ref}</cite>
        </div>
      );

    case 'keyDefinition':
      return (
        <div className="key-definition">
          <p>{block.text}</p>
        </div>
      );

    case 'discussion':
      return (
        <div className="discussion-block">
          <span className="block-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {block.label || 'Discussion'}
          </span>
          {block.text && <p>{block.text}</p>}
          {block.questions && (
            <ul>
              {block.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      );

    case 'reflection':
      return (
        <div className="reflection-block">
          <span className="block-label">{block.label || 'Reflection'}</span>
          {block.text && <p>{block.text}</p>}
          {block.questions && (
            <ul>
              {block.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          )}
        </div>
      );

    case 'checklist':
      return (
        <ul className="checklist">
          {block.items?.map((item, i) => (
            <li key={i}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      );

    case 'numbered':
      return (
        <ol className="numbered-list">
          {block.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );

    case 'header':
      return <h4 className="content-header">{block.title}</h4>;

    default:
      return null;
  }
}

const styles = `
  .session-page {
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

  /* Page Header */
  .page-header {
    background: #242D3D;
    border-bottom: 1px solid #3D4A5C;
    padding: 24px;
  }

  .header-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #A0AEC0;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 12px;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #D4A853;
  }

  .session-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .header-content h1 {
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
  }

  /* Main */
  .session-main {
    padding: 32px 24px;
  }

  .session-container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Progress Section */
  .progress-section {
    margin-bottom: 24px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .progress-label {
    font-size: 14px;
    color: #A0AEC0;
  }

  .progress-count {
    font-size: 14px;
    color: #D4A853;
    font-weight: 600;
  }

  .progress-bar-container {
    height: 6px;
    background: #3D4A5C;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: #D4A853;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  .progress-bar.complete {
    background: #2E7D5E;
  }

  /* Session Verse */
  .session-verse-card {
    background: #242D3D;
    border-left: 4px solid #D4A853;
    border-radius: 0 12px 12px 0;
    padding: 24px;
    margin-bottom: 24px;
  }

  .session-verse-card blockquote {
    margin: 0;
  }

  .session-verse-card p {
    font-size: 16px;
    line-height: 1.7;
    color: #E2E8F0;
    font-style: italic;
    margin: 0 0 12px 0;
  }

  .session-verse-card cite {
    font-size: 14px;
    color: #D4A853;
    font-style: normal;
    font-weight: 600;
  }

  /* Warm Up — Green block */
  .warmup-section {
    background: #2E7D5E;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 32px;
  }

  .warmup-section h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #D4A853;
    margin: 0 0 10px 0;
  }

  .warmup-questions {
    margin: 0;
    padding-left: 20px;
    color: #FFFFFF;
  }

  .warmup-questions li {
    margin-bottom: 8px;
    font-size: 1rem;
    line-height: 1.6;
  }

  .warmup-questions li:last-child {
    margin-bottom: 0;
  }

  /* Lessons Section */
  .lessons-section h2 {
    font-size: 18px;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
  }

  .lessons-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .lesson-card {
    background: #242D3D;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }

  .lesson-card.completed {
    border-color: #4A9E7F;
  }

  .lesson-card.locked {
    opacity: 0.6;
  }

  .lesson-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: #FFFFFF;
  }

  .lesson-header:disabled {
    cursor: not-allowed;
  }

  .lesson-number {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    background: #1A2332;
    color: #D4A853;
    border: 1px solid #D4A853;
  }

  .lesson-card.completed .lesson-number {
    background: #2E7D5E;
    color: #FFFFFF;
    border: none;
  }

  .lesson-card.locked .lesson-number {
    color: #5A6577;
    border-color: #3D4A5C;
  }

  .lesson-info {
    flex: 1;
  }

  .lesson-info h4 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
  }

  .lesson-duration {
    font-size: 13px;
    color: #5A6577;
  }

  .lesson-toggle {
    color: #5A6577;
    transition: transform 0.2s;
  }

  .lesson-toggle svg {
    transition: transform 0.2s;
  }

  /* Lesson Content */
  .lesson-content {
    padding: 0 24px 24px 24px;
    border-top: 1px solid #3D4A5C;
    margin-top: 0;
  }

  .content-paragraph {
    font-size: 15px;
    line-height: 1.7;
    color: #E2E8F0;
    margin: 20px 0;
  }

  .content-header {
    font-size: 16px;
    font-weight: 600;
    color: #D4A853;
    margin: 24px 0 12px 0;
  }

  /* Scripture — Cream block */
  .scripture-block {
    background: #F5F0E8;
    border-left: 3px solid #D4A853;
    border-radius: 6px;
    padding: 16px 20px;
    margin: 20px 0;
  }

  .scripture-block + .scripture-block {
    margin-top: 8px;
  }

  .scripture-text {
    color: #0D0D0D;
    font-style: italic;
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0 0 8px 0;
  }

  .scripture-ref {
    color: #D4A853;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    font-style: normal;
  }

  /* Key Definition — Gold top/bottom rule */
  .key-definition {
    background: #1A2332;
    border-top: 2px solid #D4A853;
    border-bottom: 2px solid #D4A853;
    border-radius: 4px;
    padding: 18px 20px;
    margin: 24px 0;
  }

  .key-definition p {
    color: #D4A853;
    font-weight: 600;
    font-size: 1.05rem;
    line-height: 1.55;
    margin: 0;
  }

  /* Discussion — Green block */
  .discussion-block {
    background: #2E7D5E;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 24px 0;
  }

  .discussion-block .block-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #D4A853;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .discussion-block p {
    color: #FFFFFF;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .discussion-block p:last-child {
    margin-bottom: 0;
  }

  .discussion-block ul {
    margin: 0;
    padding-left: 20px;
    color: #FFFFFF;
  }

  .discussion-block li {
    margin-bottom: 8px;
    font-size: 1rem;
    line-height: 1.6;
  }

  .discussion-block li:last-child {
    margin-bottom: 0;
  }

  /* Reflection — Cream2 block */
  .reflection-block {
    background: #EDE8DE;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 24px 0;
  }

  .reflection-block .block-label {
    display: block;
    color: #2E7D5E;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .reflection-block p {
    color: #0D0D0D;
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0 0 8px 0;
  }

  .reflection-block p:last-child {
    margin-bottom: 0;
  }

  .reflection-block ul {
    margin: 0;
    padding-left: 20px;
    color: #0D0D0D;
  }

  .reflection-block li {
    margin-bottom: 8px;
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .reflection-block li:last-child {
    margin-bottom: 0;
  }

  .checklist {
    list-style: none;
    margin: 20px 0;
    padding: 0;
  }

  .checklist li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 15px;
    color: #E2E8F0;
    line-height: 1.5;
  }

  .checklist li svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: #4A9E7F;
  }

  .numbered-list {
    margin: 20px 0;
    padding-left: 24px;
    color: #E2E8F0;
  }

  .numbered-list li {
    margin-bottom: 12px;
    font-size: 15px;
    line-height: 1.6;
  }

  .btn-complete {
    display: block;
    width: 100%;
    padding: 14px 24px;
    background: #D4A853;
    color: #1A2332;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 24px;
    transition: background 0.2s;
  }

  .btn-complete:hover:not(:disabled) {
    background: #E5B964;
  }

  .btn-complete:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Session Complete */
  .session-complete-section {
    margin-top: 32px;
    padding: 24px;
    background: linear-gradient(135deg, rgba(74, 158, 127, 0.1) 0%, rgba(74, 158, 127, 0.05) 100%);
    border: 1px solid rgba(74, 158, 127, 0.3);
    border-radius: 12px;
    text-align: center;
  }

  .btn-session-complete {
    padding: 16px 32px;
    background: #4A9E7F;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-session-complete:hover:not(:disabled) {
    background: #5AB88F;
  }

  .btn-session-complete:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Navigation */
  .session-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #3D4A5C;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #A0AEC0;
    text-decoration: none;
    font-size: 14px;
    padding: 10px 16px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .nav-link:hover {
    background: #242D3D;
    color: #D4A853;
  }

  .nav-link.next {
    margin-left: auto;
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
  }

  /* Mobile */
  @media (max-width: 640px) {
    .header-content h1 {
      font-size: 24px;
    }

    .lesson-header {
      padding: 16px;
    }

    .lesson-content {
      padding: 0 16px 16px 16px;
    }
  }
`;
