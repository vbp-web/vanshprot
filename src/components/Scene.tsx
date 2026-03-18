import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ── Scroll tracker ────────────────────────────────────────────────────
function useScrollProgress() {
  const ref = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      ref.current = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return ref;
}

// ── Cinematic Waypoints ───────────────────────────────────────────────
const WAYPOINTS = [
  { progress: 0.00, pos: new THREE.Vector3(0, 6, 18),  look: new THREE.Vector3(0, 0, 0) },
  { progress: 0.25, pos: new THREE.Vector3(3, 3, 12),  look: new THREE.Vector3(0, 0, 0) },
  { progress: 0.50, pos: new THREE.Vector3(-2, 1, 6),  look: new THREE.Vector3(0, 0.5, 0) },
  { progress: 0.75, pos: new THREE.Vector3(2, -1, 3),  look: new THREE.Vector3(0, 0, -2) },
  { progress: 1.00, pos: new THREE.Vector3(-1, 0.5, 1.5), look: new THREE.Vector3(0, 0, 0) },
];

function lerpWaypoints(p: number) {
  const c = Math.max(0, Math.min(1, p));
  let fi = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (c >= WAYPOINTS[i].progress && c <= WAYPOINTS[i + 1].progress) { fi = i; break; }
  }
  const from = WAYPOINTS[fi];
  const to   = WAYPOINTS[Math.min(fi + 1, WAYPOINTS.length - 1)];
  const range = to.progress - from.progress;
  const t = range === 0 ? 0 : (c - from.progress) / range;
  const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  return { pos: from.pos.clone().lerp(to.pos, e), look: from.look.clone().lerp(to.look, e) };
}

// ── Cinematic Camera ──────────────────────────────────────────────────
function CinematicCamera({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const sPos  = useRef(new THREE.Vector3(0, 6, 18));
  const sLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const { pos, look } = lerpWaypoints(scrollRef.current);
    const sp = Math.min(1, delta * 1.6);
    sPos.current.lerp(pos, sp);
    sLook.current.lerp(look, sp);
    camera.position.copy(sPos.current);
    camera.lookAt(sLook.current);
  });
  return null;
}

// ── Latent Space Clusters ─────────────────────────────────────────────
const CLUSTER_DEFS = [
  { color: '#00d4ff', cx: -4,  cy:  2, cz: -3, n: 600 },
  { color: '#7c3aed', cx:  2,  cy: -2, cz: -5, n: 500 },
  { color: '#f472b6', cx: -2,  cy: -3, cz:  3, n: 500 },
  { color: '#34d399', cx:  5,  cy:  1, cz:  2, n: 450 },
  { color: '#fbbf24', cx:  0,  cy:  4, cz:  1, n: 400 },
  { color: '#60a5fa', cx: -5,  cy: -1, cz: -1, n: 400 },
];

function LatentClusters({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const clusters = useMemo(() =>
    CLUSTER_DEFS.map(({ color, cx, cy, cz, n }) => {
      const positions = new Float32Array(n * 3);
      const base      = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const bx = cx + (Math.random()-0.5) * 1.8;
        const by = cy + (Math.random()-0.5) * 1.8;
        const bz = cz + (Math.random()-0.5) * 1.8;
        base[i*3] = positions[i*3] = bx;
        base[i*3+1] = positions[i*3+1] = by;
        base[i*3+2] = positions[i*3+2] = bz;
      }
      return { color, positions, base, cx, cy, cz, n };
    }), []);

  const geoRefs = useRef<(THREE.BufferGeometry | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scroll = scrollRef.current;

    clusters.forEach(({ base, positions, cx, cy, cz, n }, ci) => {
      const geo = geoRefs.current[ci];
      if (!geo) return;

      const conv = THREE.MathUtils.smoothstep(scroll, 0.35, 0.65);

      for (let i = 0; i < n; i++) {
        const bx = base[i*3]; const by = base[i*3+1]; const bz = base[i*3+2];
        const tx = bx*(1-conv) + (bx*0.1+(Math.random()-0.5)*0.3)*conv;
        const ty = by*(1-conv) + (by*0.1+(Math.random()-0.5)*0.3)*conv;
        const tz = bz*(1-conv) + (bz*0.1+(Math.random()-0.5)*0.3)*conv;
        const freq = 0.4 + ci*0.07; const amp = 0.08*(1-conv*0.7);
        positions[i*3]   = tx + Math.sin(t*freq+bx)*amp;
        positions[i*3+1] = ty + Math.cos(t*freq+by)*amp;
        positions[i*3+2] = tz + Math.sin(t*freq+bz+1)*amp;
      }

      const attr = geo.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;

      const mat = (geo.parent as unknown as THREE.Points)?.material as THREE.PointsMaterial;
      if (mat) mat.opacity = THREE.MathUtils.lerp(0.75, 0, THREE.MathUtils.smoothstep(scroll, 0.55, 0.75));
    });
  });

  return (
    <group>
      {clusters.map(({ color, positions, n }, ci) => (
        <points key={ci}>
          <bufferGeometry ref={el => { geoRefs.current[ci] = el; }}>
            <bufferAttribute attach="attributes-position" count={n} array={positions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.06} color={color} transparent opacity={0.75} sizeAttenuation depthWrite={false} />
        </points>
      ))}
    </group>
  );
}

