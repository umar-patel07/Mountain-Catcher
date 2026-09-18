import React from 'react';
import { GameEventNotification } from '../types';
import { ShieldAlert, Trophy, Flame, Flag, ShieldCheck } from 'lucide-react';

interface NotificationBannerProps {
  notification: GameEventNotification | null;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification }) => {
  if (!notification) return null;

  const getStyle = () => {
    switch (notification.type) {
      case 'PAHAD_TAKEN':
        return {
          bg: 'from-amber-600/90 via-red-600/90 to-amber-700/90 border-amber-300',
          textColor: 'text-amber-100',
          icon: <ShieldAlert className="w-8 h-8 text-amber-200 animate-bounce" />,
        };
      case 'CAUGHT':
        return {
          bg: 'from-red-600/90 via-rose-700/90 to-red-800/90 border-red-300',
          textColor: 'text-rose-100',
          icon: <Flame className="w-8 h-8 text-rose-200 animate-bounce" />,
        };
      case 'NEW_CATCHER':
        return {
          bg: 'from-red-700/90 via-red-800/90 to-zinc-900/90 border-red-400',
          textColor: 'text-red-100',
          icon: <Flag className="w-8 h-8 text-red-200 animate-pulse" />,
        };
      case 'SAFE':
        return {
          bg: 'from-emerald-600/90 via-teal-700/90 to-emerald-800/90 border-emerald-300',
          textColor: 'text-emerald-100',
          icon: <ShieldCheck className="w-8 h-8 text-emerald-200" />,
        };
      case 'RUN':
        return {
          bg: 'from-blue-600/90 via-indigo-600/90 to-sky-600/90 border-blue-300',
          textColor: 'text-blue-100',
          icon: <Trophy className="w-8 h-8 text-yellow-300 animate-spin" />,
        };
      case 'READY':
      default:
        return {
          bg: 'from-slate-800/90 via-cyan-900/90 to-slate-900/90 border-cyan-400',
          textColor: 'text-cyan-100',
          icon: <Flag className="w-8 h-8 text-cyan-300" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      id="game-event-banner"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none transition-all duration-300 animate-in fade-in zoom-in-95"
    >
      <div
        className={`flex items-center gap-4 px-8 py-3.5 rounded-2xl bg-gradient-to-r ${style.bg} border-2 shadow-2xl backdrop-blur-md`}
      >
        {style.icon}
        <div className="flex flex-col">
          <span className="text-2xl md:text-3xl font-black tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-['Fredoka',sans-serif]">
            {notification.title}
          </span>
          {notification.subtitle && (
            <span className={`text-xs md:text-sm font-bold ${style.textColor} drop-shadow`}>
              {notification.subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
