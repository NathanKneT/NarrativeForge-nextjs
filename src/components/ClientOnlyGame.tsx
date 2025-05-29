'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const [testStoryInfo, setTestStoryInfo] = useState<
    TestStoryData['metadata'] | null
  >(null);

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
    clearCorruptedState,
  } = useGameStore();

  // S'assurer qu'on est côté client
  useEffect(() => {
    setIsClient(true);
    setHasHydrated(true);
  }, []);

  // ✅ FIX: Fonction pour vérifier si l'état du jeu est compatible avec l'histoire
  const isGameStateValid = useCallback(
    (gameState: any, storyLoader: StoryLoader | null): boolean => {
      if (!gameState || !storyLoader) return false;

      // Vérifier que le nœud actuel existe dans l'histoire
      const currentNodeExists = storyLoader.getNode(gameState.currentNodeId);
      if (!currentNodeExists) {
        console.warn(
          "⚠️ Nœud actuel introuvable dans l'histoire:",
          gameState.currentNodeId
        );
        return false;
      }

      // Vérifier que tous les nœuds visités existent
      if (gameState.visitedNodes) {
        for (const nodeId of gameState.visitedNodes) {
          if (!storyLoader.getNode(nodeId)) {
            console.warn('⚠️ Nœud visité introuvable:', nodeId);
            return false;
          }
        }
      }

      return true;
    },
    []
  );

  // Détecter et charger une histoire de test depuis l'URL
  useEffect(() => {
    if (!hasHydrated || !isClient) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isTest = urlParams.get('test') === 'true';
    const storyParam = urlParams.get('story');

    if (isTest && storyParam) {
      try {
        console.log("🧪 Mode test détecté, chargement de l'histoire...");

        const testStoryData: TestStoryData = JSON.parse(
          decodeURIComponent(storyParam)
        );

        // Validation de base des données de test
        if (!testStoryData.story || !Array.isArray(testStoryData.story)) {
          throw new Error("Format d'histoire de test invalide");
        }

        if (!testStoryData.startNodeId) {
          throw new Error("Nœud de départ manquant dans l'histoire de test");
        }

        console.log('✅ Histoire de test validée:', {
          nodes: testStoryData.story.length,
          startNode: testStoryData.startNodeId,
          metadata: testStoryData.metadata,
        });

        const loader = new StoryLoader(testStoryData.story);
        setStoryLoader(loader);
        setIsTestMode(true);
        setTestStoryInfo(testStoryData.metadata);

        // ✅ FIX: Toujours réinitialiser en mode test pour éviter les conflits
        clearCorruptedState();
        initializeGame(testStoryData.startNodeId);

        // Nettoyer l'URL pour éviter la pollution
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('test');
        newUrl.searchParams.delete('story');
        window.history.replaceState({}, '', newUrl.toString());

        return; // Sortir early pour éviter le chargement de l'histoire par défaut
      } catch (error) {
        console.error(
          "❌ Erreur lors du chargement de l'histoire de test:",
          error
        );
        setError("Impossible de charger l'histoire de test");
        // Continuer avec l'histoire par défaut en cas d'erreur
      }
    }

    // Chargement de l'histoire par défaut
    loadDefaultStory();
  }, [hasHydrated, isClient, initializeGame, setError, clearCorruptedState]);

  // Fonction pour charger l'histoire par défaut
  const loadDefaultStory = useCallback(() => {
    try {
      console.log("🔄 Chargement de l'histoire par défaut...");

      // Migrer les anciennes données vers le nouveau format
      const migratedData = migrateStoryData(defaultStoryData);
      const loader = new StoryLoader(migratedData);

      // Valider l'intégrité de l'histoire
      const validation = loader.validateStory();
      if (!validation.isValid) {
        console.warn(
          "Avertissements de validation de l'histoire:",
          validation.errors
        );
        // Ne pas arrêter pour des erreurs mineures, juste les logger
        if (
          validation.errors.some(
            (error) =>
              error.includes('introuvable') || error.includes('manquant')
          )
        ) {
          throw new Error(
            'Erreurs critiques de validation : ' + validation.errors.join(', ')
          );
        }
      }

      if (validation.warnings.length > 0) {
        console.warn('Avertissements de validation:', validation.warnings);
      }

      setStoryLoader(loader);
      setIsTestMode(false);
      setTestStoryInfo(null);

      // ✅ FIX: Vérifier si l'état du jeu existant est compatible
      if (gameState && !isGameStateValid(gameState, loader)) {
        console.log(
          "🧹 État du jeu incompatible avec l'histoire, réinitialisation..."
        );
        clearCorruptedState();
      }

      // Initialiser le jeu si pas encore fait OU si l'état était corrompu
      if (!gameState || !isGameStateValid(gameState, loader)) {
        const startNodeId = loader.getStartNodeId();
        console.log('🚀 Initialisation avec le nœud:', startNodeId);
        initializeGame(startNodeId);
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors du chargement de l'histoire par défaut:",
        error
      );
      setError("Impossible de charger l'histoire");
    }
  }, [
    gameState,
    initializeGame,
    setError,
    isGameStateValid,
    clearCorruptedState,
  ]);

  // ✅ FIX: Charger le nœud actuel avec gestion des erreurs et nettoyage automatique
  useEffect(() => {
    if (storyLoader && gameState && hasHydrated && isClient) {
      // Vérifier si le nœud actuel est déjà le bon
      if (currentNode?.id === gameState.currentNodeId) {
        return;
      }

      const node = storyLoader.getNode(gameState.currentNodeId);
      if (node) {
        console.log('📖 Chargement du nœud:', node.id, node.title);
        setCurrentNode(node);
      } else {
        console.error('❌ Nœud introuvable:', gameState.currentNodeId);

        // ✅ FIX: Auto-nettoyage de l'état corrompu
        console.log(
          "🧹 Détection d'un état corrompu, nettoyage automatique..."
        );
        clearCorruptedState();

        // Recharger l'histoire par défaut avec un petit délai
        setTimeout(() => {
          loadDefaultStory();
        }, 100);

        return;
      }
    }
  }, [
    storyLoader,
    gameState?.currentNodeId,
    hasHydrated,
    isClient,
    setCurrentNode,
    setError,
    currentNode?.id,
    clearCorruptedState,
    loadDefaultStory,
  ]);

  // Gestionnaire de choix avec gestion du redémarrage
  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!storyLoader || !gameState) return;

      console.log('🎮 Choix sélectionné:', choiceId);
      const nextNode = storyLoader.getNextNode(
        gameState.currentNodeId,
        choiceId
      );

      if (nextNode) {
        // Navigation normale
        makeChoice(choiceId, nextNode.id);
      } else {
        // Vérifier si c'est un redémarrage
        const currentNode = storyLoader.getNode(gameState.currentNodeId);
        const choice = currentNode?.choices.find((c) => c.id === choiceId);

        if (choice && choice.nextNodeId === '-1') {
          console.log("🔄 Redémarrage de l'histoire...");
          handleRestart();
        } else {
          console.error('❌ Impossible de naviguer vers le nœud suivant');
          setError('Navigation impossible - nœud de destination introuvable');
        }
      }
    },
    [storyLoader, gameState, makeChoice, setError]
  );

  // Gestionnaires de contrôles
  const handleSave = useCallback(() => {
    if (isTestMode) {
      alert(
        "La sauvegarde n'est pas disponible en mode test. Retournez à l'éditeur pour sauvegarder votre projet."
      );
      return;
    }
    setSaveModalOpen(true);
  }, [isTestMode]);

  const handleLoad = useCallback(() => {
    if (isTestMode) {
      const shouldContinue = confirm(
        "Vous êtes en mode test. Charger une sauvegarde quittera ce mode et retournera à l'histoire principale. Continuer ?"
      );
      if (!shouldContinue) return;

      // Quitter le mode test et recharger l'histoire par défaut
      setIsTestMode(false);
      setTestStoryInfo(null);
      clearCorruptedState(); // ✅ FIX: Nettoyer l'état avant de recharger
      loadDefaultStory();
    }
    setLoadModalOpen(true);
  }, [isTestMode, loadDefaultStory, clearCorruptedState]);

  const handleSaveConfirm = useCallback(
    async (saveName: string) => {
      try {
        await saveGame(saveName);
        setSaveModalOpen(false);

        // Notification améliorée
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Partie sauvegardée', {
            body: `Sauvegarde "${saveName}" créée avec succès`,
            icon: '/favicon.ico',
          });
        } else {
          alert('Partie sauvegardée !');
        }
      } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        alert('Erreur lors de la sauvegarde');
      }
    },
    [saveGame]
  );

  const handleLoadConfirm = useCallback(
    (saveData: SaveData) => {
      try {
        // ✅ FIX: Vérifier la compatibilité de la sauvegarde avec l'histoire actuelle
        if (storyLoader && !isGameStateValid(saveData.gameState, storyLoader)) {
          const shouldContinue = confirm(
            "Cette sauvegarde semble incompatible avec l'histoire actuelle. Cela peut causer des problèmes. Continuer quand même ?"
          );
          if (!shouldContinue) return;
        }

        loadGame(saveData);
        setLoadModalOpen(false);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Partie chargée', {
            body: `Sauvegarde "${saveData.name}" chargée`,
            icon: '/favicon.ico',
          });
        } else {
          alert('Partie chargée !');
        }
      } catch (error) {
        console.error('Erreur de chargement:', error);
        alert('Erreur lors du chargement');
      }
    },
    [loadGame, storyLoader, isGameStateValid]
  );

  const handleRestart = useCallback(() => {
    const confirmMessage = isTestMode
      ? "Redémarrer l'histoire de test ?"
      : "Redémarrer l'histoire ?";

    if (!confirm(confirmMessage)) return;

    console.log('🔄 Redémarrage demandé');
    restartGame();

    if (storyLoader) {
      const startNodeId = storyLoader.getStartNodeId();
      console.log('🚀 Redémarrage vers le nœud:', startNodeId);
      initializeGame(startNodeId);
    }
  }, [isTestMode, restartGame, storyLoader, initializeGame]);

  const handleSettings = useCallback(() => {
    const options = [
      'Paramètres audio',
      "Paramètres d'affichage",
      'Nettoyer les données corrompues',
      'Réinitialiser toutes les données',
      'À propos',
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
        alert("Paramètres d'affichage à implémenter");
        break;
      case 2:
        if (
          confirm(
            'Nettoyer les données de jeu corrompues ? Cela supprimera votre progression actuelle mais préservera vos sauvegardes.'
          )
        ) {
          clearCorruptedState();
          loadDefaultStory();
          alert('✅ Données nettoyées ! Le jeu redémarre.');
        }
        break;
      case 3:
        if (
          confirm(
            'Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.'
          )
        ) {
          localStorage.clear();
          window.location.reload();
        }
        break;
      case 4:
        alert(
          `Asylum Interactive Story\nVersion 1.0.0\n\n${isTestMode ? 'Mode Test Actif' : 'Mode Normal'}\n\nDéveloppé avec Next.js, React Flow et TypeScript`
        );
        break;
      default:
        break;
    }
  }, [isMuted, clearCorruptedState, loadDefaultStory, isTestMode]);

  // Affichage pendant l'hydration et le chargement initial
  if (!isClient || !hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-xl text-white">Chargement...</div>
      </div>
    );
  }

  if (!currentNode || !storyLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 text-xl text-white">
            {isTestMode
              ? "Initialisation de l'histoire de test..."
              : "Initialisation de l'histoire..."}
          </div>
          {gameState && (
            <div className="text-sm text-gray-400">
              Nœud actuel: {gameState.currentNodeId}
            </div>
          )}
          {testStoryInfo && (
            <div className="mt-2 text-sm text-blue-400">
              🧪 Test: {testStoryInfo.totalNodes} nœuds,{' '}
              {testStoryInfo.totalChoices} choix
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
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Asylum{' '}
            {isTestMode && (
              <span className="text-sm text-blue-400">🧪 MODE TEST</span>
            )}
          </h1>
          <p className="text-gray-300">Histoire Interactive</p>

          {/* Info de test */}
          {isTestMode && testStoryInfo && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-blue-500/50 bg-blue-900/50 p-3">
              <div className="text-sm text-blue-200">
                <div className="mb-1 font-medium">🧪 Histoire de Test</div>
                <div className="space-y-1 text-xs">
                  <div>
                    Générée:{' '}
                    {new Date(testStoryInfo.generatedAt).toLocaleString()}
                  </div>
                  <div>Éditeur v{testStoryInfo.editorVersion}</div>
                  <div>
                    {testStoryInfo.totalNodes} nœuds •{' '}
                    {testStoryInfo.totalChoices} choix
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="mx-auto max-w-4xl">
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

          <StoryViewer node={currentNode} onChoiceSelect={handleChoiceSelect} />

          {/* Modales de sauvegarde/chargement */}
          <SaveLoadModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            mode="save"
            onSave={handleSaveConfirm}
            onLoad={() => {}}
            currentProgress={visitedNodes}
          />

          <SaveLoadModal
            isOpen={loadModalOpen}
            onClose={() => setLoadModalOpen(false)}
            mode="load"
            onSave={() => {}}
            onLoad={handleLoadConfirm}
          />

          {/* Debug info en dev */}
          {isClient && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 rounded bg-gray-800 p-4 text-sm text-white">
              <h3 className="mb-2 font-bold">Debug Info:</h3>
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
                  <p>
                    État valide:{' '}
                    {isGameStateValid(gameState, storyLoader) ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
              {testStoryInfo && (
                <div className="mt-2 border-t border-gray-600 pt-2">
                  <p className="text-blue-400">Test Info:</p>
                  <p className="text-xs">Généré: {testStoryInfo.generatedAt}</p>
                  <p className="text-xs">
                    Version: {testStoryInfo.editorVersion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
