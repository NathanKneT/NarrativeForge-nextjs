import { Node, Edge } from 'reactflow';
import { StoryNode, Choice } from './story';

// Types spécifiques à l'éditeur
export interface EditorNode extends Node {
  data: {
    storyNode: StoryNode;
    isStartNode?: boolean;
    isEndNode?: boolean;
    nodeType: 'start' | 'story' | 'choice' | 'end';
  };
}

export type EditorEdge = Edge & {
  data?: {
    choice?: Choice;
    condition?: string;
  };
};

export interface StoryProject {
  id: string;
  name: string;
  description: string;
  nodes: EditorNode[];
  edges: EditorEdge[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author?: string;
  };
}

export interface EditorState {
  currentProject: StoryProject | null;
  selectedNode: EditorNode | null;
  selectedEdge: EditorEdge | null;
  isEditingNode: boolean;
  isEditingEdge: boolean;
  clipboardNode: EditorNode | null;
  history: StoryProject[];
  historyIndex: number;
}

export interface NodeFormData {
  title: string;
  content: string;
  nodeType: 'start' | 'story' | 'choice' | 'end';
  tags: string[];
  metadata: {
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedReadTime?: number;
  };
}

export interface ChoiceFormData {
  text: string;
  condition?: string;
  consequences?: string[];
}

// Types pour les templates de nœuds
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  nodeType: 'start' | 'story' | 'choice' | 'end';
  defaultData: Partial<StoryNode>;
  icon: string;
  color: string;
}

// Types pour l'export/import
export interface ExportFormat {
  format: 'json' | 'asylum-json' | 'twine' | 'ink';
  includeMetadata: boolean;
  minify: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'node' | 'edge' | 'structure';
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'node' | 'edge' | 'structure';
  nodeId?: string;
  edgeId?: string;
  message: string;
  suggestion?: string;
}