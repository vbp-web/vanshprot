import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const COUNT = 2200;
const ARMS = 3;

// ─────────────────────────────────────────────
// 3-D Particle System
// phase 0→1 : center → burst (explosion)
// phase 1→2 : burst  → galaxy (formation)
// ─────────────────────────────────────────────
function LoaderParticles({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
    const pointsRef = useRef<THREE.Points>(null);

    const { initPos, burst, galaxy, colors } = useMemo(() => {
        const initPos = new Float32Array(COUNT * 3); // all zeros = center
        const burst = new Float32Array(COUNT * 3);
        const galaxy = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);

        const iC = new THREE.Color('#ffd580'); // warm core
        const oC = new THREE.Color('#6366f1'); // purple arms

        for (let i = 0; i < COUNT; i++) {
            // ── Burst: random sphere ──
            const r = 0.6 + Math.random() * 2.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            burst[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            burst[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            burst[i * 3 + 2] = r * Math.cos(phi);

            // ── Galaxy: spiral arms ──
            const t = Math.random();
            const rad = 0.25 + t * 3.0;
            const arm = ((i % ARMS) / ARMS) * Math.PI * 2;
            const ang = arm + rad * 1.25 + (Math.random() - 0.5) * 0.5 / rad;

            galaxy[i * 3] = Math.cos(ang) * rad + (Math.random() - 0.5) * 0.12 * rad;
            galaxy[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
            galaxy[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * 0.12 * rad;

            // ── Colors ──
            const c = iC.clone().lerp(oC, t);
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }

        return { initPos, burst, galaxy, colors };
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const phase = Math.max(0, Math.min(2, phaseRef.current));
        const burstT = Math.min(phase, 1);
        const galaxyT = Math.max(0, phase - 1);

        const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;

        for (let i = 0; i < COUNT * 3; i++) {
            arr[i] = galaxyT > 0
                ? burst[i] + (galaxy[i] - burst[i]) * galaxyT
                : burst[i] * burstT;
        }
        attr.needsUpdate = true;

        // Rotation speeds up during formation
        pointsRef.current.rotation.y = state.clock.getElapsedTime() * (0.15 + galaxyT * 0.25);
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={COUNT} array={initPos} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} transparent opacity={0.92} sizeAttenuation vertexColors depthWrite={false} />
        </points>
    );
}

// ─────────────────────────────────────────────
// Central glow — shrinks after burst
// ─────────────────────────────────────────────
function CoreGlow({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!ref.current) return;
        const p = phaseRef.current;
        // Grow quickly then shrink as particles fly away
        const scale = p < 0.05
            ? 0.01
            : p < 0.3
                ? 0.01 + p * 0.8
                : Math.max(0.01, 0.25 - (p - 0.3) * 0.35);
        ref.current.scale.setScalar(scale);
        // Pulse
        const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.08;
        ref.current.scale.multiplyScalar(pulse);
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color="#e0d0ff" transparent opacity={0.95} />
        </mesh>
    );
}

// ─────────────────────────────────────────────
// SVG Logo  — "AS." with animated stroke
// ─────────────────────────────────────────────
function SVGLogo({ glow }: { glow: boolean }) {
    return (
        <svg
            viewBox="0 0 220 100"
            width="180"
            height="82"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto"
        >
            {/* V */}
            <motion.path
                d="M10 12 L45 90 L80 12"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                filter={glow ? 'url(#glow)' : undefined}
            />

            {/* P */}
            <motion.path
                d="M105 90 L105 12 C155 12 155 51 105 51"
                stroke="url(#grad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.7, ease: "easeInOut" }}
                filter={glow ? 'url(#glow)' : undefined}
            />
            {/* . */}
            <motion.circle
                cx="168"
                cy="84"
                r="6"
                fill="url(#grad)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.8, ease: 'backOut' }}
                style={{ originX: '168px', originY: '84px' }}
                filter={glow ? 'url(#glow)' : undefined}
            />

            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
}

// ─────────────────────────────────────────────
// Main Loader
// ─────────────────────────────────────────────
interface LoaderProps { onDone: () => void; }

export default function Loader({ onDone }: LoaderProps) {
    const phaseRef = useRef(0);            // drives 3D particles
    const [progress, setProgress] = useState(0);
    const [logoGlow, setLogoGlow] = useState(false);
    const [statusText, setStatusText] = useState('Initialising...');
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const STATUS = [
            { t: 0.4, text: 'Initialising...' },
            { t: 1.6, text: 'Generating galaxy...' },
            { t: 2.4, text: 'Forming star arms...' },
            { t: 3.2, text: 'Entering portfolio...' },
        ];

        const tl = gsap.timeline();

        // ── 1. Logo glow fires at 1.2 s ──
        tl.call(() => setLogoGlow(true), [], 1.2);

        // ── 2. Burst: phase 0 → 1 ──
        tl.to(phaseRef, { current: 1, duration: 0.75, ease: 'power3.in' }, 1.4);

        // ── 3. Galaxy form: phase 1 → 2 ──
        tl.to(phaseRef, { current: 2, duration: 1.4, ease: 'power2.out' }, 2.15);

        // ── 4. Progress bar ──
        tl.to({ v: 0 }, {
            v: 100,
            duration: 3.6,
            ease: 'power1.inOut',
            onUpdate: function () { setProgress(Math.round(this.targets()[0].v)); },
        }, 0.3);

        // ── 5. Status texts ──
        STATUS.forEach(({ t, text }) => tl.call(() => setStatusText(text), [], t));

        // ── 6. Exit ──
        tl.call(() => setExiting(true), [], 3.8);
        tl.call(onDone, [], 4.45);

        return () => { tl.kill(); };
    }, [onDone]);

    return (
        <AnimatePresence>
            {!exiting ? (
                <motion.div
                    key="loader"
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: '#020008' }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* ── 3D Background ── */}
                    <div className="absolute inset-0">
                        <Canvas
                            dpr={[1, 1.5]}
                            camera={{ position: [0, 1.2, 5.5], fov: 60 }}
                            gl={{ antialias: false, alpha: false }}
                            style={{ background: 'transparent' }}
                        >
                            <ambientLight intensity={0.1} />
                            <pointLight position={[0, 0, 0]} color="#a78bfa" intensity={4} distance={6} />
                            <CoreGlow phaseRef={phaseRef} />
                            <LoaderParticles phaseRef={phaseRef} />
                        </Canvas>
                    </div>

                    {/* ── Radial gradient overlay so text stays readable ── */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(2,0,8,0.5) 0%, rgba(2,0,8,0.15) 60%, transparent 100%)',
                        }}
                    />

                    {/* ── UI layer ── */}
                    <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">

                        {/* SVG Logo draw-on */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <SVGLogo glow={logoGlow} />
                        </motion.div>

                        {/* Name */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="space-y-1"
                        >
                            <div className="text-white/80 font-display font-bold tracking-[0.25em] uppercase text-sm">
                                Vansh Prajapati
                            </div>
                            <div className="text-white/30 font-display tracking-[0.15em] uppercase text-xs">
                                Creative Developer &amp; Designer
                            </div>
                        </motion.div>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            className="w-56 space-y-3"
                        >
                            {/* Track */}
                            <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${progress}%`,
                                        background: 'linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4)',
                                        boxShadow: '0 0 10px rgba(124,58,237,0.8)',
                                        transition: 'width 0.1s linear',
                                    }}
                                />
                            </div>

                            {/* Status + percentage */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">
                                    {statusText}
                                </span>
                                <span
                                    className="text-[11px] font-display font-bold tabular-nums"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {progress}%
                                </span>
                            </div>
                        </motion.div>

                        {/* Blinking cursor dot */}
                        <motion.div
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }}
                        />
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
