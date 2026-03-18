import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code2, Palette, Cpu, Zap, Globe, Layers } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { name: 'Frontend',           icon: Globe,   items: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'] },
  { name: '3D & Motion',        icon: Cpu,     items: ['Three.js', 'React Three Fiber', 'GSAP', 'Framer Motion'] },
  { name: 'Backend & Database', icon: Code2,   items: ['Node.js', 'Express', 'MongoDB', 'JWT / OAuth', 'Role-Based Access Control'] },
  { name: 'Tools & AI',         icon: Layers,  items: ['Git', 'Generative AI', 'LLM APIs', 'Prompt Engineering'] },
  { name: 'Performance',        icon: Zap,     items: ['SEO', 'Core Web Vitals', 'Optimization', 'Lazy Loading'] },
  { name: 'Design',             icon: Palette, items: ['UI/UX', 'Typography', 'Branding', 'Prototyping'] },
];

// ── Desktop: horizontal scroll section ───────────────────────────────
function DesktopSkills() {
  const sectionRef    = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const horiz   = horizontalRef.current;
    if (!section || !horiz) return;

    // Small delay so layout is stable
    const ctx = gsap.context(() => {
      const totalScroll = horiz.scrollWidth - window.innerWidth;

      gsap.to(horiz, {
        x: -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${totalScroll}`,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-screen relative overflow-hidden"
      style={{ background: 'rgba(2,0,8,0.6)' }}
    >
      {/* Left gradient curtain */}
      <div
        className="absolute left-0 top-0 h-full w-[38vw] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #020008 55%, transparent 100%)' }}
      />
      {/* Right fade edge */}
      <div
        className="absolute right-0 top-0 h-full w-[8vw] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #020008 10%, transparent 100%)' }}
      />

      {/* Heading */}
      <div className="absolute top-1/2 -translate-y-1/2 left-16 z-30 max-w-sm">
        <h2
          className="font-display font-bold uppercase tracking-widest text-sm mb-4"
          style={{ color: '#7c3aed' }}
        >
          Expertise
        </h2>
        <h3 className="text-5xl lg:text-6xl font-display font-bold tracking-tighter leading-none">
          SKILLS
          <br />
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            &amp; TECH
          </span>
        </h3>
        <div className="mt-8 flex items-center gap-3">
          <div className="w-8 h-px" style={{ background: 'rgba(124,58,237,0.6)' }} />
          <span className="text-[10px] font-display uppercase tracking-[0.2em] text-white/30">
            Scroll to explore
          </span>
        </div>
      </div>

      {/* Horizontally scrolling cards */}
      <div
        ref={horizontalRef}
        className="flex items-center h-full gap-8 will-change-transform"
        style={{ paddingLeft: '42vw', paddingRight: '8vw' }}
      >
        {skills.map((skill, index) => (
          <SkillCard key={index} skill={skill} index={index} />
        ))}
      </div>
    </section>
  );
}

// ── Mobile: vertical grid ─────────────────────────────────────────────
function MobileSkills() {
  return (
    <section className="py-20 px-5 relative" style={{ background: 'rgba(2,0,8,0.6)' }}>
      {/* Heading */}
      <div className="mb-10 text-center">
        <p className="font-display font-bold uppercase tracking-widest text-sm mb-3" style={{ color: '#7c3aed' }}>
          Expertise
        </p>
        <h2 className="text-4xl font-display font-bold tracking-tighter leading-none">
          SKILLS{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            &amp; TECH
          </span>
        </h2>
      </div>

      {/* Card grid — 2 columns on wider phones, 1 on very narrow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <MobileSkillCard key={index} skill={skill} index={index} />
        ))}
      </div>
    </section>
  );
}

// ── Shared skill card — desktop ───────────────────────────────────────
function SkillCard({ skill, index }: { skill: typeof skills[0]; index: number }) {
  return (
    <div
      className="flex-shrink-0 w-[320px] lg:w-[340px] h-[420px] lg:h-[440px] rounded-3xl p-8 lg:p-10 flex flex-col justify-between transition-all duration-500 group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.border    = '1px solid rgba(124,58,237,0.4)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.05)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border    = '1px solid rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      <div className="space-y-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          <skill.icon className="w-7 h-7" style={{ color: '#7c3aed' }} />
        </div>
        <h4 className="text-2xl font-display font-bold">{skill.name}</h4>
        <ul className="space-y-2.5">
          {skill.items.map((item, i) => (
            <li key={i} className="text-white/55 text-base flex items-center gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="font-display font-bold text-5xl self-end" style={{ color: 'rgba(124,58,237,0.15)' }}>
        0{index + 1}
      </div>
    </div>
  );
}

// ── Shared skill card — mobile ────────────────────────────────────────
function MobileSkillCard({ skill, index }: { skill: typeof skills[0]; index: number }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5 active:scale-[0.98] transition-transform duration-150"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.28)' }}
        >
          <skill.icon className="w-5 h-5" style={{ color: '#7c3aed' }} />
        </div>
        <span className="font-display font-bold text-3xl" style={{ color: 'rgba(124,58,237,0.18)' }}>
          0{index + 1}
        </span>
      </div>

      <h4 className="text-lg font-display font-bold">{skill.name}</h4>

      {/* Tags instead of a list — more compact on mobile */}
      <div className="flex flex-wrap gap-2">
        {skill.items.map((item, i) => (
          <span
            key={i}
            className="text-[11px] font-mono px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Responsive wrapper — renders the right layout ─────────────────────
export default function Skills() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Avoid flash: render nothing until we know the screen size
  if (isMobile === null) return null;

  return isMobile ? <MobileSkills /> : <DesktopSkills />;
}
