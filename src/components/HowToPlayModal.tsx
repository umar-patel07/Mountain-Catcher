import React from 'react';
import { X, Mountain, Footprints, AlertTriangle, ShieldCheck, Repeat, Play, Volume2, RotateCcw } from 'lucide-react';
import { DEFAULT_PLAYERS_CONFIG } from '../game/GameEngine';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: '1. STAY ON PAHAD',
      desc: 'All non-catcher players start on their own raised brown pahads. As long as you stand on your pahad, you are completely safe!',
      icon: <Mountain className="w-8 h-8 text-amber-400" />,
      tag: 'SAFE ZONE',
      tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      num: 2,
      title: '2. MOVE FREELY',
      desc: 'Players can move around their current pahad, jump down, run across the playground, and climb onto any other pahad anytime.',
      icon: <Footprints className="w-8 h-8 text-sky-400" />,
      tag: 'EXCHANGE',
      tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    },
    {
      num: 3,
      title: '3. GETTING OFF IS RISKY',
      desc: 'If you leave your pahad and run on the ground, the Catcher can chase and tag you! Getting tagged makes you the new Catcher.',
      icon: <AlertTriangle className="w-8 h-8 text-rose-400" />,
      tag: 'GROUND DANGER',
      tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    {
      num: 4,
      title: '4. PAHAD SNATCH',
      desc: "If you leave your pahad and the Catcher climbs onto it before you return or reach another pahad, your pahad is TAKEN and you're OUT!",
      icon: <ShieldCheck className="w-8 h-8 text-amber-500" />,
      tag: 'SPECIAL MECHANIC',
      tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      num: 5,
      title: '5. ROLE SWITCH',
      desc: 'The caught or displaced player becomes the new Catcher on the ground. The previous Catcher climbs safely onto a pahad. Game continues endlessly!',
      icon: <Repeat className="w-8 h-8 text-purple-400" />,
      tag: 'CYCLE',
      tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div
      id="how-to-play-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl my-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wide font-['Fredoka',sans-serif] text-amber-400">
                HOW TO PLAY PAHAD PAHAD
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                Climb · Move · Survive — "Same Ground. Different Stories."
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 5 Core Gameplay Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mb-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 transition-all hover:bg-slate-800/90 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-900/80">{step.icon}</div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${step.tagColor}`}
                  >
                    {step.tag}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-100 mb-1.5 font-['Fredoka',sans-serif]">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Grid & Quick Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
          {/* Controls Table */}
          <div className="lg:col-span-7 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🎮</span> Controls (Simultaneous Keyboard Play)
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="font-black text-slate-400 text-[11px] pb-1 border-b border-slate-800">Player</div>
              <div className="font-black text-slate-400 text-[11px] pb-1 border-b border-slate-800">Forward</div>
              <div className="font-black text-slate-400 text-[11px] pb-1 border-b border-slate-800">Backward</div>
              <div className="font-black text-slate-400 text-[11px] pb-1 border-b border-slate-800">Left</div>
              <div className="font-black text-slate-400 text-[11px] pb-1 border-b border-slate-800">Right</div>

              {DEFAULT_PLAYERS_CONFIG.map((p) => (
                <React.Fragment key={p.id}>
                  <div className="flex items-center justify-center gap-1.5 py-1.5 font-bold">
                    <span
                      className="w-4 h-4 rounded text-[10px] flex items-center justify-center text-white"
                      style={{ backgroundColor: p.hexColor }}
                    >
                      {p.badge}
                    </span>
                    <span className="text-slate-200">{p.name}</span>
                  </div>
                  <div className="py-1.5 font-mono text-cyan-300 bg-slate-900/60 rounded m-0.5">
                    {p.controls.forward.replace('Key', '').replace('Arrow', '↑').replace('Numpad', 'Num ')}
                  </div>
                  <div className="py-1.5 font-mono text-cyan-300 bg-slate-900/60 rounded m-0.5">
                    {p.controls.backward.replace('Key', '').replace('Arrow', '↓').replace('Numpad', 'Num ')}
                  </div>
                  <div className="py-1.5 font-mono text-cyan-300 bg-slate-900/60 rounded m-0.5">
                    {p.controls.left.replace('Key', '').replace('Arrow', '←').replace('Numpad', 'Num ')}
                  </div>
                  <div className="py-1.5 font-mono text-cyan-300 bg-slate-900/60 rounded m-0.5">
                    {p.controls.right.replace('Key', '').replace('Arrow', '→').replace('Numpad', 'Num ')}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              * Any player can also be toggled to <span className="text-amber-400 font-bold">AI Bot</span> using the robot icon on the status panel!
            </p>
          </div>

          {/* Quick Keys & Game Rules */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span>📋</span> Game Rules & Hotkeys
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>1 Catcher on ground, all others on individual Pahads.</li>
                <li>Pahads are safe zones — Catcher cannot tag you on top.</li>
                <li>Exchange pahads anytime to tease or evade the Catcher.</li>
                <li>If the Catcher snatches your empty pahad, you become Catcher!</li>
                <li>No match timer — continuous playground fun until you stop.</li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><RotateCcw size={14} className="text-cyan-400"/> R = Restart</span>
              <span className="flex items-center gap-1.5"><Play size={14} className="text-amber-400"/> P = Pause</span>
              <span className="flex items-center gap-1.5"><Volume2 size={14} className="text-emerald-400"/> M = Mute Audio</span>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wide shadow-lg transition-transform active:scale-95"
          >
            GOT IT, LET'S PLAY!
          </button>
        </div>
      </div>
    </div>
  );
};
