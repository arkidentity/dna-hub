'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  toolkit90DayData,
  getMonthData,
  getWeeksForMonth,
  type ToolkitMonth,
  type ToolkitWeek,
} from '@/lib/toolkit-90day-data';

interface WeekProgressEntry {
  week_number: number;
  completed: boolean;
  completed_at: string | null;
}

interface ToolkitProgressResponse {
  weeks: WeekProgressEntry[];
  completedCount: number;
  totalWeeks: number;
}

export default function ToolkitMonthPage({ params }: { params: Promise<{ monthId: string }> }) {
  const resolvedParams = use(params);
  const monthId = parseInt(resolvedParams.monthId);
  const router = useRouter();
  const [month, setMonth] = useState<ToolkitMonth | null>(null);
  const [monthWeeks, setMonthWeeks] = useState<ToolkitWeek[]>([]);
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const monthData = getMonthData(monthId);
        if (!monthData) {
          setError('Month not found');
          setIsLoading(false);
          return;
        }
        setMonth(monthData);
        setMonthWeeks(getWeeksForMonth(monthId));

        // Fetch progress from API
        const response = await fetch('/api/training/toolkit');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.ok) {
          const data: ToolkitProgressResponse = await response.json();
          const completed = new Set<number>();
          data.weeks.forEach((w) => {
            if (w.completed) completed.add(w.week_number);
          });
          setCompletedWeeks(completed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [monthId, router]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getWeekStatus = (weekNumber: number): 'completed' | 'current' | 'locked' => {
    if (completedWeeks.has(weekNumber)) return 'completed';
    // Current = first non-completed week across ALL weeks
    for (let i = 1; i <= toolkit90DayData.weeks.length; i++) {
      if (!completedWeeks.has(i)) {
        return weekNumber === i ? 'current' : 'locked';
      }
    }
    return 'locked';
  };

  const totalMonths = toolkit90DayData.months.length;

  if (isLoading) {
    return (
      <div className="month-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading month...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !month) {
    return (
      <div className="month-page">
        <div className="error-container">
          <h1>Oops!</h1>
          <p>{error || 'Month not found.'}</p>
          <Link href="/training/toolkit" className="btn-primary">
            Back to Toolkit
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="month-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training/toolkit" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Toolkit
          </Link>

          <div className="badges-row">
            <span className="month-badge">Month {month.month}</span>
          </div>

          <h1>{month.title}</h1>
          <p className="focus-statement">{month.focus}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="month-main">
        <div className="month-container">
          {/* Intro Paragraph */}
          <div className="intro-block">
            <p>{month.intro}</p>
          </div>

          {/* Week Cards */}
          <div className="weeks-section">
            <h2 className="section-title">Weekly Sessions</h2>
            <div className="weeks-grid">
              {month.weeks.map((weekInfo) => {
                const status = getWeekStatus(weekInfo.week);
                return (
                  <Link
                    key={weekInfo.week}
                    href={`/training/toolkit/week/${weekInfo.week}`}
                    className={`week-card ${status}`}
                  >
                    <div className="week-card-header">
                      <span className="week-number">Week {weekInfo.week}</span>
                      {status === 'completed' && (
                        <span className="status-icon completed-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                      {status === 'current' && (
                        <span className="status-icon current-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className="week-card-title">{weekInfo.title}</h3>
                    <div className="week-card-tool">
                      <span className="tool-label">Tool</span>
                      <span className="tool-value">{weekInfo.tool}</span>
                    </div>
                    <p className="week-card-purpose">{weekInfo.purpose}</p>
                    <div className="week-card-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {weekInfo.timeCommitment}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Success Factors Accordion */}
          {month.successFactors.length > 0 && (
            <div className="accordion-section">
              <button
                className="accordion-header"
                onClick={() => toggleSection('successFactors')}
              >
                <h2 className="accordion-title">Success Factors</h2>
                <svg
                  className={`chevron ${expandedSections.successFactors ? 'expanded' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedSections.successFactors && (
                <div className="accordion-body">
                  <div className="factors-grid">
                    {month.successFactors.map((factor, i) => (
                      <div key={i} className="factor-card">
                        <h4 className="factor-title">{factor.title}</h4>
                        <p className="factor-description">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evaluation Accordion */}
          {month.evaluation && (
            <div className="accordion-section">
              <button
                className="accordion-header"
                onClick={() => toggleSection('evaluation')}
              >
                <h2 className="accordion-title">Evaluation</h2>
                <svg
                  className={`chevron ${expandedSections.evaluation ? 'expanded' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedSections.evaluation && (
                <div className="accordion-body">
                  {/* Green Lights */}
                  <div className="eval-group">
                    <h4 className="eval-group-title green-title">Green Lights</h4>
                    <ul className="eval-list">
                      {month.evaluation.greenLights.map((item, i) => (
                        <li key={i} className="eval-item">
                          <span className="eval-dot green-dot" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Yellow Lights */}
                  {month.evaluation.yellowLights && month.evaluation.yellowLights.length > 0 && (
                    <div className="eval-group">
                      <h4 className="eval-group-title yellow-title">Yellow Lights</h4>
                      <ul className="eval-list">
                        {month.evaluation.yellowLights.map((item, i) => (
                          <li key={i} className="eval-item">
                            <span className="eval-dot yellow-dot" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Red Lights */}
                  <div className="eval-group">
                    <h4 className="eval-group-title red-title">Red Lights</h4>
                    <ul className="eval-list">
                      {month.evaluation.redLights.map((item, i) => (
                        <li key={i} className="eval-item">
                          <span className="eval-dot red-dot" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prev/Next Month Navigation */}
          <div className="month-navigation">
            {monthId > 1 && (
              <Link href={`/training/toolkit/month/${monthId - 1}`} className="nav-link prev">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Month {monthId - 1}
              </Link>
            )}
            {monthId < totalMonths && (
              <Link href={`/training/toolkit/month/${monthId + 1}`} className="nav-link next">
                Month {monthId + 1}
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

// === Styles ===

const styles = `
  .month-page {
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

  .month-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .header-content h1 {
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }

  .focus-statement {
    color: #A0AEC0;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  /* Main */
  .month-main {
    padding: 32px 24px;
  }

  .month-container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Intro Block */
  .intro-block {
    margin-bottom: 40px;
  }

  .intro-block p {
    color: #E2E8F0;
    font-size: 15px;
    line-height: 1.8;
    margin: 0;
  }

  /* Weeks Section */
  .weeks-section {
    margin-bottom: 40px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 20px 0;
  }

  .weeks-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Week Card */
  .week-card {
    display: block;
    background: #242D3D;
    border: 2px solid #3D4A5C;
    border-radius: 12px;
    padding: 20px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .week-card:hover {
    border-color: #5A6577;
  }

  .week-card.completed {
    border-color: #4A9E7F;
  }

  .week-card.completed:hover {
    border-color: #5AB88F;
  }

  .week-card.current {
    border-color: #D4A853;
  }

  .week-card.current:hover {
    border-color: #E0BC6A;
  }

  .week-card.locked {
    opacity: 0.5;
  }

  .week-card.locked:hover {
    opacity: 0.65;
    border-color: #5A6577;
  }

  .week-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .week-number {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #A0AEC0;
  }

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .completed-icon {
    color: #4A9E7F;
  }

  .current-icon {
    color: #D4A853;
  }

  .week-card-title {
    font-size: 17px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 12px 0;
  }

  .week-card-tool {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .tool-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #D4A853;
  }

  .tool-value {
    font-size: 14px;
    color: #E2E8F0;
    font-weight: 500;
  }

  .week-card-purpose {
    font-size: 14px;
    color: #A0AEC0;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  .week-card-time {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(61, 74, 92, 0.6);
    color: #A0AEC0;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  /* Accordion */
  .accordion-section {
    background: #242D3D;
    border: 1px solid #3D4A5C;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 20px 24px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .accordion-title {
    font-size: 16px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0;
  }

  .chevron {
    color: #A0AEC0;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .chevron.expanded {
    transform: rotate(180deg);
  }

  .accordion-body {
    padding: 0 24px 24px 24px;
    border-top: 1px solid #3D4A5C;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Success Factors */
  .factors-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 20px;
  }

  .factor-card {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px 20px;
    border-left: 3px solid #D4A853;
  }

  .factor-title {
    font-size: 15px;
    font-weight: 600;
    color: #D4A853;
    margin: 0 0 6px 0;
  }

  .factor-description {
    font-size: 14px;
    color: #A0AEC0;
    line-height: 1.6;
    margin: 0;
  }

  /* Evaluation */
  .eval-group {
    padding-top: 20px;
  }

  .eval-group + .eval-group {
    padding-top: 16px;
  }

  .eval-group-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 12px 0;
  }

  .green-title {
    color: #4A9E7F;
  }

  .yellow-title {
    color: #D4A853;
  }

  .red-title {
    color: #E53E3E;
  }

  .eval-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .eval-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
    font-size: 14px;
    color: #E2E8F0;
    line-height: 1.6;
  }

  .eval-item:last-child {
    margin-bottom: 0;
  }

  .eval-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .green-dot {
    background: #4A9E7F;
  }

  .yellow-dot {
    background: #D4A853;
  }

  .red-dot {
    background: #E53E3E;
  }

  /* Navigation */
  .month-navigation {
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
    .page-header {
      padding: 16px;
    }

    .header-content h1 {
      font-size: 24px;
    }

    .month-main {
      padding: 24px 16px;
    }

    .week-card {
      padding: 16px;
    }

    .week-card-title {
      font-size: 16px;
    }

    .accordion-header {
      padding: 16px 18px;
    }

    .accordion-body {
      padding: 0 18px 18px 18px;
    }

    .factor-card {
      padding: 14px 16px;
    }
  }
`;
