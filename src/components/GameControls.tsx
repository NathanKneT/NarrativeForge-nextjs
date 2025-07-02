'use client';

import React from 'react';
import {
  Save,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  FolderOpen,
} from 'lucide-react';

interface GameControlsProps {
  onSave: () => void;
  onLoad: () => void;
  onRestart: () => void;
  onSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onSave,
  onLoad,
  onRestart,
  onSettings,
  isMuted,
  onToggleMute,
}) => {
  const controls = [
    { icon: Save, label: 'Save Game', action: onSave },
    { icon: FolderOpen, label: 'Load Game', action: onLoad },
    { icon: RotateCcw, label: 'Restart', action: onRestart },
    { icon: Settings, label: 'Settings', action: onSettings },
    {
      icon: isMuted ? VolumeX : Volume2,
      label: isMuted ? 'Unmute' : 'Mute',
      action: onToggleMute,
    },
  ];

  return (
    <div className="mb-6 flex justify-center gap-2">
      {controls.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          className="rounded-lg bg-gray-700 p-3 
                   text-white transition-colors duration-200 hover:bg-blue-600
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
};