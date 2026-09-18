/**
 * PAHAD PAHAD - 3D Local Multiplayer Playground Tag Game
 * "Same Ground. Different Stories."
 */
import { useEffect, useRef, useState } from 'react';
import { GameEngine, DEFAULT_PLAYERS_CONFIG } from './game/GameEngine';
import { GameEventNotification, GamePhase, PahadData, PlayerConfig, PlayerEntity, PlayerId } from './types';
import { Minimap } from './components/Minimap';
import { PlayerStatusPanel } from './components/PlayerStatusPanel';
import { NotificationBanner } from './components/NotificationBanner';
import { HowToPlayModal } from './components/HowToPlayModal';
import { sound } from './audio/SoundSystem';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Users,
  Pause,
  Bot,
  User,
  Shield,
  Keyboard,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>(DEFAULT_PLAYERS_CONFIG);
  const [players, setPlayers] = useState<PlayerEntity[]>([]);
  const [pahads, setPahads] = useState<PahadData[]>([]);
  const [catcherId, setCatcherId] = useState<PlayerId>('p1');
  const [currentNotification, setCurrentNotification] = useState<GameEventNotification | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current, {
      onPhaseChange: (newPhase) => setPhase(newPhase),
      onPlayersUpdate: (updatedPlayers) => {
        setPlayers(updatedPlayers);
        if (engineRef.current) {
          setPahads([...engineRef.current.getPahads()]);
        }
      },
      onNotification: (notif) => {
        setCurrentNotification(notif);
        setTimeout(() => {
          setCurrentNotification((prev) => (prev?.id === notif.id ? null : prev));
        }, notif.duration);
      },
      onCatcherChange: (newCatcherId) => setCatcherId(newCatcherId),
    });

    engineRef.current = engine;

    // Hotkey handler for game controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        engine.restartMatch();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        setPhase((prev) => {
          const next = prev === 'PAUSED' ? 'PLAYING' : 'PAUSED';
          engine.setPhase(next);
          return next;
        });
      } else if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = (count: number) => {
    sound.playClick();
    setPlayerCount(count);
    if (engineRef.current) {
      engineRef.current.setupMatch(count, playerConfigs);
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePlayerAI = (playerId: PlayerId) => {
    sound.playClick();
    if (engineRef.current && phase !== 'MENU') {
      engineRef.current.toggleAI(playerId);
    } else {
      setPlayerConfigs((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, isAI: !p.isAI } : p))
      );
    }
  };

  const handleRestart = () => {
    sound.playClick();
    if (engineRef.current) {
      engineRef.current.restartMatch();
    }
  };

  const handlePauseResume = () => {
    sound.playClick();
    const nextPhase: GamePhase = phase === 'PAUSED' ? 'PLAYING' : 'PAUSED';
    setPhase(nextPhase);
    if (engineRef.current) {
      engineRef.current.setPhase(nextPhase);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D WebGL Canvas Layer */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Notifications (Ready, Run, Caught, Pahad Taken, New Catcher) */}
      <NotificationBanner notification={currentNotification} />

      {/* IN-GAME HUD (When not in Menu) */}
      {phase !== 'MENU' && (
        <>
          {/* Top Bar Header */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
            {/* Logo Badge & Quick Player Count Switcher */}
            <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-amber-500/40 shadow-xl">
                <span className="font-['Fredoka',sans-serif] font-black text-base tracking-wider text-amber-400">
                  PAHAD PAHAD
                </span>
              </div>

              {/* Quick Player Count Buttons (2, 3, 4, 5 Players) */}
              <div className="flex items-center bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1 gap-1 shadow-xl">
                {[2, 3, 4, 5].map((cnt) => {
                  const isActive = playerCount === cnt;
                  return (
                    <button
                      key={cnt}
                      id={`btn-player-count-${cnt}`}
                      onClick={() => {
                        if (playerCount !== cnt) {
                          handleStartGame(cnt);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black scale-105'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      title={`Play with ${cnt} Players (${cnt - 1} Pahad${cnt - 1 > 1 ? 's' : ''})`}
                    >
                      {cnt}P
                    </button>
                  );
                })}
              </div>

              {/* Utility Buttons */}
              <button
                id="btn-restart"
                onClick={handleRestart}
                title="Restart Match (R)"
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 shadow-xl transition-all active:scale-95"
              >
                <RotateCcw size={15} />
              </button>

              <button
                id="btn-pause"
                onClick={handlePauseResume}
                title="Pause / Resume (P)"
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 shadow-xl transition-all active:scale-95"
              >
                {phase === 'PAUSED' ? <Play size={15} /> : <Pause size={15} />}
              </button>

              <button
                id="btn-mute"
                onClick={handleToggleMute}
                title="Toggle Mute (M)"
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 shadow-xl transition-all active:scale-95"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                id="btn-how-to-play"
                onClick={() => setIsHowToPlayOpen(true)}
                title="How to Play & Rules"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-xl text-xs font-bold transition-all active:scale-95"
              >
                <HelpCircle size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <button
                id="btn-menu"
                onClick={() => setPhase('MENU')}
                title="Quit to Main Menu"
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 shadow-xl text-xs font-bold transition-all active:scale-95"
              >
                Menu
              </button>
            </div>

            {/* Top-Right Player Status Panel */}
            <div className="pointer-events-auto">
              <PlayerStatusPanel
                players={players}
                catcherId={catcherId}
                onToggleAI={handleTogglePlayerAI}
              />
            </div>
          </div>

          {/* Bottom-Right Minimap */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <Minimap players={players} pahads={pahads} catcherId={catcherId} />
          </div>

          {/* Bottom-Left Controls Drawer */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-sm">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-2xl text-xs text-slate-200">
              <div
                className="flex items-center justify-between cursor-pointer font-bold"
                onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              >
                <div className="flex items-center gap-2 text-cyan-300">
                  <Keyboard size={15} />
                  <span>Controls Cheatsheet</span>
                </div>
                <button className="text-slate-400 hover:text-white">
                  {isControlsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {isControlsExpanded && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span
                          className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[9px] text-white"
                          style={{ backgroundColor: p.hexColor }}
                        >
                          {p.badge}
                        </span>
                        {p.name} {p.isAI ? '(AI Bot)' : ''}
                      </span>
                      <span className="font-mono text-cyan-300 bg-slate-950/70 px-1.5 py-0.5 rounded">
                        {p.controlLabel}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                    <span>R = Restart</span>
                    <span>P / Esc = Pause</span>
                    <span>M = Audio</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Center Objective Pill */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-xs font-semibold text-slate-300 shadow-lg">
            <Shield size={14} className="text-emerald-400" />
            <span>Pahad tops are safe · Don't let the Catcher steal your empty Pahad!</span>
          </div>
        </>
      )}

      {/* PAUSE MODAL OVERLAY */}
      {phase === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-center">
            <h3 className="text-2xl font-black text-amber-400 font-['Fredoka',sans-serif] tracking-wide mb-1">
              MATCH PAUSED
            </h3>
            <p className="text-xs text-slate-400 mb-6">Take a breath before the chase continues!</p>

            <div className="space-y-3">
              <button
                onClick={handlePauseResume}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-black text-sm text-slate-950 shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={18} />
                RESUME MATCH
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                RESTART ROUND
              </button>

              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <HelpCircle size={16} />
                HOW TO PLAY
              </button>

              <button
                onClick={() => setPhase('MENU')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/50 text-red-400 font-bold text-xs border border-red-900/40 transition-colors"
              >
                QUIT TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN MENU OVERLAY (Initial Screen) */}
      {phase === 'MENU' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-slate-950/90 via-slate-900/85 to-slate-950/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl my-auto p-6 md:p-8 rounded-3xl bg-slate-900/95 border-2 border-amber-500/40 shadow-2xl text-center">
            {/* Game Logo & Slogan matching the Poster */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-2">
                Climb · Move · Survive
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 font-['Fredoka',sans-serif] drop-shadow-[0_4px_16px_rgba(245,158,11,0.4)]">
                PAHAD PAHAD
              </h1>
              <p className="mt-1 text-sm md:text-base font-extrabold text-slate-300 tracking-wide">
                “SAME GROUND. DIFFERENT STORIES.”
              </p>
            </div>

            {/* Select Player Count */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider mb-3">
                <Users size={16} />
                <span>CHOOSE NUMBER OF PLAYERS (2 - 5)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {[2, 3, 4, 5].map((count) => {
                  const isSelected = playerCount === count;
                  const pahadsNeeded = count - 1;
                  return (
                    <button
                      key={count}
                      onClick={() => {
                        sound.playClick();
                        setPlayerCount(count);
                      }}
                      className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg scale-105 border-2 border-amber-300'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                      }`}
                    >
                      <span className="text-lg font-black">{count} PLAYERS</span>
                      <span
                        className={`text-[10px] font-bold ${
                          isSelected ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {pahadsNeeded} {pahadsNeeded === 1 ? 'Pahad' : 'Pahads'} · 1 Catcher
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player Roster Preview & AI Bot Toggles */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
              <div className="flex items-center justify-between mb-3 text-xs font-extrabold text-slate-400 uppercase">
                <span>Player Controls & Control Mode</span>
                <span>Click icon to toggle Human / AI Bot</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {playerConfigs.slice(0, playerCount).map((cfg, idx) => (
                  <div
                    key={cfg.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black text-white shadow"
                        style={{ backgroundColor: cfg.hexColor }}
                      >
                        {cfg.badge}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{cfg.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{cfg.controlLabel}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePlayerAI(cfg.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        cfg.isAI
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cfg.isAI ? (
                        <>
                          <Bot size={13} className="text-amber-400" />
                          <span>AI</span>
                        </>
                      ) : (
                        <>
                          <User size={13} />
                          <span>Human</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="btn-start-match"
                onClick={() => handleStartGame(playerCount)}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-lg tracking-wider font-['Fredoka',sans-serif] shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={22} className="fill-slate-950" />
                START MATCH
              </button>

              <button
                id="btn-menu-how-to-play"
                onClick={() => setIsHowToPlayOpen(true)}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle size={18} className="text-amber-400" />
                HOW TO PLAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
    </div>
  );
}
