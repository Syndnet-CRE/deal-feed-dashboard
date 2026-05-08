import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'
import {
  AiCodeReviews,
  RealtimeCodePreviews,
  OneClickIntegrations,
  McpConnectivity,
  ParallelAgents,
  EasyDeployment,
} from './LandingBento.jsx'

/* ─── Animated section wrapper ──────────────────────────────────────────── */

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`nd-animated${visible ? ' nd-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/* ─── Header ────────────────────────────────────────────────────────────── */

function Header() {
  return (
    <header className="nd-header">
      <div className="nd-header-inner">
        <div className="nd-logo">
          <img src="/logos/nightdrop-logo.png" alt="Nightdrop" />
        </div>
        <nav className="nd-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#testimonials">Reviews</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nd-header-cta">
          <Link to="/login"><button className="nd-btn-ghost">Sign In</button></Link>
          <Link to="/login"><button className="nd-btn-primary">Join the Waitlist</button></Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────────────── */

function HeroSVG() {
  const COLS = 35
  const ROWS = 22
  const W = 1220
  const H = 810
  const cw = W / COLS
  const ch = H / ROWS

  const filledCells = [
    [3,4],[3,5],[4,4],[4,5],
    [8,10],[8,11],[9,10],[9,11],
    [15,3],[15,4],[16,3],[16,4],
    [20,14],[20,15],[21,14],[21,15],
    [28,7],[28,8],[29,7],[29,8],
    [31,17],[31,18],[32,17],[32,18],
  ]
  const filledSet = new Set(filledCells.map(([c,r]) => `${c}-${r}`))

  const filterGroups = [
    { id:'g1', x:2*cw, y:3*ch, w:4*cw, h:4*ch, blur:40, color:'#5BCC48', op:0.18 },
    { id:'g2', x:14*cw, y:2*ch, w:5*cw, h:4*ch, blur:50, color:'#5BCC48', op:0.12 },
    { id:'g3', x:19*cw, y:13*ch, w:5*cw, h:4*ch, blur:45, color:'#4ab83a', op:0.14 },
    { id:'g4', x:27*cw, y:6*ch, w:5*cw, h:5*ch, blur:55, color:'#5BCC48', op:0.10 },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="nd-hero-svg" style={{ display:'block' }}>
      <defs>
        {filterGroups.map(g => (
          <filter key={g.id} id={g.id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={g.blur} />
          </filter>
        ))}
        <linearGradient id="svgFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="60%" stopColor="#0f1211" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1211" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* glow blobs */}
      {filterGroups.map(g => (
        <rect key={g.id} x={g.x} y={g.y} width={g.w} height={g.h}
          fill={g.color} opacity={g.op} filter={`url(#${g.id})`} />
      ))}

      {/* grid */}
      {Array.from({ length: COLS }, (_, c) =>
        Array.from({ length: ROWS }, (_, r) => {
          const filled = filledSet.has(`${c}-${r}`)
          return (
            <rect key={`${c}-${r}`}
              x={c * cw + 1} y={r * ch + 1}
              width={cw - 2} height={ch - 2}
              rx="3"
              fill={filled ? 'rgba(91,204,72,0.18)' : 'none'}
              stroke={filled ? 'rgba(91,204,72,0.4)' : 'rgba(255,255,255,0.04)'}
              strokeWidth="1"
              strokeDasharray={filled ? '0' : '4 4'}
            />
          )
        })
      )}

      {/* fade-to-background at bottom */}
      <rect x="0" y="0" width={W} height={H} fill="url(#svgFade)" />
    </svg>
  )
}

function Hero() {
  return (
    <section className="nd-hero">
      <AnimatedSection>
        <div className="nd-hero-badge">
          <span className="nd-hero-badge-dot" />
          Early access now open
        </div>
        <h1 className="nd-hero-title">
          Tell us what you're looking for.<br />
          Deals in your inbox every morning.
        </h1>
        <p className="nd-hero-sub">
          A curated digest of distressed commercial properties matched to your exact buy box.
          No dashboards. No searching. Just deals.
        </p>
        <div className="nd-hero-actions">
          <Link to="/login"><button className="nd-btn-primary-lg">Get Early Access →</button></Link>
          <a href="#how-it-works"><button className="nd-btn-outline-lg">See how it works</button></a>
        </div>
      </AnimatedSection>
      <AnimatedSection delay={150}>
        <HeroSVG />
      </AnimatedSection>
    </section>
  )
}

