'use client';

import CrtFrame from './components/CrtFrame';
import { Gamepad2, Sparkles, Trophy, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#06050a] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden">

      {/* Retro Arcade Ambient Neon Backlight Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#00ff66]/15 via-[#ff007f]/10 to-[#00f0ff]/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Header Banner */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-b border-[#00ff66]/20 relative z-10 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#00ff66]/10 border border-[#00ff66]/30 rounded-lg text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.3)]">
            <Gamepad2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-glow-green tracking-wider text-[#00ff66]">
              RETRO CRT ARCADE 1984
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">
              CANVAS 2D • WEB AUDIO SYNTH • NEXT.JS 16
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-gray-300">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-stone-900/80 border border-stone-800 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-[#ffe600]" />
            <span className="text-[#ffe600]">HIGH SCORES PERSISTED</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-stone-900/80 border border-stone-800 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#00f0ff]">60 FPS CRT GLOW</span>
          </div>
        </div>
      </header>

      {/* CRT Television Arcade Display Unit */}
      <section className="w-full flex-1 flex items-center justify-center relative z-10 my-2">
        <CrtFrame />
      </section>

      {/* Footer info */}
      <footer className="w-full max-w-5xl py-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-gray-500 relative z-10 mt-4 gap-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-[#00ff66]" />
          <span>CYBERTRON ARCADE LABS © 1984-2026</span>
        </div>
        <p className="text-stone-400">
          Use <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] text-[#00ff66]">WASD</kbd> or <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] text-[#00ff66]">ARROWS</kbd> to move, <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] text-[#ffe600]">SPACE</kbd> to shoot!
        </p>
      </footer>
    </main>
  );
}
