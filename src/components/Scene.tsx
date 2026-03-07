import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── Cinematic Scroll Waypoints ───────────────────────────────────────
// Each waypoint: { progress (0–1), position, lookAt }
const WAYPOINTS = [
  { progress: 0.00, pos: new THREE.Vector3(0, 3.5, 6.0), look: new THREE.Vector3(0, 0, 0) },  // Full galaxy overview
  { progress: 0.20, pos: new THREE.Vector3(0, 1.5, 3.5), look: new THREE.Vector3(0, 0, 0) },  // Descending toward core
  { progress: 0.40, pos: new THREE.Vector3(-1, 0.5, 1.5), look: new THREE.Vector3(0, 0.2, 0) }, // Inside left arm
  { progress: 0.60, pos: new THREE.Vector3(2, 0.8, 2.0), look: new THREE.Vector3(0, 0.1, 0) }, // Orbit to right arm
  { progress: 0.80, pos: new THREE.Vector3(0, 2.0, 4.0), look: new THREE.Vector3(0, 0, 0) },  // Rising & pulling back
  { progress: 1.00, pos: new THREE.Vector3(0, 1.0, 5.5), look: new THREE.Vector3(0, 0, 0) },  // Final settled view
];

// ── Smooth interpolation between waypoints ───────────────────────────
function lerpWaypoints(progress: number) {
  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));

  // Find the two surrounding waypoints
  let fromIdx = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (p >= WAYPOINTS[i].progress && p <= WAYPOINTS[i + 1].progress) {
      fromIdx = i;
      break;
    }
  }

  const from = WAYPOINTS[fromIdx];
  const to = WAYPOINTS[Math.min(fromIdx + 1, WAYPOINTS.length - 1)];

  // Local t between the two waypoints
  const range = to.progress - from.progress;
  const t = range === 0 ? 0 : (p - from.progress) / range;

  // Smooth t using ease-in-out cubic
  const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const pos = from.pos.clone().lerp(to.pos, easedT);
  const look = from.look.clone().lerp(to.look, easedT);

  return { pos, look };
}

// ── Cinematic Camera Controller ──────────────────────────────────────
function CinematicCamera() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 3.5, 6));
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));
  const scrollRef = useRef(0);

  // Track scroll progress (0–1)
  useMemo(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? scrollTop / maxScroll : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((_, delta) => {
    const { pos, look } = lerpWaypoints(scrollRef.current);

    // Smooth lerp — adjust 0.8 for faster, 0.3 for slower camera catch-up
    const lerpSpeed = Math.min(1, delta * 1.8);
    smoothPos.current.lerp(pos, lerpSpeed);
    smoothLook.current.lerp(look, lerpSpeed);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}

// ── Spiral Galaxy Arms ───────────────────────────────────────────────
function GalaxyArms() {
  const count = 8000;
  const arms = 3;
  const spin = 1.2;
  const spread = 0.35;
  const innerRadius = 0.3;
  const outerRadius = 4.5;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const innerColor = new THREE.Color('#ffd580');
    const outerColor = new THREE.Color('#6366f1');

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const radius = innerRadius + t * (outerRadius - innerRadius);
      const armAngle = ((i % arms) / arms) * Math.PI * 2;
      const spinAngle = radius * spin;
      const spreadAng = (Math.random() - 0.5) * spread * (1 / radius) * 2;
      const angle = armAngle + spinAngle + spreadAng;

      const rx = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * radius * 0.3;
      const ry = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.08;
      const rz = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * radius * 0.3;

      positions[i * 3] = Math.cos(angle) * radius + rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = Math.sin(angle) * radius + rz;

      const mixed = innerColor.clone().lerp(outerColor, t);
      const armHue = (i % arms) / arms;
      mixed.lerp(new THREE.Color().setHSL(0.65 + armHue * 0.15, 0.8, 0.6), 0.3);

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    return { positions, colors };
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} transparent opacity={0.85} sizeAttenuation vertexColors depthWrite={false} />
    </points>
  );
}

// ── Dense Glowing Core ───────────────────────────────────────────────
function GalaxyCore() {
  const count = 1500;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 2) * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.25;
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.8 + Math.random() * 0.2;
      const warmth = Math.random() * 0.3;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness - warmth * 0.1;
      colors[i * 3 + 2] = brightness - warmth * 0.3;
    }
    return { positions, colors };
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.07;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} transparent opacity={0.95} sizeAttenuation vertexColors depthWrite={false} />
    </points>
  );
}

// ── Nebula Dust Clouds ───────────────────────────────────────────────
function NebulaCloud({ color, position, count = 600 }: {
  color: string;
  position: [number, number, number];
  count?: number;
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2.5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    ref.current.rotation.z = state.clock.getElapsedTime() * 0.008;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={color} transparent opacity={0.18} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Main Scene Export ────────────────────────────────────────────────
export default function Scene() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }} style={{ background: '#020008' }}>
        {/* Camera is controlled manually via CinematicCamera — no makeDefault PerspectiveCamera needed */}
        <PerspectiveCamera makeDefault position={[0, 3.5, 6]} fov={65} />

        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} color="#ffe8a0" intensity={3} distance={5} />
        <pointLight position={[2, 0.5, -2]} color="#6366f1" intensity={1.5} distance={8} />
        <pointLight position={[-2, 0.5, 2]} color="#8b5cf6" intensity={1.5} distance={8} />

        <CinematicCamera />

        <Stars radius={80} depth={60} count={5000} factor={3} saturation={0.6} fade speed={0.4} />
        <GalaxyArms />
        <GalaxyCore />

        <NebulaCloud color="#818cf8" position={[2.5, 0, -1.5]} count={700} />
        <NebulaCloud color="#a78bfa" position={[-2.0, 0, 2.0]} count={600} />
        <NebulaCloud color="#f472b6" position={[1.5, 0, 2.5]} count={500} />
        <NebulaCloud color="#67e8f9" position={[-3.0, 0, -1.0]} count={400} />
      </Canvas>
    </div>
  );
}
