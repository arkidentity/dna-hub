// Styles for the Training Assessment page
// Extracted from page.tsx for maintainability

export const styles = `
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
