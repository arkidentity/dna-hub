'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

export default function MinistryGiftTestPage() {
  useScrollFadeIn();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [churchName, setChurchName] = useState('');
  const [churchSize, setChurchSize] = useState('');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/spiritual-gifts/leader-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, churchName, churchSize, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Something went wrong. Please try again.');
      }
      router.push('/ministry-gift-test/confirmation');
    } catch (err: unknown) {
      setSubmitState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(247,244,239,0.07)',
    border: '1px solid rgba(247,244,239,0.15)',
    borderRadius: '4px',
    color: 'var(--lp-warm-white)',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    color: 'rgba(247,244,239,0.5)',
    marginBottom: '0.4rem',
    letterSpacing: '0.03em',
    fontFamily: 'DM Sans, sans-serif',
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const eyebrowStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    color: 'var(--lp-gold)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.18em',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  };

  const eyebrowRuleStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '32px',
    height: '1px',
    background: 'var(--lp-gold)',
  };

  return (
    <div className="landing-page">
      {/* ── 1. NAV ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(247,244,239,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--lp-rule)',
        padding: '1rem 3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Image
          src="/dna-logo-black.png"
          alt="DNA Discipleship"
          width={120}
          height={36}
          style={{ height: '36px', width: 'auto' }}
          placeholder="empty"
          priority
        />
        <a
          href="#get-access"
          style={{
            background: 'var(--lp-gold)',
            color: '#fff',
            padding: '0.6rem 1.5rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.02em',
            transition: 'background 0.2s',
          }}
        >
          Get Free Access
        </a>
      </nav>

      {/* ── 2. HERO ── */}
      <section style={{ background: 'var(--lp-paper)', paddingTop: '0' }}>
        <div
          className="gt-hero"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '9rem 5rem 0',
          }}
        >
          <div style={eyebrowStyle}>
            <span style={eyebrowRuleStyle} />
            Free for Your Entire Team
          </div>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            fontWeight: 900,
            color: 'var(--lp-ink)',
            lineHeight: 1.08,
            margin: '0 0 2rem',
            letterSpacing: '-0.02em',
          }}>
            Know exactly where<br />
            your people<br />
            <em style={{ color: 'var(--lp-gold)', fontStyle: 'italic' }}>belong.</em>
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--lp-mid)',
            maxWidth: '580px',
            lineHeight: 1.7,
            margin: '0 0 4rem',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Most church leaders place people by availability, not design. The Ministry Gifts Assessment shows you — and your team — what God built them to do. Free for your entire church.
          </p>
        </div>
      </section>

      {/* ── 3. FORM SECTION ── */}
      <section
        id="get-access"
        className="gt-form-section"
        style={{
          background: 'var(--lp-accent)',
          padding: '5rem 5rem 6rem',
        }}
      >
        <div
          className="gt-form-inner"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT */}
          <div>
            <div style={{ ...eyebrowStyle, color: 'var(--lp-gold)' }}>
              <span style={eyebrowRuleStyle} />
              Free Team Access
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(2rem, 3vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: '0 0 1.5rem',
            }}>
              Give your team the clarity they've been{' '}
              <em style={{ color: 'var(--lp-gold)', fontStyle: 'italic' }}>missing.</em>
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(247,244,239,0.7)',
              lineHeight: 1.7,
              margin: '0 0 2.5rem',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Request access and we'll set up your church dashboard — free. Send the assessment to as many leaders as you need.
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}>
              {[
                'Church dashboard with all team results',
                'Unique assessment link for unlimited leaders',
                '96-question biblical assessment per person',
                'Results mapped across Romans 12, 1 Cor 12, Ephesians 4',
                'Personal gift profile for each team member',
                'Access via the Daily DNA app',
              ].map((item) => (
                <li key={item} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.95rem',
                  color: 'rgba(247,244,239,0.85)',
                  fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.5,
                }}>
                  <span style={{ color: 'var(--lp-gold)', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — FORM CARD */}
          <div style={{
            background: 'var(--lp-accent-light)',
            border: '1px solid rgba(247,244,239,0.08)',
            borderRadius: '8px',
            padding: '2.5rem',
          }}>
            <div style={{ ...eyebrowStyle, marginBottom: '0.75rem' }}>
              <span style={eyebrowRuleStyle} />
              Free — No Credit Card
            </div>
            <h3 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 0.5rem',
            }}>
              Ministry Gifts Assessment
            </h3>
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(247,244,239,0.4)',
              margin: '0 0 2rem',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Instant access · Unlimited team members · Results to your dashboard
            </p>

            <form onSubmit={handleSubmit} style={fieldGroupStyle}>
              <div>
                <label htmlFor="gt-name" style={labelStyle}>Your name</label>
                <input
                  id="gt-name"
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="gt-email" style={labelStyle}>Your email address</label>
                <input
                  id="gt-email"
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="gt-church" style={labelStyle}>Church name</label>
                <input
                  id="gt-church"
                  type="text"
                  required
                  placeholder="Church name"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="gt-size" style={labelStyle}>Church size</label>
                <select
                  id="gt-size"
                  required
                  value={churchSize}
                  onChange={(e) => setChurchSize(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c8922a' strokeWidth='1.5' fill='none' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                    cursor: 'pointer',
                    color: churchSize ? 'var(--lp-warm-white)' : 'rgba(247,244,239,0.4)',
                  }}
                >
                  <option value="" disabled>Church size</option>
                  <option value="1–50 people">1–50 people</option>
                  <option value="51–200 people">51–200 people</option>
                  <option value="201–500 people">201–500 people</option>
                  <option value="501–1,000 people">501–1,000 people</option>
                  <option value="1,000+ people">1,000+ people</option>
                </select>
              </div>
              <div>
                <label htmlFor="gt-message" style={labelStyle}>Anything else (optional)</label>
                <textarea
                  id="gt-message"
                  placeholder="Anything else we should know? (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: '80px',
                  }}
                />
              </div>

              {submitState === 'error' && (
                <p style={{
                  fontSize: '0.85rem',
                  color: '#f87171',
                  fontFamily: 'DM Sans, sans-serif',
                  margin: 0,
                }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitState === 'submitting'}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: submitState === 'submitting' ? 'var(--lp-gold-dark)' : 'var(--lp-gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  cursor: submitState === 'submitting' ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'background 0.2s',
                }}
              >
                {submitState === 'submitting' ? 'Sending…' : 'Request Free Access →'}
              </button>

              <p className="lp-form-hint" style={{
                fontSize: '0.78rem',
                color: 'rgba(247,244,239,0.35)',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Instant access. No spam, ever.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── 4. PROBLEM SECTION ── */}
      <section
        className="gt-problem"
        style={{
          background: 'var(--lp-ink)',
          padding: '6rem 5rem',
        }}
      >
        <div
          className="gt-problem-inner"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT */}
          <div>
            <div style={{ ...eyebrowStyle }}>
              <span style={eyebrowRuleStyle} />
              The Real Cost
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              margin: '0 0 1.5rem',
            }}>
              Wrong-fit ministry is why your best people quietly disappear.
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(247,244,239,0.7)',
              lineHeight: 1.75,
              margin: '0 0 1.25rem',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              It's not commitment. It's not burnout. It's not even busyness. When someone serves outside their God-given design, they feel something is wrong with them — and they leave before they ever figure out why.
            </p>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(247,244,239,0.7)',
              lineHeight: 1.75,
              margin: 0,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              The Ministry Gifts Assessment gives every person on your team language for how God wired them — and gives you a clear picture of where they'll thrive.
            </p>
          </div>

          {/* RIGHT */}
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              {
                title: 'Volunteers serve 6 months and disappear',
                body: 'Not because they lost faith — because they were placed in roles that drained them dry and nobody caught it.',
              },
              {
                title: 'Ministry feels like obligation instead of joy',
                body: "When people serve in their design, they don't need to be recruited. They show up. They stay. They multiply.",
              },
              {
                title: 'You spend more time filling roles than developing people',
                body: 'Gift clarity changes recruiting from a chore into a conversation. You stop filling slots and start placing people with intention.',
              },
            ].map((item) => (
              <div key={item.title} style={{
                border: '1px solid rgba(200,146,42,0.2)',
                background: 'rgba(200,146,42,0.04)',
                borderRadius: '6px',
                padding: '1.5rem',
              }}>
                <p style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#fff',
                  margin: '0 0 0.6rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {item.title}
                </p>
                <p style={{
                  fontSize: '0.87rem',
                  color: 'rgba(247,244,239,0.6)',
                  lineHeight: 1.65,
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. STORY SECTION ── */}
      <section
        className="gt-story"
        style={{
          background: 'var(--lp-accent)',
          padding: '6rem 5rem',
        }}
      >
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <div style={{ ...eyebrowStyle, justifyContent: 'center' }}>
            <span style={eyebrowRuleStyle} />
            Why It Matters
            <span style={eyebrowRuleStyle} />
          </div>
          <blockquote style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
            fontStyle: 'italic',
            color: '#fff',
            lineHeight: 1.45,
            margin: '0 0 2.5rem',
            padding: 0,
            border: 'none',
          }}>
            "She wasn't lazy. She wasn't uncommitted. She was serving outside her design."
          </blockquote>
          <p style={{
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.8,
            margin: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            When Nicole was organizing events at her church, she felt completely drained — not because she wasn't trying, but because administration wasn't how God wired her. After discovering her gift of mercy through the assessment, she moved into pastoral care. She didn't need to be motivated or managed. She just needed to be in the right place. That's what gift clarity does — it stops people from blaming themselves and gives leaders the map they need to place people well.
          </p>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section
        className="gt-how"
        style={{
          background: 'var(--lp-warm-white)',
          padding: '7rem 5rem',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ ...eyebrowStyle, justifyContent: 'center' }}>
              <span style={eyebrowRuleStyle} />
              How It Works
              <span style={eyebrowRuleStyle} />
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(2rem, 3vw, 2.8rem)',
              fontWeight: 800,
              color: 'var(--lp-ink)',
              margin: '0 0 1rem',
            }}>
              Simple. Biblical. Actionable.
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--lp-mid)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Three steps from sign-up to a full picture of your team's gifts.
            </p>
          </div>

          <div
            className="gt-steps-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              border: '1px solid var(--lp-rule)',
            }}
          >
            {[
              {
                num: '01',
                time: 'Instant',
                title: "You're in immediately",
                text: "Fill out the form. You're instantly added to your church dashboard and receive your unique assessment link — ready to send to your team right away.",
              },
              {
                num: '02',
                time: '15 minutes each',
                title: 'Your team takes the assessment',
                text: 'Send the link to as many leaders as you want. Each person completes 96 questions drawn from Romans 12, 1 Corinthians 12, and Ephesians 4.',
              },
              {
                num: '03',
                time: 'Immediately',
                title: 'Results come to you',
                text: "Every result flows into your church dashboard. You see your entire team's gifts in one place — and you finally know who belongs where.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="gt-step-card"
                style={{
                  padding: '2.5rem 2rem',
                  borderRight: i < 2 ? '1px solid var(--lp-rule)' : 'none',
                }}
              >
                <div style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: 'var(--lp-rule)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}>
                  {step.num}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--lp-gold)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.15em',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.6rem',
                }}>
                  {step.time}
                </div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--lp-ink)',
                  margin: '0 0 0.75rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontSize: '0.87rem',
                  color: 'var(--lp-mid)',
                  lineHeight: 1.65,
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. GIFTS GRID ── */}
      <section
        className="gt-gifts"
        style={{
          background: 'var(--lp-paper)',
          padding: '7rem 5rem',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            className="gt-gifts-header"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4rem',
              alignItems: 'start',
              marginBottom: '4rem',
            }}
          >
            <div>
              <div style={eyebrowStyle}>
                <span style={eyebrowRuleStyle} />
                Biblical Framework
              </div>
              <h2 style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(2rem, 3vw, 2.8rem)',
                fontWeight: 800,
                color: 'var(--lp-ink)',
                lineHeight: 1.2,
                margin: 0,
              }}>
                Not a personality test.{' '}
                <em style={{ color: 'var(--lp-gold)', fontStyle: 'italic' }}>A design test.</em>
              </h2>
            </div>
            <div style={{ paddingTop: '0.5rem' }}>
              <p style={{
                fontSize: '1rem',
                color: 'var(--lp-mid)',
                lineHeight: 1.75,
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                This isn't about whether you're an introvert or extrovert. It's about function — what God built you to do in the body of Christ. Romans 12, 1 Corinthians 12, and Ephesians 4 aren't suggestions. They're your team's blueprint.
              </p>
            </div>
          </div>

          <div
            className="gt-gifts-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1.5px',
              background: 'var(--lp-rule)',
            }}
          >
            {[
              {
                source: 'Romans 12:6',
                name: 'Prophecy',
                desc: "Declares God's truth with clarity and conviction. Moves people toward repentance, alignment, and accountability.",
              },
              {
                source: 'Romans 12:7',
                name: 'Serving',
                desc: 'Identifies and meets practical needs. Finds deep fulfillment in supporting others so ministry can move forward.',
              },
              {
                source: 'Romans 12:7',
                name: 'Teaching',
                desc: 'Communicates biblical truth with depth and precision. Helps others understand and apply Scripture to their lives.',
              },
              {
                source: 'Romans 12:8',
                name: 'Exhortation',
                desc: 'Comes alongside people to encourage, counsel, and call them forward. Naturally builds others toward growth.',
              },
              {
                source: 'Romans 12:8',
                name: 'Giving',
                desc: 'Contributes generously and joyfully. Sees resources as tools for Kingdom impact and gives with faith and precision.',
              },
              {
                source: 'Romans 12:8',
                name: 'Leadership',
                desc: 'Casts vision, organizes people, and moves groups toward goals with confidence and clarity.',
              },
              {
                source: 'Romans 12:8',
                name: 'Mercy',
                desc: 'Feels deeply for those who are hurting. Provides compassionate care and presence to the suffering.',
              },
              {
                source: '1 Cor 12, Eph 4',
                name: '+ More Gifts',
                desc: 'Healing, Faith, Administration, Evangelism, Pastoring, Tongues, Apostleship — and more. All mapped in the assessment.',
              },
            ].map((gift) => (
              <div key={gift.name} style={{
                background: 'var(--lp-warm-white)',
                padding: '1.75rem 2rem',
              }}>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--lp-gold)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                }}>
                  {gift.source}
                </div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--lp-ink)',
                  margin: '0 0 0.5rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {gift.name}
                </p>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--lp-mid)',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {gift.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PULLQUOTE ── */}
      <section style={{
        background: 'var(--lp-gold)',
        padding: '5rem',
        textAlign: 'center',
      }}>
        <Image
          src="/dna-logo-black.png"
          alt="DNA Discipleship"
          width={52}
          height={52}
          style={{ height: '52px', width: 'auto', marginBottom: '2rem', opacity: 0.7 }}
          placeholder="empty"
        />
        <blockquote style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
          fontStyle: 'italic',
          color: 'var(--lp-charcoal)',
          lineHeight: 1.45,
          maxWidth: '700px',
          margin: '0 auto 1.5rem',
          padding: 0,
          border: 'none',
        }}>
          "When people serve in their God-given design, they don't burn out. They multiply."
        </blockquote>
        <p style={{
          fontSize: '0.75rem',
          color: 'rgba(42,40,37,0.6)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.15em',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600,
          margin: 0,
        }}>
          DNA Discipleship
        </p>
      </section>

      {/* ── 9. FAQ ── */}
      <section
        className="gt-faq"
        style={{
          background: 'var(--lp-warm-white)',
          padding: '6rem 5rem',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ ...eyebrowStyle, justifyContent: 'center' }}>
            <span style={eyebrowRuleStyle} />
            Common Questions
            <span style={eyebrowRuleStyle} />
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(2rem, 3vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--lp-ink)',
            textAlign: 'center',
            margin: '0 0 3.5rem',
          }}>
            What pastors usually ask first
          </h2>

          {[
            {
              q: 'Is this actually free? What\'s the catch?',
              a: 'It\'s genuinely free. We offer this because we believe gift clarity is foundational to healthy discipleship — and we want to be useful to your church before anything else. No hidden fees, no auto-billing.',
            },
            {
              q: 'How many people can take it?',
              a: 'As many as you want. Once you have access, you get a unique link you can send to your entire leadership team, small group leaders, volunteers — whoever you want.',
            },
            {
              q: 'How long does the assessment take?',
              a: 'About 15 minutes per person. It\'s 96 questions drawn from Romans 12, 1 Corinthians 12, and Ephesians 4. Results show up in your church dashboard immediately after each person completes it.',
            },
            {
              q: 'Do team members need to download anything?',
              a: 'They\'ll sign up through the Daily DNA app — available on iOS and Android. It takes about 2 minutes to get set up and then they\'re straight into the assessment.',
            },
            {
              q: 'What happens after we get the results?',
              a: 'That\'s up to you. We\'ll follow up with some guidance on how to use the results well — and if you want to talk through what you\'re seeing in your team, we\'re happy to have that conversation. No pressure.',
            },
          ].map((item, i, arr) => (
            <div key={item.q} style={{
              borderBottom: i < arr.length - 1 ? '1px solid var(--lp-rule)' : 'none',
              padding: '2rem 0',
            }}>
              <p style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--lp-ink)',
                margin: '0 0 0.75rem',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {item.q}
              </p>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--lp-mid)',
                lineHeight: 1.7,
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. FOOTER CTA ── */}
      <section
        className="gt-footer-cta"
        style={{
          background: 'var(--lp-ink)',
          padding: '6rem 5rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          color: '#fff',
          margin: '0 0 1.25rem',
          lineHeight: 1.15,
        }}>
          Stop guessing where your people{' '}
          <em style={{ color: 'var(--lp-gold)', fontStyle: 'italic' }}>belong.</em>
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'rgba(247,244,239,0.5)',
          margin: '0 0 2.5rem',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Free access for your entire team. Results to your dashboard. Clarity you can actually use.
        </p>
        <a
          href="#get-access"
          style={{
            display: 'inline-block',
            background: 'var(--lp-gold)',
            color: '#fff',
            padding: '1rem 2.5rem',
            borderRadius: '4px',
            fontSize: '1.05rem',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
          }}
        >
          Get Free Team Access →
        </a>
        <p className="lp-form-hint" style={{
          fontSize: '0.78rem',
          color: 'rgba(247,244,239,0.3)',
          fontFamily: 'DM Sans, sans-serif',
          margin: 0,
        }}>
          No credit card. No commitment.
        </p>
      </section>

      {/* ── 11. SITE FOOTER ── */}
      <footer
        className="gt-site-footer"
        style={{
          background: 'var(--lp-charcoal)',
          padding: '2rem 5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image
            src="/dna-logo-black.png"
            alt="DNA Discipleship"
            width={28}
            height={28}
            style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(5deg)', opacity: 0.85 }}
            placeholder="empty"
          />
          <span style={{
            fontSize: '0.78rem',
            color: 'rgba(247,244,239,0.4)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            DNA Discipleship / A ministry of ARK Identity Discipleship
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'Login', href: '/login' },
            { label: 'Contact', href: '/contact' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: '0.82rem',
                color: 'rgba(247,244,239,0.45)',
                textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </footer>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 900px) {
          .gt-hero { padding: 7rem 2rem 0 !important; max-width: 100% !important; }
          .gt-form-section, .gt-problem, .gt-story, .gt-how, .gt-gifts, .gt-faq, .gt-footer-cta { padding: 4rem 2rem !important; }
          .gt-form-inner, .gt-problem-inner, .gt-gifts-header { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .gt-steps-grid, .gt-gifts-grid { grid-template-columns: 1fr !important; }
          .gt-step-card { border-right: none !important; border-bottom: 1px solid var(--lp-rule) !important; }
          .gt-step-card:last-child { border-bottom: none !important; }
          nav { padding: 1rem 1.5rem !important; }
          .gt-site-footer { flex-direction: column !important; gap: 1rem !important; padding: 2rem 1.5rem !important; text-align: center !important; }
        }
        @media (max-width: 600px) {
          .lp-form-hint { font-size: 1rem !important; }
          .gt-hero { padding: 6rem 1.5rem 0 !important; }
        }
      `}</style>
    </div>
  );
}
