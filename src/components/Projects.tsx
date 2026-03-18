import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'Sportivo-Multi Sport Booking Platform',
    category: 'UI/UX & Frontend',
    image: '/images/sportivo.jpg',
    description: 'A comprehensive design system built for scalability and accessibility, featuring over 50+ components.',
    tech: ['React', 'TypeScript', 'Tailwind', 'Storybook'],
    color: '#00ff88',
    objectFit: 'cover' as const,
    objectPosition: 'center',
    liveLink: 'https://sportivo-multi-sport-slot-booking.onrender.com/',
    githubLink: 'https://github.com/'
  },
  {
    title: 'parArc Design Studio',
    category: '3D & WebGL',
    image: '/images/parArc.jpg',
    description: 'An experimental 3D engine built on top of Three.js, focusing on real-time lighting and physics.',
    tech: ['Html', 'Css', 'JavaScript', 'Three.js', '3D Animation'],
    color: '#3b82f6',
    objectFit: 'contain' as const,
    objectPosition: 'center',
    liveLink: 'https://pararcdesignstudio.in/',
    githubLink: 'https://github.com/'
  },
  {
    title: 'Pulse Analytics',
    category: 'SaaS & Dashboard',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    description: 'Real-time analytics platform providing deep insights into user behavior and conversion rates.',
    tech: ['Next.js', 'Node.js', 'PostgreSQL', 'D3.js'],
    color: '#f59e0b',
    objectFit: 'cover' as const,
    objectPosition: 'center',
  }
];

export default function Projects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const projectCards = containerRef.current.querySelectorAll('.project-card');

    projectCards.forEach((card, index) => {
      gsap.fromTo(card,
        { opacity: 0, y: 100, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
          }
        }
      );
    });
  }, []);

  return (
    <section ref={containerRef} className="py-16 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-10 md:mb-20">
        <h2 className="text-accent font-display font-medium tracking-widest uppercase text-sm mb-4">
          Selected Work
        </h2>
        <h3 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tighter">
          PROJECTS
        </h3>
      </div>

      <div className="space-y-20 md:space-y-40">
        {projects.map((project, index) => (
          <div
            key={index}
            className="project-card grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center"
          >
            <div className={`order-2 ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-display font-bold text-accent uppercase tracking-widest">
                    {project.category}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h4 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-tight leading-tight">
                  {project.title}
                </h4>
                <p className="text-white/60 text-lg leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {project.tech.map((t, i) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-display font-bold uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-6 pt-6">
                  {project.liveLink && (
                    <a
                      href={project.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-widest hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Live Demo
                    </a>
                  )}
                  {project.githubLink && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-widest hover:text-accent transition-colors"
                    >
                      <Github className="w-4 h-4" /> View Code
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className={`order-1 ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
              <div
                className="relative group overflow-hidden rounded-3xl aspect-video"
                style={{ background: project.objectFit === 'contain' ? '#0a0a0a' : 'transparent' }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  style={{
                    objectFit: project.objectFit ?? 'cover',
                    objectPosition: project.objectPosition ?? 'center',
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${project.color}22 0%, transparent 70%)` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
