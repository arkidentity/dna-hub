'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toolkit90DayData } from '@/lib/toolkit-90day-data';

interface WeekProgress {
  week_number: number;
  completed: boolean;
  completed_at: string | null;
}

interface ToolkitProgress {
  weeks: WeekProgress[];
  completedCount: number;
  totalWeeks: number;
}

export default function ToolkitOverviewPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ToolkitProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/training/toolkit');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load toolkit progress');
        }

        const data = await response.json();
        setProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [router]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getMonthCompletedCount(monthNumber: number): number {
    if (!progress) return 0;
    const startWeek = (monthNumber - 1) * 4 + 1;
    const endWeek = startWeek + 3;
    return progress.weeks
      .filter((w) => w.week_number >= startWeek && w.week_number <= endWeek && w.completed)
      .length;
  }

  function getMonthStatus(monthNumber: number): 'completed' | 'current' | 'future' {
    const completed = getMonthCompletedCount(monthNumber);
    if (completed === 4) return 'completed';

    // Current = first month that isn't fully complete
    for (let m = 1; m < monthNumber; m++) {
      if (getMonthCompletedCount(m) < 4) return 'future';
    }
    return 'current';
  }

  if (isLoading) {
    return (
      <div className="toolkit-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading toolkit...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="toolkit-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error}</p>
          <Link href="/training" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const completedCount = progress?.completedCount || 0;
  const totalWeeks = progress?.totalWeeks || 12;
  const progressPercent = Math.round((completedCount / totalWeeks) * 100);
  const isComplete = completedCount === totalWeeks;
  const { overview, months } = toolkit90DayData;

  return (
    <div className="toolkit-page">
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
            Training Dashboard
          </Link>
          <h1>{toolkit90DayData.title}</h1>
          <p className="subtitle">{toolkit90DayData.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="toolkit-main">
        <div className="toolkit-container">
          {/* Progress Bar */}
          <section className="progress-section">
            <div className="progress-card">
              <div className="progress-info">
                <span className="progress-label">Your Progress</span>
                <span className="progress-count">
                  {completedCount} of {totalWeeks} weeks complete
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className={`progress-bar ${isComplete ? 'complete' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isComplete && (
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
                  90-Day Toolkit Complete!
                </div>
              )}
            </div>
          </section>

          {/* Month Cards */}
          <section className="months-section">
            {months.map((month) => {
              const status = getMonthStatus(month.month);
              const completed = getMonthCompletedCount(month.month);

              return (
                <Link
                  key={month.month}
                  href={`/training/toolkit/month/${month.month}`}
                  className={`month-card ${status}`}
                >
                  <div className="month-header">
                    <div className="month-badge">
                      {status === 'completed' ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <span>Month {month.month}</span>
                      )}
                    </div>
                    <div className="month-completion">
                      {completed === 4 ? (
                        <span className="completion-check">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Complete
                        </span>
                      ) : (
                        <span className="completion-count">
                          {completed} of 4 complete
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="month-title">{month.title}</h3>
                  <p className="month-focus">{month.focus}</p>
                  <ul className="month-weeks-list">
                    {month.weeks.map((w) => {
                      const weekCompleted = progress?.weeks.find(
                        (pw) => pw.week_number === w.week
                      )?.completed;
                      return (
                        <li key={w.week} className={weekCompleted ? 'week-done' : ''}>
                          {weekCompleted ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="week-bullet" />
                          )}
                          <span>
                            Week {w.week}: {w.title}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Link>
              );
            })}
          </section>

          {/* Intro Paragraph */}
          <section className="intro-section">
            <div className="intro-card">
              <p>{overview.intro}</p>
            </div>
          </section>

          {/* Collapsible: Key Principles */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['principles'] ? 'open' : ''}`}
              onClick={() => toggleSection('principles')}
            >
              <h2>Key Principles</h2>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['principles'] && (
              <div className="accordion-content">
                <div className="principles-list">
                  {overview.keyPrinciples.map((principle, i) => (
                    <div key={i} className="principle-card">
                      <h4>{principle.title}</h4>
                      <p>{principle.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Collapsible: The Big Picture */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['bigPicture'] ? 'open' : ''}`}
              onClick={() => toggleSection('bigPicture')}
            >
              <h2>The Big Picture</h2>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['bigPicture'] && (
              <div className="accordion-content">
                {/* Desktop table */}
                <div className="big-picture-table">
                  <div className="table-header">
                    <span>Phase</span>
                    <span>Timeline</span>
                    <span>Focus</span>
                    <span>Leader Role</span>
                  </div>
                  {overview.bigPicture.map((row, i) => (
                    <div key={i} className="table-row">
                      <span className="table-phase">{row.phase}</span>
                      <span>{row.timeline}</span>
                      <span>{row.focus}</span>
                      <span>{row.leaderRole}</span>
                    </div>
                  ))}
                </div>
                {/* Mobile cards */}
                <div className="big-picture-cards">
                  {overview.bigPicture.map((row, i) => (
                    <div key={i} className="big-picture-card">
                      <h4>{row.phase}</h4>
                      <div className="bp-detail">
                        <span className="bp-label">Timeline:</span> {row.timeline}
                      </div>
                      <div className="bp-detail">
                        <span className="bp-label">Focus:</span> {row.focus}
                      </div>
                      <div className="bp-detail">
                        <span className="bp-label">Leader Role:</span> {row.leaderRole}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Collapsible: Leader Expectations */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['expectations'] ? 'open' : ''}`}
              onClick={() => toggleSection('expectations')}
            >
              <h2>Leader Expectations</h2>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['expectations'] && (
              <div className="accordion-content">
                <div className="expectations-grid">
                  <div className="expectation-group">
                    <h4>Before You Start</h4>
                    <ul className="checklist">
                      {overview.leaderExpectations.beforeStart.map((item, i) => (
                        <li key={i}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="expectation-group">
                    <h4>During the 90 Days</h4>
                    <ul className="checklist">
                      {overview.leaderExpectations.during.map((item, i) => (
                        <li key={i}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="expectation-group">
                    <h4>After Week 12</h4>
                    <ul className="checklist">
                      {overview.leaderExpectations.afterWeek12.map((item, i) => (
                        <li key={i}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Collapsible: Common Mistakes */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['mistakes'] ? 'open' : ''}`}
              onClick={() => toggleSection('mistakes')}
            >
              <h2>Common Mistakes</h2>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['mistakes'] && (
              <div className="accordion-content">
                <div className="mistakes-list">
                  {overview.commonMistakes.map((mistake, i) => (
                    <div key={i} className="mistake-card">
                      <h4>{mistake.title}</h4>
                      <p>{mistake.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Collapsible: FAQ */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['faq'] ? 'open' : ''}`}
              onClick={() => toggleSection('faq')}
            >
              <h2>FAQ</h2>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['faq'] && (
              <div className="accordion-content">
                <div className="faq-list">
                  {overview.faq.map((item, i) => (
                    <FaqItem key={i} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="faq-chevron"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .faq-item {
          background: #1A2332;
          border-radius: 8px;
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: none;
          border: none;
          color: #E2E8F0;
          font-size: 15px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: color 0.2s;
        }
        .faq-question:hover {
          color: #D4A853;
        }
        .faq-chevron {
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .faq-item.open .faq-chevron {
          transform: rotate(180deg);
        }
        .faq-answer {
          padding: 0 16px 16px 16px;
        }
        .faq-answer p {
          color: #A0AEC0;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

const styles = `
  .toolkit-page {
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
  .toolkit-main {
    padding: 32px 24px;
  }

  .toolkit-container {
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

  .progress-bar.complete {
    background: linear-gradient(90deg, #4A9E7F, #5CB992);
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

  /* Months Section */
  .months-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .month-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    border: 2px solid #3D4A5C;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s, transform 0.2s;
    display: block;
  }

  .month-card:hover {
    transform: translateY(-2px);
  }

  .month-card.completed {
    border-color: #4A9E7F;
  }

  .month-card.current {
    border-color: #D4A853;
  }

  .month-card.future {
    border-color: #3D4A5C;
  }

  .month-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .month-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .month-card.completed .month-badge {
    background: rgba(74, 158, 127, 0.15);
    color: #4A9E7F;
  }

  .month-card.current .month-badge {
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
  }

  .month-card.future .month-badge {
    background: rgba(61, 74, 92, 0.5);
    color: #A0AEC0;
  }

  .month-completion {
    font-size: 13px;
  }

  .completion-check {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #4A9E7F;
    font-weight: 600;
  }

  .completion-count {
    color: #A0AEC0;
  }

  .month-title {
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 8px 0;
  }

  .month-focus {
    font-size: 14px;
    color: #A0AEC0;
    line-height: 1.5;
    margin: 0 0 16px 0;
  }

  .month-weeks-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .month-weeks-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #E2E8F0;
  }

  .month-weeks-list li.week-done {
    color: #4A9E7F;
  }

  .month-weeks-list li.week-done svg {
    color: #4A9E7F;
  }

  .week-bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3D4A5C;
    flex-shrink: 0;
    margin: 0 4px;
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
    margin: 0;
    font-size: 15px;
  }

  /* Accordion Sections */
  .accordion-section {
    margin-bottom: 8px;
  }

  .accordion-trigger {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #242D3D;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .accordion-trigger:hover {
    background: #2A3548;
  }

  .accordion-trigger.open {
    border-radius: 12px 12px 0 0;
  }

  .accordion-trigger h2 {
    font-size: 16px;
    font-weight: 600;
    color: #E2E8F0;
    margin: 0;
  }

  .chevron {
    color: #A0AEC0;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .accordion-trigger.open .chevron {
    transform: rotate(180deg);
  }

  .accordion-content {
    background: #242D3D;
    border-radius: 0 0 12px 12px;
    padding: 0 24px 24px 24px;
  }

  /* Key Principles */
  .principles-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .principle-card {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px 16px 16px 20px;
    border-left: 4px solid #D4A853;
  }

  .principle-card h4 {
    color: #D4A853;
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 6px 0;
  }

  .principle-card p {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }

  /* Big Picture Table */
  .big-picture-table {
    display: grid;
    gap: 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #3D4A5C;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.5fr 0.8fr;
    gap: 0;
    background: #1A2332;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 700;
    color: #D4A853;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.5fr 0.8fr;
    gap: 0;
    padding: 12px 16px;
    font-size: 13px;
    color: #E2E8F0;
    border-top: 1px solid #3D4A5C;
    align-items: start;
  }

  .table-row span {
    line-height: 1.5;
  }

  .table-phase {
    font-weight: 600;
    color: #E2E8F0;
  }

  .big-picture-cards {
    display: none;
  }

  /* Leader Expectations */
  .expectations-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .expectation-group {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px;
  }

  .expectation-group h4 {
    color: #D4A853;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #3D4A5C;
  }

  .checklist {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .checklist li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #E2E8F0;
    line-height: 1.5;
  }

  .checklist li svg {
    flex-shrink: 0;
    color: #3D4A5C;
    margin-top: 2px;
  }

  /* Common Mistakes */
  .mistakes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mistake-card {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px;
  }

  .mistake-card h4 {
    color: #E2E8F0;
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 6px 0;
  }

  .mistake-card p {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }

  /* FAQ */
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Buttons */
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
  }

  .btn-primary:hover {
    background: #E5B964;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .header-content h1 {
      font-size: 24px;
    }

    .progress-info {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }

    .month-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .month-title {
      font-size: 18px;
    }

    /* Big Picture: hide table, show cards */
    .big-picture-table {
      display: none;
    }

    .big-picture-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .big-picture-card {
      background: #1A2332;
      border-radius: 8px;
      padding: 16px;
    }

    .big-picture-card h4 {
      color: #D4A853;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 10px 0;
    }

    .bp-detail {
      font-size: 13px;
      color: #E2E8F0;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .bp-label {
      color: #A0AEC0;
      font-weight: 600;
    }

    /* Expectations: single column */
    .expectations-grid {
      grid-template-columns: 1fr;
    }

    .accordion-trigger {
      padding: 14px 16px;
    }

    .accordion-content {
      padding: 0 16px 16px 16px;
    }

    .toolkit-main {
      padding: 24px 16px;
    }
  }
`;
