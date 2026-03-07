import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code2, Palette, Cpu, Zap, Globe, Layers } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { name: 'Frontend', icon: Globe, items: ['Html', 'Css', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'] },
  { name: '3D & Motion', icon: Cpu, items: ['Three.js', 'React Three Fiber', 'GSAP', 'Framer Motion'] },
  { name: 'Backend & Database', icon: Code2, items: ['Node.js', 'Express', 'MongoDB', 'Authentication(JWT,OAuth)', 'Role-Based Access Control'] },
  { name: 'Tools & Ai', icon: Layers, items: ['Git', 'Gen AI', 'APIs'] },
  { name: 'Performance', icon: Zap, items: ['SEO', 'Core WebVitals', 'Optimization', 'Lazy Loading'] },
  { name: 'Design', icon: Palette, items: ['UI/UX', 'Typography', 'Branding', 'Prototyping'] },
];

export default function Skills() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !horizontalRef.current) return;

    const scrollWidth = horizontalRef.current.scrollWidth;
    const windowWidth = window.innerWidth;
    const totalScroll = scrollWidth - windowWidth;

    gsap.to(horizontalRef.current, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-screen relative overflow-hidden"
      style={{ background: 'rgba(2,0,8,0.6)' }}
    >
      {/* ── Left gradient curtain — cards slide BEHIND this ── */}
      <div
        className="absolute left-0 top-0 h-full w-[38vw] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #020008 55%, transparent 100%)' }}
      />

      {/* ── Right fade edge ── */}
      <div
        className="absolute right-0 top-0 h-full w-[8vw] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #020008 10%, transparent 100%)' }}
      />

      {/* ── Heading — sits on top of the gradient curtain ── */}
      <div className="absolute top-1/2 -translate-y-1/2 left-16 z-30 max-w-xs md:max-w-sm">
        <h2
          className="font-display font-bold uppercase tracking-widest text-sm mb-4"
          style={{ color: '#7c3aed' }}
        >
          Expertise
        </h2>
        <h3 className="text-5xl md:text-6xl font-display font-bold tracking-tighter leading-none">
          SKILLS
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            &amp; TECH
          </span>
        </h3>

        {/* Scroll hint */}
        <div className="mt-8 flex items-center gap-3">
          <div className="w-8 h-px" style={{ background: 'rgba(124,58,237,0.6)' }} />
          <span className="text-[10px] font-display uppercase tracking-[0.2em] text-white/30">
            Scroll to explore
          </span>
        </div>
      </div>

      {/* ── Horizontally scrolling cards ── */}
      <div
        ref={horizontalRef}
        className="flex items-center h-full gap-8"
        style={{ paddingLeft: '42vw', paddingRight: '8vw' }}
      >
        {skills.map((skill, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[340px] h-[440px] rounded-3xl p-10 flex flex-col justify-between transition-all duration-500"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.4)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.08)';
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

              <ul className="space-y-3">
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

            {/* Card number */}
            <div
              className="font-display font-bold text-5xl self-end"
              style={{ color: 'rgba(124,58,237,0.15)' }}
            >
              0{index + 1}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
