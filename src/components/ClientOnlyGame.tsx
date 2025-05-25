'use client';

import React, { useEffect, useState } from 'react';
import { StoryViewer } from '@/components/StoryViewer';
import { ProgressTracker } from '@/components/ProgressTracker';
import { GameControls } from '@/components/GameControls';
import { SaveLoadModal } from '@/components/SaveLoadModal';
import { Navigation } from '@/components/Navigation';
import { useGameStore } from '@/stores/gameStore';
import { StoryLoader } from '@/lib/storyLoader';
import { migrateStoryData } from '@/lib/storyMigration';
import { SaveData, StoryNode } from '@/types/story';

// Import du text.json par défaut
import defaultStoryData from '@/data/text.json';

interface TestStoryData {
  story: StoryNode[];
  startNodeId: string;
  metadata: {
    generatedAt: string;
    editorVersion: string;
    totalNodes: number;
    totalChoices: number;
  };
}

export function ClientOnlyGame() {
  const [storyLoader, setStoryLoader] = useState<StoryLoader | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testStoryInfo, setTestStoryInfo] = useState<TestStoryData['metadata'] | null>(null);
  
  const {
    gameState,
    currentNode,
    initializeGame,
    makeChoice,
    saveGame,
    loadGame,
    restartGame,
    setCurrentNode,
    setError,
  } = useGameStore();

  // S'assurer qu'on est côté client
  useEffect(() => {
    setIsClient(true);
    setHasHydrated(true);
  }, []);

  // Détecter et charger une histoire de test depuis l'URL
  useEffect(() => {
    if (!hasHydrated || !isClient) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isTest = urlParams.get('test') === 'true';
    const storyParam = urlParams.get('story');

    if (isTest && storyParam) {
      try {
        console.log('🧪 Mode test détecté, chargement de l\'histoire...');
        
        const testStoryData: TestStoryData = JSON.parse(decodeURIComponent(storyParam));
        
        // Validation de base des données de test
        if (!testStoryData.story || !Array.isArray(testStoryData.story)) {
          throw new Error('Format d\'histoire de test invalide');
        }

        if (!testStoryData.startNodeId) {
          throw new Error('Nœud de départ manquant dans l\'histoire de test');
        }

        console.log('✅ Histoire de test validée:', {
          nodes: testStoryData.story.length,
          startNode: testStoryData.startNodeId,
          metadata: testStoryData.metadata
        });

        const loader = new StoryLoader(testStoryData.story);
        setStoryLoader(loader);
        setIsTestMode(true);
        setTestStoryInfo(testStoryData.metadata);

        // Initialiser le jeu avec l'histoire de test
        initializeGame(testStoryData.startNodeId);

        // Nettoyer l'URL pour éviter la pollution
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('test');
        newUrl.searchParams.delete('story');
        window.history.replaceState({}, '', newUrl.toString());

        return; // Sortir early pour éviter le chargement de l'histoire par défaut

      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'histoire de test:', error);
        setError('Impossible de charger l\'histoire de test');
        // Continuer avec l'histoire par défaut en cas d'erreur
      }
    }

    // Chargement de l'histoire par défaut
    loadDefaultStory();
  }, [hasHydrated, isClient, initializeGame, setError]);

  // Fonction pour charger l'histoire par défaut
  const loadDefaultStory = () => {
    try {
      console.log('🔄 Chargement de l\'histoire par défaut...');
      
      // Migrer les anciennes données vers le nouveau format
      const migratedData = migrateStoryData(defaultStoryData);
      const loader = new StoryLoader(migratedData);
      
      // Valider l'intégrité de l'histoire
      const validation = loader.validateStory();
      if (!validation.isValid) {
        console.warn('Avertissements de validation de l\'histoire:', validation.errors);
      }
      
      setStoryLoader(loader);
      setIsTestMode(false);
      setTestStoryInfo(null);
      
      // Initialiser le jeu si pas encore fait
      if (!gameState) {
        const startNodeId = loader.getStartNodeId();
        console.log('🚀 Initialisation avec le nœud:', startNodeId);
        initializeGame(startNodeId);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'histoire par défaut:', error);
      setError('Impossible de charger l\'histoire');
    }
  };

  // Charger le nœud actuel
  useEffect(() => {
    if (storyLoader && gameState && hasHydrated && isClient) {
      const node = storyLoader.getNode(gameState.currentNodeId);
      if (node) {
        console.log('📖 Chargement du nœud:', node.id, node.title);
        setCurrentNode(node);
      } else {
        console.error('❌ Nœud introuvable:', gameState.currentNodeId);
        setError(`Nœud introuvable: ${gameState.currentNodeId}`);
      }
    }
  }, [storyLoader, gameState, setCurrentNode, hasHydrated, isClient, setError]);

  // Gestionnaire de choix avec gestion du redémarrage
  const handleChoiceSelect = (choiceId: string) => {
    if (!storyLoader || !gameState) return;

    console.log('🎮 Choix sélectionné:', choiceId);
    const nextNode = storyLoader.getNextNode(gameState.currentNodeId, choiceId);
    
    if (nextNode) {
      // Navigation normale
      makeChoice(choiceId, nextNode.id);
    } else {
      // Vérifier si c'est un redémarrage
      const currentNode = storyLoader.getNode(gameState.currentNodeId);
      const choice = currentNode?.choices.find(c => c.id === choiceId);
      
      if (choice && choice.nextNodeId === '-1') {
        console.log('🔄 Redémarrage de l\'histoire...');
        handleRestart();
      } else {
        console.error('❌ Impossible de naviguer vers le nœud suivant');
        setError('Navigation impossible - nœud de destination introuvable');
      }
    }
  };

  // Gestionnaires de contrôles
  const handleSave = () => {
    if (isTestMode) {
      alert('La sauvegarde n\'est pas disponible en mode test. Retournez à l\'éditeur pour sauvegarder votre projet.');
      return;
    }
    setSaveModalOpen(true);
  };

  const handleLoad = () => {
    if (isTestMode) {
      const shouldContinue = confirm(
        'Vous êtes en mode test. Charger une sauvegarde quittera ce mode et retournera à l\'histoire principale. Continuer ?'
      );
      if (!shouldContinue) return;
      
      // Quitter le mode test et recharger l'histoire par défaut
      setIsTestMode(false);
      setTestStoryInfo(null);
      loadDefaultStory();
    }
    setLoadModalOpen(true);
  };

  const handleSaveConfirm = async (saveName: string) => {
    try {
      await saveGame(saveName);
      setSaveModalOpen(false);
      
      // Notification améliorée
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Partie sauvegardée', {
          body: `Sauvegarde "${saveName}" créée avec succès`,
          icon: '/favicon.ico'
        });
      } else {
        alert('Partie sauvegardée !');
      }
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleLoadConfirm = (saveData: SaveData) => {
    try {
      loadGame(saveData);
      setLoadModalOpen(false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Partie chargée', {
          body: `Sauvegarde "${saveData.name}" chargée`,
          icon: '/favicon.ico'
        });
      } else {
        alert('Partie chargée !');
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      alert('Erreur lors du chargement');
    }
  };

  const handleRestart = () => {
    const confirmMessage = isTestMode 
      ? 'Redémarrer l\'histoire de test ?'
      : 'Redémarrer l\'histoire ?';
      
    if (!confirm(confirmMessage)) return;
    
    console.log('🔄 Redémarrage demandé');
    restartGame();
    
    if (storyLoader) {
      const startNodeId = storyLoader.getStartNodeId();
      console.log('🚀 Redémarrage vers le nœud:', startNodeId);
      initializeGame(startNodeId);
    }
  };

  const handleSettings = () => {
    const options = [
      'Paramètres audio',
      'Paramètres d\'affichage', 
      'Réinitialiser les données',
      'À propos'
    ];
    
    const choice = prompt(
      'Paramètres disponibles :\n' + 
      options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') +
      '\n\nEntrez le numéro de votre choix :'
    );
    
    const optionIndex = parseInt(choice || '') - 1;
    
    switch (optionIndex) {
      case 0:
        setIsMuted(!isMuted);
        alert(`Audio ${isMuted ? 'activé' : 'désactivé'}`);
        break;
      case 1:
        alert('Paramètres d\'affichage à implémenter');
        break;
      case 2:
        if (confirm('Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.')) {
          localStorage.clear();
          window.location.reload();
        }
        break;
      case 3:
        alert(`Asylum Interactive Story\nVersion 1.0.0\n\n${isTestMode ? 'Mode Test Actif' : 'Mode Normal'}\n\nDéveloppé avec Next.js, React Flow et TypeScript`);
        break;
      default:
        break;
    }
  };

  // Affichage pendant l'hydration et le chargement initial
  if (!isClient || !hasHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!currentNode || !storyLoader) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {isTestMode ? 'Initialisation de l\'histoire de test...' : 'Initialisation de l\'histoire...'}
          </div>
          {gameState && (
            <div className="text-sm text-gray-400">
              Nœud actuel: {gameState.currentNodeId}
            </div>
          )}
          {testStoryInfo && (
            <div className="text-sm text-blue-400 mt-2">
              🧪 Test: {testStoryInfo.totalNodes} nœuds, {testStoryInfo.totalChoices} choix
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalNodes = storyLoader.getAllNodes().length;
  const visitedNodes = gameState?.visitedNodes.size || 0;
  const currentProgress = visitedNodes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Asylum {isTestMode && <span className="text-sm text-blue-400">🧪 MODE TEST</span>}
          </h1>
          <p className="text-gray-300">Histoire Interactive</p>
          
          {/* Info de test */}
          {isTestMode && testStoryInfo && (
            <div className="mt-4 p-3 bg-blue-900/50 border border-blue-500/50 rounded-lg max-w-md mx-auto">
              <div className="text-sm text-blue-200">
                <div className="font-medium mb-1">🧪 Histoire de Test</div>
                <div className="text-xs space-y-1">
                  <div>Générée: {new Date(testStoryInfo.generatedAt).toLocaleString()}</div>
                  <div>Éditeur v{testStoryInfo.editorVersion}</div>
                  <div>{testStoryInfo.totalNodes} nœuds • {testStoryInfo.totalChoices} choix</div>
                </div>
              </div>
            </div>
          )}
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

          {/* Modales de sauvegarde/chargement */}
          <SaveLoadModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            mode="save"
            onSave={handleSaveConfirm}
            onLoad={() => {}} // Non utilisé en mode save
            currentProgress={visitedNodes}
          />

          <SaveLoadModal
            isOpen={loadModalOpen}
            onClose={() => setLoadModalOpen(false)}
            mode="load"
            onSave={() => {}} // Non utilisé en mode load
            onLoad={handleLoadConfirm}
          />

          {/* Debug info en dev */}
          {isClient && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-800 text-white text-sm rounded">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>Mode: {isTestMode ? 'Test' : 'Normal'}</p>
                  <p>Nœud actuel: {currentNode.id}</p>
                  <p>Nœuds visités: {visitedNodes}</p>
                  <p>Total nœuds: {totalNodes}</p>
                </div>
                <div>
                  <p>Choix disponibles: {currentNode.choices.length}</p>
                  <p>Nœud de départ: {storyLoader.getStartNodeId()}</p>
                  <p>Hydraté: {hasHydrated ? 'Oui' : 'Non'}</p>
                  <p>Client: {isClient ? 'Oui' : 'Non'}</p>
                </div>
              </div>
              {testStoryInfo && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <p className="text-blue-400">Test Info:</p>
                  <p className="text-xs">Généré: {testStoryInfo.generatedAt}</p>
                  <p className="text-xs">Version: {testStoryInfo.editorVersion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}