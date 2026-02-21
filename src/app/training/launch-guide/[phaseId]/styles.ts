// Styles for the Launch Guide Phase page
// Extracted from page.tsx for maintainability

export const styles = `
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
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }

  .section-card.section-completed {
    border-color: rgba(74, 158, 127, 0.3);
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

  .section-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-status {
    flex-shrink: 0;
  }

  .status-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
  }

  .status-icon.pending {
    background: rgba(212, 168, 83, 0.15);
    color: #D4A853;
  }

  .status-icon.completed {
    background: rgba(74, 158, 127, 0.15);
    color: #4A9E7F;
  }

  .section-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #D4A853;
  }

  .section-card.section-completed .section-info h3 {
    color: #4A9E7F;
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

  .subsection.collapsible {
    cursor: pointer;
  }

  .subsection-header-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 8px;
  }

  .subsection-header-btn h4 {
    margin: 0;
  }

  .subsection-header-btn svg {
    color: #5A6577;
    transition: transform 0.2s;
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

  .next-phase-hint {
    font-size: 15px;
    color: #A0AEC0;
    margin: 0;
    line-height: 1.6;
    white-space: pre-line;
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

  /* Resource Link */
  .resource-link-box {
    margin: 20px 0;
    padding: 20px;
    background: rgba(45, 106, 106, 0.1);
    border: 1px solid rgba(45, 106, 106, 0.3);
    border-radius: 8px;
    text-align: center;
  }

  .resource-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #2D6A6A;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    padding: 12px 20px;
    background: rgba(45, 106, 106, 0.15);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .resource-link:hover {
    background: rgba(45, 106, 106, 0.25);
  }

  .resource-description {
    font-size: 13px;
    color: #A0AEC0;
    margin: 12px 0 0 0;
  }

  /* Section Check */
  .section-check-box {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #3D4A5C;
  }

  .section-check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(212, 168, 83, 0.1) 0%, rgba(212, 168, 83, 0.05) 100%);
    border: 1px solid rgba(212, 168, 83, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .section-check-item:hover {
    background: linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(212, 168, 83, 0.08) 100%);
  }

  .section-check-item.checked {
    background: linear-gradient(135deg, rgba(74, 158, 127, 0.1) 0%, rgba(74, 158, 127, 0.05) 100%);
    border-color: rgba(74, 158, 127, 0.3);
  }

  .section-check-item input {
    display: none;
  }

  .section-check-item .checkbox-custom {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 2px solid #D4A853;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .section-check-item.checked .checkbox-custom {
    background: #4A9E7F;
    border-color: #4A9E7F;
    color: #FFFFFF;
  }

  .section-check-item .checkbox-label {
    font-size: 15px;
    color: #D4A853;
    font-weight: 600;
  }

  .section-check-item.checked .checkbox-label {
    color: #4A9E7F;
  }

  /* Interactive Fields */
  .interactive-field {
    margin: 20px 0;
    padding: 20px;
    background: #1A2332;
    border-radius: 8px;
  }

  .interactive-field label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #D4A853;
    margin-bottom: 12px;
  }

  .interactive-field input[type="text"],
  .interactive-field input[type="date"],
  .interactive-field textarea {
    width: 100%;
    padding: 12px 16px;
    background: #242D3D;
    border: 1px solid #3D4A5C;
    border-radius: 8px;
    color: #E2E8F0;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .interactive-field input:focus,
  .interactive-field textarea:focus {
    outline: none;
    border-color: #D4A853;
  }

  .interactive-field textarea {
    resize: vertical;
    min-height: 100px;
  }

  /* Names List Field */
  .names-input-row {
    display: flex;
    gap: 8px;
  }

  .names-input-row input {
    flex: 1;
  }

  .add-name-btn {
    padding: 12px 20px;
    background: #D4A853;
    color: #1A2332;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .add-name-btn:hover:not(:disabled) {
    background: #E5B964;
  }

  .add-name-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .names-list {
    list-style: none;
    padding: 0;
    margin: 16px 0 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .names-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(212, 168, 83, 0.15);
    border-radius: 20px;
    font-size: 14px;
    color: #E2E8F0;
  }

  .remove-name-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    background: rgba(229, 115, 115, 0.2);
    border: none;
    border-radius: 50%;
    color: #E57373;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .remove-name-btn:hover {
    background: rgba(229, 115, 115, 0.4);
  }

  .field-hint {
    font-size: 12px;
    color: #5A6577;
    margin: 12px 0 0 0;
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

    .names-input-row {
      flex-direction: column;
    }

    .section-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
`;
