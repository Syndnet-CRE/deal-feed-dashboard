import { Search } from 'lucide-react'

/* ─── AiCodeReviews ─────────────────────────────────────────────────────── */

export function AiCodeReviews() {
  const bgPanel = {
    position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
    width: 340, height: 206, borderRadius: 12,
    background: 'rgba(231,236,235,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    opacity: 0.6, overflow: 'hidden', padding: 16,
  }
  const fgPanel = {
    position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%) scale(0.95)',
    width: 340, height: 221, borderRadius: 12,
    background: 'hsl(210 11% 9%)', border: '1px solid rgba(255,255,255,0.12)',
    overflow: 'hidden',
  }
  const codeRow = (highlight) => ({
    padding: '3px 16px', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap',
    background: highlight ? 'hsl(111 56% 54% / 0.15)' : 'transparent',
    borderLeft: highlight ? '2px solid hsl(111 56% 54%)' : '2px solid transparent',
    color: highlight ? 'hsl(160 14% 93%)' : 'hsl(160 14% 93% / 0.5)',
  })
  const btn = {
    margin: '10px 16px 0', padding: '6px 12px', borderRadius: 6,
    background: 'hsl(111 56% 54%)', border: 'none', cursor: 'pointer',
    color: 'hsl(160 8% 6%)', fontSize: 12, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }

  const bgRows = [
    '  const buyer = await db.findOne(',
    '    { email: params.email }',
    '  )',
    '  if (!buyer) throw new Error()',
    '  return formatBuyer(buyer)',
  ]
  const fgRows = [
    { text: "  const { data, error } = await supabase", hi: false },
    { text: "    .from('buy_boxes')", hi: false },
    { text: "    .select('*')", hi: false },
    { text: "    .eq('subscriber_id', id)", hi: true },
    { text: "    .order('created_at', { asc: false })", hi: true },
    { text: '', hi: false },
    { text: '  if (error) throw error', hi: false },
    { text: '  return data ?? []', hi: false },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={bgPanel}>
        {bgRows.map((r, i) => (
          <div key={i} style={{ padding: '3px 0', fontSize: 11, fontFamily: 'monospace', color: 'hsl(160 14% 93% / 0.3)' }}>{r}</div>
        ))}
      </div>
      <div style={fgPanel}>
        <div style={{ paddingTop: 12 }}>
          {fgRows.map((r, i) => (
            <div key={i} style={codeRow(r.hi)}>{r.text}</div>
          ))}
        </div>
        <button style={btn}>Apply changes ⌘Y</button>
      </div>
    </div>
  )
}

/* ─── RealtimeCodePreviews ──────────────────────────────────────────────── */

export function RealtimeCodePreviews() {
  const wrap = {
    display: 'flex', width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  }
  const leftPanel = {
    width: 350, height: 221, borderRadius: '12px 0 0 12px',
    background: 'rgba(231,236,235,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden', padding: '12px 0',
  }
  const rightPanel = {
    width: 175, height: 221, borderRadius: '0 12px 12px 0',
    background: 'rgba(231,236,235,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderLeft: 'none', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end', padding: 16,
  }
  const codeRow = (dim) => ({
    padding: '2px 16px', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap',
    color: dim ? 'rgba(231,236,235,0.3)' : 'rgba(231,236,235,0.7)',
  })
  const dlBtn = {
    padding: '7px 12px', borderRadius: 6, background: 'hsl(111 56% 54%)',
    border: 'none', cursor: 'pointer', color: 'hsl(160 8% 6%)',
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  }
  const lines = [
    { text: "import { runMatch } from './matcher'", dim: false },
    { text: "import { sendDigest } from './mailer'", dim: false },
    { text: '', dim: true },
    { text: 'export async function runNightly(subs) {', dim: false },
    { text: '  for (const sub of subs) {', dim: false },
    { text: '    const matches = await runMatch(sub)', dim: false },
    { text: '    if (matches.length === 0) continue', dim: true },
    { text: '    await sendDigest(sub, matches)', dim: false },
    { text: '  }', dim: false },
    { text: '}', dim: false },
  ]

  return (
    <div style={wrap}>
      <div style={leftPanel}>
        {lines.map((l, i) => <div key={i} style={codeRow(l.dim)}>{l.text}</div>)}
      </div>
      <svg width="2" height="221" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="lgLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(111 56% 54%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(111 56% 54%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(111 56% 54%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="2" height="221" fill="url(#lgLine)" />
      </svg>
      <div style={rightPanel}>
        <button style={dlBtn}>Download for macOS</button>
      </div>
    </div>
  )
}

/* ─── Logo SVGs ─────────────────────────────────────────────────────────── */

function FigmaLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 38 57" fill="none">
      <path d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.5 9.5 0 0 1 19 28.5Z" fill="var(--oci-primary)" />
      <path d="M9.5 57A9.5 9.5 0 0 0 19 47.5V38H9.5a9.5 9.5 0 0 0 0 19Z" fill="var(--oci-primary)" opacity=".7" />
      <path d="M9.5 38H19V19H9.5a9.5 9.5 0 0 0 0 19Z" fill="var(--oci-primary)" opacity=".5" />
      <path d="M19 19H28.5a9.5 9.5 0 0 0 0-19H19Z" fill="var(--oci-primary)" opacity=".9" />
      <path d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19Z" fill="var(--oci-primary)" opacity=".6" />
    </svg>
  )
}

