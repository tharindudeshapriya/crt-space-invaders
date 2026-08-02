'use client';

import React, { useState } from 'react';
import ArcadeGame from './ArcadeGame';
import { Volume2, VolumeX, Monitor, Power, Zap, HelpCircle, Shield, Radio } from 'lucide-react';
import { soundEngine } from '../lib/audio';

export default function CrtFrame() {
  const [isPowerOn, setIsPowerOn] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const togglePower = () => {
    setIsPowerOn(!isPowerOn);
  };

  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-full max-w-5xl px-1 sm:px-4 py-2 sm:py-6 flex flex-col items-center justify-center">
      {/* Outer CRT TV Cabinet Housing */}
      <div className="relative w-full bg-[#18171f] border-2 sm:border-4 border-[#2d2a3d] rounded-2xl sm:rounded-[38px] p-2.5 sm:p-6 md:p-10 crt-bezel-shadow flex flex-col items-center">
        
        {/* Top Cabinet Texture Vent Grills */}
        <div className="w-full flex justify-between items-center mb-2 sm:mb-4 px-2 opacity-75">
          <div className="hidden sm:flex space-x-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-6 sm:w-8 h-1.5 bg-[#0d0c12] rounded-full shadow-inner" />
            ))}
          </div>
          <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] text-[#00ff66]/80 font-mono tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 text-[#00ff66] animate-pulse" />
            <span>NTSC-US 60Hz RGB</span>
          </div>
          <div className="hidden sm:flex space-x-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-6 sm:w-8 h-1.5 bg-[#0d0c12] rounded-full shadow-inner" />
            ))}
          </div>
        </div>

        {/* Inner Curved CRT Screen Bezel */}
        <div className="relative w-full bg-[#0a0810] rounded-xl sm:rounded-[24px] p-1.5 sm:p-4 border-4 sm:border-8 border-[#12101b] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] overflow-hidden">
          {isPowerOn ? (
            <ArcadeGame />
          ) : (
            <div className="w-full aspect-[4/3] bg-[#020503] rounded-lg flex flex-col items-center justify-center text-center p-6 border border-[#00ff66]/10">
              <div className="w-16 h-1 bg-[#00ff66]/40 rounded-full animate-pulse mb-4" />
              <p className="text-sm text-[#00ff66]/60 font-retro tracking-wider">SYSTEM STANDBY</p>
              <p className="text-xs text-gray-500 font-mono mt-2">Press POWER button to turn on CRT display</p>
            </div>
          )}
        </div>

        {/* Bottom CRT Television Control Panel */}
        <div className="w-full mt-6 pt-4 border-t-2 border-[#2b273b] flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-6">
          
          {/* Brand Metallic Label */}
          <div className="flex items-center space-x-3">
            {/* Pulsing Power LED */}
            <div className={`w-3.5 h-3.5 rounded-full ${isPowerOn ? 'bg-[#00ff66] led-indicator' : 'bg-red-900'}`} />
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-widest bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow">
                CYBERTRON-80
              </div>
              <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">
                COLOR MATRIX CRT SYSTEM
              </div>
            </div>
          </div>

          {/* Physical TV Buttons & Knobs */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Power Toggle Button */}
            <button
              onClick={togglePower}
              title="Power Toggle"
              className={`p-2.5 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-retro ${
                isPowerOn
                  ? 'bg-gradient-to-b from-[#00ff66]/20 to-[#00ff66]/5 border-[#00ff66] text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : 'bg-stone-900 border-stone-700 text-stone-500'
              }`}
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline">POWER</span>
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              title="Toggle Audio Synth"
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center space-x-1.5 text-xs font-retro"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00f0ff]" />}
              <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO'}</span>
            </button>

            {/* Help / Controls Button */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              title="Game Instructions"
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-[#ffe600] hover:border-[#ffe600] transition-all flex items-center space-x-1.5 text-xs font-retro"
            >
              <HelpCircle className="w-4 h-4 text-[#ffe600]" />
              <span className="hidden sm:inline">GUIDE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Modal Drawer */}
      {showInstructions && (
        <div className="w-full mt-6 bg-[#12101b] border-2 border-[#00ff66]/40 rounded-2xl p-5 shadow-2xl text-left text-xs space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center border-b border-[#00ff66]/20 pb-3">
            <h3 className="text-sm font-bold text-[#00ff66] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#ffe600]" /> RETRO ARCADE PILOT MANUAL
            </h3>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-gray-400 hover:text-white font-mono text-sm px-2"
            >
              [X]
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
            <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-stone-800">
              <p className="text-[#00f0ff] font-bold">🕹️ FLIGHT CONTROLS</p>
              <ul className="space-y-1 font-mono text-[11px]">
                <li><strong className="text-white">W / A / S / D or ARROWS:</strong> Move Ship</li>
                <li><strong className="text-white">SPACEBAR:</strong> Fire Plasma Lasers</li>
                <li><strong className="text-white">P or ESC:</strong> Pause Game</li>
                <li><strong className="text-white">M:</strong> Toggle Audio Synth</li>
              </ul>
            </div>

            <div className="space-y-2 bg-black/40 p-3 rounded-lg border border-stone-800">
              <p className="text-[#ff007f] font-bold">⚡ POWER-UP DROPS</p>
              <ul className="space-y-1 font-mono text-[11px]">
                <li><strong className="text-[#00f0ff]">3X (Triple Laser):</strong> Spreads 3 plasma beams</li>
                <li><strong className="text-[#ff007f]">SH (Shield):</strong> Absorbs 2 enemy hits</li>
                <li><strong className="text-[#ffe600]">B (EMP Bomb):</strong> Clears all screen enemies</li>
                <li><strong className="text-[#00ff66]">+1 (Extra Ship):</strong> Restores 1 player life</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
