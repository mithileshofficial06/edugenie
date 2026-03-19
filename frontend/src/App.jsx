import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleBackground from './components/ParticleBackground'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/* ── Ticker ── */
function Ticker() {
  const items = [
    { text: 'ONLINE', dot: '#00ff88' },
    { text: 'AI POWERED', dot: '#8b5cf6' },
    { text: 'FREE', dot: '#00ffff' },
    { text: 'REAL-TIME', dot: '#ffd700' },
  ]
  const set = [...items, ...items, ...items, ...items, ...items, ...items]
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {set.map((it, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-dot" style={{ background: it.dot }} />
            {it.text}
            <span className="ticker-sep">/</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Input ── */
function Field({ label, helper, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ccc' }}>
        {label}
      </label>
      <input className="brutal-input" {...props} />
      {helper && <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>{helper}</span>}
    </div>
  )
}

/* ── Stat Card ── */
function StatCard({ num, title, desc, color, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.15 }}
      whileHover={{ y: -3, x: -3, scale: 1.02, boxShadow: `6px 6px 0 ${color}`, transition: { duration: 0.2 } }}
      style={{
        background: '#111', border: `2px solid ${color}`,
        boxShadow: `3px 3px 0 ${color}`, padding: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <span style={{ fontSize: 32, fontWeight: 900, color }}>{num}</span>
      <h3 style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  )
}

/* ── Token Step ── */
function StepCard({ num, title, text, color, index, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.15 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      style={{
        background: '#111', border: '2px solid #333', padding: 24,
        boxShadow: '3px 3px 0 #333', display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #333', paddingBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 900, WebkitTextStroke: `2px ${color}`, color: 'transparent' }}>{num}</span>
        <span style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{text}</p>
      {children}
    </motion.div>
  )
}

/* ── Slide-up helper ── */
const slideUp = (delay) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
})

/* ══════════════ APP ══════════════ */
export default function App() {
  const [form, setForm] = useState({
    moodleUrl: 'https://moodle.licet.ac.in',
    moodleToken: '',
    whatsappNumber: '+91',
    email: '',
    semesterStart: '',
    semesterEnd: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [joinCopied, setJoinCopied] = useState(false)

  const set = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); if (error) setError(null) }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    if (!form.whatsappNumber.startsWith('+')) { setError('Number must start with country code (+91)'); setLoading(false); return }
    if (!form.email || !form.email.includes('@')) { setError('Valid email address is required'); setLoading(false); return }
    if (!form.semesterStart || !form.semesterEnd) { setError('Both semester dates are required'); setLoading(false); return }
    try {
      const r = await fetch(`${API}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await r.json()
      d.success ? setResult(d.message) : setError(d.message || 'Registration failed.')
    } catch { setError('Connection error. Is backend running?') }
    finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText('https://moodle.licet.ac.in/login/token.php?username=YOUR_USERNAME&password=YOUR_PASSWORD&service=moodle_mobile_app')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const copyJoin = () => {
    navigator.clipboard.writeText('join light-type')
    setJoinCopied(true); setTimeout(() => setJoinCopied(false), 2000)
  }

  const reset = () => { setResult(null); setForm({ moodleUrl: 'https://moodle.licet.ac.in', moodleToken: '', whatsappNumber: '+91', email: '', semesterStart: '', semesterEnd: '' }) }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}
         className="selection:bg-[#00ffff] selection:text-black">

      <ParticleBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>

      <Ticker />

      {/* ── Nav (fade down) ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ height: 64, borderBottom: '2px solid #333', background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 50 }}
      >
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, background: '#8b5cf6', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, boxShadow: '3px 3px 0 #fff', transform: 'rotate(-3deg)',
            }}>EG</div>
            <span style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>EduGenie</span>
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <a href="#token" style={{ color: '#888', textDecoration: 'none' }}>API Token</a>
            <a href="#whatsapp" style={{ color: '#888', textDecoration: 'none' }}>WhatsApp</a>
            <a href="#features" style={{ color: '#888', textDecoration: 'none' }}>Features</a>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

          {/* Left — staggered text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Heading — each word staggered slide-up */}
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              <motion.span {...slideUp(0.3)} style={{ display: 'block' }}>DOMINATE</motion.span>
              <motion.span {...slideUp(0.5)} style={{ display: 'block', WebkitTextStroke: '2px #00ffff', color: 'transparent' }}>EVERY</motion.span>
              <motion.span {...slideUp(0.7)} style={{ display: 'block' }}>DEADLINE</motion.span>
            </h1>

            {/* Subtitle — fade in, delay 0.9 + blinking cursor */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              style={{
                fontSize: 16, color: '#888', fontWeight: 600, maxWidth: 420,
                borderLeft: '3px solid #8b5cf6', paddingLeft: 16, lineHeight: 1.6,
                textTransform: 'uppercase', letterSpacing: '0.02em',
              }}
            >
              Connect Moodle. Get WhatsApp alerts. Crush exams with auto-generated AI material. Brutally simple
              <span className="blink-cursor">|</span>
            </motion.p>
          </div>

          {/* Right — Form (slide from right) */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ maxWidth: 500, width: '100%', justifySelf: 'end' }}
          >
            <div style={{
              background: '#111', border: '2px solid #00ffff', padding: 32,
              boxShadow: '4px 4px 0 #00ffff',
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 14 }}>
                Ignite the Genie
              </h2>

              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.form key="f" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                               style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Staggered fields */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.8 }}>
                      <Field label="Moodle URL" name="moodleUrl" type="url" value={form.moodleUrl} onChange={set}
                             placeholder="https://moodle.yourschool.edu" required />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.9 }}>
                      <Field label="Moodle API Token" name="moodleToken" type="password" value={form.moodleToken} onChange={set}
                             placeholder="Paste your token" helper="Preferences → Security Keys" required />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.0 }}>
                      <Field label="WhatsApp Number" name="whatsappNumber" type="tel" value={form.whatsappNumber} onChange={set}
                             placeholder="+91 98765 43210" helper="Must join Twilio Sandbox first" required />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.05 }}>
                      <Field label="Email Address" name="email" type="email" value={form.email} onChange={set}
                             placeholder="your.email@college.edu" helper="AI study material will be sent here" required />
                    </motion.div>

                    {/* Semester Date Pickers */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.1 }}
                                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                                className="date-picker-row">
                      <Field label="Semester Start" name="semesterStart" type="date" value={form.semesterStart} onChange={set} required />
                      <Field label="Semester End" name="semesterEnd" type="date" value={form.semesterEnd} onChange={set} required />
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          padding: 12, background: '#ff3333', color: '#000', border: '2px solid #000',
                          fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
                        }}
                      >{error}</motion.div>
                    )}

                    {/* Button — fade in last + hover pulse */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 1.2 }}>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="brutal-btn"
                        style={{ marginTop: 8 }}
                        whileHover={!loading ? { scale: 1.03 } : {}}
                        whileTap={!loading ? { scale: 0.97 } : {}}
                      >
                        {loading ? 'PROCESSING...' : 'ACTIVATE EDUGENIE'}
                      </motion.button>
                    </motion.div>
                  </motion.form>
                ) : (
                  <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                              style={{ background: '#00ff88', color: '#000', border: '2px solid #000', padding: 24, textAlign: 'center', boxShadow: '3px 3px 0 #00ff88' }}>
                    <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 12 }}>✓</div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>System Armed</h3>
                    <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>{result}</p>
                    <div style={{ background: '#111', color: '#fff', padding: 16, fontSize: 13, fontWeight: 900, textTransform: 'uppercase', textAlign: 'left', border: '2px solid #000', marginBottom: 16 }}>
                      <p style={{ borderBottom: '1px solid #333', paddingBottom: 8, marginBottom: 8 }}><span style={{ color: '#00ff88' }}>STATUS:</span> ONLINE</p>
                      <p style={{ borderBottom: '1px solid #333', paddingBottom: 8, marginBottom: 8 }}><span style={{ color: '#00ffff' }}>MONITORING:</span> EVERY 2 HRS</p>
                      <p><span style={{ color: '#8b5cf6' }}>AI SYNC:</span> ACTIVE</p>
                    </div>
                    <button onClick={reset} style={{
                      width: '100%', padding: '12px 0', background: '#000', color: '#fff',
                      border: '2px solid #000', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer',
                    }}>ADD ANOTHER</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Token Guide (scroll-triggered stagger) ── */}
      <section id="token" style={{ background: '#111', borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '80px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 900, textTransform: 'uppercase', position: 'relative', display: 'inline-block' }}>
              <span style={{ WebkitTextStroke: '2px #fff', color: 'transparent' }}>GET YOUR API TOKEN</span>
              <span style={{ position: 'absolute', bottom: -8, left: 0, width: '100%', height: 3, background: '#ff3333' }} />
            </h2>
            <p style={{ marginTop: 16, fontSize: 14, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Follow these steps to connect your Moodle account
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <StepCard num="01" title="LOGIN TO MOODLE" color="#00ffff" index={0}
              text="Go to moodle.licet.ac.in and login with your college credentials" />
            <StepCard num="02" title="NAVIGATE TO SECURITY KEYS" color="#00ff88" index={1}
              text="Click your Profile picture → Preferences → Security Keys" />
            <StepCard num="03" title="COPY YOUR TOKEN" color="#8b5cf6" index={2}
              text="Copy the token shown on the page and paste it in the form above" />
            <StepCard num="04" title="ALTERNATIVE METHOD" color="#ffd700" index={3}
              text="Open this URL in your browser after logging in — replace YOUR_USERNAME and YOUR_PASSWORD:">
              <div onClick={copy} style={{
                background: '#0a0a0a', border: '2px solid #00ffff', padding: 12,
                color: '#00ffff', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all',
                cursor: 'pointer', position: 'relative', lineHeight: 1.5, marginTop: 4,
              }}>
                https://moodle.licet.ac.in/login/token.php?username=YOUR_USERNAME&password=YOUR_PASSWORD&service=moodle_mobile_app
                <span style={{
                  position: 'absolute', right: 8, bottom: 8, fontSize: 10, fontWeight: 900,
                  background: '#00ffff', color: '#000', padding: '2px 6px', fontFamily: "'Space Grotesk', sans-serif",
                }}>{copied ? 'COPIED!' : 'CLICK TO COPY'}</span>
              </div>
              <p style={{ fontSize: 12, color: '#00ffff', fontWeight: 700, textTransform: 'uppercase', borderLeft: '3px solid #00ffff', paddingLeft: 8, marginTop: 4 }}>
                Copy the token value from the JSON response
              </p>
            </StepCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              marginTop: 32, border: '2px solid #00ff88', background: 'rgba(0,255,136,0.06)',
              padding: '16px 24px', textAlign: 'center', boxShadow: '3px 3px 0 #00ff88',
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 900, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>SECURITY PROTOCOL ACTIVE</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
              Your token is encrypted and never shared. Used only to monitor your Moodle courses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── WhatsApp Sandbox Setup ── */}
      <section id="whatsapp" style={{ padding: '80px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 900, textTransform: 'uppercase', position: 'relative', display: 'inline-block' }}>
              <span style={{ WebkitTextStroke: '2px #fff', color: 'transparent' }}>ACTIVATE WHATSAPP</span>
              <span style={{ position: 'absolute', bottom: -8, left: 0, width: '100%', height: 3, background: '#00ff88' }} />
            </h2>
            <p style={{ marginTop: 16, fontSize: 14, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              One-time Twilio sandbox setup to receive alerts
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <StepCard num="01" title="SAVE THIS NUMBER" color="#00ffff" index={0}
              text='Save +1 415 523 8886 in your phone contacts as "EduGenie"' />
            <StepCard num="02" title="SEND JOIN CODE" color="#00ff88" index={1}
              text="Open WhatsApp and send this exact message to +1 415 523 8886:">
              <div onClick={copyJoin} style={{
                background: '#0a0a0a', border: '2px solid #00ff88', padding: 12,
                color: '#00ff88', fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all',
                cursor: 'pointer', position: 'relative', lineHeight: 1.5, marginTop: 4,
                textAlign: 'center', letterSpacing: '0.05em',
              }}>
                join light-type
                <span style={{
                  position: 'absolute', right: 8, bottom: 8, fontSize: 10, fontWeight: 900,
                  background: '#00ff88', color: '#000', padding: '2px 6px', fontFamily: "'Space Grotesk', sans-serif",
                }}>{joinCopied ? 'COPIED!' : 'CLICK TO COPY'}</span>
              </div>
            </StepCard>
            <StepCard num="03" title="WAIT FOR CONFIRMATION" color="#8b5cf6" index={2}
              text="You will receive a confirmation message from Twilio saying you are connected to the sandbox" />
            <StepCard num="04" title="YOU ARE READY" color="#ffd700" index={3}
              text="Enter your WhatsApp number in the form above with country code +91 and click Activate EduGenie" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              marginTop: 32, border: '2px solid #ffd700', background: 'rgba(255,215,0,0.06)',
              padding: '16px 24px', textAlign: 'center', boxShadow: '3px 3px 0 #ffd700',
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 900, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              THIS IS A ONE TIME SETUP.
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
              SANDBOX CONNECTION LASTS 72 HOURS. SEND THE JOIN CODE AGAIN IF ALERTS STOP.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Features (scroll-triggered stagger) ── */}
      <section id="features" style={{ background: '#111', borderTop: '2px solid #333', borderBottom: '2px solid #333', padding: '80px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 900, textTransform: 'uppercase', position: 'relative', display: 'inline-block' }}>
              <span style={{ WebkitTextStroke: '2px #fff', color: 'transparent' }}>THE ARSENAL</span>
              <span style={{ position: 'absolute', bottom: -8, left: 0, width: '100%', height: 3, background: '#8b5cf6' }} />
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard num="01" title="AUTO-SYNC" desc="Continuous loop monitoring of Moodle assignments. Never miss a drop." color="#00ffff" index={0} />
            <StatCard num="02" title="WHATSAPP ALERTS" desc="Raw payload delivery directly to your phone. Zero friction." color="#00ff88" index={1} />
            <StatCard num="03" title="GEMINI AI FORGE" desc="Instant synthesis of mock exams and detailed study guides." color="#8b5cf6" index={2} />
            <StatCard num="04" title="DEADLINE TERROR" desc="Multi-tier aggressive reminders: 3 Days, 24 Hours, 2 Hours." color="#ffd700" index={3} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ padding: '24px 0', borderTop: '2px solid #333', textAlign: 'center' }}
      >
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            EDUGENIE // NO MERCY ACADEMICS
          </p>
        </div>
      </motion.footer>

      {/* ── Mobile + cursor blink + date input styling ── */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-cursor {
          animation: blink 1s step-end infinite;
          color: #00ffff;
          font-weight: 900;
          margin-left: 2px;
        }
        /* Date input brutalist styling */
        input[type="date"].brutal-input {
          color-scheme: dark;
        }
        input[type="date"].brutal-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .container { padding: 0 16px !important; }
          section > .container > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          section > .container > div[style*="grid-template-columns: 1fr 1fr"],
          section > .container[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section > .container > div[style*="grid-template-columns: repeat(4"],
          section > .container > div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
          .date-picker-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      </div>
    </div>
  )
}