function VercelLogo() {
  return (
    <svg width="24" height="21" viewBox="0 0 284 246" fill="none">
      <path d="M142 0L284 246H0L142 0Z" fill="var(--oci-primary)" />
    </svg>
  )
}

function GitHubLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 98 96" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" fill="var(--oci-primary)"
        d="M49 0C21.9 0 0 22 0 49.2c0 21.8 14 40.2 33.4 46.7 2.4.5 3.3-1.1 3.3-2.4v-8.4c-13.5 3-16.3-6.5-16.3-6.5-2.2-5.6-5.4-7.1-5.4-7.1-4.4-3 .3-3 .3-3 4.9.4 7.4 5 7.4 5 4.3 7.4 11.3 5.3 14 4 .4-3.1 1.7-5.3 3-6.5-10.8-1.2-22.1-5.4-22.1-24 0-5.3 1.9-9.6 5-13-.5-1.2-2.2-6.2.5-12.8 0 0 4.1-1.3 13.4 5 3.9-1.1 8-1.6 12.2-1.6s8.3.6 12.2 1.6c9.3-6.3 13.4-5 13.4-5 2.7 6.7 1 11.7.5 12.8 3.1 3.4 5 7.7 5 13 0 18.6-11.3 22.7-22.1 23.9 1.7 1.5 3.3 4.5 3.3 9v13.3c0 1.3.9 2.9 3.3 2.4C84 89.4 98 71 98 49.2 98 22 76.1 0 49 0Z" />
    </svg>
  )
}

function SlackLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="var(--oci-primary)" />
      <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="var(--oci-primary)" opacity=".8" />
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="var(--oci-primary)" opacity=".6" />
      <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="var(--oci-primary)" opacity=".7" />
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="var(--oci-primary)" opacity=".9" />
      <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="var(--oci-primary)" />
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="var(--oci-primary)" opacity=".5" />
      <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="var(--oci-primary)" opacity=".6" />
    </svg>
  )
}

function VSCodeLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <path d="M74.9 6.3L50.2 31 31.3 15.2l-12.5 6.4v56.9l12.5 6.4L50.2 69l24.7 24.7 12.8-6.6V13z" fill="var(--oci-primary)" />
      <path d="M31.3 69.1L18.8 78.5V21.5l12.5 9.4V69z" fill="var(--oci-primary)" opacity=".6" />
    </svg>
  )
}

/* ─── OneClickIntegrations ──────────────────────────────────────────────── */

