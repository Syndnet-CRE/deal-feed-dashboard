import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link to="/" className="lp-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#5BCC48" strokeWidth="2"/>
            <path d="M14 6 L14 22 M8 12 L14 6 L20 12" stroke="#5BCC48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Nightdrop</span>
        </Link>
        <nav className="lp-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#testimonials">Reviews</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="lp-header-actions">
          <Link to="/login" className="lp-btn-ghost">Sign In</Link>
          <Link to="/login" className="lp-btn-primary">Join the Waitlist</Link>
        </div>
        <button className="lp-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && (
        <div className="lp-mobile-menu">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)}>Reviews</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
          <Link to="/login" className="lp-btn-primary" onClick={() => setMenuOpen(false)}>Join the Waitlist</Link>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-grid" aria-hidden="true" />
      <div className="lp-hero-content">
        <div className="lp-badge">Now accepting early access</div>
        <h1 className="lp-hero-headline">
          Tell us what you're looking for.<br />
          <span className="lp-hero-accent">Deals in your inbox every morning.</span>
        </h1>
        <p className="lp-hero-sub">
          Submit your acquisition criteria once. Every morning we deliver a curated digest of matched
          off-market properties — scored by distress signals, written up as actionable deal briefs,
          with owner contact info attached. No searching. No platforms.
        </p>
        <div className="lp-hero-cta">
          <Link to="/login" className="lp-btn-primary lp-btn-lg">Join the Waitlist</Link>
          <a href="#how-it-works" className="lp-btn-ghost lp-btn-lg">See how it works</a>
        </div>
        <div className="lp-stats">
          <div className="lp-stat">
            <span className="lp-stat-value">$2.3T</span>
            <span className="lp-stat-label">in off-market CRE tracked</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-value">70%+</span>
            <span className="lp-stat-label">of deals never hit the MLS</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-value">12hrs</span>
            <span className="lp-stat-label">before your competition wakes up</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const BENTO_CARDS = [
  {
    num: '01',
    title: 'Submit your buy box',
    desc: 'Tell us your asset class, geography, price range, and deal criteria. Takes five minutes.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 12h12M10 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="23" cy="22" r="5" fill="#5BCC48"/>
        <path d="M21 22l1.5 1.5L25 20" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    wide: false,
  },
  {
    num: '02',
    title: 'We search every night',
    desc: 'Our agents scan county records, distress databases, permit filings, and off-market signals while you sleep.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 8v8l5 3" stroke="#5BCC48" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    wide: false,
  },
  {
    num: '03',
    title: 'AI scores every match',
    desc: 'Each property is ranked against your criteria — distress depth, deal velocity, ownership motivation, and market comps.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 24 L12 16 L18 20 L26 8" stroke="#5BCC48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="26" cy="8" r="2.5" fill="#5BCC48"/>
      </svg>
    ),
    wide: true,
  },
  {
    num: '04',
    title: 'Distress signals surfaced',
    desc: 'Tax delinquency, code violations, foreclosure filings, loan maturities — every signal that matters, pre-pulled.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 5 L28 26 H4 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M16 13v6M16 22v1" stroke="#F4B73E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    wide: false,
  },
  {
    num: '05',
    title: 'Owner contact attached',
    desc: 'Verified owner name, entity structure, mailing address, and skip-traced phone — ready to reach out the moment you read it.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="22" r="4" fill="#5BCC48"/>
        <path d="M22.5 22h3M24 20.5v3" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    wide: false,
  },
  {
    num: '06',
    title: 'In your inbox by 6am',
    desc: 'A clean deal brief for every match, delivered before the workday starts. Your morning edge, automated.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 12l12 8 12-8" stroke="#5BCC48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    wide: false,
  },
];

