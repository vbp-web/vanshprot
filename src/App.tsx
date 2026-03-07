import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import Scene from './components/Scene';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import SmoothScroll from './components/SmoothScroll';
import ScrollProgress from './components/ScrollProgress';
import Loader from './components/Loader';

// ── Custom magnetic cursor ────────────────────────────────────────────
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const spring = { damping: 28, stiffness: 600 };
  const x = useSpring(cursorX, spring);
  const y = useSpring(cursorY, spring);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference"
      style={{
        translateX: x,
        translateY: y,
        border: '1.5px solid #7c3aed',
        background: 'rgba(124,58,237,0.08)',
      }}
    />
  );
}

// Loader is now imported from ./components/Loader

// ── Nav ───────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(2,0,8,0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      }}
    >
      <div className="text-xl font-display font-bold tracking-tighter"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
        Vansh Prajapati.
      </div>

      <div className="flex gap-8 text-sm font-display font-bold uppercase tracking-widest">
        {[['#about', 'About'], ['#projects', 'Work'], ['#contact', 'Contact']].map(([href, label]) => (
          <a
            key={label}
            href={href}
            className="relative text-white/60 hover:text-white transition-colors duration-300 group"
          >
            {label}
            <span
              className="absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300 rounded-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
            />
          </a>
        ))}
      </div>
    </nav>
  );
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return <Loader onDone={() => setLoaded(true)} />;
  }

  return (
    <SmoothScroll>
      <div className="relative">
        <CustomCursor />
        <Scene />
        <ScrollProgress />
        <Nav />

        <main>
          {/* Hero is self-contained with its own id="hero" */}
          <Hero />

          <div id="about">
            <About />
          </div>

          <div id="skills">
            <Skills />
          </div>

          <div id="projects">
            <Projects />
          </div>

          <div id="contact">
            <Contact />
          </div>
        </main>
      </div>
    </SmoothScroll>
  );
}
