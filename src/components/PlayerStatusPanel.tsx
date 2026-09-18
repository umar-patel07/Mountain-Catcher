import React from 'react';
import { PlayerEntity, PlayerId } from '../types';
import { Bot, User } from 'lucide-react';

interface PlayerStatusPanelProps {
  players: PlayerEntity[];
  catcherId: PlayerId;
  onToggleAI: (id: PlayerId) => void;
}

export const PlayerStatusPanel: React.FC<PlayerStatusPanelProps> = ({
  players,
  catcherId,
  onToggleAI,
}) => {
  return (
    <div
      id="player-status-panel"
      className="bg-slate-900/85 backdrop-blur-md border border-cyan-800/40 rounded-xl p-3.5 shadow-2xl min-w-[240px] text-white select-none"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2.5">
        <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase">
          PLAYER STATUS
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">
          {players.length} Players
        </span>
      </div>

      <div className="space-y-1.5">
        {players.map((p) => {
          const isCatcher = p.id === catcherId;
          const isOnPahad = p.state === 'ON_PAHAD';

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isCatcher
                  ? 'bg-red-950/60 border border-red-500/40 shadow-inner'
                  : 'bg-slate-800/60 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              {/* Badge & Name */}
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] text-white shadow"
                  style={{ backgroundColor: isCatcher ? '#dc2626' : p.hexColor }}
                >
                  {isCatcher ? 'C' : p.badge}
                </span>
                <span className="font-bold text-slate-100">{p.name}</span>

                {/* AI / Human toggle icon button */}
                <button
                  onClick={() => onToggleAI(p.id)}
                  title={p.isAI ? 'Controlled by AI (Click to make Human)' : `Human Controls: ${p.controlLabel} (Click for AI)`}
                  className="p-0.5 ml-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {p.isAI ? <Bot size={13} className="text-amber-400" /> : <User size={13} />}
                </button>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-1.5">
                {isCatcher ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-600 text-white animate-pulse">
                    Catcher
                  </span>
                ) : isOnPahad ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    On Pahad
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    On Ground
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Catcher cannot tag on Pahad</span>
        <span className="text-emerald-400 font-bold">Pahad = Safe</span>
      </div>
    </div>
  );
};
