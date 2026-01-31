'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roadblocks, assessmentIntro, assessmentConclusion } from '@/lib/flow-assessment-data';

type View = 'intro' | 'roadblock' | 'summary' | 'completion';

interface AssessmentData {
  ratings: Record<string, number>;
  reflections: Record<string, Record<string, string>>;
  topRoadblocks: string[];
  actionPlan: Record<string, { actions: string[]; deadline: string }>;
  accountabilityPartner: string;
  accountabilityDate: string;
}

const initialAssessmentData: AssessmentData = {
  ratings: {},
  reflections: {},
  topRoadblocks: [],
  actionPlan: {},
  accountabilityPartner: '',
  accountabilityDate: ''
};

export default function FlowAssessmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<View>('intro');
  const [currentRoadblockIndex, setCurrentRoadblockIndex] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>(initialAssessmentData);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState(false);

  // Load existing draft or create new assessment
  useEffect(() => {
    async function loadAssessment() {
      try {
        const response = await fetch('/api/training/assessment');

        if (response.status === 401) {
          router.push('/training/login');
          return;
        }

        const data = await response.json();

        if (data.assessment) {
          setAssessmentId(data.assessment.id);
          setAssessmentData({
            ratings: data.assessment.roadblock_ratings || {},
            reflections: data.assessment.reflections || {},
            topRoadblocks: data.assessment.top_roadblocks || [],
            actionPlan: data.assessment.action_plan || {},
            accountabilityPartner: data.assessment.accountability_partner || '',
            accountabilityDate: data.assessment.accountability_date || ''
          });

          // If there are existing ratings, resume from where they left off
          if (data.assessment.roadblock_ratings && Object.keys(data.assessment.roadblock_ratings).length > 0) {
            const completedCount = Object.keys(data.assessment.roadblock_ratings).length;
            if (completedCount < roadblocks.length) {
              setCurrentRoadblockIndex(completedCount);
              setView('roadblock');
            } else {
              setView('summary');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessment();
  }, [router]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (assessmentId && Object.keys(assessmentData.ratings).length > 0) {
        saveProgress(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [assessmentId, assessmentData]);

  const saveProgress = useCallback(async (silent = false) => {
    if (!silent) setIsSaving(true);

    try {
      await fetch('/api/training/assessment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          data: {
            roadblock_ratings: assessmentData.ratings,
            reflections: assessmentData.reflections,
            top_roadblocks: assessmentData.topRoadblocks,
            action_plan: assessmentData.actionPlan,
            accountability_partner: assessmentData.accountabilityPartner,
            accountability_date: assessmentData.accountabilityDate
          }
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [assessmentId, assessmentData]);

  const handleRatingSelect = (roadblockId: string, rating: number) => {
    setAssessmentData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [roadblockId]: rating }
    }));
  };

  const handleReflectionChange = (roadblockId: string, questionIndex: number, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      reflections: {
        ...prev.reflections,
        [roadblockId]: {
          ...(prev.reflections[roadblockId] || {}),
          [`q${questionIndex + 1}`]: value
        }
      }
    }));
  };

  const goToNext = async () => {
    await saveProgress();

    if (currentRoadblockIndex < roadblocks.length - 1) {
      setCurrentRoadblockIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Calculate top roadblocks
      const sorted = Object.entries(assessmentData.ratings)
        .sort(([, a], [, b]) => b - a)
        .filter(([, rating]) => rating >= 3)
        .slice(0, 3)
        .map(([id]) => id);

      setAssessmentData(prev => ({ ...prev, topRoadblocks: sorted }));
      setView('summary');
      window.scrollTo(0, 0);
    }
  };

  const goToPrev = () => {
    if (currentRoadblockIndex > 0) {
      setCurrentRoadblockIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    } else {
      setView('intro');
    }
  };

  const handleSaveForLater = async () => {
    await saveProgress();
    router.push('/training');
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/training/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          data: {
            roadblock_ratings: assessmentData.ratings,
            reflections: assessmentData.reflections,
            top_roadblocks: assessmentData.topRoadblocks,
            action_plan: assessmentData.actionPlan,
            accountability_partner: assessmentData.accountabilityPartner,
            accountability_date: assessmentData.accountabilityDate
          }
        })
      });

      if (response.ok) {
        setView('completion');
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActionPlanChange = (roadblockId: string, field: 'actions' | 'deadline', value: string | string[]) => {
    setAssessmentData(prev => ({
      ...prev,
      actionPlan: {
        ...prev.actionPlan,
        [roadblockId]: {
          ...(prev.actionPlan[roadblockId] || { actions: [], deadline: '' }),
          [field]: value
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="assessment-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading assessment...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const currentRoadblock = roadblocks[currentRoadblockIndex];
  const progress = ((currentRoadblockIndex + 1) / roadblocks.length) * 100;

  return (
    <div className="assessment-page">
      {/* Header */}
      <header className="assessment-header">
        <Link href="/training" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
        {isSaving && <span className="saving-indicator">Saving...</span>}
      </header>

      <main className="assessment-main">
        {/* INTRO VIEW */}
        {view === 'intro' && (
          <div className="assessment-intro">
            <h1>{assessmentIntro.title}</h1>
            <p className="intro-subtitle">{assessmentIntro.subtitle}</p>

            <div className="intro-content">
              <p>{assessmentIntro.description}</p>

              <div className="intro-goals">
                <h3>How This Works:</h3>
                <ul>
                  {assessmentIntro.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ul>
              </div>

              <div className="intro-time">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Estimated time: {assessmentIntro.timeEstimate}</span>
              </div>
            </div>

            <div className="intro-actions">
              <button className="btn-primary" onClick={() => setView('roadblock')}>
                Begin Assessment
              </button>
              <Link href="/training" className="btn-secondary">
                I&apos;ll Do This Later
              </Link>
            </div>
          </div>
        )}

        {/* ROADBLOCK VIEW */}
        {view === 'roadblock' && currentRoadblock && (
          <div className="roadblock-view">
            {/* Progress Bar */}
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Roadblock Header */}
            <div className="roadblock-header">
              <span className="roadblock-number">Roadblock {currentRoadblockIndex + 1} of {roadblocks.length}</span>
              <h2>{currentRoadblock.title}</h2>
            </div>

            {/* Description Section */}
            <section className="section">
              <div className="section-quote">
                <p>{currentRoadblock.description}</p>
              </div>

              <div className="subsection">
                <h4>How It Shows Up:</h4>
                <ul className="section-list">
                  {currentRoadblock.manifestations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="subsection">
                <h4>Root Causes:</h4>
                <ul className="section-list">
                  {currentRoadblock.rootCauses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="subsection">
                <h4>How It Blocks the Flow:</h4>
                <ul className="section-list">
                  {currentRoadblock.blocksTheFlow.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Scripture Section */}
            <section className="section scripture-section">
              <p className="scripture-text">&ldquo;{currentRoadblock.scripture.text}&rdquo;</p>
              <p className="scripture-ref">{currentRoadblock.scripture.reference}</p>
            </section>

            {/* Rating Section */}
            <section className="section rating-section">
              <h3>Your Rating</h3>
              <p className="rating-desc">How much does this roadblock impact you?</p>

              <div className="rating-scale">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className={`rating-btn ${assessmentData.ratings[currentRoadblock.id] === rating ? 'selected' : ''}`}
                    onClick={() => handleRatingSelect(currentRoadblock.id, rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="rating-labels">
                <span>Not an issue</span>
                <span>Blocks me significantly</span>
              </div>
            </section>

            {/* Reflection Questions */}
            <section className="section questions-section">
              <h3>Reflection Questions</h3>
              <p className="questions-note">Take time to honestly reflect. These are for you and God.</p>

              {currentRoadblock.reflectionQuestions.map((question, i) => (
                <div key={i} className="question">
                  <label>{i + 1}. {question}</label>
                  <textarea
                    value={assessmentData.reflections[currentRoadblock.id]?.[`q${i + 1}`] || ''}
                    onChange={(e) => handleReflectionChange(currentRoadblock.id, i, e.target.value)}
                    placeholder="Your reflection..."
                    rows={3}
                  />
                </div>
              ))}
            </section>

            {/* Action Steps (Collapsible) */}
            <section className={`section actions-section ${expandedActions ? 'expanded' : ''}`}>
              <button className="actions-header" onClick={() => setExpandedActions(!expandedActions)}>
                <h3>Suggested Action Steps</h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedActions && (
                <div className="actions-content">
                  <p className="actions-note">These are optional now. You&apos;ll create your action plan at the end.</p>
                  <ul className="actions-list">
                    {currentRoadblock.actionSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                  <div className="accountability-preview">
                    <strong>Accountability Question:</strong>
                    <p>{currentRoadblock.accountabilityQuestion}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Navigation */}
            <div className="navigation">
              <button className="nav-btn nav-prev" onClick={goToPrev}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {currentRoadblockIndex === 0 ? 'Intro' : 'Previous'}
              </button>
              <button
                className="nav-btn nav-next"
                onClick={goToNext}
                disabled={!assessmentData.ratings[currentRoadblock.id]}
              >
                {currentRoadblockIndex === roadblocks.length - 1 ? 'View Results' : 'Next'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Save For Later */}
            <div className="save-later">
              <button className="save-later-btn" onClick={handleSaveForLater}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save &amp; Continue Later
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY VIEW */}
        {view === 'summary' && (
          <div className="summary-view">
            <h2>Your Results</h2>

            {/* Chart */}
            <section className="section chart-section">
              <h3>Roadblock Ratings</h3>
              <div className="chart">
                {roadblocks.map(rb => {
                  const rating = assessmentData.ratings[rb.id] || 0;
                  const width = (rating / 5) * 100;
                  return (
                    <div key={rb.id} className="chart-row">
                      <span className="chart-label">{rb.shortTitle}</span>
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ width: `${width}%` }} />
                      </div>
                      <span className="chart-value">{rating}/5</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Top Roadblocks */}
            <section className="section top-section">
              <h3>Your Top Roadblocks</h3>
              {assessmentData.topRoadblocks.length > 0 ? (
                <div className="top-list">
                  {assessmentData.topRoadblocks.map((id, i) => {
                    const rb = roadblocks.find(r => r.id === id);
                    if (!rb) return null;
                    return (
                      <div key={id} className="top-item">
                        <span className="top-rank">{i + 1}</span>
                        <div className="top-info">
                          <span className="top-name">{rb.title}</span>
                          <span className="top-rating">Rating: {assessmentData.ratings[id]}/5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-top">No roadblocks rated 3 or higher. You&apos;re in good shape!</p>
              )}
            </section>

            {/* Action Plan */}
            {assessmentData.topRoadblocks.length > 0 && (
              <section className="section action-plan-section">
                <h3>{assessmentConclusion.title}</h3>
                <p className="plan-desc">{assessmentConclusion.description}</p>

                {assessmentData.topRoadblocks.map(id => {
                  const rb = roadblocks.find(r => r.id === id);
                  if (!rb) return null;
                  return (
                    <div key={id} className="plan-item">
                      <label className="plan-label">{rb.title}</label>
                      <p className="plan-hint">Choose 1-2 action steps:</p>
                      <div className="plan-actions">
                        {rb.actionSteps.map((step, i) => {
                          const selected = assessmentData.actionPlan[id]?.actions?.includes(step);
                          return (
                            <label key={i} className={`action-checkbox ${selected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  const current = assessmentData.actionPlan[id]?.actions || [];
                                  const updated = selected
                                    ? current.filter(s => s !== step)
                                    : [...current, step];
                                  handleActionPlanChange(id, 'actions', updated);
                                }}
                              />
                              <span>{step}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="deadline-field">
                        <label>Target Date:</label>
                        <input
                          type="date"
                          value={assessmentData.actionPlan[id]?.deadline || ''}
                          onChange={(e) => handleActionPlanChange(id, 'deadline', e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Accountability */}
            <section className="section accountability-section">
              <h3>Accountability Partner</h3>
              <p>Who will check in with you on your action steps?</p>

              <div className="form-group">
                <label>Partner&apos;s Name</label>
                <input
                  type="text"
                  value={assessmentData.accountabilityPartner}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, accountabilityPartner: e.target.value }))}
                  placeholder="Enter their name"
                />
              </div>

              <div className="form-group">
                <label>First Check-in Date</label>
                <input
                  type="date"
                  value={assessmentData.accountabilityDate}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, accountabilityDate: e.target.value }))}
                />
              </div>
            </section>

            {/* Encouragement */}
            <section className="section encouragement-section">
              <p>{assessmentConclusion.encouragement}</p>
            </section>

            {/* Complete Button */}
            <div className="summary-actions">
              <button className="btn-primary" onClick={handleComplete} disabled={isSaving}>
                {isSaving ? 'Completing...' : 'Complete Assessment'}
              </button>
              <button className="btn-secondary" onClick={() => { setView('roadblock'); setCurrentRoadblockIndex(0); }}>
                Review Answers
              </button>
            </div>
          </div>
        )}

        {/* COMPLETION VIEW */}
        {view === 'completion' && (
          <div className="completion-view">
            <div className="completion-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Assessment Complete!</h2>
            <p>You&apos;ve taken an important step toward becoming a more effective disciple-maker.</p>

            <div className="completion-next">
              <h3>What&apos;s Next?</h3>
              <ul>
                <li>Review your results and action plan anytime from your dashboard</li>
                <li>Reach out to your accountability partner this week</li>
                <li>The DNA Manual is now unlocked - continue your training!</li>
                <li>You can retake this assessment in 3 months to track growth</li>
              </ul>
            </div>

            <div className="completion-remember">
              <p><strong>Remember:</strong></p>
              <ul>
                <li>These roadblocks don&apos;t disqualify you</li>
                <li>Awareness is the first step to freedom</li>
                <li>God uses broken vessels to pour out His love</li>
              </ul>
            </div>

            <div className="completion-actions">
              <Link href="/training/assessment/results" className="btn-primary">
                View Full Results
              </Link>
              <Link href="/training" className="btn-secondary">
                Continue Training
              </Link>
            </div>
          </div>
        )}
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .assessment-page {
    min-height: 100vh;
    background: #1A2332;
    color: #FFFFFF;
  }

  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .spinner {
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

  /* Header */
  .assessment-header {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #3D4A5C;
    position: sticky;
    top: 0;
    background: #1A2332;
    z-index: 100;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #A0AEC0;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #D4A853;
  }

  .saving-indicator {
    color: #D4A853;
    font-size: 13px;
  }

  /* Main */
  .assessment-main {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* Intro View */
  .assessment-intro {
    text-align: center;
  }

  .assessment-intro h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #FFFFFF;
  }

  .intro-subtitle {
    color: #D4A853;
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 32px 0;
  }

  .intro-content {
    text-align: left;
    background: #242D3D;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
  }

  .intro-content > p {
    color: #A0AEC0;
    line-height: 1.6;
    margin: 0 0 24px 0;
  }

  .intro-goals {
    background: #1A2332;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .intro-goals h3 {
    color: #D4A853;
    font-size: 16px;
    margin: 0 0 12px 0;
  }

  .intro-goals ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .intro-goals li {
    position: relative;
    padding-left: 24px;
    margin-bottom: 8px;
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.5;
  }

  .intro-goals li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #D4A853;
    font-weight: bold;
  }

  .intro-time {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #A0AEC0;
    font-size: 14px;
  }

  .intro-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 32px;
    background: #D4A853;
    color: #1A2332;
    border: 2px solid #D4A853;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: transparent;
    color: #D4A853;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    background: transparent;
    color: #D4A853;
    border: 2px solid #D4A853;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-secondary:hover {
    background: #D4A853;
    color: #1A2332;
  }

  /* Progress Bar */
  .progress-bar {
    height: 4px;
    background: #3D4A5C;
    border-radius: 2px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #D4A853;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  /* Roadblock Header */
  .roadblock-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .roadblock-number {
    display: inline-block;
    background: #D4A853;
    color: #1A2332;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 999px;
    margin-bottom: 8px;
  }

  .roadblock-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: #FFFFFF;
  }

  /* Sections */
  .section {
    background: #242D3D;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .section h3 {
    color: #D4A853;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 12px 0;
  }

  .section h4 {
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .section-quote {
    font-style: italic;
    color: #A0AEC0;
    padding: 16px;
    background: #1A2332;
    border-left: 3px solid #D4A853;
    border-radius: 0 8px 8px 0;
    margin-bottom: 16px;
  }

  .section-quote p {
    margin: 0;
    line-height: 1.6;
  }

  .subsection {
    margin-bottom: 16px;
  }

  .subsection:last-child {
    margin-bottom: 0;
  }

  .section-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .section-list li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 6px;
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.4;
  }

  .section-list li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #D4A853;
  }

  /* Scripture Section */
  .scripture-section {
    text-align: center;
    background: linear-gradient(135deg, #242D3D 0%, rgba(212, 168, 83, 0.1) 100%);
    border: 1px solid #D4A853;
  }

  .scripture-text {
    font-size: 16px;
    font-style: italic;
    color: #FFFFFF;
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .scripture-ref {
    color: #D4A853;
    font-weight: 600;
    font-size: 14px;
    margin: 0;
  }

  /* Rating Section */
  .rating-section {
    text-align: center;
  }

  .rating-desc {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0 0 16px 0;
  }

  .rating-scale {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .rating-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1A2332;
    border: 2px solid #3D4A5C;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #FFFFFF;
    cursor: pointer;
    transition: all 0.2s;
  }

  .rating-btn:hover {
    border-color: #D4A853;
  }

  .rating-btn.selected {
    background: #D4A853;
    border-color: #D4A853;
    color: #1A2332;
  }

  .rating-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 8px;
    font-size: 12px;
    color: #5A6577;
  }

  /* Questions Section */
  .questions-section h3 {
    margin-bottom: 4px;
  }

  .questions-note {
    color: #5A6577;
    font-size: 13px;
    font-style: italic;
    margin: 0 0 16px 0;
  }

  .question {
    margin-bottom: 16px;
  }

  .question:last-child {
    margin-bottom: 0;
  }

  .question label {
    display: block;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .question textarea {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    background: #1A2332;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .question textarea:focus {
    outline: none;
    border-color: #D4A853;
  }

  .question textarea::placeholder {
    color: #5A6577;
  }

  /* Actions Section (Collapsible) */
  .actions-section {
    padding: 0;
    overflow: hidden;
  }

  .actions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #D4A853;
    transition: background 0.2s;
  }

  .actions-header:hover {
    background: rgba(212, 168, 83, 0.05);
  }

  .actions-header h3 {
    margin: 0;
  }

  .actions-header svg {
    transition: transform 0.3s;
  }

  .actions-section.expanded .actions-header svg {
    transform: rotate(180deg);
  }

  .actions-content {
    padding: 0 20px 20px;
    border-top: 1px solid #3D4A5C;
  }

  .actions-note {
    color: #5A6577;
    font-size: 13px;
    margin: 16px 0;
  }

  .actions-list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px 0;
  }

  .actions-list li {
    position: relative;
    padding-left: 24px;
    margin-bottom: 8px;
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.4;
  }

  .actions-list li::before {
    content: '☐';
    position: absolute;
    left: 0;
    color: #D4A853;
  }

  .accountability-preview {
    background: #1A2332;
    padding: 12px;
    border-radius: 8px;
  }

  .accountability-preview strong {
    color: #5A6577;
    font-size: 12px;
  }

  .accountability-preview p {
    color: #D4A853;
    font-style: italic;
    font-size: 14px;
    margin: 4px 0 0 0;
  }

  /* Navigation */
  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid #3D4A5C;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #242D3D;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #FFFFFF;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-btn:hover:not(:disabled) {
    border-color: #D4A853;
    color: #D4A853;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-next {
    background: #D4A853;
    border-color: #D4A853;
    color: #1A2332;
  }

  .nav-next:hover:not(:disabled) {
    background: transparent;
    color: #D4A853;
  }

  /* Save For Later */
  .save-later {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid #3D4A5C;
  }

  .save-later-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #5A6577;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-later-btn:hover {
    border-color: #D4A853;
    color: #D4A853;
    background: rgba(212, 168, 83, 0.05);
  }

  /* Summary View */
  .summary-view h2 {
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    margin: 0 0 24px 0;
    color: #FFFFFF;
  }

  .chart-section h3 {
    margin-bottom: 16px;
  }

  .chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chart-row {
    display: grid;
    grid-template-columns: 80px 1fr 45px;
    align-items: center;
    gap: 12px;
  }

  .chart-label {
    font-size: 13px;
    color: #A0AEC0;
    text-align: right;
  }

  .chart-bar-container {
    height: 20px;
    background: #1A2332;
    border-radius: 4px;
    overflow: hidden;
  }

  .chart-bar {
    height: 100%;
    background: #D4A853;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .chart-value {
    font-size: 13px;
    font-weight: 600;
    color: #FFFFFF;
  }

  /* Top Section */
  .top-section h3 {
    margin-bottom: 16px;
  }

  .top-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .top-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: #1A2332;
    border-radius: 8px;
  }

  .top-rank {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #D4A853;
    color: #1A2332;
    font-weight: 700;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .top-info {
    display: flex;
    flex-direction: column;
  }

  .top-name {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
  }

  .top-rating {
    font-size: 13px;
    color: #5A6577;
  }

  .no-top {
    color: #A0AEC0;
    font-size: 14px;
    text-align: center;
    padding: 16px;
  }

  /* Action Plan Section */
  .action-plan-section h3 {
    margin-bottom: 8px;
  }

  .plan-desc {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0 0 20px 0;
  }

  .plan-item {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #3D4A5C;
  }

  .plan-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .plan-label {
    display: block;
    color: #D4A853;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .plan-hint {
    color: #5A6577;
    font-size: 13px;
    margin: 0 0 12px 0;
  }

  .plan-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .action-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #1A2332;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .action-checkbox:hover {
    background: rgba(212, 168, 83, 0.1);
  }

  .action-checkbox.selected {
    background: rgba(212, 168, 83, 0.15);
    border: 1px solid rgba(212, 168, 83, 0.3);
  }

  .action-checkbox input {
    margin-top: 3px;
    accent-color: #D4A853;
  }

  .action-checkbox span {
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.4;
  }

  .deadline-field {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .deadline-field label {
    color: #A0AEC0;
    font-size: 14px;
  }

  .deadline-field input {
    padding: 10px 12px;
    background: #1A2332;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
  }

  .deadline-field input:focus {
    outline: none;
    border-color: #D4A853;
  }

  /* Accountability Section */
  .accountability-section h3 {
    margin-bottom: 8px;
  }

  .accountability-section > p {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0 0 20px 0;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    color: #A0AEC0;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .form-group input {
    width: 100%;
    padding: 12px;
    background: #1A2332;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 14px;
  }

  .form-group input:focus {
    outline: none;
    border-color: #D4A853;
  }

  .form-group input::placeholder {
    color: #5A6577;
  }

  /* Encouragement Section */
  .encouragement-section {
    background: rgba(212, 168, 83, 0.1);
    border-left: 3px solid #D4A853;
  }

  .encouragement-section p {
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }

  /* Summary Actions */
  .summary-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }

  /* Completion View */
  .completion-view {
    text-align: center;
    padding: 32px 0;
  }

  .completion-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    color: #4A9E7F;
  }

  .completion-view h2 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 12px 0;
    color: #FFFFFF;
  }

  .completion-view > p {
    color: #A0AEC0;
    font-size: 16px;
    margin: 0 0 32px 0;
  }

  .completion-next,
  .completion-remember {
    background: #242D3D;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    text-align: left;
  }

  .completion-next h3,
  .completion-remember p strong {
    color: #D4A853;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .completion-next ul,
  .completion-remember ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .completion-next li,
  .completion-remember li {
    position: relative;
    padding-left: 24px;
    margin-bottom: 8px;
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.4;
  }

  .completion-next li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: #D4A853;
  }

  .completion-remember li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #D4A853;
  }

  .completion-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 32px;
  }

  /* Mobile Responsive */
  @media (max-width: 480px) {
    .rating-btn {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    .chart-row {
      grid-template-columns: 65px 1fr 40px;
      gap: 8px;
    }

    .chart-label {
      font-size: 11px;
    }
  }
`;
