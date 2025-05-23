'use client';

import React, { useEffect, useState } from 'react';
import { StoryViewer } from '@/components/StoryViewer';
import { ProgressTracker } from '@/components/ProgressTracker';
import { GameControls } from '@/components/GameControls';
import { useGameStore } from '@/stores/gameStore';
import { StoryLoader } from '@/lib/storyLoader';
import { migrateStoryData } from '@/lib/storyMigration';

// Import du text.json
import oldStoryData from '@/data/text.json';

export default function HomePage() {
  const [storyLoader, setStoryLoader] = useState<StoryLoader | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isClient, setIsClient] = useState(false); // 🔧 Fix hydration
  
  const {
    gameState,
    currentNode,
    initializeGame,
    makeChoice,
    saveGame,
    restartGame,
    setCurrentNode,
    setError,
  } = useGameStore();

  // 🔧 Fix hydration - s'assurer qu'on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialisation de l'histoire
  useEffect(() => {
    if (!isClient) return; // 🔧 Attendre le côté client

    try {
      // Migrer les anciennes données vers le nouveau format
      const migratedData = migrateStoryData(oldStoryData);
      const loader = new StoryLoader(migratedData);
      
      // Valider l'intégrité de l'histoire
      const validation = loader.validateStory();
      if (!validation.isValid) {
        console.warn('Story validation warnings:', validation.errors);
      }
      
      setStoryLoader(loader);
      
      // Initialiser le jeu si pas encore fait
      if (!gameState) {
        // Trouver le noeud de départ (ID le plus petit)
        const startNode = migratedData.find(node => node.id === '203') || migratedData[0];
        initializeGame(startNode.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'histoire:', error);
      setError('Impossible de charger l\'histoire');
    }
  }, [isClient, gameState, initializeGame, setError]);

  // Charger le noeud actuel
  useEffect(() => {
    if (storyLoader && gameState && isClient) {
      const node = storyLoader.getNode(gameState.currentNodeId);
      if (node) {
        setCurrentNode(node);
      }
    }
  }, [storyLoader, gameState, setCurrentNode, isClient]);

  // Gestionnaire de choix
  const handleChoiceSelect = (choiceId: string) => {
    if (!storyLoader || !gameState) return;

    const nextNode = storyLoader.getNextNode(gameState.currentNodeId, choiceId);
    if (nextNode) {
      makeChoice(choiceId, nextNode.id);
    }
  };

  // Gestionnaires de contrôles
  const handleSave = () => {
    const saveName = prompt('Nom de la sauvegarde:');
    if (saveName) {
      saveGame(saveName);
      alert('Partie sauvegardée !');
    }
  };

  const handleLoad = () => {
    alert('Fonction de chargement à implémenter');
  };

  const handleRestart = () => {
    if (confirm('Êtes-vous sûr de vouloir recommencer ?')) {
      restartGame();
      if (storyLoader) {
        const startNode = storyLoader.getNode('203') || storyLoader.getAllNodes()[0];
        initializeGame(startNode.id);
      }
    }
  };

  const handleSettings = () => {
    alert('Paramètres à implémenter');
  };

  // 🔧 Affichage de chargement pendant l'hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-asylum-dark flex items-center justify-center">
        <div className="text-white text-xl">Initialisation...</div>
      </div>
    );
  }

  if (!currentNode || !storyLoader) {
    return (
      <div className="min-h-screen bg-asylum-dark flex items-center justify-center">
        <div className="text-white text-xl">Chargement de lhistoire...</div>
      </div>
    );
  }

  const totalNodes = storyLoader.getAllNodes().length;
  const visitedNodes = gameState?.visitedNodes.size || 0;
  const currentProgress = visitedNodes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-asylum-dark via-asylum-medium to-asylum-light">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Asylum
          </h1>
          <p className="text-gray-300">Histoire Interactive</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <ProgressTracker
            currentProgress={currentProgress}
            totalNodes={totalNodes}
            visitedNodes={visitedNodes}
          />

          <GameControls
            onSave={handleSave}
            onLoad={handleLoad}
            onRestart={handleRestart}
            onSettings={handleSettings}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />

          <StoryViewer
            node={currentNode}
            onChoiceSelect={handleChoiceSelect}
          />
        </div>
      </div>
    </div>
  );
}