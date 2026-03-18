import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';

// ─── Node & Edge Definitions ─────────────────────────────────────────
// [x, y, z, layer]
const RAW_NODES: [number, number, number, number][] = [
  [0,    0,    0,    0], // 0  core
  [-1.3, 0.5,  0.2,  1], // 1
  [1.3,  0.5,  0.2,  1], // 2
  [0,    1.3,  0,    1], // 3
  [0,   -0.9,  0.5,  1], // 4
  [-2.3, 1.0, -0.4,  2], // 5
  [2.3,  1.0, -0.4,  2], // 6
  [-1.0, 1.9, -0.2,  2], // 7
  [1.0,  1.9, -0.2,  2], // 8
  [-1.5,-1.3,  0.7,  2], // 9
  [1.5, -1.3,  0.7,  2], // 10
  [-3.0, 0.2, -0.8,  3], // 11
  [3.0,  0.2, -0.8,  3], // 12
  [0,    2.6, -0.7,  3], // 13
  [-2.0,-2.0,  0.9,  3], // 14
  [2.0, -2.0,  0.9,  3], // 15
];

const NODE_POS   = RAW_NODES.map(([x, y, z]) => new THREE.Vector3(x, y, z));
const NODE_LAYER = RAW_NODES.map(([, , , l]) => l);

// When each node becomes visible (phase 0→1)
const BIRTH = [
  0.00,
  0.25, 0.28, 0.31, 0.34,
  0.50, 0.53, 0.56, 0.58, 0.60, 0.62,
  0.72, 0.75, 0.77, 0.80, 0.82,
];

const EDGES: [number, number][] = [
  [0,1],[0,2],[0,3],[0,4],
  [1,5],[1,7],[1,9],[2,6],[2,8],[2,10],
  [3,7],[3,8],[4,9],[4,10],
  [5,11],[5,14],[6,12],[6,15],
  [7,13],[7,11],[8,13],[8,12],
  [9,14],[10,15],[1,3],[2,3],
];

const LAYER_COL = ['#00d4ff','#7c3aed','#a855f7','#f472b6'];

