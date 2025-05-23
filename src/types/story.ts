export interface StoryNode {
  id: string;
  title: string;
  content: string;
  choices: Choice[];
  multimedia?: MediaContent;
  metadata: NodeMetadata;
}

export interface Choice {
  id: string;
  text: string;
  nextNodeId: string;
  conditions?: Condition[];
  consequences?: Effect[];
}

// Types manquants ajoutés
export interface Condition {
  type: 'variable' | 'visited' | 'choice_made' | 'item_has';
  target: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface Effect {
  type: 'set_variable' | 'add_item' | 'remove_item' | 'play_sound';
  target: string;
  value: string | number | boolean;
  description?: string;
}

export interface MediaContent {
  backgroundImage?: string;
  backgroundMusic?: string;
  soundEffects?: string[];
  video?: string;
}

export interface NodeMetadata {
  tags: string[];
  visitCount: number;
  lastVisited?: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  currentNodeId: string;
  visitedNodes: Set<string>;
  choices: Record<string, string>;
  startTime: Date;
  playTime: number;
  variables: Record<string, string | number | boolean>;
  inventory: string[];
}

export interface SaveData {
  id: string;
  name: string;
  gameState: GameState;
  timestamp: Date;
  storyProgress: number;
}