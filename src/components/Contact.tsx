import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Github, Linkedin, Twitter, ArrowRight, Send, CheckCircle, XCircle, Loader, Instagram } from 'lucide-react';
import emailjs from '@emailjs/browser';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── EmailJS config ──────────────────────────────────────────────────────
const EJS_SERVICE = 'service_hy5g7aw';
const EJS_TEMPLATE = 'template_hdwbcqi';   // ← your real Template ID
const EJS_KEY = '2N7V2DmPmDDmaIXoF'; // ← your Public Key

// Initialize EmailJS once (required for v4+)
emailjs.init({ publicKey: EJS_KEY });

gsap.registerPlugin(ScrollTrigger);

const SOCIALS = [
  { Icon: Github, href: 'https://github.com/vbp-web', label: 'GitHub' },
  { Icon: Linkedin, href: 'https://www.linkedin.com/in/vansh-prajapati-6a1749360/', label: 'LinkedIn' },
];

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const htmlFormRef = useRef<HTMLFormElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // ── Form state ──────────────────────────────────────────────────────
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const isValid = fields.name.trim().length > 1
    && /^[^@]+@[^@]+\.[^@]+$/.test(fields.email)
    && fields.message.trim().length > 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid || status === 'sending') return;
    setStatus('sending');
    try {
      const result = await emailjs.send(
        EJS_SERVICE,
        EJS_TEMPLATE,
        {
          from_name: fields.name,
          from_email: fields.email,
          message: fields.message,
          reply_to: fields.email,
        },
        { publicKey: EJS_KEY }
      );
      console.log('EmailJS success:', result);
      setStatus('success');
      setFields({ name: '', email: '', message: '' });
      setTouched({ name: false, email: false, message: false });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error('EmailJS error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading slams in
      gsap.fromTo(headingRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: 'power4.out',
          scrollTrigger: { trigger: headingRef.current, start: 'top 90%', toggleActions: 'play none none none' },
        }
      );

      // Body text
      gsap.fromTo(bodyRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.15,
          scrollTrigger: { trigger: bodyRef.current, start: 'top 92%', toggleActions: 'play none none none' },
        }
      );

      // Social icons stagger in
      const socialIcons = socialsRef.current?.querySelectorAll('a');
      if (socialIcons && socialIcons.length > 0) {
        gsap.fromTo(socialIcons,
          { scale: 0, opacity: 0 },
          {
            scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2)',
            scrollTrigger: { trigger: socialsRef.current, start: 'top 92%', toggleActions: 'play none none none' },
          }
        );
      }

      // Form slides in from right
      gsap.fromTo(formRef.current,
        { x: 50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 1.1, ease: 'power4.out',
          scrollTrigger: { trigger: formRef.current, start: 'top 90%', toggleActions: 'play none none none' },
        }
      );

      // Form fields stagger in — use a class that excludes the button
      const fields = formRef.current?.querySelectorAll('.form-field-item');
      if (fields && fields.length > 0) {
        gsap.fromTo(fields,
          { y: 20, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out', delay: 0.25,
            immediateRender: false,
            scrollTrigger: { trigger: formRef.current, start: 'top 88%', toggleActions: 'play none none none' },
          }
        );
      }

      // Footer
      gsap.fromTo(footerRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: footerRef.current, start: 'top 98%', toggleActions: 'play none none none' },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="py-32 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

        {/* ── Left side ── */}
        <div className="space-y-12">
          <div ref={headingRef}>
            <div className="text-sm font-display font-bold uppercase tracking-widest mb-4"
              style={{ color: '#7c3aed' }}>
              Get in Touch
            </div>
            <h3 className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-none">
              LET'S<br />
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                CONNECT
              </span>
            </h3>
          </div>

          <p ref={bodyRef} className="text-white/55 text-xl leading-relaxed max-w-md">
            Have a project in mind or just want to say hi? I'm always open to new
            opportunities and collaborations.
          </p>

          <div>
            <a href="mailto:prajapativansh804@gmail.com"
              className="flex items-center gap-4 text-xl font-display font-bold group w-fit">
              <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)' }}>
                <Mail className="w-5 h-5" style={{ color: '#7c3aed' }} />
              </div>
              <span className="group-hover:text-violet-400 transition-colors">prajapativansh804@gmail.com</span>
            </a>
          </div>

          {/* Socials */}
          <div ref={socialsRef} className="flex gap-4">
            {SOCIALS.map(({ Icon, href, label }) => (
              <motion.a
                key={label} href={href} aria-label={label}
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div ref={formRef} className="rounded-3xl p-10 md:p-12 relative overflow-hidden"
          style={{
            background: 'rgba(15, 10, 30, 0.85)',
            border: '1px solid rgba(124,58,237,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
          {/* Glow corners */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
            style={{ background: 'rgba(124,58,237,0.25)' }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.15)' }} />

          <form ref={htmlFormRef} onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Name */}
            <div className="form-field-item space-y-3">
              <label className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.8)' }}>Full Name</label>
              <input
                type="text"
                name="from_name"
                placeholder="John Doe"
                value={fields.name}
                onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
                onFocus={e => { e.target.style.borderBottom = '2px solid #7c3aed'; }}
                onBlur={e => {
                  setTouched(t => ({ ...t, name: true }));
                  e.target.style.borderBottom = fields.name.trim() ? '1.5px solid rgba(255,255,255,0.25)' : '2px solid #ef4444';
                }}
                className="w-full bg-transparent py-3 focus:outline-none transition-all text-lg"
                style={{ color: 'white', borderBottom: '1.5px solid rgba(255,255,255,0.25)', caretColor: '#7c3aed' }}
              />
              {touched.name && !fields.name.trim() && (
                <p className="text-xs text-red-400">Name is required</p>
              )}
            </div>

            {/* Email */}
            <div className="form-field-item space-y-3">
              <label className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.8)' }}>Email Address</label>
              <input
                type="email"
                name="from_email"
                placeholder="john@example.com"
                value={fields.email}
                onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                className="w-full bg-transparent py-3 focus:outline-none transition-all text-lg"
                style={{
                  color: 'white',
                  borderBottom: touched.email && !/^[^@]+@[^@]+\.[^@]+$/.test(fields.email) ? '2px solid #ef4444' : '1.5px solid rgba(255,255,255,0.25)',
                  caretColor: '#7c3aed',
                }}
                onFocus={e => { e.target.style.borderBottom = '2px solid #7c3aed'; }}
              />
              {touched.email && !/^[^@]+@[^@]+\.[^@]+$/.test(fields.email) && (
                <p className="text-xs text-red-400">Valid email required</p>
              )}
            </div>

            {/* Message */}
            <div className="form-field-item space-y-3">
              <label className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.8)' }}>Your Message</label>
              <textarea
                rows={4}
                name="message"
                placeholder="Tell me about your project..."
                value={fields.message}
                onChange={e => setFields(f => ({ ...f, message: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, message: true }))}
                className="w-full bg-transparent py-3 focus:outline-none transition-all text-lg resize-none"
                style={{
                  color: 'white',
                  borderBottom: touched.message && fields.message.trim().length < 10 ? '2px solid #ef4444' : '1.5px solid rgba(255,255,255,0.25)',
                  caretColor: '#7c3aed',
                }}
                onFocus={e => { (e.target as HTMLTextAreaElement).style.borderBottom = '2px solid #7c3aed'; }}
              />
              {touched.message && fields.message.trim().length < 10 && (
                <p className="text-xs text-red-400">Message must be at least 10 characters</p>
              )}
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={status === 'sending'}
              whileHover={isValid && status !== 'sending' ? { scale: 1.02, boxShadow: '0 0 30px rgba(124,58,237,0.5)' } : {}}
              whileTap={isValid ? { scale: 0.97 } : {}}
              className="w-full py-5 font-display font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300"
              style={{
                background: status === 'success'
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : status === 'error'
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                    : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                color: 'white',
                opacity: !isValid && status === 'idle' ? 0.6 : 1,
                cursor: !isValid || status === 'sending' ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'sending' && <Loader className="w-4 h-4 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-4 h-4" />}
              {status === 'error' && <XCircle className="w-4 h-4" />}
              {status === 'idle' && <Send className="w-4 h-4" />}

              {status === 'sending' ? 'Sending...' : ''}
              {status === 'success' ? 'Message Sent! 🎉' : ''}
              {status === 'error' ? 'Failed — Try Again' : ''}
              {status === 'idle' ? 'Send Message' : ''}

              {status === 'idle' && <ArrowRight className="w-4 h-4" />}
            </motion.button>

            {/* Toast notification */}
            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 rounded-2xl text-sm font-display"
                  style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80' }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Your message was sent to prajapativansh804@gmail.com ✓
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 rounded-2xl text-sm font-display"
                  style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}
                >
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  Something went wrong. Please email directly: prajapativansh804@gmail.com
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* ── Footer ── */}
      <div ref={footerRef} className="mt-32 pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="text-xs text-white/30 font-display font-medium uppercase tracking-widest">
          © 2026 Vansh Prajapati.
        </div>
        <div className="flex gap-8 text-xs text-white/30 font-display uppercase tracking-widest">
          <a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a>
        </div>
      </div>
    </section>
  );
}
