'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface FormData {
  // Section 1: About You & Your Church
  church_name: string;
  church_city: string;
  church_state: string;
  attendance_size: string;
  your_name: string;
  your_role: string;
  is_decision_maker: string;

  // Section 2: Your Discipleship Context
  discipleship_culture: string;
  tried_before: string;
  tried_before_details: string;
  read_dna_manual: string;
  how_heard: string;
  how_heard_other: string;

  // Section 3: Readiness & Commitment
  pastor_commitment: string;
  leadership_buy_in: string;
  potential_leaders_count: string;
  launch_timeline: string;
  why_now: string;
  what_would_make_you_say_no: string;

  // Section 4: Contact Info
  contact_email: string;
  contact_phone: string;
  biggest_question: string;
}

const initialFormData: FormData = {
  church_name: '',
  church_city: '',
  church_state: '',
  attendance_size: '',
  your_name: '',
  your_role: '',
  is_decision_maker: '',

  discipleship_culture: '',
  tried_before: '',
  tried_before_details: '',
  read_dna_manual: '',
  how_heard: '',
  how_heard_other: '',

  pastor_commitment: '',
  leadership_buy_in: '',
  potential_leaders_count: '',
  launch_timeline: '',
  why_now: '',
  what_would_make_you_say_no: '',

  contact_email: '',
  contact_phone: '',
  biggest_question: '',
};

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Determine readiness level based on key answers
function calculateReadinessLevel(data: FormData): 'ready' | 'building' | 'exploring' {
  let score = 0;

  // Decision maker (important signal)
  if (data.is_decision_maker === 'yes') score += 2;
  else if (data.is_decision_maker === 'partial') score += 1;

  // Pastor commitment (heavy weight)
  if (data.pastor_commitment === '10' || data.pastor_commitment === '9') score += 3;
  else if (data.pastor_commitment === '8' || data.pastor_commitment === '7') score += 2;
  else if (data.pastor_commitment === '6' || data.pastor_commitment === '5') score += 1;

  // Leadership buy-in
  if (data.leadership_buy_in === 'fully_supportive') score += 3;
  else if (data.leadership_buy_in === 'mostly_supportive') score += 2;
  else if (data.leadership_buy_in === 'exploring') score += 1;

  // Have read the manual (shows seriousness)
  if (data.read_dna_manual === 'yes_fully') score += 2;
  else if (data.read_dna_manual === 'yes_partially') score += 1;

  // Potential leaders count
  if (data.potential_leaders_count === '6_plus') score += 2;
  else if (data.potential_leaders_count === '3_5') score += 1;

  // Launch timeline (urgency)
  if (data.launch_timeline === 'within_3_months') score += 2;
  else if (data.launch_timeline === '3_6_months') score += 1;

  // Discipleship culture exists
  if (data.discipleship_culture === 'active') score += 2;
  else if (data.discipleship_culture === 'inconsistent') score += 1;

  // Thresholds must match /src/app/api/assessment/route.ts
  if (score >= 10) return 'ready';
  if (score >= 5) return 'building';
  return 'exploring';
}

