export interface TimelinePhase {
  id: string;
  title: string;
  summary: string;
  gets: string[];
  needs: string;
}

export interface TimelineLabels {
  list: string;
  getsLabel: string;
  needsLabel: string;
}

export interface ProblemItem {
  id: string;
  title: string;
  problem: string;
  decision: string;
  result: string;
}

export interface ProblemLabels {
  problem: string;
  decision: string;
  result: string;
}

export interface PointItem {
  id: string;
  title: string;
  text: string;
}

export interface DiagramNode {
  id: string;
  name: string;
  detail: string;
}

export interface DiagramLayer {
  id: string;
  title: string;
  nodes: DiagramNode[];
}
