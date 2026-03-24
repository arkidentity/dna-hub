'use client';

import { useState, useRef, useEffect } from 'react';

// ── Color Palette Presets ──────────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Navy & Gold', primary: '#1A2332', accent: '#D4A853' },
  { name: 'Forest & Cream', primary: '#1B4332', accent: '#D4C5A9' },
  { name: 'Burgundy & Rose', primary: '#5B1A2A', accent: '#E8B4B8' },
  { name: 'Midnight & Silver', primary: '#1C1C2E', accent: '#B8C4D0' },
  { name: 'Deep Teal & Sand', primary: '#134E4A', accent: '#D4C9A8' },
  { name: 'Royal Blue & Light Blue', primary: '#1E3A5F', accent: '#7FB3D8' },
  { name: 'Charcoal & Amber', primary: '#2D2D2D', accent: '#F0A830' },
  { name: 'Espresso & Tan', primary: '#3C2415', accent: '#C9A96E' },
  { name: 'Slate & Sage', primary: '#2F3E46', accent: '#84A98C' },
  { name: 'Plum & Lavender', primary: '#44234A', accent: '#C3A6D8' },
  { name: 'Dark Red & Peach', primary: '#6B1D1D', accent: '#F2C4A0' },
  { name: 'Black & White', primary: '#1A1A1A', accent: '#E8E8E8' },
];

// ── Helpers ────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1A2332' : '#FFFFFF';
}

// ── Main Component ─────────────────────────────────────────────

