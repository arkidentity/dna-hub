'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roadblocks, assessmentIntro, assessmentConclusion } from '@/lib/flow-assessment-data';
import { styles } from './styles';

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
          router.push('/login');
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
