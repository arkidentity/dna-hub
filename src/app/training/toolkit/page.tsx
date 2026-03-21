'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DNA_TOOLKIT_GUIDES, LEADER_GUIDES_STORAGE_URL } from '@/lib/dna-toolkit-data';

export default function DNAToolkitPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
  });
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState('');

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openPdfViewer(filename: string, title: string) {
    setViewingPdf(`${LEADER_GUIDES_STORAGE_URL}?file=${encodeURIComponent(filename)}`);
    setViewingTitle(title);
  }

  function downloadPdf(filename: string) {
    const link = document.createElement('a');
    link.href = `${LEADER_GUIDES_STORAGE_URL}?file=${encodeURIComponent(filename)}&download=true`;
    link.download = filename;
    link.click();
  }

  return (
    <div className="toolkit-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Link href="/training" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Training Dashboard
          </Link>
          <h1>DNA Toolkit</h1>
          <p className="subtitle">Your complete library of DNA tools and leader resources.</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="toolkit-main">
        <div className="toolkit-container">

          {/* Accordion: About This Toolkit */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['overview'] ? 'open' : ''}`}
              onClick={() => toggleSection('overview')}
            >
              <h2>About This Toolkit</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['overview'] && (
              <div className="accordion-content">
                <div className="overview-content">
                  <p>
                    The DNA Toolkit is your master library of discipleship tools. Each tool is designed to be used inside your DNA group meetings — giving disciples a repeatable experience they can eventually facilitate themselves.
                  </p>
                  <p>
                    The toolkit is not a rigid curriculum. It&apos;s a library. The 90-Day Toolkit pathway tells you which tools to use in Phase 1 and in what sequence. Phase 2 and beyond give you more flexibility to use tools based on where your group is.
                  </p>

                  <div className="principles-grid">
                    <div className="principle-card">
                      <h4>Depth over velocity</h4>
                      <p>DNA runs on a 12-month multiplication timeline. Don&apos;t rush it. The system works because the relationships are real.</p>
                    </div>
                    <div className="principle-card">
                      <h4>Faithfulness over capability</h4>
                      <p>Select disciples who are hungry and faithful — not the most talented or ready-looking people in the room.</p>
                    </div>
                    <div className="principle-card">
                      <h4>Experience before facilitation</h4>
                      <p>Every tool in Phase 1 is experienced by disciples first. In Phase 2, they begin to facilitate. In Phase 3, they lead.</p>
                    </div>
                    <div className="principle-card">
                      <h4>The group is the curriculum</h4>
                      <p>The tools create the environment. The Holy Spirit and the relationships do the actual work. Stay out of the way when God is moving.</p>
                    </div>
                  </div>

                  <div className="expectations-block">
                    <h4>Leader Expectations</h4>
                    <p className="expectations-lead">Before you lead a tool, you must have experienced it as a disciple. This is non-negotiable in DNA. You cannot give away what you haven&apos;t received.</p>
                    <ul>
                      <li>Complete your own daily 3D Journal and 4D Prayer</li>
                      <li>Come to each meeting prepared — read the leader guide for that week&apos;s tool in advance</li>
                      <li>Model vulnerability. Your disciples will go as deep as you go.</li>
                      <li>Follow up with your disciples between meetings, not just during them</li>
                      <li>Stay connected to your coach and the DNA Cohort</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Accordion: Leader Guides */}
          <section className="accordion-section">
            <button
              className={`accordion-trigger ${openSections['guides'] ? 'open' : ''}`}
              onClick={() => toggleSection('guides')}
            >
              <h2>Leader Guides</h2>
              <span className="guide-count">{DNA_TOOLKIT_GUIDES.length} tools</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openSections['guides'] && (
              <div className="accordion-content">
                <div className="guides-grid">
                  {DNA_TOOLKIT_GUIDES.map((guide) => (
                    <div key={guide.id} className="guide-card">
                      <div className="guide-info">
                        <h4>{guide.name}</h4>
                        <p>{guide.description}</p>
                      </div>
                      <div className="guide-actions">
                        <button
                          className="btn-view"
                          onClick={() => openPdfViewer(guide.pdfFilename, guide.name)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </button>
                        <button
                          className="btn-download"
                          onClick={() => downloadPdf(guide.pdfFilename)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="pdf-overlay" onClick={() => setViewingPdf(null)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>{viewingTitle}</h3>
              <button className="pdf-close" onClick={() => setViewingPdf(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <iframe
              src={viewingPdf}
              className="pdf-iframe"
              title={`${viewingTitle} Leader Guide`}
            />
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .toolkit-page {
    min-height: 100vh;
    background: #1A2332;
    color: #FFFFFF;
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
    gap: 12px;
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
    flex: 1;
    text-align: left;
  }

  .guide-count {
    font-size: 13px;
    color: #A0AEC0;
    background: #1A2332;
    padding: 2px 10px;
    border-radius: 12px;
    white-space: nowrap;
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

  /* Overview Content */
  .overview-content p {
    color: #E2E8F0;
    line-height: 1.7;
    font-size: 15px;
    margin: 0 0 16px 0;
  }

  .principles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 24px 0;
  }

  .principle-card {
    background: #1A2332;
    border-radius: 8px;
    padding: 16px 16px 16px 20px;
    border-left: 4px solid #D4A853;
  }

  .principle-card h4 {
    color: #D4A853;
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 6px 0;
  }

  .principle-card p {
    color: #A0AEC0;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }

  .expectations-block {
    background: #1A2332;
    border-radius: 8px;
    padding: 20px;
    margin-top: 8px;
  }

  .expectations-block h4 {
    color: #D4A853;
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .expectations-lead {
    font-weight: 600 !important;
    color: #E2E8F0 !important;
    margin-bottom: 12px !important;
  }

  .expectations-block ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .expectations-block li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    color: #A0AEC0;
    line-height: 1.5;
  }

  .expectations-block li::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #D4A853;
    flex-shrink: 0;
    margin-top: 7px;
  }

  /* Leader Guides Grid */
  .guides-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .guide-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #1A2332;
    border-radius: 8px;
    padding: 16px 20px;
    transition: border-color 0.2s;
    border: 1px solid transparent;
  }

  .guide-card:hover {
    border-color: #3D4A5C;
  }

  .guide-info {
    flex: 1;
    min-width: 0;
  }

  .guide-info h4 {
    color: #E2E8F0;
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px 0;
  }

  .guide-info p {
    color: #A0AEC0;
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
  }

  .guide-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-view,
  .btn-download {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    white-space: nowrap;
  }

  .btn-view {
    background: rgba(212, 168, 83, 0.12);
    color: #D4A853;
  }

  .btn-view:hover {
    background: rgba(212, 168, 83, 0.25);
  }

  .btn-download {
    background: rgba(160, 174, 192, 0.1);
    color: #A0AEC0;
  }

  .btn-download:hover {
    background: rgba(160, 174, 192, 0.2);
    color: #E2E8F0;
  }

  /* PDF Viewer Modal */
  .pdf-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .pdf-modal {
    background: #242D3D;
    border-radius: 12px;
    width: 100%;
    max-width: 900px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pdf-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #3D4A5C;
  }

  .pdf-modal-header h3 {
    color: #D4A853;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .pdf-close {
    background: none;
    border: none;
    color: #A0AEC0;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .pdf-close:hover {
    color: #FFFFFF;
  }

  .pdf-iframe {
    flex: 1;
    width: 100%;
    border: none;
    background: #FFFFFF;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .header-content h1 {
      font-size: 24px;
    }

    .toolkit-main {
      padding: 24px 16px;
    }

    .accordion-trigger {
      padding: 14px 16px;
    }

    .accordion-content {
      padding: 0 16px 16px 16px;
    }

    .principles-grid {
      grid-template-columns: 1fr;
    }

    .guide-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
    }

    .guide-actions {
      width: 100%;
    }

    .btn-view,
    .btn-download {
      flex: 1;
      justify-content: center;
    }

    .pdf-overlay {
      padding: 0;
    }

    .pdf-modal {
      border-radius: 0;
      height: 100vh;
      max-width: 100%;
    }
  }
`;
