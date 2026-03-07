import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Animated counter that counts up when visible ─────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;

        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => setCount(Math.floor(obj.val)),
        });
      },
    });
  }, [target]);

  return (
    <div ref={ref} className="text-5xl font-display font-bold"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
    >
      {count}{suffix}
    </div>
  );
}

// ── Terminal typing card ─────────────────────────────────────────────
const COMMANDS: { cmd: string; output: string; color: string }[] = [
  { cmd: 'whoami', output: 'Vansh Prajapati', color: '#a78bfa' },
  { cmd: 'cat role.txt', output: 'Creative Developer & Designer', color: '#60a5fa' },
  { cmd: 'cat skills.txt', output: 'React · Three.js · GSAP · Node · TypeScript', color: '#34d399' },
  { cmd: 'cat experience.txt', output: '5+ years of creative development', color: '#fbbf24' },
  { cmd: 'echo $LOCATION', output: 'India 🇮🇳  (Remote Friendly)', color: '#f472b6' },
  { cmd: 'echo $STATUS', output: '🟢 Available for work', color: '#4ade80' },
  { cmd: 'git log --oneline -1', output: 'feat: crafting immersive digital worlds', color: '#a78bfa' },
];

const PROMPT = 'vansh@portfolio:~$';
const TYPE_SPEED = 38;  // ms per char (command)
const OUTPUT_DELAY = 320; // ms before output appears
const PAUSE_AFTER = 1400; // ms to read before next command

function TerminalCard() {
  const [lines, setLines] = useState<{ type: 'cmd' | 'out' | 'prompt'; text: string; color?: string }[]>([]);
  const [currentCmd, setCurrentCmd] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState<'typing' | 'output' | 'pause'>('typing');
  const cmdIdx = useRef(0);
  const charIdx = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null); // terminal body scroll

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Scroll terminal body — NOT the page
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, currentCmd]);

  const tick = useCallback(() => {
    const entry = COMMANDS[cmdIdx.current % COMMANDS.length];

    if (phase === 'typing') {
      if (charIdx.current < entry.cmd.length) {
        setCurrentCmd(entry.cmd.slice(0, charIdx.current + 1));
        charIdx.current++;
        timerRef.current = setTimeout(tick, TYPE_SPEED);
      } else {
        // Done typing command → show output
        setPhase('output');
        timerRef.current = setTimeout(tick, OUTPUT_DELAY);
      }
    } else if (phase === 'output') {
      // Commit command line + output line
      setLines(prev => [
        ...prev,
        { type: 'cmd', text: entry.cmd },
        { type: 'out', text: entry.output, color: entry.color },
        { type: 'prompt', text: '' },
      ]);
      setCurrentCmd('');
      setPhase('pause');
      timerRef.current = setTimeout(tick, PAUSE_AFTER);
    } else {
      // Next command
      cmdIdx.current++;
      charIdx.current = 0;
      setPhase('typing');
      timerRef.current = setTimeout(tick, 100);
    }
  }, [phase]);

  useEffect(() => {
    timerRef.current = setTimeout(tick, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tick]);

  // Keep only last 20 lines so terminal doesn't overflow
  const visibleLines = lines.slice(-20);

  return (
    <div
      className="relative aspect-[4/5] rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: '#0d0d14',
        border: '1px solid rgba(124,58,237,0.3)',
        boxShadow: '0 0 60px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── macOS-style title bar ── */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-2 text-[11px] font-mono text-white/30 tracking-wider">portfolio — zsh</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#28c840' }} />
          <span className="text-[10px] font-mono text-green-400/70">live</span>
        </div>
      </div>

      {/* ── Terminal body ── */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm flex flex-col gap-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Welcome line */}
        <div className="text-white/30 text-xs mb-3">
          Last login: {new Date().toDateString()} on ttys001
        </div>

        {/* Rendered lines */}
        {visibleLines.map((line, i) => (
          <div key={i} className="leading-relaxed">
            {line.type === 'cmd' && (
              <div className="flex gap-2">
                <span style={{ color: '#7c3aed' }}>{PROMPT}</span>
                <span className="text-white">{line.text}</span>
              </div>
            )}
            {line.type === 'out' && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-2 py-0.5"
                style={{ color: line.color }}
              >
                → {line.text}
              </motion.div>
            )}
            {line.type === 'prompt' && <div className="h-1" />}
          </div>
        ))}

        {/* Active typing line */}
        <div className="flex gap-2 leading-relaxed">
          <span style={{ color: '#7c3aed' }}>{PROMPT}</span>
          <span className="text-white">{currentCmd}</span>
          <span
            className="inline-block w-[2px] h-[1em] relative top-[1px]"
            style={{
              background: showCursor ? '#a78bfa' : 'transparent',
              transition: 'background 0.1s',
            }}
          />
        </div>

        <div ref={bodyRef} />
      </div>

      {/* ── Status bar (like VS Code) ── */}
      <div
        className="flex items-center gap-4 px-4 py-1.5 text-[10px] font-mono flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #7c3aed22, #3b82f622)',
          borderTop: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <span style={{ color: '#a78bfa' }}>⎇ main</span>
        <span style={{ color: '#4ade80' }}>✓ Available</span>
        <span className="ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>UTF-8 · zsh</span>
      </div>
    </div>
  );
}