/* ─── Social proof ──────────────────────────────────────────────────────── */

const socialLogos = [
  'Self-Storage Investors',
  'Industrial Operators',
  'CRE Funds',
  'Multifamily Buyers',
  'Land Developers',
]

function SocialProof() {
  return (
    <AnimatedSection>
      <div className="nd-social">
        <p className="nd-social-label">Trusted by investors across asset classes</p>
        <div className="nd-social-logos">
          {socialLogos.map(l => (
            <span key={l} className="nd-social-logo">{l}</span>
          ))}
        </div>
      </div>
    </AnimatedSection>
  )
}

/* ─── Bento section ─────────────────────────────────────────────────────── */

const bentoCards = [
  {
    title: 'Submit your buy box.',
    desc: 'Tell us your asset class, geography, lot size, value range, and distress criteria. Takes five minutes.',
    Component: AiCodeReviews,
  },
  {
    title: 'We search every night.',
    desc: 'Our pipeline runs at 2am against 160 million parcels with 900 data points per property — geospatial, demographic, ownership, transaction, and assessment data.',
    Component: RealtimeCodePreviews,
  },
  {
    title: 'AI scores every match.',
    desc: 'Each property is evaluated against your exact criteria and assigned a confidence score. Weak matches are dropped before they ever reach you.',
    Component: OneClickIntegrations,
  },
  {
    title: 'Distress signals surfaced.',
    desc: 'Tax delinquency, absentee ownership, long holds with no permits, inactive entities — every signal is flagged and explained.',
    Component: McpConnectivity,
  },
  {
    title: 'Owner contact attached.',
    desc: 'Each deal brief includes the best available owner contact — name, phone, and email — with confidence percentages on each.',
    Component: ParallelAgents,
  },
  {
    title: 'In your inbox by 6am.',
    desc: 'Matched deals land every morning as a clean email digest. Read it, make calls, move on.',
    Component: EasyDeployment,
  },
]

