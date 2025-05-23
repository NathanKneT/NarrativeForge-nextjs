'use client';

import React from 'react';
import { Save, RotateCcw, Settings, Volume2, VolumeX, FolderOpen } from 'lucide-react';

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
    { icon: Save, label: 'Sauvegarder', action: onSave },
    { icon: FolderOpen, label: 'Charger', action: onLoad }, // Maintenant utilisé
    { icon: RotateCcw, label: 'Recommencer', action: onRestart },
    { icon: Settings, label: 'Paramètres', action: onSettings },
    { 
      icon: isMuted ? VolumeX : Volume2, 
      label: isMuted ? 'Activer le son' : 'Couper le son', 
      action: onToggleMute 
    },
  ];

  return (
    <div className="flex gap-2 justify-center mb-6">
      {controls.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          className="p-3 bg-asylum-medium hover:bg-asylum-accent 
                   text-white rounded-lg transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-asylum-accent"
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
};