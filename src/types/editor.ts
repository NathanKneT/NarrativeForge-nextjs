import type { Node, Edge } from '@xyflow/react';
import { StoryNode, Choice } from './story';

export interface EditorNodeData extends Record<string, unknown> {
  storyNode: StoryNode;
  isStartNode?: boolean;
  isEndNode?: boolean;
  nodeType: 'start' | 'story' | 'end';
}

export interface EditorNode extends Node<EditorNodeData, string> {
  dragHandle?: string;
}

export interface EditorEdgeData extends Record<string, unknown> {
  choice?: Choice;
}

export interface EditorEdge extends Edge<EditorEdgeData> {}

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
