import { Component, type ReactNode, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { CompanionAnimation } from '../../types/phygital';
import { Companion2DFallback } from './Companion2DFallback';

interface Companion3DStageProps {
  animation: CompanionAnimation;
  sunBatteryLevel: number;
  prefer2D?: boolean;
  compact?: boolean;
  onSelectCompanion?: (who: 'leo' | 'maya') => void;
}

function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LeoMesh({
  animation,
  onClick,
}: {
  animation: CompanionAnimation;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const magRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current || !magRef.current || !headRef.current) return;

    if (animation === 'celebration' || animation === 'happy') {
      groupRef.current.position.y = Math.abs(Math.sin(t * 5.2)) * 0.25;
      groupRef.current.rotation.y = Math.sin(t * 2.5) * 0.22;
      magRef.current.rotation.z = Math.sin(t * 6) * 0.35;
    } else if (animation === 'walking') {
      groupRef.current.position.y = Math.abs(Math.sin(t * 6)) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 6) * 0.06;
    } else if (animation === 'thinking') {
      headRef.current.rotation.z = 0.14 + Math.sin(t * 1.6) * 0.05;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.03;
    } else if (animation === 'surprised') {
      groupRef.current.position.y = Math.sin(t * 8) * 0.06 + 0.08;
      headRef.current.rotation.x = -0.1;
    } else if (animation === 'talking' || animation === 'quest') {
      groupRef.current.position.y = Math.sin(t * 2.4) * 0.04;
      headRef.current.rotation.y = Math.sin(t * 3) * 0.12;
      magRef.current.rotation.z = Math.sin(t * 3.5) * 0.2;
    } else {
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.04;
      groupRef.current.rotation.y = 0.18 + Math.sin(t * 0.8) * 0.05;
      headRef.current.rotation.z = 0;
      headRef.current.rotation.x = 0;
      magRef.current.rotation.z = Math.sin(t * 1.5) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[-0.95, 0, 0]} onClick={onClick}>
      {/* Legs */}
      <mesh position={[-0.16, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.24, 6, 12]} />
        <meshStandardMaterial color="#7A583E" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.24, 6, 12]} />
        <meshStandardMaterial color="#7A583E" roughness={0.7} />
      </mesh>

      {/* Torso / Explorer Vest */}
      <RoundedBox args={[0.62, 0.68, 0.42]} radius={0.18} position={[0, 0.72, 0]} castShadow>
        <meshStandardMaterial color="#C77B5A" roughness={0.6} />
      </RoundedBox>
      {/* Shirt front */}
      <RoundedBox args={[0.32, 0.56, 0.44]} radius={0.08} position={[0, 0.72, 0.01]}>
        <meshStandardMaterial color="#FAF8F5" roughness={0.7} />
      </RoundedBox>
      {/* Notebook on hip */}
      <RoundedBox args={[0.12, 0.28, 0.22]} radius={0.03} position={[-0.35, 0.65, 0.08]}>
        <meshStandardMaterial color="#E8C878" roughness={0.5} />
      </RoundedBox>

      {/* Left Arm */}
      <mesh position={[-0.4, 0.74, 0]} rotation={[0, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.08, 0.3, 6, 10]} />
        <meshStandardMaterial color="#F6D5B8" roughness={0.6} />
      </mesh>

      {/* Right Arm + Glowing Magnifying Glass */}
      <group ref={magRef} position={[0.42, 0.78, 0.12]}>
        <mesh rotation={[0.4, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.08, 0.28, 6, 10]} />
          <meshStandardMaterial color="#F6D5B8" roughness={0.6} />
        </mesh>
        <mesh position={[0.16, 0.14, 0.22]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.24, 10]} />
          <meshStandardMaterial color="#7A583E" />
        </mesh>
        <mesh position={[0.16, 0.34, 0.28]}>
          <torusGeometry args={[0.14, 0.03, 12, 24]} />
          <meshStandardMaterial color="#4A3525" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0.16, 0.34, 0.28]}>
          <circleGeometry args={[0.12, 24]} />
          <meshStandardMaterial
            color="#E8C878"
            emissive="#E8C878"
            emissiveIntensity={0.65}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Head + Glasses */}
      <group ref={headRef} position={[0, 1.36, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial color="#F6D5B8" roughness={0.55} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.16, -0.02]} castShadow>
          <sphereGeometry args={[0.33, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          <meshStandardMaterial color="#4A3525" roughness={0.8} />
        </mesh>
        {/* Glasses */}
        <mesh position={[-0.12, 0.02, 0.31]}>
          <torusGeometry args={[0.09, 0.018, 10, 20]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
        <mesh position={[0.12, 0.02, 0.31]}>
          <torusGeometry args={[0.09, 0.018, 10, 20]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
        <mesh position={[0, 0.02, 0.32]}>
          <boxGeometry args={[0.08, 0.02, 0.02]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 0.02, 0.31]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
        <mesh position={[0.12, 0.02, 0.31]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
      </group>
    </group>
  );
}

function MayaMesh({
  animation,
  onClick,
}: {
  animation: CompanionAnimation;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current || !headRef.current) return;

    if (animation === 'celebration' || animation === 'happy') {
      groupRef.current.position.y = Math.abs(Math.sin(t * 5.6 + 0.6)) * 0.28;
      groupRef.current.rotation.y = Math.sin(t * 2.5) * -0.22;
    } else if (animation === 'walking') {
      groupRef.current.position.y = Math.abs(Math.sin(t * 6 + 1)) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 6) * -0.06;
    } else if (animation === 'talking' || animation === 'quest') {
      groupRef.current.position.y = Math.sin(t * 2.4 + 0.4) * 0.05;
      headRef.current.rotation.y = Math.sin(t * 3 + 0.5) * -0.14;
    } else {
      groupRef.current.position.y = Math.sin(t * 1.9 + 0.8) * 0.045;
      groupRef.current.rotation.y = -0.2 + Math.sin(t * 0.8) * 0.05;
      headRef.current.rotation.y = 0;
    }
  });

  return (
    <group ref={groupRef} position={[0.95, 0, 0]} onClick={onClick}>
      {/* Legs */}
      <mesh position={[-0.15, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.085, 0.24, 6, 12]} />
        <meshStandardMaterial color="#7A583E" roughness={0.7} />
      </mesh>
      <mesh position={[0.15, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.085, 0.24, 6, 12]} />
        <meshStandardMaterial color="#7A583E" roughness={0.7} />
      </mesh>

      {/* Sage Explorer Tunic */}
      <RoundedBox args={[0.6, 0.68, 0.4]} radius={0.18} position={[0, 0.72, 0]} castShadow>
        <meshStandardMaterial color="#A5B49A" roughness={0.6} />
      </RoundedBox>
      {/* Adventure Satchel */}
      <RoundedBox args={[0.18, 0.24, 0.26]} radius={0.05} position={[0.35, 0.6, 0.05]}>
        <meshStandardMaterial color="#C77B5A" roughness={0.6} />
      </RoundedBox>

      {/* Arms */}
      <mesh position={[-0.39, 0.75, 0.06]} rotation={[0.2, 0, 0.28]} castShadow>
        <capsuleGeometry args={[0.075, 0.28, 6, 10]} />
        <meshStandardMaterial color="#EAC09E" roughness={0.6} />
      </mesh>
      <mesh position={[0.39, 0.75, 0.06]} rotation={[0.2, 0, -0.28]} castShadow>
        <capsuleGeometry args={[0.075, 0.28, 6, 10]} />
        <meshStandardMaterial color="#EAC09E" roughness={0.6} />
      </mesh>

      {/* Head + Curly Hair Puffs */}
      <group ref={headRef} position={[0, 1.34, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.33, 24, 24]} />
          <meshStandardMaterial color="#EAC09E" roughness={0.55} />
        </mesh>
        {/* Curly Puffs */}
        <mesh position={[-0.28, 0.18, -0.05]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#4A3525" roughness={0.85} />
        </mesh>
        <mesh position={[0.28, 0.18, -0.05]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#4A3525" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.24, -0.05]} castShadow>
          <sphereGeometry args={[0.26, 18, 18]} />
          <meshStandardMaterial color="#4A3525" roughness={0.85} />
        </mesh>
        {/* Nature Leaf Accessory */}
        <mesh position={[0.28, 0.31, 0.1]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#A5B49A" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.11, 0.02, 0.3]}>
          <sphereGeometry args={[0.034, 10, 10]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
        <mesh position={[0.11, 0.02, 0.3]}>
          <sphereGeometry args={[0.034, 10, 10]} />
          <meshStandardMaterial color="#4A3525" />
        </mesh>
      </group>
    </group>
  );
}

function SunOrb({ level }: { level: number }) {
  const glow = 0.35 + (level / 100) * 1.1;
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh position={[0, 2.35, -0.4]}>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial
          color="#E8C878"
          emissive="#E8C878"
          emissiveIntensity={glow}
          roughness={0.25}
        />
      </mesh>
    </Float>
  );
}

export function Companion3DStage({
  animation,
  sunBatteryLevel,
  prefer2D = false,
  compact = false,
  onSelectCompanion,
}: Companion3DStageProps) {
  const canWebGL = useMemo(() => supportsWebGL(), []);

  const fallback = (
    <Companion2DFallback
      animation={animation}
      sunBatteryLevel={sunBatteryLevel}
      compact={compact}
      onSelectCompanion={onSelectCompanion}
    />
  );

  if (prefer2D || !canWebGL) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <div
        className={`relative overflow-hidden rounded-storybook border border-espresso/10 bg-gradient-to-b from-[#FFFDF8] via-[#FBF3E2] to-[#ECE6D5] ${
          compact ? 'h-48' : 'h-64 sm:h-72'
        }`}
        aria-label="Leo and Maya 3D Interactive Stage"
      >
        <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-cocoa shadow-sm">
          <span className="hidden sm:inline">Drag to look around · </span>Tap Leo or Maya
        </div>
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-espresso shadow-sm border border-sunbeam/50">
          <span className="h-2.5 w-2.5 rounded-full bg-sunbeam" />
          Sun-Battery {sunBatteryLevel}%
        </div>

        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 1.45, 5.1], fov: 44 }}
          gl={{ antialias: true, powerPreference: 'low-power' }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 5, 4]} intensity={1.15} castShadow />
          <pointLight position={[0, 2.4, 0]} intensity={0.7} color="#E8C878" />

          {/* Storybook Mossy Island Pedestal */}
          <mesh position={[0, -0.08, 0]} receiveShadow>
            <cylinderGeometry args={[2.15, 2.35, 0.24, 36]} />
            <meshStandardMaterial color="#A5B49A" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[2.25, 2.1, 0.16, 36]} />
            <meshStandardMaterial color="#7A583E" roughness={0.9} />
          </mesh>

          <SunOrb level={sunBatteryLevel} />
          <LeoMesh animation={animation} onClick={() => onSelectCompanion?.('leo')} />
          <MayaMesh animation={animation} onClick={() => onSelectCompanion?.('maya')} />

          <ContactShadows
            position={[0, 0.05, 0]}
            opacity={0.35}
            scale={5}
            blur={2.2}
            far={2}
          />
          <OrbitControls
            target={[0, 0.95, 0]}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