// ── Neural Network Layout ─────────────────────────────────────────────
const LAYER_DEFS = [
  { n: 6, x: -3.5, spread: 1.8 },
  { n: 8, x:  0,   spread: 2.2 },
  { n: 8, x:  0,   spread: 2.2 },
  { n: 5, x:  3.5, spread: 1.4 },
];

function buildNetwork() {
  return LAYER_DEFS.map(({ n, x, spread }, li) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = spread * 0.5;
      return new THREE.Vector3(x, Math.sin(angle)*r, Math.cos(angle)*r + (li-1.5)*0.8);
    })
  );
}
const NETWORK = buildNetwork();
const ALL_NODES = NETWORK.flat();

const NET_EDGES: [THREE.Vector3, THREE.Vector3][] = [];
for (let li = 0; li < NETWORK.length - 1; li++) {
  for (const a of NETWORK[li]) {
    for (const b of NETWORK[li+1]) NET_EDGES.push([a, b]);
  }
}

// ── Network Edges ─────────────────────────────────────────────────────
function NetworkEdges({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(NET_EDGES.length * 6);
    NET_EDGES.forEach(([a, b], i) => {
      arr[i*6]   = a.x; arr[i*6+1] = a.y; arr[i*6+2] = a.z;
      arr[i*6+3] = b.x; arr[i*6+4] = b.y; arr[i*6+5] = b.z;
    });
    return arr;
  }, []);

  useFrame(() => {
    if (matRef.current)
      matRef.current.opacity = THREE.MathUtils.smoothstep(scrollRef.current, 0.40, 0.65);
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={NET_EDGES.length*2} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={matRef} color="#4f46e5" transparent opacity={0} />
    </lineSegments>
  );
}

