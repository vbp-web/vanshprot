import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WORDS = ['CRAFTING', 'IMMERSIVE', 'DIGITAL', 'EXPERIENCES'];
const SUBTITLE = 'Creative Developer & Designer — where code meets cinematic design';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // ── Set initial states ──
      gsap.set(wordsRef.current, { y: 120, opacity: 0, rotateX: -45 });
      gsap.set(subtitleRef.current, { opacity: 0, y: 30 });
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });
      gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'left center' });

      // ── Create the pinned scrollytelling timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',   // pin for 2.5 viewport heights
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Reveal each word sequentially
      WORDS.forEach((_, i) => {
        tl.to(wordsRef.current[i], {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.6,
          ease: 'power3.out',
        }, i * 0.55);
      });

      // Accent line draws in
      tl.to(lineRef.current, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 1.8);

      // Subtitle appears
      tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.0);

      // CTA buttons appear
      tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 2.4);

      // Scroll hint fades out
      tl.to(scrollHintRef.current, { opacity: 0, duration: 0.3 }, 0.2);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      {/* Main word stack */}
      <div className="z-10 text-center perspective-[800px]">
        <div className="overflow-hidden mb-2">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {WORDS.map((word, i) => (
              <span
                key={word}
                ref={(el) => { wordsRef.current[i] = el; }}
                className="block text-[clamp(3rem,10vw,9rem)] font-display font-bold tracking-tighter leading-none"
                style={{
                  background: i === 1 || i === 3
                    ? 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                    : 'white',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: i === 1 || i === 3 ? 'transparent' : 'white',
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Accent line */}
        <div
          ref={lineRef}
          className="w-full h-[2px] my-6 mx-auto max-w-xl rounded-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6, transparent)' }}
        />

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="max-w-lg mx-auto text-lg md:text-xl text-white/50 font-light leading-relaxed mb-10"
        >
          {SUBTITLE}
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex gap-4 justify-center flex-wrap">
          <a
            href="#projects"
            className="px-8 py-4 rounded-full font-display font-bold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border border-white/20 font-display font-bold rounded-full hover:bg-white/10 transition-all duration-300 hover:border-white/40"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div ref={scrollHintRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll to begin</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        <ArrowDown className="w-4 h-4 text-white/30" />
      </div>
    </section>
  );
}
