import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: "You're In — DNA Discipleship",
  description: 'Your church dashboard is live. Your assessment link is ready to send.',
  robots: 'noindex',
};

const steps = [
  {
    num: '01',
    title: "Check your inbox — it's there now",
    text: 'Your church dashboard is live and your unique assessment link is already in your inbox. If you don\'t see it in the next few minutes, check your spam and add info@dnadiscipleship.com to your contacts.',
  },
  {
    num: '02',
    title: 'Send the link to your team',
    text: 'Forward the assessment link to as many leaders as you want — small group leaders, volunteers, staff. Each person signs up through the Daily DNA app and completes the 15-minute assessment.',
  },
  {
    num: '03',
    title: 'Watch results come in',
    text: 'Every time someone completes the assessment, their results appear in your church dashboard. You\'ll see each person\'s gift profile, their top gifts, and how your team maps across the biblical gift passages.',
  },
];

export default function GiftTestConfirmationPage() {
  return (
    <div className="landing-page" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--lp-paper)', color: 'var(--lp-ink)', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2.5rem',
        borderBottom: '1px solid var(--lp-rule)',
        background: 'var(--lp-warm-white)',
      }}>
        <Link href="/">
          <Image src="/dna-logo-black.png" alt="DNA Discipleship" width={120} height={36} placeholder="empty" style={{ height: '36px', width: 'auto' }} />
        </Link>
        <Link href="/login" style={{ fontSize: '0.82rem', color: 'var(--lp-mid)', textDecoration: 'none', letterSpacing: '0.05em' }}>
          Leader Login
        </Link>
      </nav>

      {/* Confirmation Hero */}
      <section style={{
        background: 'var(--lp-accent)',
        padding: '6rem 5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 30% 30%, rgba(200,146,42,0.2) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 70%, rgba(200,146,42,0.1) 0%, transparent 50%)
          `,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '620px', margin: '0 auto' }}>
          {/* Checkmark */}
          <div style={{
            width: '72px', height: '72px',
            border: '2px solid var(--lp-gold)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 2rem',
            fontSize: '1.75rem',
            color: 'var(--lp-gold)',
            animation: 'gt-popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}>
            ✓
          </div>

          <div style={{
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--lp-gold)', marginBottom: '1rem',
          }}>
            You&apos;re In — Instantly
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff',
            lineHeight: 1.1, marginBottom: '1.25rem',
          }}>
            Your dashboard is live.<br />
            Your link is <em style={{ fontStyle: 'italic', color: 'var(--lp-gold-light)' }}>ready.</em>
          </h1>

          <p style={{
            fontSize: '1.05rem', color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7, maxWidth: '500px', margin: '0 auto',
          }}>
            Your church dashboard is ready and your assessment link is on its way to your inbox right now. Here&apos;s exactly what to do next.
          </p>
        </div>
      </section>

      {/* What To Do Next */}
      <section style={{ background: 'var(--lp-warm-white)', padding: '6rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--lp-gold)',
            marginBottom: '1.25rem', textAlign: 'center',
          }}>
            What To Do Now
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.6rem, 2.5vw, 2rem)', fontWeight: 900,
            textAlign: 'center', marginBottom: '3rem',
          }}>
            Three steps to get your team started
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr',
                gap: '0 1.75rem',
                opacity: 0,
                animation: `gt-fadeUp 0.5s ${0.1 + i * 0.15}s forwards`,
              }}>
                {/* Number + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '48px', height: '48px',
                    border: '1.5px solid var(--lp-gold)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 600, color: 'var(--lp-gold)',
                    flexShrink: 0,
                  }}>
                    {step.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, width: '1px', background: 'var(--lp-rule)', marginTop: '0.5rem', minHeight: '2rem' }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ padding: '0.4rem 0 2.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>{step.title}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--lp-mid)', lineHeight: 1.7 }}>{step.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* While You Wait */}
      <section style={{
        background: 'var(--lp-paper)',
        padding: '5rem',
        borderTop: '1px solid var(--lp-rule)',
        borderBottom: '1px solid var(--lp-rule)',
      }} className="gt-confirm-wait">
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="gt-confirm-wait-inner">
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 900,
              marginBottom: '1rem', lineHeight: 1.25,
            }}>
              While your team takes the assessment
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--lp-mid)' }}>
              The assessment will tell you <em>what</em> your people are gifted to do. But knowing gifts is only half the picture. The other half is having a system that actually deploys them — where gifted people move from knowing to multiplying. That&apos;s what DNA is built for.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/" style={{
              background: 'var(--lp-warm-white)',
              border: '1px solid var(--lp-rule)',
              padding: '1.25rem 1.5rem',
              textDecoration: 'none', color: 'var(--lp-ink)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>See how DNA works</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--lp-mid)' }}>The discipleship system that turns gift clarity into multiplication</div>
              </div>
              <span style={{ color: 'var(--lp-gold)', fontSize: '1rem', flexShrink: 0, marginLeft: '1rem' }}>→</span>
            </Link>
            <a href="mailto:info@dnadiscipleship.com" style={{
              background: 'var(--lp-warm-white)',
              border: '1px solid var(--lp-rule)',
              padding: '1.25rem 1.5rem',
              textDecoration: 'none', color: 'var(--lp-ink)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Questions? Email us directly</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--lp-mid)' }}>info@dnadiscipleship.com — we respond same day</div>
              </div>
              <span style={{ color: 'var(--lp-gold)', fontSize: '1rem', flexShrink: 0, marginLeft: '1rem' }}>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Pullquote */}
      <section style={{ background: 'var(--lp-gold)', padding: '5rem', textAlign: 'center' }}>
        <Image src="/dna-logo-black.png" alt="DNA" width={52} height={52} placeholder="empty" style={{ width: '52px', height: '52px', margin: '0 auto 1.5rem', display: 'block' }} />
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 700, fontStyle: 'italic',
          color: 'var(--lp-ink)', maxWidth: '640px', margin: '0 auto 1.5rem', lineHeight: 1.45,
        }}>
          &ldquo;When people serve in their God-given design, they don&apos;t burn out. They multiply.&rdquo;
        </p>
        <div style={{ fontSize: '0.82rem', color: 'rgba(15,14,12,0.6)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          DNA Discipleship
        </div>
      </section>

      {/* Site Footer */}
      <footer style={{
        background: 'var(--lp-charcoal)', padding: '2rem 5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }} className="gt-confirm-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Image src="/dna-logo-gold.png" alt="DNA" width={28} height={28} placeholder="empty" style={{ height: '28px', width: 'auto', opacity: 0.55 }} />
          <div style={{ fontSize: '0.78rem', color: 'rgba(247,244,239,0.35)', lineHeight: 1.45 }}>
            DNA Discipleship<br />
            <span style={{ color: 'rgba(247,244,239,0.52)' }}>A ministry of ARK Identity Discipleship</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[['/', 'Home'], ['/login', 'Login'], ['mailto:info@dnadiscipleship.com', 'Contact']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontSize: '0.8rem', color: 'rgba(247,244,239,0.35)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </footer>

      {/* Keyframes + responsive */}
      <style>{`
        @keyframes gt-popIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gt-fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .gt-confirm-wait { padding: 4rem 2rem !important; }
          .gt-confirm-wait-inner { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .gt-confirm-footer { flex-direction: column !important; gap: 1rem !important; padding: 2rem 1.5rem !important; text-align: center !important; }
        }
        @media (max-width: 600px) {
          .lp-form-hint { font-size: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
