import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { SkinViewer, WalkingAnimation, WaveAnimation, PlayerAnimation } from 'skinview3d';

export type AnimationType = 'walk' | 'run' | 'wave' | 'idle';

interface Skin3DViewerProps {
  skinUrl?: string | null;
  className?: string;
}

/**
 * Calm, smooth running animation (+30% speed boost).
 */
class CalmRunAnimation extends PlayerAnimation {
  animate(player: any) {
    const t = this.progress * 9.5 + Math.PI * 0.5;

    // Smooth leg swing
    player.skin.leftLeg.rotation.x = Math.cos(t + Math.PI) * 0.8;
    player.skin.rightLeg.rotation.x = Math.cos(t) * 0.8;

    // Natural arm swing
    player.skin.leftArm.rotation.x = Math.cos(t) * 0.9;
    player.skin.rightArm.rotation.x = Math.cos(t + Math.PI) * 0.9;

    const basicArmRotationZ = Math.PI * 0.05;
    player.skin.leftArm.rotation.z = Math.cos(t) * 0.05 + basicArmRotationZ;
    player.skin.rightArm.rotation.z = Math.cos(t + Math.PI) * 0.05 - basicArmRotationZ;

    // Gentle bounce
    player.position.y = Math.cos(t * 2) * 0.25;
    player.position.x = Math.cos(t) * 0.04;
    player.rotation.z = Math.cos(t + Math.PI) * 0.005;

    // Cape dynamics
    if (player.cape) {
      const basicCapeRotationX = Math.PI * 0.22;
      player.cape.rotation.x = Math.sin(t * 2) * 0.08 + basicCapeRotationX;
    }
  }
}

/**
 * High-Performance Official 3D Minecraft WebGL Skin Viewer powered by skinview3d (Three.js)
 */
export const Skin3DViewer: React.FC<Skin3DViewerProps> = ({ skinUrl, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const animRef = useRef<any>(null);

  const [animType, setAnimType] = useState<AnimationType>('walk');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Initialize WebGL SkinViewer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = new SkinViewer({
      canvas,
      width: 320,
      height: 280,
      skin: skinUrl || undefined,
    });

    // Front perspective camera matching Blockbench view
    const initialDistance = 48;
    const initialAngle = 0.15; // ~8.5 degrees gentle angle
    viewer.camera.position.set(
      Math.sin(initialAngle) * initialDistance,
      1,
      Math.cos(initialAngle) * initialDistance
    );
    viewer.camera.lookAt(0, 0, 0);
    viewer.fov = 70;
    viewer.autoRotate = false;
    viewer.controls.enableRotate = true;
    viewer.controls.enableZoom = true;
    viewer.controls.enablePan = true;
    viewer.controls.screenSpacePanning = true;
    viewer.controls.mouseButtons = {
      LEFT: 0, // Rotate
      MIDDLE: 1, // Dolly / Zoom
      RIGHT: 2, // Pan up / down / sideways
    };

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // Update skin texture when skinUrl changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (skinUrl) {
      viewer.loadSkin(skinUrl).catch(() => {});
    } else {
      viewer.resetSkin();
    }
  }, [skinUrl]);

  // Create or switch animation type with clean reset on transition
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Reset joints and player position to default clean base
    try {
      viewer.playerObject.skin.resetJoints();
      viewer.playerObject.position.set(0, 0, 0);
      viewer.playerObject.rotation.set(0, 0, 0);
    } catch {}

    let animation: any = null;
    switch (animType) {
      case 'walk':
        animation = new WalkingAnimation();
        animation.speed = 0.42;
        break;
      case 'run':
        animation = new CalmRunAnimation();
        animation.speed = 0.72;
        break;
      case 'wave':
        animation = new WaveAnimation();
        animation.speed = 0.62;
        break;
      case 'idle':
        // Completely motionless static standing pose to inspect the skin around
        animation = null;
        break;
    }

    if (animation) {
      animation.paused = !isPlaying;
    }

    viewer.animation = animation;
    animRef.current = animation;
  }, [animType]);

  // Toggle pause without resetting model pose or reverting to T-pose
  useEffect(() => {
    if (animRef.current) {
      animRef.current.paused = !isPlaying;
    }
  }, [isPlaying]);

  const handleResetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const initialDistance = 48;
    const initialAngle = 0.15;
    viewer.camera.position.set(
      Math.sin(initialAngle) * initialDistance,
      1,
      Math.cos(initialAngle) * initialDistance
    );
    viewer.camera.lookAt(0, 0, 0);
    viewer.controls.reset();
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D WebGL Canvas Stage */}
      <div className="relative w-full h-[250px] rounded-2xl bg-[#090b10] border border-[#1b1f2e] overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center shadow-inner group">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {/* Ambient floor glow */}
        <div className="absolute bottom-2 w-36 h-6 bg-cyan-500/10 rounded-full blur-md pointer-events-none" />

        {/* Reset Camera Button */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Сбросить угол обзора"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#141824]/80 hover:bg-[#20273a] text-[#8b92a5] hover:text-white border border-[#252c40] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Animation Controls Ribbon */}
      <div className="w-full mt-3 flex items-center justify-between gap-1.5 p-1 rounded-xl bg-[#10121a] border border-[#1f2332]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-[#181c28] hover:bg-[#242b3e] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Animation Mode Selectors */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {(
            [
              { id: 'walk', label: 'Ходьба' },
              { id: 'run', label: 'Бег' },
              { id: 'wave', label: 'Приветствие' },
              { id: 'idle', label: 'Стойка' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setAnimType(mode.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                animType === mode.id
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-[#7d869e] hover:text-[#e2e8f0] hover:bg-[#161924]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