export default function AssessmentPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSections = 4;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateSection = (section: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (section === 1) {
      if (!formData.church_name) newErrors.church_name = 'Church name is required';
      if (!formData.church_city) newErrors.church_city = 'City is required';
      if (!formData.church_state) newErrors.church_state = 'State is required';
      if (!formData.attendance_size) newErrors.attendance_size = 'Please select an option';
      if (!formData.your_name) newErrors.your_name = 'Your name is required';
      if (!formData.your_role) newErrors.your_role = 'Your role is required';
      if (!formData.is_decision_maker) newErrors.is_decision_maker = 'Please select an option';
    }

    if (section === 2) {
      if (!formData.discipleship_culture) newErrors.discipleship_culture = 'Please select an option';
      if (!formData.tried_before) newErrors.tried_before = 'Please select an option';
      if (!formData.read_dna_manual) newErrors.read_dna_manual = 'Please select an option';
      if (!formData.how_heard) newErrors.how_heard = 'Please select an option';
    }

    if (section === 3) {
      if (!formData.pastor_commitment) newErrors.pastor_commitment = 'Please select an option';
      if (!formData.leadership_buy_in) newErrors.leadership_buy_in = 'Please select an option';
      if (!formData.potential_leaders_count) newErrors.potential_leaders_count = 'Please select an option';
      if (!formData.launch_timeline) newErrors.launch_timeline = 'Please select an option';
      if (!formData.why_now) newErrors.why_now = 'This field is required';
    }

    if (section === 4) {
      if (!formData.contact_email) newErrors.contact_email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Please enter a valid email';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => Math.min(prev + 1, totalSections));
      window.scrollTo(0, 0);
    }
  };

  const prevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateSection(currentSection)) return;

    setIsSubmitting(true);

    try {
      // Calculate readiness level
      const readinessLevel = calculateReadinessLevel(formData);

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, readiness_level: readinessLevel }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      // Redirect to thank-you with readiness level
      router.push(`/assessment/thank-you?level=${readinessLevel}&church=${encodeURIComponent(formData.church_name)}`);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: 'Failed to submit assessment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    required = false,
    placeholder = '',
    type = 'text'
  ) => (
    <div className="mb-6">
      <label className="block text-navy font-medium mb-2">
        {label}{required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        className={errors[field] ? 'border-error' : ''}
      />
      {errors[field] && <p className="text-error text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  const renderSelect = (
    label: string,
    field: keyof FormData,
    options: { value: string; label: string }[],
    required = false
  ) => (
    <div className="mb-6">
      <label className="block text-navy font-medium mb-2">
        {label}{required && <span className="text-error">*</span>}
      </label>
      <select
        value={formData[field]}
        onChange={e => updateField(field, e.target.value)}
        className={errors[field] ? 'border-error' : ''}
      >
        <option value="">Select an option...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors[field] && <p className="text-error text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  const renderTextarea = (
    label: string,
    field: keyof FormData,
    required = false,
    placeholder = ''
  ) => (
    <div className="mb-6">
      <label className="block text-navy font-medium mb-2">
        {label}{required && <span className="text-error">*</span>}
      </label>
      <textarea
        value={formData[field]}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={errors[field] ? 'border-error' : ''}
      />
      {errors[field] && <p className="text-error text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gold hover:text-gold-light">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH ASSESSMENT</p>
            <p className="text-white/70 text-sm">See if DNA is right for your church</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-foreground-muted mb-2">
            <span>Section {currentSection} of {totalSections}</span>
            <span>{Math.round((currentSection / totalSections) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(currentSection / totalSections) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Sections */}
        <div className="card">
          {/* Section 1: About You & Your Church */}
          {currentSection === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-2">About You & Your Church</h2>
              <p className="text-foreground-muted mb-6">Help us understand who we&apos;re talking to.</p>

              {renderInput('Church Name', 'church_name', true)}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-navy font-medium mb-2">
                    City<span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.church_city}
                    onChange={e => updateField('church_city', e.target.value)}
                    className={errors.church_city ? 'border-error' : ''}
                  />
                  {errors.church_city && <p className="text-error text-sm mt-1">{errors.church_city}</p>}
                </div>
                <div>
                  <label className="block text-navy font-medium mb-2">
                    State<span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.church_state}
                    onChange={e => updateField('church_state', e.target.value)}
                    className={errors.church_state ? 'border-error' : ''}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.church_state && <p className="text-error text-sm mt-1">{errors.church_state}</p>}
                </div>
              </div>

              {renderSelect('Average Weekend Attendance', 'attendance_size', [
                { value: 'under_50', label: 'Under 50' },
                { value: '50_100', label: '50-100' },
                { value: '100_250', label: '100-250' },
                { value: '250_500', label: '250-500' },
                { value: '500_1000', label: '500-1,000' },
                { value: '1000_plus', label: '1,000+' },
              ], true)}

              {renderInput('Your Name', 'your_name', true)}
              {renderInput('Your Role', 'your_role', true, 'e.g., Senior Pastor, Discipleship Director')}

              {renderSelect('Are you the decision-maker for discipleship initiatives at your church?', 'is_decision_maker', [
                { value: 'yes', label: 'Yes, I can make this decision' },
                { value: 'partial', label: 'Partially - I\'ll need to get approval from leadership' },
                { value: 'no', label: 'No - I\'m researching on behalf of someone else' },
              ], true)}
            </div>
          )}

          {/* Section 2: Your Discipleship Context */}
          {currentSection === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-2">Your Discipleship Context</h2>
              <p className="text-foreground-muted mb-6">Help us understand where you&apos;re starting from.</p>

              {renderSelect('How would you describe your church\'s current discipleship culture?', 'discipleship_culture', [
                { value: 'none', label: 'We don\'t really have one—people attend but don\'t go deeper' },
                { value: 'programs', label: 'We have programs but limited life-on-life discipleship' },
                { value: 'inconsistent', label: 'We have some people discipling others but it\'s inconsistent' },
                { value: 'active', label: 'We have an active discipleship culture but want to multiply it' },
              ], true)}

              {renderSelect('Has your church tried a discipleship program before?', 'tried_before', [
                { value: 'no', label: 'No, this would be our first intentional effort' },
                { value: 'yes_worked', label: 'Yes, and it went well' },
                { value: 'yes_struggled', label: 'Yes, but we struggled to sustain it' },
                { value: 'yes_failed', label: 'Yes, and it didn\'t work for us' },
              ], true)}

              {(formData.tried_before === 'yes_struggled' || formData.tried_before === 'yes_failed') && (
                <div className="mb-6 -mt-2">
                  <label className="block text-navy font-medium mb-2">
                    What happened? (This helps us avoid repeating past mistakes)
                  </label>
                  <textarea
                    value={formData.tried_before_details}
                    onChange={e => updateField('tried_before_details', e.target.value)}
                    placeholder="Tell us briefly what went wrong..."
                    rows={2}
                  />
                </div>
              )}

              {renderSelect('Have you read the DNA Manual?', 'read_dna_manual', [
                { value: 'yes_fully', label: 'Yes, I\'ve read the whole thing' },
                { value: 'yes_partially', label: 'Yes, I\'ve started it' },
                { value: 'no_have_it', label: 'No, but I have a copy' },
                { value: 'no_dont_have', label: 'No, I don\'t have it yet' },
              ], true)}

              {renderSelect('How did you hear about DNA?', 'how_heard', [
                { value: 'referral', label: 'Referral from another church/pastor' },
                { value: 'travis', label: 'I know Travis personally' },
                { value: 'event', label: 'Conference or event' },
                { value: 'search', label: 'Online search' },
                { value: 'social', label: 'Social media' },
                { value: 'other', label: 'Other' },
              ], true)}

              {formData.how_heard === 'other' && (
                <div className="mb-6 -mt-4">
                  <input
                    type="text"
                    value={formData.how_heard_other}
                    onChange={e => updateField('how_heard_other', e.target.value)}
                    placeholder="Please specify..."
                  />
                </div>
              )}

              {formData.how_heard === 'referral' && (
                <div className="mb-6 -mt-4">
                  <input
                    type="text"
                    value={formData.how_heard_other}
                    onChange={e => updateField('how_heard_other', e.target.value)}
                    placeholder="Who referred you? (optional)"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 3: Readiness & Commitment */}
          {currentSection === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-2">Readiness & Commitment</h2>
              <p className="text-foreground-muted mb-6">Help us understand where you are in the decision process.</p>

              {renderSelect('On a scale of 1-10, how committed is your senior pastor to implementing DNA?', 'pastor_commitment', [
                { value: '10', label: '10 - Fully committed, this is a priority' },
                { value: '9', label: '9 - Very committed' },
                { value: '8', label: '8 - Committed' },
                { value: '7', label: '7 - Interested and supportive' },
                { value: '6', label: '6 - Open to it' },
                { value: '5', label: '5 - Neutral' },
                { value: '4', label: '4 - Skeptical but willing to explore' },
                { value: '3', label: '3 - Hesitant' },
                { value: '2', label: '2 - Resistant' },
                { value: '1', label: '1 - Not involved/aware' },
              ], true)}

              {renderSelect('Is your church leadership (elders/board) on board?', 'leadership_buy_in', [
                { value: 'fully_supportive', label: 'Yes, fully supportive' },
                { value: 'mostly_supportive', label: 'Mostly - a few questions remain' },
                { value: 'exploring', label: 'We\'re exploring together' },
                { value: 'not_yet', label: 'Haven\'t discussed it with them yet' },
                { value: 'resistant', label: 'Some resistance' },
              ], true)}

              {renderSelect('How many potential DNA leaders do you have in mind?', 'potential_leaders_count', [
                { value: '0', label: 'None yet - still thinking about who' },
                { value: '1_2', label: '1-2 people' },
                { value: '3_5', label: '3-5 people' },
                { value: '6_plus', label: '6 or more' },
              ], true)}

              {renderSelect('When would you ideally want to launch?', 'launch_timeline', [
                { value: 'within_3_months', label: 'Within 3 months' },
                { value: '3_6_months', label: '3-6 months' },
                { value: '6_12_months', label: '6-12 months' },
                { value: 'no_timeline', label: 'No specific timeline - just exploring' },
              ], true)}

              {renderTextarea(
                'What\'s driving your interest in DNA right now?',
                'why_now',
                true,
                'What prompted you to pursue this now?'
              )}

              {renderTextarea(
                'What would make you say "no" to DNA?',
                'what_would_make_you_say_no',
                false,
                'This helps us address concerns upfront (optional but helpful)'
              )}
            </div>
          )}

          {/* Section 4: Contact Info */}
          {currentSection === 4 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-2">Last Step</h2>
              <p className="text-foreground-muted mb-6">How can we reach you?</p>

              {renderInput('Email', 'contact_email', true, '', 'email')}
              {renderInput('Phone (optional)', 'contact_phone', false, '', 'tel')}

              {renderTextarea(
                'What\'s your biggest question about DNA?',
                'biggest_question',
                false,
                'We\'ll address this on our discovery call'
              )}

              {errors.submit && (
                <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-card-border">
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSection === 1}
              className={`btn-secondary ${currentSection === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentSection < totalSections ? (
              <button type="button" onClick={nextSection} className="btn-primary">
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Get My Next Steps'
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
