'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  launchGuideData,
  getPhase,
  Phase,
  Section,
  Subsection,
  ResponseItem,
} from '@/lib/launch-guide-data';

interface PhaseProgress {
  completed: boolean;
  checklistCompleted: string[];
}

export default function PhasePage({
  params,
}: {
  params: Promise<{ phaseId: string }>;
}) {
  const resolvedParams = use(params);
  const phaseId = parseInt(resolvedParams.phaseId);
  const router = useRouter();
  const [phase, setPhaseData] = useState<Phase | null>(null);
  const [progress, setProgress] = useState<PhaseProgress>({
    completed: false,
    checklistCompleted: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get phase data
        const phaseData = getPhase(phaseId);
        if (!phaseData) {
          setError('Phase not found');
          setIsLoading(false);
          return;
        }
        setPhaseData(phaseData);

        // Expand first section by default
        if (phaseData.sections.length > 0) {
          setExpandedSections([phaseData.sections[0].id]);
        }

        // Fetch progress from API
        const response = await fetch(
          `/api/training/launch-guide/phases/${phaseId}`
        );

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          router.push('/training/launch-guide');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [phaseId, router]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (isSaving) return;

    const isCurrentlyCompleted = progress.checklistCompleted.includes(itemId);
    const newCompleted = isCurrentlyCompleted
      ? progress.checklistCompleted.filter((id) => id !== itemId)
      : [...progress.checklistCompleted, itemId];

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      checklistCompleted: newCompleted,
    }));

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/training/launch-guide/phases/${phaseId}/checklist`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, completed: !isCurrentlyCompleted }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      } else {
        // Revert on error
        setProgress((prev) => ({
          ...prev,
          checklistCompleted: progress.checklistCompleted,
        }));
      }
    } catch (err) {
      console.error('Failed to update checklist:', err);
      // Revert on error
      setProgress((prev) => ({
        ...prev,
        checklistCompleted: progress.checklistCompleted,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const completePhase = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/training/launch-guide/phases/${phaseId}/complete`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        // Navigate to next phase or back to guide
        const nextPhaseId = phaseId + 1;
        if (nextPhaseId < launchGuideData.phases.length) {
          router.push(`/training/launch-guide/${nextPhaseId}`);
        } else {
          router.push('/training/launch-guide');
        }
      }
    } catch (err) {
      console.error('Failed to complete phase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="phase-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading phase...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !phase) {
    return (
      <div className="phase-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Phase not found.'}</p>
          <Link href="/training/launch-guide" className="btn-primary">
            Back to Launch Guide
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const checklistProgress = progress.checklistCompleted.length;
  const checklistTotal = phase.checklist.length;
  const progressPercent = Math.round((checklistProgress / checklistTotal) * 100);
  const allChecklistComplete = checklistProgress === checklistTotal;

  return (
    <div className="phase-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training/launch-guide" className="back-link">
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
            Back to Launch Guide
          </Link>
          <div className="phase-badge">Phase {phase.id}</div>
          <h1>{phase.title}</h1>
          <p className="tagline">{phase.tagline}</p>
          <p className="duration">{phase.duration}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="phase-main">
        <div className="phase-container">
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">Checklist Progress</span>
              <span className="progress-count">
                {checklistProgress}/{checklistTotal}
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Intro */}
          {phase.intro && (
            <div className="intro-card">
              <p>{phase.intro}</p>
            </div>
          )}

          {/* Sections */}
          <div className="sections-list">
            {phase.sections.map((section) => {
              const isExpanded = expandedSections.includes(section.id);

              return (
                <div key={section.id} className="section-card">
                  <button
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="section-info">
                      <h3>{section.title}</h3>
                    </div>
                    <div className="section-toggle">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: isExpanded
                            ? 'rotate(180deg)'
                            : 'rotate(0)',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="section-content">
                      {section.intro && (
                        <p className="section-intro">{section.intro}</p>
                      )}
                      {section.content && (
                        <p className="section-text">{section.content}</p>
                      )}
                      {section.whyList && (
                        <ul className="why-list">
                          {section.whyList.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {section.items && (
                        <ul className="items-list">
                          {section.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {section.subsections?.map((sub, i) => (
                        <SubsectionRenderer key={i} subsection={sub} />
                      ))}
                      {section.sampleConversation && (
                        <div className="sample-conversation">
                          <h4>Sample Conversation</h4>
                          <p>{section.sampleConversation}</p>
                        </div>
                      )}
                      {section.additionalNotes?.map((note, i) => (
                        <div key={i} className="additional-note">
                          <h5>{note.title}</h5>
                          <p>{note.content}</p>
                        </div>
                      ))}
                      {section.callout && (
                        <div className="callout-box">
                          <h4>{section.callout.title}</h4>
                          <p>{section.callout.content}</p>
                          {section.callout.note && (
                            <p className="callout-note">
                              {section.callout.note}
                            </p>
                          )}
                        </div>
                      )}
                      {section.note && (
                        <div className="section-note">
                          <p>{section.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Checklist */}
          <div className="checklist-section">
            <h2>Phase {phase.id} Checklist</h2>
            <div className="checklist-grid">
              {phase.checklist.map((item) => {
                const isChecked = progress.checklistCompleted.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`checklist-item ${isChecked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklistItem(item.id)}
                      disabled={isSaving}
                    />
                    <span className="checkbox-custom">
                      {isChecked && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="checkbox-label">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Next Phase Prompt */}
          <div className="next-phase-section">
            <h3>Ready for Next Phase?</h3>
            <p>{phase.nextPhasePrompt}</p>
          </div>

          {/* Phase Complete Button */}
          {allChecklistComplete && !progress.completed && (
            <div className="phase-complete-section">
              <button
                className="btn-phase-complete"
                onClick={completePhase}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Complete Phase & Continue'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="phase-navigation">
            {phaseId > 0 && (
              <Link
                href={`/training/launch-guide/${phaseId - 1}`}
                className="nav-link prev"
              >
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
                Previous Phase
              </Link>
            )}
            {phaseId < launchGuideData.phases.length - 1 &&
              progress.completed && (
                <Link
                  href={`/training/launch-guide/${phaseId + 1}`}
                  className="nav-link next"
                >
                  Next Phase
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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

function SubsectionRenderer({ subsection }: { subsection: Subsection }) {
  const typeClass = subsection.type || '';

  return (
    <div className={`subsection ${typeClass}`}>
      <h4>{subsection.title}</h4>
      {subsection.subtitle && (
        <p className="subsection-subtitle">{subsection.subtitle}</p>
      )}
      {subsection.content && <p className="subsection-content">{subsection.content}</p>}
      {subsection.items && (
        <>
          {subsection.numbered ? (
            <ol className="subsection-list numbered">
              {(subsection.items as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : subsection.type === 'responses' ? (
            <div className="responses-list">
              {(subsection.items as ResponseItem[]).map((item, i) => (
                <div key={i} className="response-item">
                  <p className="response-text">{item.response}</p>
                  <p className="response-action">{item.action}</p>
                </div>
              ))}
            </div>
          ) : (
            <ul
              className={`subsection-list ${typeClass === 'warning' ? 'warning' : typeClass === 'success' ? 'success' : ''}`}
            >
              {(subsection.items as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {subsection.note && (
        <div className="subsection-note">
          <p>{subsection.note}</p>
        </div>
      )}
    </div>
  );
}

const styles = `
  .phase-page {
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

  .phase-badge {
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
    margin: 0 0 8px 0;
  }

  .tagline {
    color: #A0AEC0;
    font-size: 16px;
    font-style: italic;
    margin: 0 0 4px 0;
  }

  .duration {
    color: #D4A853;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }

  /* Main */
  .phase-main {
    padding: 32px 24px;
  }

  .phase-container {
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
    background: linear-gradient(90deg, #D4A853, #E5B964);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  /* Intro Card */
  .intro-card {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .intro-card p {
    color: #E2E8F0;
    line-height: 1.7;
    margin: 0;
  }

  /* Sections */
  .sections-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;
  }

  .section-card {
    background: #242D3D;
    border-radius: 12px;
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: #FFFFFF;
  }

  .section-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #D4A853;
  }

  .section-toggle {
    color: #5A6577;
  }

  .section-toggle svg {
    transition: transform 0.2s;
  }

  .section-content {
    padding: 0 24px 24px 24px;
    border-top: 1px solid #3D4A5C;
  }

  .section-intro,
  .section-text {
    font-size: 15px;
    line-height: 1.7;
    color: #E2E8F0;
    margin: 16px 0;
  }

  .why-list,
  .items-list {
    margin: 16px 0;
    padding-left: 20px;
    color: #E2E8F0;
  }

  .why-list li,
  .items-list li {
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 1.5;
  }

  /* Subsections */
  .subsection {
    margin: 20px 0;
    padding: 16px;
    background: #1A2332;
    border-radius: 8px;
  }

  .subsection h4 {
    font-size: 15px;
    font-weight: 600;
    color: #D4A853;
    margin: 0 0 8px 0;
  }

  .subsection-subtitle {
    font-size: 14px;
    color: #A0AEC0;
    font-style: italic;
    margin: 0 0 12px 0;
  }

  .subsection-content {
    font-size: 14px;
    color: #E2E8F0;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  .subsection-list {
    margin: 0;
    padding-left: 20px;
    color: #E2E8F0;
  }

  .subsection-list li {
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.5;
  }

  .subsection-list.numbered {
    padding-left: 24px;
  }

  .subsection-list.warning li {
    color: #E57373;
  }

  .subsection-list.success li {
    color: #4A9E7F;
  }

  .subsection.warning {
    border-left: 4px solid #E57373;
  }

  .subsection.success {
    border-left: 4px solid #4A9E7F;
  }

  .subsection-note {
    margin-top: 12px;
    padding: 12px;
    background: rgba(212, 168, 83, 0.1);
    border-radius: 6px;
  }

  .subsection-note p {
    font-size: 13px;
    color: #D4A853;
    font-style: italic;
    margin: 0;
    line-height: 1.5;
  }

  /* Responses */
  .responses-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .response-item {
    padding: 12px;
    background: #2D3748;
    border-radius: 6px;
  }

  .response-text {
    font-size: 14px;
    color: #E2E8F0;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .response-action {
    font-size: 13px;
    color: #4A9E7F;
    margin: 0;
    font-style: italic;
  }

  /* Sample Conversation */
  .sample-conversation {
    margin: 20px 0;
    padding: 20px;
    background: linear-gradient(135deg, rgba(45, 106, 106, 0.15) 0%, rgba(45, 106, 106, 0.05) 100%);
    border-left: 4px solid #2D6A6A;
    border-radius: 0 8px 8px 0;
  }

  .sample-conversation h4 {
    font-size: 14px;
    color: #2D6A6A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 12px 0;
  }

  .sample-conversation p {
    font-size: 14px;
    color: #E2E8F0;
    line-height: 1.7;
    margin: 0;
    font-style: italic;
    white-space: pre-line;
  }

  /* Additional Notes */
  .additional-note {
    margin: 16px 0;
    padding: 16px;
    background: #2D3748;
    border-radius: 8px;
  }

  .additional-note h5 {
    font-size: 14px;
    font-weight: 600;
    color: #D4A853;
    margin: 0 0 8px 0;
  }

  .additional-note p {
    font-size: 14px;
    color: #A0AEC0;
    margin: 0;
    line-height: 1.5;
  }

  /* Callout Box */
  .callout-box {
    margin: 20px 0;
    padding: 20px;
    background: rgba(212, 168, 83, 0.1);
    border: 1px solid rgba(212, 168, 83, 0.3);
    border-radius: 8px;
  }

  .callout-box h4 {
    font-size: 15px;
    font-weight: 600;
    color: #D4A853;
    margin: 0 0 12px 0;
  }

  .callout-box p {
    font-size: 14px;
    color: #E2E8F0;
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .callout-note {
    font-style: italic;
    color: #A0AEC0 !important;
    font-size: 13px !important;
  }

  /* Section Note */
  .section-note {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(74, 158, 127, 0.1);
    border-left: 4px solid #4A9E7F;
    border-radius: 0 6px 6px 0;
  }

  .section-note p {
    font-size: 14px;
    color: #4A9E7F;
    margin: 0;
    line-height: 1.5;
    white-space: pre-line;
  }

  /* Checklist Section */
  .checklist-section {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
  }

  .checklist-section h2 {
    font-size: 18px;
    font-weight: 600;
    color: #D4A853;
    margin: 0 0 20px 0;
  }

  .checklist-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #1A2332;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .checklist-item:hover {
    background: #2D3748;
  }

  .checklist-item.checked {
    background: rgba(74, 158, 127, 0.1);
  }

  .checklist-item input {
    display: none;
  }

  .checkbox-custom {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 2px solid #5A6577;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .checklist-item.checked .checkbox-custom {
    background: #4A9E7F;
    border-color: #4A9E7F;
    color: #FFFFFF;
  }

  .checkbox-label {
    font-size: 15px;
    color: #E2E8F0;
    line-height: 1.5;
  }

  .checklist-item.checked .checkbox-label {
    color: #4A9E7F;
  }

  /* Next Phase Section */
  .next-phase-section {
    background: #242D3D;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
    text-align: center;
  }

  .next-phase-section h3 {
    font-size: 16px;
    color: #D4A853;
    margin: 0 0 12px 0;
  }

  .next-phase-section p {
    font-size: 14px;
    color: #A0AEC0;
    margin: 0;
    line-height: 1.6;
    white-space: pre-line;
  }

  /* Phase Complete */
  .phase-complete-section {
    padding: 24px;
    background: linear-gradient(135deg, rgba(74, 158, 127, 0.1) 0%, rgba(74, 158, 127, 0.05) 100%);
    border: 1px solid rgba(74, 158, 127, 0.3);
    border-radius: 12px;
    text-align: center;
    margin-bottom: 32px;
  }

  .btn-phase-complete {
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

  .btn-phase-complete:hover:not(:disabled) {
    background: #5AB88F;
  }

  .btn-phase-complete:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Navigation */
  .phase-navigation {
    display: flex;
    justify-content: space-between;
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

    .section-header {
      padding: 16px;
    }

    .section-content {
      padding: 0 16px 16px 16px;
    }

    .checklist-item {
      padding: 12px;
    }
  }
`;
