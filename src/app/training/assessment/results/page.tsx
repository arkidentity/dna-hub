'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roadblocks } from '@/lib/flow-assessment-data';

interface AssessmentResult {
  id: string;
  roadblock_ratings: Record<string, number>;
  reflections: Record<string, Record<string, string>>;
  top_roadblocks: string[];
  action_plan: Record<string, { actions: string[]; deadline: string }>;
  accountability_partner: string;
  accountability_date: string;
  completed_at: string;
  previous_assessment_id: string | null;
}

interface PreviousResult {
  id: string;
  roadblock_ratings: Record<string, number>;
  completed_at: string;
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [previousResult, setPreviousResult] = useState<PreviousResult | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch('/api/training/assessment/results');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          router.push('/training');
          return;
        }

        const data = await response.json();
        setResult(data.assessment);
        setPreviousResult(data.previousAssessment || null);
      } catch (error) {
        console.error('Failed to load results:', error);
        router.push('/training');
      } finally {
        setIsLoading(false);
      }
    }

    loadResults();
  }, [router]);

  if (isLoading) {
    return (
      <div className="results-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your results...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-page">
        <div className="error-container">
          <h1>No Results Found</h1>
          <p>Complete the Flow Assessment first to see your results.</p>
          <Link href="/training/assessment" className="btn-primary">
            Take Assessment
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const completedDate = new Date(result.completed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="results-page">
      {/* Header */}
      <header className="results-header">
        <Link href="/training" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
      </header>

      <main className="results-main">
        <div className="results-container">
          <h1>Flow Assessment Results</h1>
          <p className="results-date">Completed {completedDate}</p>

          {/* Chart */}
          <section className="section chart-section">
            <h2>Roadblock Ratings</h2>
            {previousResult && (
              <div className="legend">
                <span className="legend-current">Current</span>
                <span className="legend-previous">Previous</span>
              </div>
            )}
            <div className="chart">
              {roadblocks.map(rb => {
                const rating = result.roadblock_ratings[rb.id] || 0;
                const prevRating = previousResult?.roadblock_ratings[rb.id] || 0;
                const width = (rating / 5) * 100;
                const prevWidth = (prevRating / 5) * 100;
                const change = previousResult ? rating - prevRating : null;

                return (
                  <div key={rb.id} className="chart-row">
                    <span className="chart-label">{rb.shortTitle}</span>
                    <div className="chart-bar-container">
                      <div className="chart-bar" style={{ width: `${width}%` }} />
                      {previousResult && (
                        <div className="chart-previous" style={{ left: `${prevWidth}%` }} />
                      )}
                    </div>
                    <span className="chart-value">
                      {rating}/5
                      {change !== null && change !== 0 && (
                        <span className={`change ${change > 0 ? 'worse' : 'better'}`}>
                          {change > 0 ? `+${change}` : change}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top Roadblocks */}
          <section className="section top-section">
            <h2>Your Top Roadblocks</h2>
            {result.top_roadblocks.length > 0 ? (
              <div className="top-list">
                {result.top_roadblocks.map((id, i) => {
                  const rb = roadblocks.find(r => r.id === id);
                  if (!rb) return null;
                  return (
                    <div key={id} className="top-item">
                      <span className="top-rank">{i + 1}</span>
                      <div className="top-info">
                        <span className="top-name">{rb.title}</span>
                        <span className="top-rating">Rating: {result.roadblock_ratings[id]}/5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-top">No roadblocks rated 3 or higher. You&apos;re in great shape!</p>
            )}
          </section>

          {/* Action Plan */}
          {Object.keys(result.action_plan).length > 0 && (
            <section className="section action-plan-section">
              <h2>Your Action Plan</h2>
              {Object.entries(result.action_plan).map(([id, plan]) => {
                const rb = roadblocks.find(r => r.id === id);
                if (!rb || !plan.actions?.length) return null;
                return (
                  <div key={id} className="plan-item">
                    <h3>{rb.title}</h3>
                    <ul className="plan-actions">
                      {plan.actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                    {plan.deadline && (
                      <p className="plan-deadline">
                        Target: {new Date(plan.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Accountability */}
          {(result.accountability_partner || result.accountability_date) && (
            <section className="section accountability-section">
              <h2>Accountability</h2>
              {result.accountability_partner && (
                <p><strong>Partner:</strong> {result.accountability_partner}</p>
              )}
              {result.accountability_date && (
                <p><strong>First Check-in:</strong> {new Date(result.accountability_date).toLocaleDateString()}</p>
              )}
            </section>
          )}

          {/* Reflections */}
          {Object.keys(result.reflections).length > 0 && (
            <section className="section reflections-section">
              <h2>Your Reflections</h2>
              {Object.entries(result.reflections).map(([rbId, answers]) => {
                const rb = roadblocks.find(r => r.id === rbId);
                if (!rb) return null;
                const hasAnswers = Object.values(answers).some(a => a?.trim());
                if (!hasAnswers) return null;

                return (
                  <div key={rbId} className="reflection-block">
                    <h3>{rb.title}</h3>
                    {rb.reflectionQuestions.map((question, i) => {
                      const answer = answers[`q${i + 1}`];
                      if (!answer?.trim()) return null;
                      return (
                        <div key={i} className="reflection-item">
                          <p className="reflection-question">{question}</p>
                          <p className="reflection-answer">{answer}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          )}

          {/* Actions */}
          <div className="results-actions">
            <Link href="/training" className="btn-primary">
              Continue Training
            </Link>
            <button className="btn-secondary" onClick={() => window.print()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Results
            </button>
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .results-page {
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

  .error-container h1 {
    color: #D4A853;
    font-size: 28px;
    margin-bottom: 12px;
  }

  .error-container p {
    color: #A0AEC0;
    margin-bottom: 24px;
  }

  /* Header */
  .results-header {
    padding: 16px 24px;
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

  /* Main */
  .results-main {
    padding: 32px 24px;
  }

  .results-container {
    max-width: 700px;
    margin: 0 auto;
  }

  .results-container h1 {
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin: 0 0 8px 0;
  }

  .results-date {
    text-align: center;
    color: #A0AEC0;
    font-size: 14px;
    margin: 0 0 32px 0;
  }

  /* Sections */
  .section {
    background: #242D3D;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .section h2 {
    color: #D4A853;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .section h3 {
    color: #FFFFFF;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  /* Chart */
  .legend {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #A0AEC0;
  }

  .legend-current::before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 8px;
    background: #D4A853;
    border-radius: 2px;
    margin-right: 8px;
    vertical-align: middle;
  }

  .legend-previous::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 12px;
    background: #5A6577;
    margin-right: 8px;
    vertical-align: middle;
  }

  .chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chart-row {
    display: grid;
    grid-template-columns: 80px 1fr 70px;
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
    overflow: visible;
    position: relative;
  }

  .chart-bar {
    height: 100%;
    background: #D4A853;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .chart-previous {
    position: absolute;
    top: -2px;
    width: 3px;
    height: 24px;
    background: #5A6577;
    border-radius: 2px;
  }

  .chart-value {
    font-size: 13px;
    font-weight: 600;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .change {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .change.better {
    background: rgba(74, 158, 127, 0.2);
    color: #4A9E7F;
  }

  .change.worse {
    background: rgba(239, 68, 68, 0.2);
    color: #F87171;
  }

  /* Top Roadblocks */
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

  /* Action Plan */
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

  .plan-actions {
    list-style: none;
    padding: 0;
    margin: 0 0 12px 0;
  }

  .plan-actions li {
    position: relative;
    padding-left: 24px;
    margin-bottom: 8px;
    color: #A0AEC0;
    font-size: 14px;
    line-height: 1.4;
  }

  .plan-actions li::before {
    content: '☐';
    position: absolute;
    left: 0;
    color: #D4A853;
  }

  .plan-deadline {
    color: #D4A853;
    font-size: 13px;
    margin: 0;
  }

  /* Accountability */
  .accountability-section p {
    color: #A0AEC0;
    font-size: 14px;
    margin: 0 0 8px 0;
  }

  .accountability-section p strong {
    color: #FFFFFF;
  }

  /* Reflections */
  .reflection-block {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #3D4A5C;
  }

  .reflection-block:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .reflection-item {
    margin-bottom: 16px;
  }

  .reflection-item:last-child {
    margin-bottom: 0;
  }

  .reflection-question {
    color: #A0AEC0;
    font-size: 13px;
    margin: 0 0 4px 0;
  }

  .reflection-answer {
    color: #FFFFFF;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    padding: 12px;
    background: #1A2332;
    border-radius: 8px;
  }

  /* Actions */
  .results-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 32px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 32px;
    background: #D4A853;
    color: #1A2332;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-primary:hover {
    background: #E5B964;
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

  /* Print styles */
  @media print {
    .results-page {
      background: white;
      color: black;
    }

    .results-header,
    .results-actions {
      display: none;
    }

    .section {
      background: white;
      border: 1px solid #ddd;
      break-inside: avoid;
    }

    .section h2 {
      color: #1A2332;
    }

    .chart-bar {
      background: #D4A853;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .chart-row {
      grid-template-columns: 65px 1fr 60px;
      gap: 8px;
    }

    .chart-label {
      font-size: 11px;
    }
  }
`;
