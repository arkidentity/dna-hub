'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  toolkit90DayData,
  getWeekData,
  getMonthForWeek,
  type ToolkitWeek,
  type ToolkitContentBlock,
} from '@/lib/toolkit-90day-data';

type TabId = 'meeting' | 'coaching' | 'prep';

interface WeekProgress {
  completed: boolean;
}

export default function ToolkitWeekPage({ params }: { params: Promise<{ weekId: string }> }) {
  const resolvedParams = use(params);
  const weekId = parseInt(resolvedParams.weekId);
  const router = useRouter();
  const [week, setWeek] = useState<ToolkitWeek | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('meeting');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const weekData = getWeekData(weekId);
        if (!weekData) {
          setError('Week not found');
          setIsLoading(false);
          return;
        }
        setWeek(weekData);

        // Fetch progress from API
        const response = await fetch(`/api/training/toolkit/week/${weekId}`);

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          router.push('/training/toolkit');
          return;
        }

        if (response.ok) {
          const data: WeekProgress = await response.json();
          setIsCompleted(data.completed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [weekId, router]);

  // Reset checked items when week changes
  useEffect(() => {
    setCheckedItems({});
    setActiveTab('meeting');
  }, [weekId]);

  const toggleCheckItem = (index: number) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const allChecklistChecked =
    week !== null &&
    week.completionChecklist.length > 0 &&
    week.completionChecklist.every((_, i) => checkedItems[i]);

  const markWeekComplete = async () => {
    if (isSaving || isCompleted) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/training/toolkit/week/${weekId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        setIsCompleted(true);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        const result = await response.json().catch(() => ({}));
        setSaveError(result.error || 'Failed to save progress. Please try again.');
      }
    } catch (err) {
      console.error('Failed to mark week complete:', err);
      setSaveError('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const monthNumber = getMonthForWeek(weekId);
  const totalWeeks = toolkit90DayData.weeks.length;

  if (isLoading) {
    return (
      <div className="week-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading week...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !week) {
    return (
      <div className="week-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Week not found.'}</p>
          <Link href={`/training/toolkit/month/${monthNumber}`} className="btn-primary">
            Back to Month {monthNumber}
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'meeting', label: 'Meeting Guide' },
    { id: 'coaching', label: 'Coaching' },
    { id: 'prep', label: 'Prep' },
  ];

  return (
    <div className="week-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href={`/training/toolkit/month/${monthNumber}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Month {monthNumber}
          </Link>

          <div className="badges-row">
            <span className="week-badge">Week {week.week}</span>
            <span className="month-badge">Month {week.month}</span>
            {isCompleted && <span className="completed-badge">Completed</span>}
          </div>

          <h1>{week.title}</h1>
          <p className="subtitle">{week.subtitle}</p>

          <div className="meta-row">
            <span className="duration-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {week.totalDuration}
            </span>
          </div>

          <div className="purpose-block">
            <span className="purpose-label">Purpose</span>
            <p className="purpose-text">{week.purpose}</p>
          </div>

          <div className="why-block">
            <span className="why-label">Why This Matters</span>
            <p className="why-text">{week.whyThisMatters}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar-wrapper">
        <div className="tab-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="week-main">
        <div className="week-container">
          {saveError && (
            <div className="save-error">
              {saveError}
            </div>
          )}

          {/* Meeting Guide Tab */}
          {activeTab === 'meeting' && (
            <div className="tab-content">
              <div className="steps-list">
                {week.meetingSteps.map((step, i) => (
                  <MeetingStepCard key={i} step={step} />
                ))}
              </div>
            </div>
          )}

          {/* Coaching Tab */}
          {activeTab === 'coaching' && (
            <div className="tab-content">
              {week.coachingTips.length > 0 && (
                <div className="coaching-section">
                  <h3 className="section-heading">Coaching Tips</h3>
                  {week.coachingTips.map((tip, i) => (
                    <div key={i} className="coaching-tip-card">
                      <span className="coaching-tip-label">COACHING TIP</span>
                      {tip.title && <h4 className="coaching-tip-title">{tip.title}</h4>}
                      {tip.text && <p className="coaching-tip-text">{tip.text}</p>}
                    </div>
                  ))}
                </div>
              )}

              {week.redFlags.length > 0 && (
                <div className="coaching-section">
                  <h3 className="section-heading">Red Flags</h3>
                  {week.redFlags.map((flag, i) => (
                    <div key={i} className="red-flag-card">
                      <span className="red-flag-label">RED FLAG</span>
                      {flag.title && <h4 className="red-flag-title">{flag.title}</h4>}
                      {flag.text && <p className="red-flag-text">{flag.text}</p>}
                    </div>
                  ))}
                </div>
              )}

              {week.scenarios.length > 0 && (
                <div className="coaching-section">
                  <h3 className="section-heading">Scenarios</h3>
                  {week.scenarios.map((scenario, i) => (
                    <div key={i} className="scenario-card">
                      <span className="scenario-label">WHAT IF...</span>
                      {scenario.text && <p className="scenario-question">{scenario.text}</p>}
                      {scenario.response && <p className="scenario-response">{scenario.response}</p>}
                    </div>
                  ))}
                </div>
              )}

              {week.coachingTips.length === 0 &&
                week.redFlags.length === 0 &&
                week.scenarios.length === 0 && (
                  <div className="empty-state">
                    <p>No coaching content for this week.</p>
                  </div>
                )}
            </div>
          )}

          {/* Prep Tab */}
          {activeTab === 'prep' && (
            <div className="tab-content">
              {week.leaderPrep.length > 0 && (
                <div className="prep-section">
                  <h3 className="section-heading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <polyline points="17 11 19 13 23 9" />
                    </svg>
                    Leader Prep
                  </h3>
                  <ul className="prep-list">
                    {week.leaderPrep.map((item, i) => (
                      <li key={i}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {week.disciplePrep.length > 0 && (
                <div className="prep-section">
                  <h3 className="section-heading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Disciple Prep
                  </h3>
                  <ul className="prep-list">
                    {week.disciplePrep.map((item, i) => (
                      <li key={i}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {week.afterMeeting.length > 0 && (
                <div className="prep-section">
                  <h3 className="section-heading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    After the Meeting
                  </h3>
                  <ul className="prep-list">
                    {week.afterMeeting.map((item, i) => (
                      <li key={i}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {week.completionChecklist.length > 0 && (
                <div className="prep-section completion-section">
                  <h3 className="section-heading">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Completion Checklist
                  </h3>
                  <ul className="completion-checklist">
                    {week.completionChecklist.map((item, i) => (
                      <li key={i}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!checkedItems[i]}
                            onChange={() => toggleCheckItem(i)}
                            disabled={isCompleted}
                          />
                          <span className="checkbox-custom">
                            {checkedItems[i] && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className={`checkbox-text ${checkedItems[i] ? 'checked' : ''}`}>{item}</span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn-mark-complete"
                    disabled={!allChecklistChecked || isSaving || isCompleted}
                    onClick={markWeekComplete}
                  >
                    {isCompleted
                      ? 'Week Completed'
                      : isSaving
                        ? 'Saving...'
                        : 'Mark Week Complete'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prev/Next Navigation */}
          <div className="week-navigation">
            {weekId > 1 && (
              <Link href={`/training/toolkit/week/${weekId - 1}`} className="nav-link prev">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Week {weekId - 1}
              </Link>
            )}
            {weekId < totalWeeks && (
              <Link href={`/training/toolkit/week/${weekId + 1}`} className="nav-link next">
                Week {weekId + 1}
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

// === Meeting Step Card ===

function MeetingStepCard({ step }: { step: ToolkitContentBlock }) {
  return (
    <div className="meeting-step-card">
      <div className="step-header">
        <div className="step-number-circle">{step.stepNumber}</div>
        <div className="step-info">
          <h4 className="step-title">{step.title}</h4>
        </div>
        {step.duration && <span className="step-duration">{step.duration}</span>}
      </div>
      {step.content && step.content.length > 0 && (
        <div className="step-body">
          {step.content.map((block, i) => (
            <ContentBlockRenderer key={i} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

// === Content Block Renderer ===

function ContentBlockRenderer({ block }: { block: ToolkitContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="content-paragraph">{block.text}</p>;

    case 'scripture':
      return (
        <div className="scripture-block">
          <p className="scripture-text">&ldquo;{block.text}&rdquo;</p>
          <cite className="scripture-ref">&mdash; {block.ref}</cite>
        </div>
      );

    case 'keyDefinition':
      return (
        <div className="key-definition">
          {block.title && <span className="key-definition-title">{block.title}</span>}
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
      return <h4 className="content-header">{block.title || block.text}</h4>;

    case 'prayerScript':
      return (
        <div className="prayer-script-block">
          <span className="prayer-label">PRAYER</span>
          <p className="prayer-text">{block.text}</p>
        </div>
      );

    case 'meetingStep':
      return <MeetingStepCard step={block} />;

    case 'coachingTip':
      return (
        <div className="coaching-tip-card">
          <span className="coaching-tip-label">COACHING TIP</span>
          {block.title && <h4 className="coaching-tip-title">{block.title}</h4>}
          {block.text && <p className="coaching-tip-text">{block.text}</p>}
        </div>
      );

    case 'redFlag':
      return (
        <div className="red-flag-card">
          <span className="red-flag-label">RED FLAG</span>
          {block.title && <h4 className="red-flag-title">{block.title}</h4>}
          {block.text && <p className="red-flag-text">{block.text}</p>}
        </div>
      );

    case 'scenario':
      return (
        <div className="scenario-card">
          <span className="scenario-label">WHAT IF...</span>
          {block.text && <p className="scenario-question">{block.text}</p>}
          {block.response && <p className="scenario-response">{block.response}</p>}
        </div>
      );

    default:
      return null;
  }
}

// === Styles ===

const styles = `
  .week-page {
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

  .badges-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .week-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .month-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(74, 158, 127, 0.15);
    color: #4A9E7F;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .completed-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(74, 158, 127, 0.25);
    color: #4A9E7F;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid rgba(74, 158, 127, 0.4);
  }

  .header-content h1 {
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 4px 0;
  }

  .subtitle {
    color: #A0AEC0;
    font-size: 16px;
    margin: 0 0 12px 0;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .duration-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: #3D4A5C;
    color: #A0AEC0;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
  }

  .purpose-block {
    margin-bottom: 12px;
  }

  .purpose-label,
  .why-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #D4A853;
    margin-bottom: 4px;
  }

  .purpose-text,
  .why-text {
    color: #E2E8F0;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  .why-block {
    margin-bottom: 0;
  }

  /* Tab Bar */
  .tab-bar-wrapper {
    background: #242D3D;
    border-bottom: 1px solid #3D4A5C;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .tab-bar {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    gap: 0;
  }

  .tab-btn {
    flex: 1;
    padding: 14px 16px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #A0AEC0;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .tab-btn:hover {
    color: #E2E8F0;
    background: rgba(255, 255, 255, 0.03);
  }

  .tab-btn.active {
    color: #D4A853;
    border-bottom-color: #D4A853;
  }

  /* Main */
  .week-main {
    padding: 32px 24px;
  }

  .week-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .save-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    color: #FCA5A5;
    font-size: 14px;
  }

  .tab-content {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ===== Meeting Guide Tab ===== */

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .meeting-step-card {
    background: #242D3D;
    border-radius: 12px;
    overflow: hidden;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }

  .step-number-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
    border: 2px solid #D4A853;
    flex-shrink: 0;
  }

  .step-info {
    flex: 1;
  }

  .step-title {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
  }

  .step-duration {
    display: inline-block;
    padding: 4px 10px;
    background: #3D4A5C;
    color: #A0AEC0;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
  }

  .step-body {
    padding: 0 24px 24px 24px;
    border-top: 1px solid #3D4A5C;
  }

  /* ===== Content Blocks (shared) ===== */

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

  /* Scripture */
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

  /* Key Definition */
  .key-definition {
    background: #1A2332;
    border-top: 2px solid #D4A853;
    border-bottom: 2px solid #D4A853;
    border-radius: 4px;
    padding: 18px 20px;
    margin: 24px 0;
  }

  .key-definition-title {
    display: block;
    color: #D4A853;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .key-definition p {
    color: #D4A853;
    font-weight: 600;
    font-size: 1.05rem;
    line-height: 1.55;
    margin: 0;
  }

  /* Discussion */
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

  /* Reflection */
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

  /* Checklist */
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

  /* Numbered */
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

  /* Prayer Script */
  .prayer-script-block {
    background: #EDE8DE;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 24px 0;
  }

  .prayer-label {
    display: block;
    color: #2E7D5E;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .prayer-text {
    color: #0D0D0D;
    font-style: italic;
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0;
  }

  /* ===== Coaching Tab ===== */

  .coaching-section {
    margin-bottom: 32px;
  }

  .coaching-section:last-child {
    margin-bottom: 0;
  }

  .section-heading {
    font-size: 14px;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Coaching Tip */
  .coaching-tip-card {
    background: #FDF3E3;
    border-left: 4px solid #D4A853;
    border-radius: 0 8px 8px 0;
    padding: 20px 24px;
    margin-bottom: 12px;
  }

  .coaching-tip-label {
    display: block;
    color: #B8860B;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .coaching-tip-title {
    color: #1A2332;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px 0;
  }

  .coaching-tip-text {
    color: #2D3748;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  /* Red Flag */
  .red-flag-card {
    background: #FDE8E8;
    border-left: 4px solid #C53030;
    border-radius: 0 8px 8px 0;
    padding: 20px 24px;
    margin-bottom: 12px;
  }

  .red-flag-label {
    display: block;
    color: #C53030;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .red-flag-title {
    color: #1A2332;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px 0;
  }

  .red-flag-text {
    color: #2D3748;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  /* Scenario */
  .scenario-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 12px;
  }

  .scenario-label {
    display: block;
    color: #D4A853;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .scenario-question {
    color: #FFFFFF;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .scenario-response {
    color: #A0AEC0;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #5A6577;
  }

  /* ===== Prep Tab ===== */

  .prep-section {
    margin-bottom: 32px;
  }

  .prep-section:last-child {
    margin-bottom: 0;
  }

  .prep-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .prep-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 15px;
    color: #E2E8F0;
    line-height: 1.5;
  }

  .prep-list li svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: #4A9E7F;
  }

  /* Completion Checklist */
  .completion-section {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
  }

  .completion-section .section-heading {
    margin-top: 0;
  }

  .completion-checklist {
    list-style: none;
    margin: 0 0 24px 0;
    padding: 0;
  }

  .completion-checklist li {
    margin-bottom: 12px;
  }

  .completion-checklist li:last-child {
    margin-bottom: 0;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label input[type="checkbox"] {
    display: none;
  }

  .checkbox-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #3D4A5C;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    transition: all 0.2s;
    background: transparent;
  }

  .checkbox-label input:checked + .checkbox-custom {
    background: #4A9E7F;
    border-color: #4A9E7F;
  }

  .checkbox-custom svg {
    color: #FFFFFF;
  }

  .checkbox-text {
    font-size: 15px;
    color: #E2E8F0;
    line-height: 1.5;
    transition: color 0.2s;
  }

  .checkbox-text.checked {
    color: #A0AEC0;
    text-decoration: line-through;
  }

  .btn-mark-complete {
    display: block;
    width: 100%;
    padding: 14px 24px;
    background: #4A9E7F;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-mark-complete:hover:not(:disabled) {
    background: #5AB88F;
  }

  .btn-mark-complete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ===== Navigation ===== */

  .week-navigation {
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

  /* ===== Mobile ===== */

  @media (max-width: 640px) {
    .page-header {
      padding: 16px;
    }

    .header-content h1 {
      font-size: 24px;
    }

    .tab-btn {
      padding: 12px 8px;
      font-size: 13px;
    }

    .week-main {
      padding: 24px 16px;
    }

    .step-header {
      padding: 16px;
      gap: 12px;
    }

    .step-body {
      padding: 0 16px 16px 16px;
    }

    .step-number-circle {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }

    .step-duration {
      font-size: 11px;
      padding: 3px 8px;
    }

    .coaching-tip-card,
    .red-flag-card,
    .scenario-card {
      padding: 16px 18px;
    }

    .completion-section {
      padding: 16px;
    }

    .discussion-block,
    .reflection-block,
    .prayer-script-block {
      padding: 16px 18px;
    }
  }
`;