// ── Scrolling text lines that fade in one by one ──────────────────────
function RevealLines({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    gsap.set(lineRefs.current, { y: 40, opacity: 0 });

    const ctx = gsap.context(() => {
      lineRefs.current.forEach((el, i) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
          delay: i * 0.15,
        });
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="space-y-1">
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <span
            ref={(el) => { lineRefs.current[i] = el; }}
            className="block text-3xl md:text-4xl font-display font-bold leading-tight"
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Label slides in
      gsap.from(labelRef.current, {
        x: -30, opacity: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: labelRef.current, start: 'top 85%' },
      });

      // Body text fades in
      gsap.from(bodyRef.current, {
        y: 20, opacity: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: bodyRef.current, start: 'top 85%' },
      });

      // Stats slide up
      gsap.from(statsRef.current, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: statsRef.current, start: 'top 90%' },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={containerRef} className="py-32 px-6 max-w-7xl mx-auto overflow-hidden relative">
      {/* Subtle dark background so text is readable over galaxy */}
      <div className="absolute inset-0 -z-10 rounded-3xl pointer-events-none"
        style={{ background: 'rgba(2,0,8,0.45)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* ── Left: Live terminal ── */}
        <TerminalCard />

        {/* ── Right: Text content ── */}
        <div
          className="space-y-10 rounded-3xl p-8 md:p-10 relative overflow-hidden"
          style={{
            background: 'rgba(15, 10, 30, 0.82)',
            border: '1px solid rgba(124,58,237,0.22)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 0 60px rgba(124,58,237,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Corner glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-[90px] pointer-events-none"
            style={{ background: 'rgba(124,58,237,0.18)' }} />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-[70px] pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.12)' }} />

          <h2 ref={labelRef} className="text-sm font-display font-bold uppercase tracking-widest relative z-10"
            style={{ color: '#7c3aed' }}>
            About Me
          </h2>

          <div className="relative z-10">
            <RevealLines lines={[
              'I build digital',
              'products that bridge',
              'imagination & reality.',
            ]} />
          </div>

          <p ref={bodyRef} className="text-white/65 text-lg leading-relaxed max-w-xl relative z-10">
            With over 5 years of experience in creative development, I specialize in crafting
            high-performance web experiences using React, Three.js, and GSAP — where engineering
            precision meets artistic vision.
          </p>

          {/* ── Animated Stats ── */}
          <div ref={statsRef} className="grid grid-cols-2 gap-8 pt-4 relative z-10"
            style={{ borderTop: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="space-y-2">
              <AnimatedCounter target={4} suffix="+" />
              <div className="text-xs text-white/40 uppercase tracking-wider font-display">Projects Completed</div>
            </div>
            <div className="space-y-2">
              <AnimatedCounter target={1} suffix=" yrs" />
              <div className="text-xs text-white/40 uppercase tracking-wider font-display">Experience</div>
            </div>
            <div className="space-y-2">
              <AnimatedCounter target={99} suffix="%" />
              <div className="text-xs text-white/40 uppercase tracking-wider font-display">Client Satisfaction</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