function BentoSection() {
  return (
    <section id="how-it-works" className="nd-section">
      <AnimatedSection>
        <div className="nd-bento-header">
          <span className="nd-section-label">How It Works</span>
          <h2 className="nd-section-title">Fully autonomous.<br />Zero dashboards.</h2>
          <p className="nd-section-sub" style={{ margin: '0 auto' }}>
            Your buy box runs every night and deals land in your inbox every morning.
          </p>
        </div>
      </AnimatedSection>
      <div className="nd-bento-grid">
        {bentoCards.map((card, i) => (
          <AnimatedSection key={card.title} delay={i * 60}>
            <div className="nd-bento-card">
              <div className="nd-bento-text">
                <p className="nd-bento-card-title">{card.title}</p>
                <p className="nd-bento-card-desc">{card.desc}</p>
              </div>
              <div className="nd-bento-illus">
                <card.Component />
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  )
}

/* ─── Large testimonial ─────────────────────────────────────────────────── */

function LargeTestimonial() {
  return (
    <AnimatedSection>
      <div className="nd-large-testimonial">
        <div className="nd-large-testimonial-inner">
          <blockquote className="nd-large-quote">
            "We tried building our own sourcing pipeline internally. It took months and it was never this good.
            Nightdrop was running in five minutes."
          </blockquote>
          <div className="nd-large-attr">
            <div className="nd-large-avatar">RF</div>
            <div>
              <div className="nd-large-name">Real Estate Fund Manager</div>
              <div className="nd-large-co">Houston, TX</div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

/* ─── Pricing ───────────────────────────────────────────────────────────── */

const plans = [
  {
    plan: 'Starter',
    monthlyPrice: 150,
    annualPrice: 135,
    desc: 'One buy box. Perfect for focused investors with a clear strategy.',
    features: ['1 active buy box', 'Daily email digest', 'Owner contact info', 'Distress signal breakdown', 'Up to 5 deals/day'],
    popular: false,
    cta: 'Get Started',
  },
  {
    plan: 'Investor',
    monthlyPrice: 200,
    annualPrice: 180,
    desc: 'Multiple buy boxes across markets. Built for serious operators.',
    features: ['Up to 5 active buy boxes', 'Daily email digest', 'Owner contact info', 'Distress signal breakdown', 'Up to 20 deals/day', 'Priority support'],
    popular: true,
    cta: 'Get Started',
  },
  {
    plan: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    desc: 'Custom coverage for funds and teams sourcing at scale.',
    features: ['Unlimited buy boxes', 'Custom geographies', 'API access', 'Dedicated support', 'Custom integrations', 'Team accounts'],
    popular: false,
    cta: 'Contact Us',
  },
]

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="nd-pricing-wrap">
      <AnimatedSection>
        <div className="nd-pricing-header">
          <span className="nd-section-label">Pricing</span>
          <h2 className="nd-section-title">Simple, transparent pricing</h2>
          <p className="nd-section-sub" style={{ margin: '0 auto' }}>
            No setup fees. No long-term contracts. Cancel any time.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="nd-pricing-toggle">
              <button
                className={`nd-toggle-btn${!isAnnual ? ' active' : ''}`}
                onClick={() => setIsAnnual(false)}
              >Monthly</button>
              <button
                className={`nd-toggle-btn${isAnnual ? ' active' : ''}`}
                onClick={() => setIsAnnual(true)}
              >Annual <span style={{ fontSize: 11, opacity: 0.8 }}>Save 10%</span></button>
            </div>
          </div>
        </div>
      </AnimatedSection>
      <div className="nd-pricing-grid">
        {plans.map((p, i) => {
          const price = isAnnual ? p.annualPrice : p.monthlyPrice
          return (
            <AnimatedSection key={p.plan} delay={i * 80}>
              <div className={`nd-pricing-card${p.popular ? ' popular' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="nd-pricing-plan">{p.plan}</div>
                  {p.popular && <span className="nd-pricing-popular-badge">Most Popular</span>}
                </div>
                <div className="nd-pricing-price">
                  {price ? (
                    <><sup>$</sup>{price}<span className="nd-price-period">/mo</span></>
                  ) : (
                    <span style={{ fontSize: 28 }}>Custom</span>
                  )}
                </div>
                <p className="nd-pricing-desc">{p.desc}</p>
                <hr className="nd-pricing-divider" />
                <ul className="nd-pricing-features">
                  {p.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button className="nd-pricing-cta">{p.cta}</button>
              </div>
            </AnimatedSection>
          )
        })}
      </div>
    </section>
  )
}

/* ─── Testimonial grid ──────────────────────────────────────────────────── */

const testimonials = [
  { quote: "I set my buy box for self-storage in the Austin metro and had three legit off-market leads in my inbox the next morning. One of them turned into a deal.", name: "Early Access Investor", company: "Austin, TX", type: "large-teal" },
  { quote: "The distress signal breakdown alone is worth the subscription. I know exactly why each deal is flagged before I pick up the phone.", name: "CRE Operator", company: "Dallas, TX", type: "small-dark" },
  { quote: "I was spending 15 hours a week pulling lists and skip tracing. Nightdrop cut that to zero.", name: "Wholesaler", company: "Phoenix, AZ", type: "small-dark" },
  { quote: "Finally a tool built for people who actually buy commercial real estate, not just browse it.", name: "Acquisitions Director", company: "Denver, CO", type: "small-dark" },
  { quote: "The owner contact info comes attached to every brief. Name, phone, email. I just make the call.", name: "Private Investor", company: "Nashville, TN", type: "small-dark" },
  { quote: "I have three buy boxes running across two states. Deals hit my inbox every morning before I've had my coffee.", name: "Portfolio Operator", company: "Atlanta, GA", type: "small-dark" },
  { quote: "We tried building our own sourcing pipeline internally. It took months and it was never this good. Nightdrop was running in five minutes.", name: "Real Estate Fund Manager", company: "Houston, TX", type: "large-light" },
]

function TestimonialCard({ quote, name, company, type }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`nd-tcard ${type}`}>
      <div className="nd-tcard-quote">"{quote}"</div>
      <div className="nd-tcard-attr">
        <div className="nd-tcard-avatar">{initials}</div>
        <div>
          <div className="nd-tcard-name">{name}</div>
          <div className="nd-tcard-co">{company}</div>
        </div>
      </div>
    </div>
  )
}

function TestimonialGridSection() {
  return (
    <section id="testimonials" className="nd-testimonials">
      <AnimatedSection>
        <div className="nd-testimonials-header">
          <h2 className="nd-section-title">Investors who tried it, kept it</h2>
          <p className="nd-section-sub" style={{ margin: '8px auto 0' }}>
            Early access feedback from real estate investors and operators using Nightdrop
          </p>
        </div>
      </AnimatedSection>
      <div className="nd-testimonial-grid">
        <div className="nd-testimonial-col">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="nd-testimonial-col">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="nd-testimonial-col">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ───────────────────────────────────────────────────────────────── */

const faqs = [
  { q: 'What asset classes does Nightdrop cover?', a: 'Self-storage, industrial, multifamily, retail, office, land, and mixed-use. You specify your asset class when you create your buy box.' },
  { q: 'How does the matching work?', a: 'Our pipeline scans 160 million parcels every night. Each property is scored against your exact buy box criteria — geography, lot size, value range, distress signals — and only strong matches are included in your digest.' },
  { q: 'Where does the owner contact info come from?', a: 'We aggregate from public records, skip-trace databases, and entity registries. Each contact comes with a confidence percentage. We surface the best available contact, not a list you have to sort through.' },
  { q: 'What counts as a distress signal?', a: 'Tax delinquency, absentee ownership, long holds with no permits or renovations, inactive registered entities, and properties with motivated-seller language in public filings.' },
  { q: 'Can I run multiple buy boxes?', a: 'Yes. The Investor plan supports up to 5 simultaneous buy boxes. Enterprise has no limit. Each box can target a different geography, asset class, or distress profile.' },
  { q: 'What if I don\'t get any matches on a given day?', a: 'We only send a digest when there are real matches. No filler, no padding. If your market is quiet, your inbox is quiet.' },
  { q: 'Is there a setup fee or contract?', a: 'No setup fee. No annual contract required (though we offer 10% off for annual billing). Cancel any time from your account settings.' },
]

function FAQSection() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faq" className="nd-faq">
      <AnimatedSection>
        <div className="nd-faq-header">
          <span className="nd-section-label">FAQ</span>
          <h2 className="nd-section-title">Common questions</h2>
        </div>
      </AnimatedSection>
      <div className="nd-faq-list">
        {faqs.map((f, i) => (
          <div key={i} className={`nd-faq-item${open === i ? ' open' : ''}`}>
            <div className="nd-faq-q" onClick={() => setOpen(open === i ? null : i)}>
              <span className="nd-faq-q-text">{f.q}</span>
              <svg className="nd-faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="nd-faq-a">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── CTA ───────────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <AnimatedSection>
      <div className="nd-cta">
        <div className="nd-cta-glow" />
        <h2 className="nd-cta-title">Ready to stop searching and start buying?</h2>
        <p className="nd-cta-sub">Set your buy box once. Let Nightdrop do the rest.</p>
        <div className="nd-cta-actions">
          <Link to="/login"><button className="nd-btn-primary-lg">Get Early Access →</button></Link>
        </div>
        <p className="nd-cta-note">No credit card required · Cancel anytime</p>
      </div>
    </AnimatedSection>
  )
}

/* ─── Footer ────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="nd-footer">
      <div className="nd-footer-inner">
        <div className="nd-footer-top">
          <div className="nd-footer-brand">
            <div className="nd-logo">
              <img src="/logos/nightdrop-logo.png" alt="Nightdrop" />
            </div>
            <p className="nd-footer-tagline">Distressed commercial deal flow, automated.</p>
          </div>
          <div className="nd-footer-links">
            <div className="nd-footer-col">
              <span className="nd-footer-col-label">Product</span>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="nd-footer-col">
              <span className="nd-footer-col-label">Company</span>
              <a href="#">About</a>
              <a href="#">Contact</a>
            </div>
            <div className="nd-footer-col">
              <span className="nd-footer-col-label">Legal</span>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="nd-footer-bottom">
          <span>© {new Date().getFullYear()} Nightdrop. All rights reserved.</span>
          <span>Built for CRE investors who move fast.</span>
        </div>
      </div>
    </footer>
  )
}

/* ─── Root ──────────────────────────────────────────────────────────────── */

export function LandingView() {
  return (
    <div className="nightdrop-landing">
      <Header />
      <Hero />
      <SocialProof />
      <BentoSection />
      <LargeTestimonial />
      <PricingSection />
      <TestimonialGridSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
