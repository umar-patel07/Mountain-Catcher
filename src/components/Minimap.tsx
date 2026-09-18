import React, { useEffect, useRef } from 'react';
import { PahadData, PlayerEntity, PlayerId } from '../types';

interface MinimapProps {
  players: PlayerEntity[];
  pahads: PahadData[];
  catcherId: PlayerId;
}

export const Minimap: React.FC<MinimapProps> = ({ players, pahads, catcherId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    // Map bounds are roughly [-20, 20], scale to fit within radar radius (e.g. radius = 90)
    const scale = (size * 0.42) / 20;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // 1. Radar background
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, size * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Radar subtle grid rings
    [0.15, 0.3, 0.45].forEach((factor) => {
      ctx.beginPath();
      ctx.arc(center, center, size * factor, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
    ctx.beginPath();
    ctx.moveTo(center, 12);
    ctx.lineTo(center, size - 12);
    ctx.moveTo(12, center);
    ctx.lineTo(size - 12, center);
    ctx.stroke();

    // 2. Render Pahads
    pahads.forEach((p) => {
      const px = center + p.x * scale;
      const pz = center + p.z * scale;
      const pRad = Math.max(8, p.radius * scale);

      // Earth brown base
      ctx.beginPath();
      ctx.arc(px, pz, pRad, 0, Math.PI * 2);
      ctx.fillStyle = '#8a5430';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#5a361e';
      ctx.stroke();

      // Green grass top
      ctx.beginPath();
      ctx.arc(px, pz, pRad * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = '#559b36';
      ctx.fill();

      // Pahad ID label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${p.id}`, px, pz);
    });

    // 3. Render Players
    players.forEach((player) => {
      const px = center + player.x * scale;
      const pz = center + player.z * scale;
      const isCatcher = player.id === catcherId;

      if (isCatcher) {
        // Catcher: Glowing Red Inverted Triangle with pulsing aura
        ctx.save();
        ctx.translate(px, pz);

        // Pulse ring
        const pulse = (Date.now() % 1000) / 1000;
        ctx.beginPath();
        ctx.arc(0, 0, 8 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - pulse * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Red triangle pointing forward
        ctx.rotate(player.rotation);
        ctx.beginPath();
        ctx.moveTo(0, 9);
        ctx.lineTo(-7, -7);
        ctx.lineTo(7, -7);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      } else {
        // Non-Catcher: Colored circle with border
        ctx.beginPath();
        ctx.arc(px, pz, 6, 0, Math.PI * 2);
        ctx.fillStyle = player.hexColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = player.state === 'ON_PAHAD' ? '#4ade80' : '#ffffff';
        ctx.stroke();

        // Direction pointer
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(player.rotation);
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-3, 4);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }, [players, pahads, catcherId]);

  return (
    <div id="radar-minimap" className="flex flex-col items-center select-none pointer-events-none">
      <div className="relative p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          className="rounded-full block"
        />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-extrabold tracking-widest text-slate-400">
          N
        </div>
      </div>
      <div className="mt-1 text-[11px] font-black tracking-wider text-slate-300 uppercase drop-shadow-md">
        MINIMAP
      </div>
    </div>
  );
};