// ─── Brain Nodes (instanced) ──────────────────────────────────────────
function BrainNodes({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const N = RAW_NODES.length;

  useFrame((state) => {
    const mesh = meshRef.current;
    const halo = haloRef.current;
    if (!mesh || !halo) return;
    const phase = phaseRef.current;
    const t = state.clock.getElapsedTime();

    RAW_NODES.forEach((_, i) => {
      const age = phase - BIRTH[i];
      const col = new THREE.Color(LAYER_COL[NODE_LAYER[i]]);

      if (age < 0) {
        dummy.position.copy(NODE_POS[i]);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        halo.setMatrixAt(i, dummy.matrix);
        return;
      }

      // Spring pop-in with overshoot
      const st = Math.min(1, age / 0.15);
      const spring = st < 0.5 ? 4*st*st*st : 1 - Math.pow(-2*st+2,3)/2;
      const bounce = st < 0.7 ? 1 + Math.sin(st * Math.PI) * 0.35 : 1;
      const pulse  = 1 + Math.sin(t * 1.8 + i * 0.85) * 0.1;

      dummy.position.copy(NODE_POS[i]);
      dummy.scale.setScalar(0.11 * spring * bounce * pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const bright = 0.6 + Math.abs(Math.sin(t * 1.2 + i)) * 0.4;
      mesh.setColorAt(i, col.clone().multiplyScalar(bright));

      // Halo ring
      dummy.scale.setScalar(0.22 * spring * (1 + Math.abs(Math.sin(t*1.5+i*0.7))*0.18));
      dummy.updateMatrix();
      halo.setMatrixAt(i, dummy.matrix);
      halo.setColorAt(i, col.clone().multiplyScalar(0.28));
    });

    mesh.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, N]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial transparent vertexColors />
      </instancedMesh>
      <instancedMesh ref={haloRef} args={[undefined, undefined, N]}>
        <ringGeometry args={[1.0, 1.18, 28]} />
        <meshBasicMaterial transparent depthWrite={false} vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

// ─── Single edge line ─────────────────────────────────────────────────
function EdgeLine({ a, b, phaseRef }: { a: number; b: number; phaseRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([NODE_POS[a], NODE_POS[b]]),
    [a, b],
  );
  const showAt = Math.max(BIRTH[a], BIRTH[b]) + 0.04;

  useFrame(() => {
    if (matRef.current)
      matRef.current.opacity = THREE.MathUtils.smoothstep(phaseRef.current, showAt, showAt + 0.12);
  });

  return (
    <line geometry={geo}>
      <lineBasicMaterial ref={matRef} color="#6366f1" transparent opacity={0} />
    </line>
  );
}

// ─── Shockwave Ring ──────────────────────────────────────────────────
function ShockwaveRing({ triggerPhase, phaseRef }: { triggerPhase: number; phaseRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const fired     = useRef(false);
  const startP    = useRef(0);

  useFrame(() => {
    const mesh = meshRef.current; const mat = matRef.current;
    if (!mesh || !mat) return;
    const phase = phaseRef.current;

    if (!fired.current && phase >= triggerPhase) { fired.current = true; startP.current = phase; }
    if (!fired.current) { mesh.scale.setScalar(0.001); return; }

    const age = phase - startP.current;
    if (age > 0.45) { mesh.scale.setScalar(0.001); mat.opacity = 0; return; }
    const t = age / 0.45;
    mesh.scale.setScalar(0.6 + t * 14);
    mat.opacity = (1 - t) * 0.9;
  });

  return (
    <mesh ref={meshRef} scale={0.001} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.88, 1.0, 64]} />
      <meshBasicMaterial ref={matRef} color="#00d4ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ─── Data Pulses ──────────────────────────────────────────────────────
function DataPulses({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulses = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      ei: Math.floor(Math.random() * EDGES.length),
      t:  Math.random(),
      sp: 0.35 + Math.random() * 0.5,
    })), []);

  useFrame((_, dt) => {
    const mesh = instanceRef.current; if (!mesh) return;
    const vis = THREE.MathUtils.smoothstep(phaseRef.current, 1.5, 1.85);
    mesh.visible = vis > 0.02;
    pulses.forEach((p, i) => {
      p.t = (p.t + dt * p.sp) % 1;
      const [ai, bi] = EDGES[p.ei];
      dummy.position.copy(NODE_POS[ai].clone().lerp(NODE_POS[bi], p.t));
      dummy.scale.setScalar(0.065 * vis);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL(0.55 + p.t * 0.35, 1, 0.8));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, 20]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={1} vertexColors />
    </instancedMesh>
  );
}

// ─── Ambient Fog ──────────────────────────────────────────────────────
function BackgroundFog() {
  const count = 700;
  const pos = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i*3]   = (Math.random()-0.5)*16;
      a[i*3+1] = (Math.random()-0.5)*10;
      a[i*3+2] = (Math.random()-0.5)*8;
    }
    return a;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame(s => { if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.014; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#6366f1" transparent opacity={0.18} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Terminal Hook ────────────────────────────────────────────────────
type TermLine = { text: string; color: string };
const TERM_SEQ = [
  { delay: 400,  text: '> CORTEX-v2.1 BOOT SEQUENCE INITIATED',   color: '#64748b' },
  { delay: 1100, text: '> Loading transformer blocks [12/12]',     color: '#64748b' },
  { delay: 1750, text: '> Temperature: 0.9 | Top-p: 0.95 | CTX: 128k', color: '#64748b' },
  { delay: 2150, text: '> Mapping attention heads: ████████ 100%', color: '#64748b' },
  { delay: 2600, text: '> Activating neural pathways...',           color: '#64748b' },
  { delay: 2950, text: '■ NEURAL CORE: ONLINE',                   color: '#00d4ff' },
  { delay: 3350, text: '> Generating portfolio...',                color: '#a78bfa' },
];

function useTerminal() {
  const [done,   setDone]   = useState<TermLine[]>([]);
  const [typing, setTyping] = useState('');

  useEffect(() => {
    const ids: number[] = [];
    TERM_SEQ.forEach(({ delay, text, color }) => {
      const tid = window.setTimeout(() => {
        let i = 0;
        const iid = window.setInterval(() => {
          i++;
          if (i <= text.length) { setTyping(text.slice(0, i)); }
          else {
            window.clearInterval(iid);
            setDone(p => [...p, { text, color }]);
            setTyping('');
          }
        }, 18);
        ids.push(iid);
      }, delay);
      ids.push(tid);
    });
    return () => ids.forEach(id => { window.clearTimeout(id); window.clearInterval(id); });
  }, []);

  return { done, typing };
}

// ─── SVG Logo ─────────────────────────────────────────────────────────
function SVGLogo({ glow }: { glow: boolean }) {
  return (
    <svg viewBox="0 0 220 100" width="160" height="72" fill="none" className="mx-auto">
      <motion.path d="M10 12 L45 90 L80 12" stroke="white" strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        filter={glow ? 'url(#lg)' : undefined} />
      <motion.path d="M105 90 L105 12 C155 12 155 51 105 51" stroke="url(#gr)"
        strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.7, ease: 'easeInOut' }}
        filter={glow ? 'url(#lg)' : undefined} />
      <motion.circle cx="168" cy="84" r="6" fill="url(#gr)"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.8, ease: 'backOut' }}
        style={{ originX: '168px', originY: '84px' }}
        filter={glow ? 'url(#lg)' : undefined} />
      <defs>
        <linearGradient id="gr" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
        <filter id="lg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ─── Main Loader ───────────────────────────────────────────────────────
interface LoaderProps { onDone: () => void; }

export default function Loader({ onDone }: LoaderProps) {
  const phaseRef  = useRef(0);
  const [progress,  setProgress]  = useState(0);
  const [logoGlow,  setLogoGlow]  = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [coreOnline,setCoreOnline] = useState(false);
  const { done, typing } = useTerminal();

  useEffect(() => {
    const tl = gsap.timeline();

    tl.call(() => setLogoGlow(true), [], 0.9);

    // Phase 0 → 1 : nodes ripple out
    tl.to(phaseRef, { current: 1, duration: 1.7, ease: 'power2.inOut' }, 0.45);

    // Phase 1 → 1.75 : edges form
    tl.to(phaseRef, { current: 1.75, duration: 0.85, ease: 'power2.out' }, 2.15);

    // Phase 1.75 → 2 : shockwave + pulses
    tl.to(phaseRef, { current: 2, duration: 0.7, ease: 'power1.out'  }, 3.0);

    // NEURAL CORE badge
    tl.call(() => setCoreOnline(true), [], 2.95);

    // Progress bar
    tl.to({ v: 0 }, {
      v: 100, duration: 3.7, ease: 'power1.inOut',
      onUpdate: function () { setProgress(Math.round(this.targets()[0].v)); },
    }, 0.25);

    // Exit
    tl.call(() => setExiting(true), [], 3.85);
    tl.call(onDone, [], 4.4);

    return () => { tl.kill(); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#030010' }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── CRT Scanlines overlay ── */}
          <div className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* ── 3-D Neural Network ── */}
          <div className="absolute inset-0">
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.4, 7.5], fov: 55 }}
              gl={{ antialias: false, alpha: false }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.07} />
              <pointLight position={[0, 0, 0]}   color="#7c3aed" intensity={5}   distance={12} />
              <pointLight position={[-3, 1.5,-2]} color="#00d4ff" intensity={2.5} distance={10} />
              <pointLight position={[3, -1,  1]}  color="#f472b6" intensity={2}   distance={10} />

              <BackgroundFog />
              <BrainNodes phaseRef={phaseRef} />
              {EDGES.map(([a, b], i) => (
                <EdgeLine key={i} a={a} b={b} phaseRef={phaseRef} />
              ))}
              <ShockwaveRing triggerPhase={1.78} phaseRef={phaseRef} />
              <DataPulses phaseRef={phaseRef} />
            </Canvas>
          </div>

          {/* ── Vignette ── */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(3,0,16,0.6) 0%, rgba(3,0,16,0.1) 70%, transparent 100%)' }}
          />

          {/* ── UI Panel ── */}
          <div className="relative z-30 flex flex-col items-center gap-6 px-6 w-full max-w-sm">

            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              <SVGLogo glow={logoGlow} />
            </motion.div>

            {/* Name */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }} className="text-center space-y-1">
              <div className="text-white/80 font-mono font-bold tracking-[0.22em] uppercase text-sm">
                Vansh Prajapati
              </div>
              <div className="text-white/30 font-mono tracking-[0.14em] uppercase text-[10px]">
                AI Engineer &amp; Creative Developer
              </div>
            </motion.div>

            {/* Terminal window */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="w-full rounded-lg overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(8px)' }}
            >
              {/* Terminal title bar */}
              <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"  />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">CORTEX TERMINAL</span>
              </div>

              {/* Terminal body */}
              <div className="p-3 space-y-1" style={{ minHeight: '130px' }}>
                {done.map((line, i) => (
                  <div key={i} className="font-mono text-[10px] leading-relaxed" style={{ color: line.color }}>
                    {line.text}
                  </div>
                ))}
                {typing && (
                  <div className="font-mono text-[10px] leading-relaxed text-white/70 flex items-center gap-1">
                    {typing}
                    <motion.span className="inline-block w-[6px] h-[10px] bg-white/60"
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
                  </div>
                )}
              </div>
            </motion.div>

            {/* NEURAL CORE ONLINE badge */}
            <AnimatePresence>
              {coreOnline && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-[11px] font-bold tracking-widest uppercase"
                  style={{
                    background: 'rgba(0,212,255,0.1)',
                    border: '1px solid rgba(0,212,255,0.5)',
                    color: '#00d4ff',
                    boxShadow: '0 0 20px rgba(0,212,255,0.3)',
                  }}
                >
                  <motion.span className="w-2 h-2 rounded-full bg-[#00d4ff]"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }} />
                  NEURAL CORE: ONLINE
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }} className="w-full space-y-2">
              <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all duration-100 linear"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg,#7c3aed,#00d4ff,#f472b6)',
                    boxShadow: '0 0 14px rgba(0,212,255,0.8)',
                  }} />
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/25">
                  {progress < 100 ? 'BOOTING SYSTEM' : 'BOOT COMPLETE'}
                </span>
                <span className="font-mono text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {progress}%
                </span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