function BentoSection() {
  return (
    <section className="lp-bento" id="how-it-works">
      <div className="lp-section-inner">
        <div className="lp-section-label">How Nightdrop Works</div>
        <h2 className="lp-section-title">Six steps. Zero effort on your part.</h2>
        <div className="lp-bento-grid">
          {BENTO_CARDS.map((card) => (
            <div key={card.num} className={`lp-bento-card${card.wide ? ' lp-bento-card--wide' : ''}`}>
              <div className="lp-bento-num">{card.num}</div>
              <div className="lp-bento-icon">{card.icon}</div>
              <h3 className="lp-bento-title">{card.title}</h3>
              <p className="lp-bento-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "I used to spend half my week driving for dollars and pulling lists. Nightdrop replaced all of that. I get better deals with better intel before I've had my first coffee.",
    name: "Marcus T.",
    role: "Multifamily Investor, Phoenix",
    large: true,
  },
  {
    quote: "The distress signal data alone is worth the subscription. I closed two deals in 90 days that I never would have found otherwise.",
    name: "Sarah K.",
    role: "CRE Broker, Dallas",
    large: false,
  },
  {
    quote: "Our acquisition pipeline went from reactive to proactive. We're finding deals before they're deals.",
    name: "James R.",
    role: "Private Equity, Chicago",
    large: false,
  },
  {
    quote: "The owner contact info is accurate. That's the thing that surprised me most. Skip-tracing used to eat two hours a day.",
    name: "Priya M.",
    role: "Industrial Investor, Atlanta",
    large: false,
  },
  {
    quote: "Set up my buy box on a Tuesday. Had three qualified leads in my inbox by Wednesday morning.",
    name: "Derek L.",
    role: "Net Lease Specialist, Denver",
    large: false,
  },
  {
    quote: "I've tried every deal sourcing platform. Nightdrop is the first one that actually fits how I work.",
    name: "Angela W.",
    role: "Office/Flex Investor, Austin",
    large: false,
  },
];

function TestimonialsSection() {
  return (
    <section className="lp-testimonials" id="testimonials">
      <div className="lp-section-inner">
        <div className="lp-section-label">What investors are saying</div>
        <h2 className="lp-section-title">From early access members</h2>
        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={`lp-testimonial-card${t.large ? ' lp-testimonial-card--large' : ''}`}>
              <div className="lp-testimonial-quote-mark">&ldquo;</div>
              <blockquote className="lp-testimonial-text">{t.quote}</blockquote>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">{t.name[0]}</div>
                <div>
                  <div className="lp-testimonial-name">{t.name}</div>
                  <div className="lp-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 150,
    annualPrice: 125,
    desc: 'Perfect for individual investors focused on one market.',
    features: [
      '1 buy box',
      'Up to 10 deals/day',
      'Distress signal scoring',
      'Owner contact info',
      'Email delivery by 6am',
      '30-day deal history',
    ],
    cta: 'Join Waitlist',
    popular: false,
  },
  {
    name: 'Investor',
    monthlyPrice: 200,
    annualPrice: 167,
    desc: 'For active investors running multiple strategies.',
    features: [
      '3 buy boxes',
      'Unlimited deals/day',
      'Advanced distress scoring',
      'Owner contact + skip trace',
      'Priority email delivery',
      '90-day deal history',
      'CSV export',
      'Slack integration (coming soon)',
    ],
    cta: 'Join Waitlist',
    popular: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    desc: 'Custom setup for teams, funds, and brokerages.',
    features: [
      'Unlimited buy boxes',
      'Unlimited deals/day',
      'Custom scoring models',
      'API access',
      'Team seats',
      'Dedicated onboarding',
      'SLA support',
    ],
    cta: 'Contact Us',
    popular: false,
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);
  return (
    <section className="lp-pricing" id="pricing">
      <div className="lp-section-inner">
        <div className="lp-section-label">Pricing</div>
        <h2 className="lp-section-title">Simple, transparent pricing</h2>
        <div className="lp-pricing-toggle">
          <span className={!annual ? 'active' : ''}>Monthly</span>
          <button
            className={`lp-toggle-switch${annual ? ' on' : ''}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
          >
            <span className="lp-toggle-knob" />
          </button>
          <span className={annual ? 'active' : ''}>Annual <span className="lp-savings-badge">Save 17%</span></span>
        </div>
        <div className="lp-plans-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`lp-plan-card${plan.popular ? ' lp-plan-card--popular' : ''}`}>
              {plan.popular && <div className="lp-popular-badge">Most Popular</div>}
              <div className="lp-plan-name">{plan.name}</div>
              <div className="lp-plan-price">
                {plan.monthlyPrice ? (
                  <>
                    <span className="lp-plan-amount">${annual ? plan.annualPrice : plan.monthlyPrice}</span>
                    <span className="lp-plan-period">/mo{annual ? ', billed annually' : ''}</span>
                  </>
                ) : (
                  <span className="lp-plan-amount">Custom</span>
                )}
              </div>
              <p className="lp-plan-desc">{plan.desc}</p>
              <ul className="lp-plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="#5BCC48" fillOpacity="0.15"/>
                      <path d="M5 8l2 2 4-4" stroke="#5BCC48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className={`lp-plan-cta${plan.popular ? ' lp-btn-primary' : ' lp-btn-outline'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: 'What markets do you cover?',
    a: 'We currently cover the top 50 US metros with full distress data coverage. Smaller markets are available on request for Enterprise plans.',
  },
  {
    q: 'Where does the property data come from?',
    a: 'We aggregate county recorder data, tax assessor records, foreclosure filings, code violation databases, permit records, and proprietary distress signal feeds — updated nightly.',
  },
  {
    q: 'How accurate is the owner contact info?',
    a: 'We run skip-trace verification on every owner record before delivery. Accuracy rates are consistently above 85% for phone numbers and above 95% for mailing addresses.',
  },
  {
    q: 'Can I change my buy box after I sign up?',
    a: 'Yes, at any time. Changes take effect the next nightly run.',
  },
  {
    q: "What if I don't find any matches?",
    a: "We'll notify you and suggest adjustments to your criteria. If you go 30 days without a match, we'll refund that month.",
  },
  {
    q: "Is there a free trial?",
    a: "We're in early access, so we're working directly with waitlist members to get you set up. Reach out after joining.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="lp-faq" id="faq">
      <div className="lp-section-inner lp-faq-inner">
        <div className="lp-section-label">FAQ</div>
        <h2 className="lp-section-title">Common questions</h2>
        <div className="lp-faq-list">
          {FAQS.map((item, i) => (
            <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
              <button className="lp-faq-question" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="lp-faq-chevron">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {open === i && <div className="lp-faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="lp-cta">
      <div className="lp-cta-bg" aria-hidden="true" />
      <div className="lp-cta-content">
        <h2 className="lp-cta-title">Stop chasing deals.<br />Start receiving them.</h2>
        <p className="lp-cta-sub">
          Join the Nightdrop waitlist. Early access is limited — we're onboarding investors one market at a time.
        </p>
        <Link to="/login" className="lp-btn-primary lp-btn-lg">Join the Waitlist</Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <Link to="/" className="lp-logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#5BCC48" strokeWidth="2"/>
              <path d="M14 6 L14 22 M8 12 L14 6 L20 12" stroke="#5BCC48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Nightdrop</span>
          </Link>
          <p className="lp-footer-tagline">Off-market CRE deals, every morning.</p>
        </div>
        <nav className="lp-footer-links">
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Product</div>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Company</div>
            <a href="mailto:brady@parcyl.ai">Contact</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Account</div>
            <Link to="/login">Sign In</Link>
            <Link to="/login">Join Waitlist</Link>
          </div>
        </nav>
      </div>
      <div className="lp-footer-bottom">
        <span>&copy; {new Date().getFullYear()} Parcyl Inc. All rights reserved.</span>
        <div className="lp-footer-legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export function LandingView() {
  return (
    <div className="lp-root">
      <LandingHeader />
      <main>
        <HeroSection />
        <BentoSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
