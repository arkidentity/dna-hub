'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface FormData {
  // Section 1: Church Context
  church_name: string;
  lead_pastor_name: string;
  your_name_role: string;
  church_city: string;
  church_state: string;
  attendance_size: string;
  discipleship_culture: string;
  discipleship_culture_other: string;
  existing_structures: string[];
  existing_structures_other: string;

  // Section 2: Leadership Readiness
  primary_champion: string;
  potential_leaders_count: string;
  leaders_experienced: string;
  leader_availability: string;
  training_preference: string;
  annual_budget: string;
  biggest_concern: string;
  biggest_concern_other: string;

  // Section 3: Implementation Timeline
  launch_timeline: string;
  initial_group_count: string;
  driving_interest: string;

  // Section 4: Expectations & Vision
  success_vision: string;
  primary_goal: string;
  primary_goal_other: string;
  measurement_methods: string[];
  measurement_methods_other: string;

  // Section 5: Potential Barriers
  potential_barriers: string[];
  potential_barriers_other: string;
  leadership_buy_in: string;
  support_needed: string[];
  support_needed_other: string;

  // Section 6: Follow-Up
  contact_email: string;
  contact_phone: string;
  additional_notes: string;
}

const initialFormData: FormData = {
  church_name: '',
  lead_pastor_name: '',
  your_name_role: '',
  church_city: '',
  church_state: '',
  attendance_size: '',
  discipleship_culture: '',
  discipleship_culture_other: '',
  existing_structures: [],
  existing_structures_other: '',

  primary_champion: '',
  potential_leaders_count: '',
  leaders_experienced: '',
  leader_availability: '',
  training_preference: '',
  annual_budget: '',
  biggest_concern: '',
  biggest_concern_other: '',

  launch_timeline: '',
  initial_group_count: '',
  driving_interest: '',

  success_vision: '',
  primary_goal: '',
  primary_goal_other: '',
  measurement_methods: [],
  measurement_methods_other: '',

  potential_barriers: [],
  potential_barriers_other: '',
  leadership_buy_in: '',
  support_needed: [],
  support_needed_other: '',

  contact_email: '',
  contact_phone: '',
  additional_notes: '',
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

export default function AssessmentPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSections = 6;

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const toggleCheckbox = (field: keyof FormData, value: string) => {
    const current = formData[field] as string[];
    if (current.includes(value)) {
      updateField(field, current.filter(v => v !== value));
    } else {
      updateField(field, [...current, value]);
    }
  };

  const validateSection = (section: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (section === 1) {
      if (!formData.church_name) newErrors.church_name = 'Church name is required';
      if (!formData.your_name_role) newErrors.your_name_role = 'Your name and role is required';
      if (!formData.church_city) newErrors.church_city = 'City is required';
      if (!formData.church_state) newErrors.church_state = 'State is required';
      if (!formData.attendance_size) newErrors.attendance_size = 'Attendance size is required';
      if (!formData.discipleship_culture) newErrors.discipleship_culture = 'Please select an option';
    }

    if (section === 2) {
      if (!formData.primary_champion) newErrors.primary_champion = 'Please select an option';
      if (!formData.potential_leaders_count) newErrors.potential_leaders_count = 'Please select an option';
      if (!formData.leaders_experienced) newErrors.leaders_experienced = 'Please select an option';
      if (!formData.leader_availability) newErrors.leader_availability = 'Please select an option';
      if (!formData.training_preference) newErrors.training_preference = 'Please select an option';
      if (!formData.biggest_concern) newErrors.biggest_concern = 'Please select an option';
    }

    if (section === 3) {
      if (!formData.launch_timeline) newErrors.launch_timeline = 'Please select an option';
      if (!formData.initial_group_count) newErrors.initial_group_count = 'Please select an option';
      if (!formData.driving_interest) newErrors.driving_interest = 'This field is required';
    }

    if (section === 4) {
      if (!formData.success_vision) newErrors.success_vision = 'This field is required';
      if (!formData.primary_goal) newErrors.primary_goal = 'Please select an option';
    }

    if (section === 5) {
      if (!formData.leadership_buy_in) newErrors.leadership_buy_in = 'Please select an option';
    }

    if (section === 6) {
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
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');

      router.push('/onboarding/thank-you');
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
        value={formData[field] as string}
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
        value={formData[field] as string}
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
        value={formData[field] as string}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={errors[field] ? 'border-error' : ''}
      />
      {errors[field] && <p className="text-error text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  const renderCheckboxGroup = (
    label: string,
    field: keyof FormData,
    options: string[],
    otherField?: keyof FormData
  ) => (
    <div className="mb-6">
      <label className="block text-navy font-medium mb-3">{label}</label>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={(formData[field] as string[]).includes(option)}
              onChange={() => toggleCheckbox(field, option)}
              className="w-5 h-5 rounded border-input-border text-gold focus:ring-gold"
            />
            <span className="text-foreground">{option}</span>
          </label>
        ))}
        {otherField && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={(formData[field] as string[]).includes('Other')}
              onChange={() => toggleCheckbox(field, 'Other')}
              className="w-5 h-5 rounded border-input-border text-gold focus:ring-gold"
            />
            <span className="text-foreground">Other:</span>
            <input
              type="text"
              value={formData[otherField] as string}
              onChange={e => updateField(otherField, e.target.value)}
              className="flex-1 py-2"
              placeholder="Please specify..."
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/onboarding" className="text-gold hover:text-gold-light">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH ASSESSMENT</p>
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
          {/* Section 1: Church Context */}
          {currentSection === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Church Context</h2>

              {renderInput('Church Name', 'church_name', true)}
              {renderInput('Lead Pastor Name', 'lead_pastor_name', false)}
              {renderInput('Your Name & Role', 'your_name_role', true, 'e.g., John Smith, Executive Pastor')}

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

              {renderSelect('How would you describe your church\'s current discipleship culture?', 'discipleship_culture', [
                { value: 'none', label: 'We don\'t really have one—people attend but don\'t go deeper' },
                { value: 'programs', label: 'We have programs but limited life-on-life discipleship' },
                { value: 'inconsistent', label: 'We have some people discipling others but it\'s inconsistent' },
                { value: 'active', label: 'We have an active discipleship culture but want to multiply it' },
                { value: 'other', label: 'Other' },
              ], true)}

              {formData.discipleship_culture === 'other' && (
                <div className="mb-6 -mt-4">
                  <input
                    type="text"
                    value={formData.discipleship_culture_other}
                    onChange={e => updateField('discipleship_culture_other', e.target.value)}
                    placeholder="Please describe..."
                  />
                </div>
              )}

              {renderCheckboxGroup(
                'What existing small group or discipleship structures do you currently have?',
                'existing_structures',
                [
                  'Sunday School classes',
                  'Small groups (Bible studies, life groups, etc.)',
                  'One-on-one mentoring',
                  'Formal discipleship programs',
                  'Classes/seminars (Alpha, membership class, etc.)',
                  'None currently',
                ],
                'existing_structures_other'
              )}
            </div>
          )}

          {/* Section 2: Leadership Readiness */}
          {currentSection === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Leadership Readiness</h2>

              {renderSelect('Who will be the primary DNA champion/coordinator at your church?', 'primary_champion', [
                { value: 'lead_pastor', label: 'Lead Pastor' },
                { value: 'associate_pastor', label: 'Associate/Executive Pastor' },
                { value: 'discipleship_pastor', label: 'Discipleship Pastor/Director' },
                { value: 'small_groups_director', label: 'Small Groups Director' },
                { value: 'lay_leader', label: 'Lay leader/volunteer' },
                { value: 'not_decided', label: 'Not decided yet' },
              ], true)}

              {renderSelect('How many potential DNA leaders (people ready to lead groups) do you currently have?', 'potential_leaders_count', [
                { value: '0_2', label: '0-2' },
                { value: '3_5', label: '3-5' },
                { value: '6_10', label: '6-10' },
                { value: '10_plus', label: '10+' },
                { value: 'not_sure', label: 'Not sure yet' },
              ], true)}

              {renderSelect('Have any of your leaders personally experienced life-on-life discipleship before?', 'leaders_experienced', [
                { value: 'yes_many', label: 'Yes, many have' },
                { value: 'a_few', label: 'A few have' },
                { value: 'no', label: 'No, this will be new for most' },
                { value: 'not_sure', label: 'Not sure' },
              ], true)}

              {renderSelect('How often are your potential DNA leaders available for training/equipping?', 'leader_availability', [
                { value: 'weekly', label: 'Weekly (ongoing support/coaching)' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'intensive', label: 'Intensive weekend(s) upfront, then occasional check-ins' },
                { value: 'self_paced', label: 'Self-paced online with optional Q&A calls' },
                { value: 'not_sure', label: 'Not sure yet—need to assess availability' },
              ], true)}

              {renderSelect('How would you prefer to train/equip your DNA leaders?', 'training_preference', [
                { value: 'in_person_us', label: 'In-person at our church (you come to us)' },
                { value: 'in_person_you', label: 'In-person intensive (we come to you for training weekend)' },
                { value: 'video', label: 'Live video meetings (Zoom/Google Meet group training)' },
                { value: 'self_paced', label: 'Self-paced online course with videos/resources' },
                { value: 'hybrid', label: 'Hybrid (initial in-person kickoff + ongoing video support)' },
                { value: 'not_sure', label: 'Not sure yet—open to recommendations' },
              ], true)}

              {renderSelect('What\'s your annual budget for leadership development/training?', 'annual_budget', [
                { value: 'under_500', label: 'Under $500' },
                { value: '500_1500', label: '$500-$1,500' },
                { value: '1500_5000', label: '$1,500-$5,000' },
                { value: '5000_plus', label: '$5,000+' },
                { value: 'no_budget', label: 'No dedicated budget currently' },
                { value: 'not_sure', label: 'Not sure/Need to check' },
              ], false)}

              {renderSelect('What\'s your biggest concern about launching DNA?', 'biggest_concern', [
                { value: 'finding_leaders', label: 'Finding leaders who are ready' },
                { value: 'commitment', label: 'Getting people to commit long-term (6-12 months)' },
                { value: 'competing_programs', label: 'Competing with existing programs' },
                { value: 'unqualified_leaders', label: 'Leaders feeling unqualified or fearful' },
                { value: 'lack_buyin', label: 'Lack of buy-in from church leadership' },
                { value: 'sustainability', label: 'Sustainability—keeping it going after initial launch' },
                { value: 'other', label: 'Other' },
              ], true)}

              {formData.biggest_concern === 'other' && (
                <div className="mb-6 -mt-4">
                  <input
                    type="text"
                    value={formData.biggest_concern_other}
                    onChange={e => updateField('biggest_concern_other', e.target.value)}
                    placeholder="Please describe..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 3: Implementation Timeline */}
          {currentSection === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Implementation Timeline</h2>

              {renderSelect('When would you ideally like to launch your first DNA groups?', 'launch_timeline', [
                { value: 'within_1_month', label: 'Within 1 month' },
                { value: '1_3_months', label: '1-3 months' },
                { value: '3_6_months', label: '3-6 months' },
                { value: '6_12_months', label: '6-12 months' },
                { value: 'exploring', label: 'Just exploring right now, no timeline yet' },
              ], true)}

              {renderSelect('How many DNA groups do you hope to launch initially?', 'initial_group_count', [
                { value: '1_2', label: '1-2 groups (pilot test)' },
                { value: '3_5', label: '3-5 groups' },
                { value: '6_10', label: '6-10 groups' },
                { value: '10_plus', label: '10+ groups' },
                { value: 'not_sure', label: 'Not sure yet' },
              ], true)}

              {renderTextarea(
                'What\'s driving your interest in DNA discipleship right now?',
                'driving_interest',
                true,
                'Tell us what prompted you to pursue DNA...'
              )}
            </div>
          )}

          {/* Section 4: Expectations & Vision */}
          {currentSection === 4 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Expectations & Vision</h2>

              {renderTextarea(
                'What does success look like for DNA at your church in 12 months?',
                'success_vision',
                true,
                'Be specific...'
              )}

              {renderSelect('What\'s the #1 thing you hope DNA will accomplish in your church?', 'primary_goal', [
                { value: 'mature_believers', label: 'Develop mature believers who can lead' },
                { value: 'multiplication_culture', label: 'Create a culture of multiplication' },
                { value: 'deepen_relationships', label: 'Deepen relationships and community' },
                { value: 'raise_leaders', label: 'Raise up new leaders for ministry' },
                { value: 'attendance_to_discipleship', label: 'Move people from attendance to discipleship' },
                { value: 'other', label: 'Other' },
              ], true)}

              {formData.primary_goal === 'other' && (
                <div className="mb-6 -mt-4">
                  <input
                    type="text"
                    value={formData.primary_goal_other}
                    onChange={e => updateField('primary_goal_other', e.target.value)}
                    placeholder="Please describe..."
                  />
                </div>
              )}

              {renderCheckboxGroup(
                'How will you measure whether DNA is working?',
                'measurement_methods',
                [
                  'Number of groups launched',
                  'Number of leaders developed',
                  'Stories of spiritual growth/transformation',
                  'Groups multiplying into new groups',
                  'Increased engagement in church life',
                  'Not sure yet',
                ],
                'measurement_methods_other'
              )}
            </div>
          )}

          {/* Section 5: Potential Barriers */}
          {currentSection === 5 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Potential Barriers</h2>

              {renderCheckboxGroup(
                'What obstacles might prevent DNA from succeeding at your church?',
                'potential_barriers',
                [
                  'Busy schedules—people struggle to commit',
                  'Existing programs competing for time/energy',
                  'Lack of leadership buy-in',
                  'Cultural resistance to change',
                  'Leaders feeling unqualified',
                  'No clear communication/launch strategy',
                  'Financial constraints',
                ],
                'potential_barriers_other'
              )}

              {renderSelect('Is your church leadership (elders/board/lead pastor) fully on board with launching DNA?', 'leadership_buy_in', [
                { value: 'fully_supportive', label: 'Yes, fully supportive' },
                { value: 'mostly_supportive', label: 'Mostly supportive, a few questions remain' },
                { value: 'exploring', label: 'Leadership is exploring but not committed yet' },
                { value: 'not_sure', label: 'Not sure yet' },
              ], true)}

              {renderCheckboxGroup(
                'What support do you need most from ARK Identity to make this successful?',
                'support_needed',
                [
                  'Leader training (how to facilitate DNA groups)',
                  'Help communicating DNA vision to the church',
                  'Ongoing coaching for DNA leaders',
                  'Troubleshooting common challenges',
                  'Resources (printed materials, digital tools, etc.)',
                  'Strategy session for customizing DNA to our context',
                ],
                'support_needed_other'
              )}
            </div>
          )}

          {/* Section 6: Follow-Up */}
          {currentSection === 6 && (
            <div>
              <h2 className="text-2xl font-semibold text-navy mb-6">Follow-Up</h2>

              {renderInput('Best email to reach you', 'contact_email', true, '', 'email')}
              {renderInput('Best phone number', 'contact_phone', false, '', 'tel')}
              {renderTextarea(
                'Anything else we should know about your church or context?',
                'additional_notes',
                false,
                'Share anything else that would help us serve you well...'
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
                  'Submit Assessment'
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
