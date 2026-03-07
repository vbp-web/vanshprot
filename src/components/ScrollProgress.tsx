import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

const SECTIONS = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Work' },
    { id: 'contact', label: 'Contact' },
];

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

    const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const idx = SECTIONS.findIndex((s) => s.id === entry.target.id || entry.target.id === `section-${s.id}`);
                    if (idx === -1) return;
                    const dot = dotRefs.current[idx];
                    if (!dot) return;
                    if (entry.isIntersecting) {
                        dot.classList.add('active-dot');
                    } else {
                        dot.classList.remove('active-dot');
                    }
                });
            },
            { threshold: 0.4 }
        );

        SECTIONS.forEach((s) => {
            const el = document.getElementById(s.id) || document.getElementById(`section-${s.id}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id) || document.getElementById(`section-${id}`);
        el?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            {/* ── Top progress bar ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] z-[9998] origin-left"
                style={{
                    scaleX,
                    background: 'linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4)',
                    boxShadow: '0 0 12px rgba(124,58,237,0.8)',
                }}
            />

            {/* ── Side section dots ── */}
            <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4 items-end">
                {SECTIONS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => scrollTo(s.id)}>
                        {/* Label */}
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-white/0 group-hover:text-white/60 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            {s.label}
                        </span>
                        {/* Dot */}
                        <button
                            ref={(el) => { dotRefs.current[i] = el; }}
                            className="w-2 h-2 rounded-full bg-white/20 border border-white/10 transition-all duration-300
                         hover:bg-accent hover:scale-125 hover:shadow-[0_0_8px_rgba(124,58,237,0.8)]
                         [&.active-dot]:bg-accent [&.active-dot]:scale-150 [&.active-dot]:shadow-[0_0_12px_rgba(124,58,237,0.9)]"
                            aria-label={`Go to ${s.label}`}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}