// ── Network Nodes ─────────────────────────────────────────────────────
function NetworkNodes({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const NODE_COLS = [
    new THREE.Color('#00d4ff'),
    new THREE.Color('#7c3aed'),
    new THREE.Color('#a855f7'),
    new THREE.Color('#f472b6'),
  ];

  useFrame((state) => {
    const mesh = instanceRef.current; if (!mesh) return;
    const vis = THREE.MathUtils.smoothstep(scrollRef.current, 0.38, 0.62);
    const t = state.clock.getElapsedTime();
    let ni = 0;
    NETWORK.forEach((layer, li) => {
      layer.forEach((pos, i) => {
        const pulse = 1 + Math.sin(t*1.5 + ni*0.8)*0.12*vis;
        dummy.position.copy(pos);
        dummy.scale.setScalar(0.12*vis*pulse);
        dummy.updateMatrix();
        mesh.setMatrixAt(ni, dummy.matrix);
        const bright = 0.5 + Math.abs(Math.sin(t*0.8 + i*1.2))*0.5;
        mesh.setColorAt(ni, NODE_COLS[li].clone().multiplyScalar(bright));
        ni++;
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, ALL_NODES.length]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial transparent vertexColors />
    </instancedMesh>
  );
}

// ── Node Halos ────────────────────────────────────────────────────────
function NodeHalos({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = instanceRef.current; if (!mesh) return;
    const vis = THREE.MathUtils.smoothstep(scrollRef.current, 0.42, 0.68);
    const t = state.clock.getElapsedTime();
    ALL_NODES.forEach((pos, i) => {
      const pulse = 0.25 + Math.abs(Math.sin(t*1.1 + i*0.9))*0.15;
      dummy.position.copy(pos);
      dummy.scale.setScalar(pulse*vis);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL((i/ALL_NODES.length)*0.5+0.55, 1, 0.7));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, ALL_NODES.length]}>
      <ringGeometry args={[0.9, 1.0, 24]} />
      <meshBasicMaterial transparent opacity={0.15} vertexColors side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}

// ── Data Pulses ───────────────────────────────────────────────────────
function DataPulses({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulses = useMemo(() =>
    Array.from({ length: 60 }, () => ({
      ei:  Math.floor(Math.random() * NET_EDGES.length),
      t:   Math.random(),
      sp:  0.3 + Math.random() * 0.5,
    })), []);

  useFrame((_, dt) => {
    const mesh = instanceRef.current; if (!mesh) return;
    const vis = THREE.MathUtils.smoothstep(scrollRef.current, 0.55, 0.72);
    mesh.visible = vis > 0.05;
    pulses.forEach((p, i) => {
      p.t = (p.t + dt * p.sp * (0.5 + vis*1.5)) % 1;
      const [a, b] = NET_EDGES[p.ei];
      dummy.position.copy(a.clone().lerp(b, p.t));
      dummy.scale.setScalar(0.045*vis);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL(0.55 + p.t*0.35, 1, 0.7));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, 60]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.9} vertexColors />
    </instancedMesh>
  );
}

// ── Heartbeat Shockwave (fires every ~6s when network visible) ────────
function HeartbeatPulse({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const lastFire = useRef(0);
  const startT   = useRef<number | null>(null);
  const INTERVAL = 5.5;

  useFrame((state) => {
    const mesh = meshRef.current; const mat = matRef.current;
    if (!mesh || !mat) return;
    const t = state.clock.getElapsedTime();
    const scroll = scrollRef.current;
    const networkVis = THREE.MathUtils.smoothstep(scroll, 0.55, 0.72);

    // Trigger every INTERVAL seconds once network is visible
    if (networkVis > 0.5 && t - lastFire.current > INTERVAL) {
      lastFire.current = t;
      startT.current = t;
    }

    if (startT.current === null) { mesh.scale.setScalar(0.001); return; }

    const age = t - startT.current;
    if (age > 1.5) { startT.current = null; mesh.scale.setScalar(0.001); mat.opacity = 0; return; }
    const p = age / 1.5;
    // Two pulses: one fast, one slow
    mesh.scale.setScalar(0.5 + p * 18);
    mat.opacity = Math.max(0, (1 - p) * 0.7 * networkVis);
  });

  return (
    <mesh ref={meshRef} scale={0.001} rotation={[Math.PI/2, 0, 0]}>
      <ringGeometry args={[0.88, 1.0, 64]} />
      <meshBasicMaterial ref={matRef} color="#00d4ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ── Boot Ripple — nodes pop in ripple wave first 4s ───────────────────
function BootRipple() {
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const startT = useRef<number | null>(null);
  const DURATION = 4.0;

  useFrame((state) => {
    const mesh = instanceRef.current; if (!mesh) return;
    const t = state.clock.getElapsedTime();
    if (startT.current === null) startT.current = t;
    const elapsed = t - startT.current;
    if (elapsed > DURATION + 1) { mesh.visible = false; return; }

    const progress = Math.min(1, elapsed / DURATION);

    ALL_NODES.forEach((pos, i) => {
      const dist = Math.sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
      const maxDist = 10;
      const birthP = dist / maxDist;
      const age = progress - birthP * 0.6;

      if (age < 0) {
        dummy.scale.setScalar(0.001);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        return;
      }

      const st = Math.min(1, age / 0.2);
      const spring = st < 0.5 ? 4*st*st*st : 1 - Math.pow(-2*st+2,3)/2;
      const bounce = st < 0.65 ? 1 + Math.sin(st*Math.PI)*0.3 : 1;
      // Fade out as scroll-driven network takes over
      const fadeOut = Math.max(0, 1 - elapsed / (DURATION + 0.5));

      dummy.position.copy(pos);
      dummy.scale.setScalar(0.14 * spring * bounce * fadeOut);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL((i / ALL_NODES.length)*0.5 + 0.55, 1, 0.7));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, ALL_NODES.length]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial transparent vertexColors />
    </instancedMesh>
  );
}

// ── Ambient Particle Fog ──────────────────────────────────────────────
function ParticleFog() {
  const count = 3000;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i*3]   = (Math.random()-0.5)*30;
      arr[i*3+1] = (Math.random()-0.5)*20;
      arr[i*3+2] = (Math.random()-0.5)*30;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame(s => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.getElapsedTime()*0.012;
    ref.current.rotation.x = s.clock.getElapsedTime()*0.006;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#6366f1" transparent opacity={0.22} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Scene Terminal: LLM Boot Text Overlay ────────────────────────────
const SCENE_TERM_SEQ = [
  { delay: 300,  text: '> INITIALISING PORTFOLIO_CORE v2.1...',     color: '#475569' },
  { delay: 900,  text: '> Loading model weights [27/27] layers',     color: '#475569' },
  { delay: 1600, text: '> Temperature: 0.9 | Top-p: 0.95 | CTX: 128k', color: '#475569' },
  { delay: 2200, text: '> Neural pathways: 847 active',              color: '#475569' },
  { delay: 2750, text: '> Attention heads mapped: ████████ 100%',    color: '#475569' },
  { delay: 3200, text: '■ SYSTEM ONLINE — Welcome, Human.',          color: '#00d4ff' },
];

function useSceneTerminal() {
  const [done,   setDone]   = useState<{ text: string; color: string }[]>([]);
  const [typing, setTyping] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const ids: number[] = [];
    const lastDelay = SCENE_TERM_SEQ[SCENE_TERM_SEQ.length - 1].delay;
    const lastLen   = SCENE_TERM_SEQ[SCENE_TERM_SEQ.length - 1].text.length;
    const hideAt    = lastDelay + lastLen * 18 + 2400; // fade 2.4s after last line done

    SCENE_TERM_SEQ.forEach(({ delay, text, color }) => {
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

    const hideId = window.setTimeout(() => setVisible(false), hideAt);
    ids.push(hideId);
    return () => ids.forEach(id => { window.clearTimeout(id); window.clearInterval(id); });
  }, []);

  return { done, typing, visible };
}

function SceneTerminal() {
  const { done, typing, visible } = useSceneTerminal();

  return (
    <div
      className="absolute bottom-8 left-6 z-20 w-80 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        pointerEvents: 'none',
      }}
    >
      {/* Terminal window */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(3,0,16,0.72)',
          border: '1px solid rgba(99,102,241,0.3)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444', opacity: 0.7 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: '#eab308', opacity: 0.7 }} />
          <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', opacity: 0.7 }} />
          <span className="ml-2 font-mono text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
            CORTEX — NEURAL OS
          </span>
          {/* Blinking activity dot */}
          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{
            background: '#00d4ff',
            boxShadow: '0 0 6px #00d4ff',
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
        </div>

        {/* Terminal body */}
        <div className="p-4 space-y-1.5" style={{ minHeight: '110px' }}>
          {done.map((line, i) => (
            <div key={i} className="font-mono text-[10px] leading-relaxed" style={{ color: line.color }}>
              {line.text}
            </div>
          ))}
          {typing && (
            <div className="font-mono text-[10px] leading-relaxed flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {typing}
              <span
                className="inline-block w-[5px] h-[10px]"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  animation: 'blink 0.7s step-end infinite',
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div
          className="px-4 py-1.5 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
        >
          <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>
            AI PORTFOLIO ENGINE
          </span>
          <span className="font-mono text-[8px]" style={{ color: 'rgba(0,212,255,0.5)' }}>
            v2.1.0
          </span>
        </div>
      </div>

      {/* Connector line from terminal to scene */}
      <div
        className="absolute -top-3 left-6 w-px h-3"
        style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.4), transparent)' }}
      />
    </div>
  );
}

// ── Main Scene ────────────────────────────────────────────────────────
export default function Scene() {
  const scrollRef = useScrollProgress();

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* CRT scanlines overlay on main scene */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.06) 0px,rgba(0,0,0,0.06) 1px,transparent 1px,transparent 4px)',
        }}
      />
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#030010' }}
      >
        <PerspectiveCamera makeDefault position={[0, 6, 18]} fov={60} />

        <ambientLight intensity={0.06} />
        <pointLight position={[0, 0, 0]}   color="#7c3aed" intensity={4}   distance={12} />
        <pointLight position={[-4, 2, -3]} color="#00d4ff" intensity={2.5} distance={10} />
        <pointLight position={[4, -1, 2]}  color="#f472b6" intensity={2}   distance={10} />

        <CinematicCamera scrollRef={scrollRef} />

        {/* Phase 1 – Latent Space clusters */}
        <LatentClusters scrollRef={scrollRef} />

        {/* Phase 2/3 – Neural Network */}
        <NetworkEdges scrollRef={scrollRef} />
        <NetworkNodes scrollRef={scrollRef} />
        <NodeHalos    scrollRef={scrollRef} />
        <DataPulses   scrollRef={scrollRef} />

        {/* Boot ripple on page load */}
        <BootRipple />

        {/* Periodic heartbeat shockwave */}
        <HeartbeatPulse scrollRef={scrollRef} />

        {/* Always-on ambient fog */}
        <ParticleFog />
      </Canvas>

      {/* LLM Terminal Boot Overlay */}
      <SceneTerminal />

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.3;transform:scale(1.3)}
        }
      `}</style>
    </div>
  );
}
