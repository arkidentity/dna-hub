'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  launchGuideData,
  getPhase,
  Phase,
  Section,
  Subsection,
  ResponseItem,
  InteractiveField,
  SectionCheck,
} from '@/lib/launch-guide-data';
import { styles } from './styles';

interface PhaseProgress {
  completed: boolean;
  checklistCompleted: string[];
  sectionChecks?: string[]; // IDs of completed section checks
  userData?: Record<string, unknown>; // User input data (names, dates, etc.)
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
    sectionChecks: [],
    userData: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    const isCurrentlyExpanded = expandedSections.includes(sectionId);

    setExpandedSections(
      isCurrentlyExpanded
        ? [] // Collapse if clicking on the open section
        : [sectionId] // Only open the clicked section (accordion behavior)
    );

    // Scroll to the section if opening it
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const sectionEl = sectionRefs.current[sectionId];
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
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

  const toggleSectionCheck = async (checkId: string) => {
    if (isSaving) return;

    const currentChecks = progress.sectionChecks || [];
    const isCurrentlyChecked = currentChecks.includes(checkId);
    const newChecks = isCurrentlyChecked
      ? currentChecks.filter((id) => id !== checkId)
      : [...currentChecks, checkId];

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      sectionChecks: newChecks,
    }));

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/training/launch-guide/phases/${phaseId}/section-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkId, completed: !isCurrentlyChecked }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      } else {
        // Revert on error
        setProgress((prev) => ({
          ...prev,
          sectionChecks: currentChecks,
        }));
      }
    } catch (err) {
      console.error('Failed to update section check:', err);
      setProgress((prev) => ({
        ...prev,
        sectionChecks: currentChecks,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserData = async (fieldId: string, value: unknown) => {
    const currentData = progress.userData || {};
    const newData = { ...currentData, [fieldId]: value };

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      userData: newData,
    }));

    try {
      await fetch(
        `/api/training/launch-guide/phases/${phaseId}/user-data`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId, value }),
        }
      );
    } catch (err) {
      console.error('Failed to save user data:', err);
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

  // Calculate progress based on section checks (primary) and checklist items (secondary)
  const totalSectionChecks = phase.sections.filter(s => s.sectionCheck).length;
  const completedSectionChecks = (progress.sectionChecks || []).length;
  const checklistProgress = progress.checklistCompleted.length;
  const checklistTotal = phase.checklist.length;

  // Total progress = section checks + checklist items
  const totalItems = totalSectionChecks + checklistTotal;
  const completedItems = completedSectionChecks + checklistProgress;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Phase is complete when all section checks are done AND all checklist items (if any) are done
  const allSectionChecksComplete = completedSectionChecks === totalSectionChecks;
  const allChecklistComplete = checklistTotal === 0 || checklistProgress === checklistTotal;
  const phaseReadyToComplete = allSectionChecksComplete && allChecklistComplete;

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
              <span className="progress-label">Phase Progress</span>
              <span className="progress-count">
                {completedItems}/{totalItems}
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
            {phase.sections.map((section, sectionIndex) => {
              const isExpanded = expandedSections.includes(section.id);
              const sectionCheckCompleted = section.sectionCheck
                ? (progress.sectionChecks || []).includes(section.sectionCheck.id)
                : false;

              return (
                <div
                  key={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className={`section-card ${sectionCheckCompleted ? 'section-completed' : ''}`}
                >
                  <button
                    className="section-header"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="section-info">
                      <div className="section-status">
                        {sectionCheckCompleted ? (
                          <span className="status-icon completed">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </span>
                        ) : (
                          <span className="status-icon pending">{sectionIndex + 1}</span>
                        )}
                      </div>
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
                      {section.resourceLink && (
                        <div className="resource-link-box">
                          <a href="/training/resources" className="resource-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            {section.resourceLink.label}
                          </a>
                          <p className="resource-description">{section.resourceLink.description}</p>
                        </div>
                      )}
                      {section.note && (
                        <div className="section-note">
                          <p>{section.note}</p>
                        </div>
                      )}

                      {/* Interactive Fields */}
                      {section.interactiveFields?.map((field) => (
                        <InteractiveFieldRenderer
                          key={field.id}
                          field={field}
                          value={progress.userData?.[field.id]}
                          onChange={(value) => updateUserData(field.id, value)}
                        />
                      ))}

                      {/* Section Check */}
                      {section.sectionCheck && (
                        <div className="section-check-box">
                          <label
                            className={`section-check-item ${sectionCheckCompleted ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={sectionCheckCompleted}
                              onChange={() => toggleSectionCheck(section.sectionCheck!.id)}
                              disabled={isSaving}
                            />
                            <span className="checkbox-custom">
                              {sectionCheckCompleted && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <span className="checkbox-label">{section.sectionCheck.label}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Checklist - only show if there are checklist items */}
          {phase.checklist.length > 0 && (
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
          )}

          {/* Phase Complete Section with CTA */}
          <div className="phase-complete-section">
            {phaseReadyToComplete && !progress.completed ? (
              <button
                className="btn-phase-complete"
                onClick={completePhase}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : phase.nextPhasePrompt}
              </button>
            ) : (
              <p className="next-phase-hint">{phase.nextPhasePrompt}</p>
            )}
          </div>

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
  const [isExpanded, setIsExpanded] = useState(
    subsection.type !== 'warning' && subsection.type !== 'success'
  );
  const typeClass = subsection.type || '';
  const isCollapsible = subsection.type === 'warning' || subsection.type === 'success';

  return (
    <div className={`subsection ${typeClass} ${isCollapsible ? 'collapsible' : ''}`}>
      {isCollapsible ? (
        <button
          className="subsection-header-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4>{subsection.title}</h4>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      ) : (
        <h4>{subsection.title}</h4>
      )}
      {subsection.subtitle && (
        <p className="subsection-subtitle">{subsection.subtitle}</p>
      )}
      {subsection.content && <p className="subsection-content">{subsection.content}</p>}
      {(!isCollapsible || isExpanded) && subsection.items && (
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

function InteractiveFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: InteractiveField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [localValue, setLocalValue] = useState<string>('');
  const [namesList, setNamesList] = useState<string[]>((value as string[]) || []);

  // Debounce saving for text fields
  useEffect(() => {
    if (field.type === 'textarea' || field.type === 'text') {
      const timer = setTimeout(() => {
        if (localValue !== (value as string || '')) {
          onChange(localValue);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localValue, field.type, onChange, value]);

  // Initialize local value from saved value
  useEffect(() => {
    if (field.type === 'textarea' || field.type === 'text' || field.type === 'date') {
      setLocalValue((value as string) || '');
    }
  }, [value, field.type]);

  if (field.type === 'names_list') {
    const addName = () => {
      if (localValue.trim() && namesList.length < (field.maxItems || 10)) {
        const newList = [...namesList, localValue.trim()];
        setNamesList(newList);
        onChange(newList);
        setLocalValue('');
      }
    };

    const removeName = (index: number) => {
      const newList = namesList.filter((_, i) => i !== index);
      setNamesList(newList);
      onChange(newList);
    };

    return (
      <div className="interactive-field names-list-field">
        <label>{field.label}</label>
        <div className="names-input-row">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={field.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addName();
              }
            }}
          />
          <button
            type="button"
            onClick={addName}
            disabled={!localValue.trim() || namesList.length >= (field.maxItems || 10)}
            className="add-name-btn"
          >
            Add
          </button>
        </div>
        {namesList.length > 0 && (
          <ul className="names-list">
            {namesList.map((name, i) => (
              <li key={i}>
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeName(i)}
                  className="remove-name-btn"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="field-hint">
          {namesList.length}/{field.maxItems || 10} names added
        </p>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div className="interactive-field date-field">
        <label>{field.label}</label>
        <input
          type="date"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="interactive-field textarea-field">
        <label>{field.label}</label>
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      </div>
    );
  }

  // Default text field
  return (
    <div className="interactive-field text-field">
      <label>{field.label}</label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}
