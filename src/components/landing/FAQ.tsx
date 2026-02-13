const faqs = [
  {
    q: 'Is this another discipleship curriculum we add to what we already have?',
    a: 'No. DNA is infrastructure, not content. If you already have curriculum you love, DNA doesn\'t replace it — it gives your leaders the system to use it in a way that actually reproduces. Most churches have good content. They don\'t have a plan.',
  },
  {
    q: 'What if our leaders have never made a disciple before?',
    a: 'That\'s exactly who DNA is for. Leaders go through the 90-day toolkit as disciples first — before they lead anyone else. They experience every tool themselves before facilitating it. You can\'t give away what you haven\'t received.',
  },
  {
    q: 'How long before we see multiplication?',
    a: 'DNA takes 6–12 months for the first full cycle. That\'s not slow — that\'s real. Discipleship that reproduces in 6 weeks usually isn\'t producing disciples. The goal isn\'t speed; it\'s a process your leaders can run again and again without you.',
  },
  {
    q: 'Does this work for smaller churches?',
    a: 'DNA was designed to scale from small churches to multi-site. Smaller churches often see faster multiplication because the relational depth is already there — they just need the system. Partnership tiers adjust to your size and budget.',
  },
  {
    q: 'We\'re not sure we\'re ready. What\'s the first step?',
    a: 'Get the Multiplication Manual. Read it. If it resonates, take the Church Assessment. Then book a discovery call — we\'ll tell you honestly what we think after listening to your context.',
  },
];

export default function FAQ() {
  return (
    <section style={{ background: 'var(--lp-warm-white)', padding: '6rem 5rem' }} className="lp-faq">
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1.25rem',
            }}
          >
            Common Questions
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.6rem, 2.5vw, 2rem)',
              fontWeight: 900,
              marginBottom: '0.5rem',
            }}
          >
            What pastors usually ask first
          </h2>
        </div>

        <div className="fade-in">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              style={{ borderBottom: '1px solid var(--lp-rule)', padding: '1.5rem 0' }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                {faq.q}
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--lp-mid)' }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