export default function ConferenceSignupPage() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [churchName, setChurchName] = useState('');
  const [churchLocation, setChurchLocation] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1A2332');
  const [accentColor, setAccentColor] = useState('#D4A853');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [step, setStep] = useState(1); // 1 = info, 2 = branding
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Success state
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState<{
    app_url: string;
    subdomain: string;
    church_id: string;
  } | null>(null);

  // Auto-generate subdomain from church name
  useEffect(() => {
    if (!subdomainTouched && churchName) {
      setSubdomain(slugify(churchName));
    }
  }, [churchName, subdomainTouched]);

  function handleSubdomainChange(value: string) {
    setSubdomainTouched(true);
    setSubdomain(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }

  function selectPreset(index: number) {
    setSelectedPreset(index);
    setPrimaryColor(COLOR_PRESETS[index].primary);
    setAccentColor(COLOR_PRESETS[index].accent);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5MB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateStep1(): boolean {
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!churchName.trim() || churchName.trim().length < 2) {
      setError('Please enter your church name.');
      return false;
    }
    return true;
  }

  function goToStep2() {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!subdomain || subdomain.length < 2) {
      setError('Please enter a subdomain (at least 2 characters).');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create church + account
      const response = await fetch('/api/conference/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          church_name: churchName.trim(),
          church_location: churchLocation.trim(),
          subdomain,
          primary_color: primaryColor,
          accent_color: accentColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // 2. Upload logo if provided
      if (logoFile && data.church_id) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('church_id', data.church_id);

        await fetch('/api/conference/upload-logo', {
          method: 'POST',
          body: formData,
        });
        // Non-fatal if logo upload fails — church is already created
      }

      setResultData(data);
      setSuccess(true);
    } catch {
      setError('Unable to connect. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success Screen ─────────────────────────────────────────

  if (success && resultData) {
    return (
      <div className="conf-page">
        <div className="conf-container">
          <div className="conf-card success-card">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1>Your App Is Live!</h1>
            <p className="success-church">{churchName}</p>

            <div className="app-url-box">
              <span className="app-url-label">Your App URL</span>
              <a href={resultData.app_url} target="_blank" rel="noopener noreferrer" className="app-url-link">
                {resultData.app_url}
              </a>
            </div>

            <div className="qr-section">
              <p className="qr-label">Share with your people</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(resultData.app_url)}&bgcolor=FFFBF5&color=1A2332&margin=8`}
                alt="QR Code to your app"
                className="qr-code"
                width={200}
                height={200}
              />
            </div>

            <div className="success-actions">
              <a href={resultData.app_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Open Your App
              </a>
            </div>

            <div className="login-instructions">
              <h3>Try It Out</h3>
              <p>Open the link above and log in with <strong>{email}</strong> to see your Pathway and start exploring your app as a disciple would.</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .conf-page {
            min-height: 100vh;
            background: #1A2332;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .conf-container {
            width: 100%;
            max-width: 480px;
          }
          .conf-card {
            background: #242D3D;
            border-radius: 16px;
            padding: 40px 32px;
          }
          .success-card {
            text-align: center;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            color: #4A9E7F;
          }
          .success-icon svg {
            width: 100%;
            height: 100%;
          }
          h1 {
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px 0;
          }
          .success-church {
            color: #D4A853;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 24px 0;
          }
          .app-url-box {
            background: #1A2332;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .app-url-label {
            display: block;
            color: #718096;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .app-url-link {
            color: #D4A853;
            font-size: 18px;
            font-weight: 600;
            text-decoration: none;
          }
          .app-url-link:hover {
            text-decoration: underline;
          }
          .qr-section {
            margin-bottom: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-label {
            color: #A0AEC0;
            font-size: 14px;
            margin: 0 0 12px 0;
          }
          .qr-code {
            border-radius: 8px;
            background: #FFFBF5;
            padding: 8px;
          }
          .success-actions {
            margin-bottom: 24px;
          }
          .btn-primary {
            display: inline-block;
            padding: 14px 32px;
            background: #D4A853;
            color: #1A2332;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s;
          }
          .btn-primary:hover {
            background: #E5B964;
          }
          .login-instructions {
            background: #1A2332;
            padding: 20px;
            border-radius: 8px;
          }
          .login-instructions h3 {
            color: #FFFFFF;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          .login-instructions p {
            color: #A0AEC0;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          .login-instructions strong {
            color: #D4A853;
          }
        `}</style>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────

  return (
    <div className="conf-page">
      <div className="conf-container">
        <div className="conf-header">
          <h1>DAILY DNA</h1>
          <p>See your branded discipleship app in 60 seconds</p>
        </div>

        <div className="conf-card">
          {/* Step indicator */}
          <div className="steps">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line" />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>
          <div className="step-labels">
            <span className={step === 1 ? 'current' : ''}>Your Info</span>
            <span className={step === 2 ? 'current' : ''}>Branding</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Step 1: Contact Info ── */}
            {step === 1 && (
              <div className="step-content">
                <div className="form-group">
                  <label htmlFor="name">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pastor John Smith"
                    required
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@mychurch.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="churchName">Church Name *</label>
                  <input
                    type="text"
                    id="churchName"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="First Baptist Church"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="churchLocation">City, State</label>
                  <input
                    type="text"
                    id="churchLocation"
                    value={churchLocation}
                    onChange={(e) => setChurchLocation(e.target.value)}
                    placeholder="Nashville, TN"
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="button" className="submit-btn" onClick={goToStep2}>
                  Next: Choose Your Colors
                </button>
              </div>
            )}

            {/* ── Step 2: Branding ── */}
            {step === 2 && (
              <div className="step-content">
                {/* Subdomain */}
                <div className="form-group">
                  <label htmlFor="subdomain">Your App URL *</label>
                  <div className="subdomain-input">
                    <input
                      type="text"
                      id="subdomain"
                      value={subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="mychurch"
                      required
                      autoFocus
                    />
                    <span className="subdomain-suffix">.dailydna.app</span>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="form-group">
                  <label>Choose Your Colors *</label>
                  <p className="color-hint">Pick a preset or customize below</p>
                  <div className="color-presets">
                    {COLOR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`preset-btn ${selectedPreset === i ? 'selected' : ''}`}
                        onClick={() => selectPreset(i)}
                        title={preset.name}
                      >
                        <span className="preset-primary" style={{ background: preset.primary }} />
                        <span className="preset-accent" style={{ background: preset.accent }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="color-row">
                  <div className="color-picker-group">
                    <label>Primary (dark)</label>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setSelectedPreset(-1);
                        }}
                        className="color-input"
                      />
                      <span className="color-hex">{primaryColor}</span>
                    </div>
                  </div>
                  <div className="color-picker-group">
                    <label>Accent (light)</label>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setSelectedPreset(-1);
                        }}
                        className="color-input"
                      />
                      <span className="color-hex">{accentColor}</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="preview-section">
                  <label>Preview</label>
                  <div className="app-preview" style={{ background: primaryColor }}>
                    <div className="preview-header" style={{ borderBottom: `2px solid ${accentColor}` }}>
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Logo" className="preview-logo" />
                      ) : (
                        <span style={{ color: getContrastColor(primaryColor), fontWeight: 700, fontSize: '16px' }}>
                          {churchName || 'Your Church'}
                        </span>
                      )}
                    </div>
                    <div className="preview-body">
                      <div className="preview-btn" style={{ background: accentColor, color: getContrastColor(accentColor) }}>
                        Start Journaling
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo Upload (Optional) */}
                <div className="form-group">
                  <label>Church Logo <span className="optional">(optional)</span></label>
                  <p className="color-hint">Horizontal logo works best. You can always add this later.</p>

                  {logoPreview ? (
                    <div className="logo-preview-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo preview" className="logo-preview-img" />
                      <button type="button" className="remove-logo" onClick={removeLogo}>Remove</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Logo
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="btn-row">
                  <button type="button" className="back-btn" onClick={() => { setStep(1); setError(''); }}>
                    Back
                  </button>
                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner" />
                        Launching...
                      </>
                    ) : (
                      'Launch My App'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="conf-footer">
          <p>Powered by <strong>DNA Discipleship</strong></p>
        </div>
      </div>

      <style jsx>{`
        .conf-page {
          min-height: 100vh;
          background: #1A2332;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .conf-container {
          width: 100%;
          max-width: 480px;
        }
        .conf-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .conf-header h1 {
          color: #D4A853;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .conf-header p {
          color: #A0AEC0;
          font-size: 16px;
          margin: 0;
        }
        .conf-card {
          background: #242D3D;
          border-radius: 16px;
          padding: 32px;
        }

        /* Steps */
        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 8px;
        }
        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          background: #3D4A5C;
          color: #5A6577;
          transition: all 0.2s;
        }
        .step-dot.active {
          background: #D4A853;
          color: #1A2332;
        }
        .step-line {
          width: 60px;
          height: 2px;
          background: #3D4A5C;
        }
        .step-labels {
          display: flex;
          justify-content: center;
          gap: 60px;
          margin-bottom: 24px;
        }
        .step-labels span {
          color: #5A6577;
          font-size: 12px;
          transition: color 0.2s;
        }
        .step-labels span.current {
          color: #D4A853;
        }

        /* Form */
        .step-content {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          color: #A0AEC0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .optional {
          color: #5A6577;
          font-weight: 400;
        }
        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="tel"] {
          width: 100%;
          padding: 14px 16px;
          background: #1A2332;
          border: 2px solid #3D4A5C;
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .form-group input::placeholder {
          color: #5A6577;
        }
        .form-group input:focus {
          outline: none;
          border-color: #D4A853;
          box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
        }

        /* Subdomain */
        .subdomain-input {
          display: flex;
          align-items: center;
          background: #1A2332;
          border: 2px solid #3D4A5C;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .subdomain-input:focus-within {
          border-color: #D4A853;
          box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
        }
        .subdomain-input input {
          flex: 1;
          padding: 14px 16px;
          background: transparent;
          border: none !important;
          color: #FFFFFF;
          font-size: 16px;
          outline: none;
          min-width: 0;
        }
        .subdomain-suffix {
          color: #5A6577;
          font-size: 14px;
          padding-right: 16px;
          white-space: nowrap;
        }

        /* Color Presets */
        .color-hint {
          color: #5A6577;
          font-size: 12px;
          margin: -4px 0 12px 0;
        }
        .color-presets {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        .preset-btn {
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
          height: 40px;
          transition: border-color 0.2s, transform 0.1s;
        }
        .preset-btn:hover {
          transform: scale(1.05);
        }
        .preset-btn.selected {
          border-color: #D4A853;
          box-shadow: 0 0 0 2px rgba(212, 168, 83, 0.3);
        }
        .preset-primary {
          flex: 1;
          display: block;
        }
        .preset-accent {
          flex: 1;
          display: block;
        }

        /* Color Pickers */
        .color-row {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .color-picker-group {
          flex: 1;
        }
        .color-picker-group label {
          display: block;
          color: #A0AEC0;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .color-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1A2332;
          padding: 6px 12px;
          border-radius: 8px;
          border: 2px solid #3D4A5C;
        }
        .color-input {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          padding: 0;
          background: none;
        }
        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-input::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
        }
        .color-hex {
          color: #718096;
          font-size: 12px;
          font-family: monospace;
        }

        /* Preview */
        .preview-section {
          margin-bottom: 20px;
        }
        .preview-section label {
          display: block;
          color: #A0AEC0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .app-preview {
          border-radius: 12px;
          overflow: hidden;
          transition: background 0.3s;
        }
        .preview-header {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-logo {
          height: 32px;
          max-width: 160px;
          object-fit: contain;
        }
        .preview-body {
          padding: 20px 16px;
          display: flex;
          justify-content: center;
        }
        .preview-btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
        }

        /* Logo Upload */
        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 2px dashed #3D4A5C;
          border-radius: 8px;
          color: #A0AEC0;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .upload-btn:hover {
          border-color: #D4A853;
          color: #D4A853;
        }
        .logo-preview-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #1A2332;
          padding: 12px 16px;
          border-radius: 8px;
        }
        .logo-preview-img {
          height: 40px;
          max-width: 160px;
          object-fit: contain;
        }
        .remove-logo {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #F87171;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
        }
        .remove-logo:hover {
          text-decoration: underline;
        }

        /* Error */
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #F87171;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        /* Buttons */
        .submit-btn {
          width: 100%;
          padding: 16px;
          background: #D4A853;
          border: none;
          border-radius: 8px;
          color: #1A2332;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #E5B964;
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-row {
          display: flex;
          gap: 12px;
        }
        .back-btn {
          padding: 16px 24px;
          background: transparent;
          border: 2px solid #3D4A5C;
          border-radius: 8px;
          color: #A0AEC0;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .back-btn:hover {
          border-color: #D4A853;
          color: #D4A853;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: #1A2332;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .conf-footer {
          text-align: center;
          margin-top: 24px;
        }
        .conf-footer p {
          color: #5A6577;
          font-size: 12px;
          margin: 0;
        }
        .conf-footer strong {
          color: #718096;
        }
      `}</style>
    </div>
  );
}