export function OneClickIntegrations() {
  const COLS = 10
  const ROWS = 4
  const SIZE = 60

  const logos = {
    '0-3': <FigmaLogo />,
    '1-5': <VercelLogo />,
    '2-3': <GitHubLogo />,
    '2-7': <SlackLogo />,
    '3-5': <VSCodeLogo />,
  }

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      '--oci-primary': 'hsl(111 56% 54%)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} style={{ display: 'flex', gap: 0 }}>
            {Array.from({ length: COLS }, (_, c) => {
              const key = `${r}-${c}`
              const logo = logos[key]
              return (
                <div key={c} style={{
                  width: SIZE, height: SIZE, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: logo ? 'rgba(91,204,72,0.08)' : 'rgba(231,236,235,0.03)',
                  border: logo ? '1px solid rgba(91,204,72,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}>
                  {logo || null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── McpConnectivity ───────────────────────────────────────────────────── */

const mcpIntegrations = [
  { name: 'Figma', installed: true, img: '/images/mcp-integrations/figma.svg' },
  { name: 'Shadcn UI', installed: false, img: '/images/mcp-integrations/shadcn.svg' },
  { name: 'Next.js', installed: true, img: '/images/mcp-integrations/nextjs.svg' },
  { name: 'Tailwind CSS', installed: false, img: '/images/mcp-integrations/tailwind.svg' },
  { name: 'Resend', installed: true, img: '/images/mcp-integrations/resend.svg' },
  { name: 'React', installed: false, img: '/images/mcp-integrations/react.svg' },
]

export function McpConnectivity() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        width: '100%', maxWidth: 320, borderRadius: 12,
        background: 'rgba(231,236,235,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(231,236,235,0.03)',
        }}>
          <Search size={14} color="rgba(231,236,235,0.5)" />
          <span style={{ fontSize: 13, color: 'rgba(231,236,235,0.5)' }}>Search integrations...</span>
        </div>
        <div>
          {mcpIntegrations.map((item) => (
            <div key={item.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={item.img} alt={item.name} width={20} height={20} style={{ borderRadius: 4 }} />
                <span style={{ fontSize: 13, color: 'hsl(160 14% 93%)' }}>{item.name}</span>
              </div>
              {item.installed && (
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(91,204,72,0.15)', color: 'hsl(111 56% 54%)',
                  border: '1px solid rgba(91,204,72,0.3)',
                }}>Installed</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── ParallelAgents ────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.09" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

const agentCards = [
  {
    icon: <CheckIcon />,
    iconColor: 'hsl(111 56% 54%)',
    iconBg: 'rgba(91,204,72,0.15)',
    label: 'claude-opus-4',
    badge: 'Done',
    badgeColor: 'hsl(111 56% 54%)',
    badgeBg: 'rgba(91,204,72,0.12)',
    title: 'Update buttons to use new design tokens',
    sub: 'Changed 3 files',
  },
  {
    icon: <RefreshIcon />,
    iconColor: 'hsl(160 14% 93%)',
    iconBg: 'rgba(231,236,235,0.1)',
    label: 'claude-sonnet-4',
    badge: 'Running',
    badgeColor: 'rgba(231,236,235,0.6)',
    badgeBg: 'rgba(231,236,235,0.08)',
    title: 'Fix sanity issue with property matching',
    sub: 'Analyzing...',
  },
  {
    icon: <SparkIcon />,
    iconColor: 'hsl(111 56% 54%)',
    iconBg: 'rgba(91,204,72,0.1)',
    label: 'claude-opus-4',
    badge: 'Queued',
    badgeColor: 'rgba(231,236,235,0.4)',
    badgeBg: 'rgba(231,236,235,0.06)',
    title: 'Plan for seamless inbox delivery',
    sub: 'Waiting...',
  },
]

export function ParallelAgents() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '0 16px' }}>
      {agentCards.map((a, i) => (
        <div key={i} style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(231,236,235,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: a.iconBg,
                color: a.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.icon}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(231,236,235,0.5)' }}>{a.label}</span>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: a.badgeBg, color: a.badgeColor }}>{a.badge}</span>
          </div>
          <div style={{ fontSize: 13, color: 'hsl(160 14% 93%)', fontWeight: 500 }}>{a.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(231,236,235,0.5)' }}>{a.sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── EasyDeployment ────────────────────────────────────────────────────── */

const logLines = [
  '[16:37:25.637] Running build in Washington, D.C., USA (East) – iad1',
  '[16:37:25.693] Cloning github.com/nightdrop/app (Branch: main)',
  '[16:37:26.211] Cloning completed: 0.518s',
  '[16:37:27.045] Running "npm install"',
  '[16:37:34.882] Found lockfile. Restoring cache.',
  '[16:37:38.551] npm warn deprecated inflight@1.0.6',
  '[16:37:41.208] Added 847 packages in 12s',
  '[16:37:41.209] Running "npm run build"',
  '[16:37:42.003] > nightdrop-app@1.0.0 build',
  '[16:37:42.004] > next build',
  '[16:37:43.419] ▲ Next.js 15.1.0',
  '[16:37:43.501] Creating an optimized production build ...',
  '[16:37:58.771] ✓ Compiled successfully',
  '[16:37:58.892] ✓ Linting and checking validity of types',
  '[16:37:59.104] ✓ Collecting page data',
  '[16:37:59.305] ✓ Generating static pages (7/7)',
  '[16:37:59.412] ✓ Collecting build traces',
  '[16:37:59.601] ✓ Finalizing page optimization',
  '[16:38:00.002] Build completed in 18.3s',
]

export function EasyDeployment() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{
        width: 339, height: 200, borderRadius: 10, overflow: 'hidden',
        background: '#0d0f0e', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -58%)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
          background: 'rgba(231,236,235,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'block' }} />
          <span style={{ fontSize: 11, color: 'rgba(231,236,235,0.4)', marginLeft: 8 }}>Build Output</span>
        </div>
        <div style={{ flex: 1, overflowY: 'hidden', padding: '8px 12px' }}>
          {logLines.map((l, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: 'monospace', lineHeight: '16px', color: 'rgba(231,236,235,0.55)', whiteSpace: 'nowrap' }}>{l}</div>
          ))}
        </div>
      </div>
      <button style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 20px', borderRadius: 8, background: 'hsl(111 56% 54%)',
        border: 'none', cursor: 'pointer', color: 'hsl(160 8% 6%)',
        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🚀 Deploy on Vercel
      </button>
    </div>
  )
}
