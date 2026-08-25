import type {
  DiagramBlock,
  DiagramEdge,
  DiagramNode,
  DocumentLanguage,
} from "@/domain/exam";
import { diagramHasCycle } from "@/domain/exam";

export const DIAGRAM_VIEWBOX_WIDTH = 1000;
export const DIAGRAM_NODE_WIDTH = 180;
export const DIAGRAM_NODE_HEIGHT = 70;
const MARGIN_X = 55;
const MARGIN_Y = 35;
const ROW_GAP = 76;
const COLUMN_GAP = 70;
const MAX_FLOW_COLUMNS = 4;

export interface DiagramNodeLayout {
  node: DiagramNode;
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
}

export interface DiagramEdgeLayout {
  edge: DiagramEdge;
  path: string;
  labelX: number;
  labelY: number;
}

export interface DiagramLayoutResult {
  width: number;
  height: number;
  nodes: DiagramNodeLayout[];
  edges: DiagramEdgeLayout[];
  hasCycle: boolean;
  fallback: boolean;
}

export function wrapDiagramText(
  text: string,
  maximumCharacters = 22,
): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const chunks =
      word.length <= maximumCharacters
        ? [word]
        : (word.match(new RegExp(`.{1,${maximumCharacters}}`, "gu")) ?? [word]);
    for (const chunk of chunks) {
      const candidate = line ? `${line} ${chunk}` : chunk;
      if (candidate.length > maximumCharacters && line) {
        lines.push(line);
        line = chunk;
      } else {
        line = candidate;
      }
    }
  }
  if (line) lines.push(line);
  if (lines.length <= 3) return lines;
  return [
    ...lines.slice(0, 2),
    `${lines[2]!.slice(0, maximumCharacters - 1)}…`,
  ];
}

function horizontalNodes(
  nodes: readonly DiagramNode[],
  language: DocumentLanguage,
): DiagramNodeLayout[] {
  const columns = Math.min(MAX_FLOW_COLUMNS, Math.max(1, nodes.length));
  const available = DIAGRAM_VIEWBOX_WIDTH - MARGIN_X * 2 - DIAGRAM_NODE_WIDTH;
  const step = columns === 1 ? 0 : available / (columns - 1);
  return nodes.map((node, index) => {
    const column = index % columns;
    const visualColumn = language === "ar" ? columns - 1 - column : column;
    return {
      node,
      x: MARGIN_X + visualColumn * step,
      y:
        MARGIN_Y +
        Math.floor(index / columns) * (DIAGRAM_NODE_HEIGHT + ROW_GAP),
      width: DIAGRAM_NODE_WIDTH,
      height: DIAGRAM_NODE_HEIGHT,
      lines: wrapDiagramText(node.text),
    };
  });
}

function verticalNodes(nodes: readonly DiagramNode[]): DiagramNodeLayout[] {
  return nodes.map((node, index) => ({
    node,
    x: (DIAGRAM_VIEWBOX_WIDTH - DIAGRAM_NODE_WIDTH) / 2,
    y: MARGIN_Y + index * (DIAGRAM_NODE_HEIGHT + ROW_GAP),
    width: DIAGRAM_NODE_WIDTH,
    height: DIAGRAM_NODE_HEIGHT,
    lines: wrapDiagramText(node.text),
  }));
}

function hierarchyLevels(block: DiagramBlock): Map<string, number> {
  const ids = new Set(block.nodes.map((node) => node.id));
  const incoming = new Map(block.nodes.map((node) => [node.id, 0]));
  const children = new Map(
    block.nodes.map((node) => [node.id, [] as string[]]),
  );
  block.edges.forEach((edge) => {
    if (!ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId)) return;
    incoming.set(edge.toNodeId, (incoming.get(edge.toNodeId) ?? 0) + 1);
    children.get(edge.fromNodeId)!.push(edge.toNodeId);
  });
  const levels = new Map<string, number>();
  const queue = block.nodes
    .filter((node) => incoming.get(node.id) === 0)
    .map((node) => node.id);
  queue.forEach((id) => levels.set(id, 0));
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index]!;
    for (const child of children.get(id) ?? []) {
      levels.set(
        child,
        Math.max(levels.get(child) ?? 0, (levels.get(id) ?? 0) + 1),
      );
      incoming.set(child, (incoming.get(child) ?? 1) - 1);
      if (incoming.get(child) === 0) queue.push(child);
    }
  }
  return levels;
}

function hierarchyNodes(block: DiagramBlock): DiagramNodeLayout[] {
  const levels = hierarchyLevels(block);
  const groups = new Map<number, DiagramNode[]>();
  block.nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    groups.set(level, [...(groups.get(level) ?? []), node]);
  });
  const result: DiagramNodeLayout[] = [];
  for (const [level, nodes] of [...groups].sort(([a], [b]) => a - b)) {
    const totalWidth =
      nodes.length * DIAGRAM_NODE_WIDTH +
      Math.max(0, nodes.length - 1) * COLUMN_GAP;
    const scale = Math.min(
      1,
      (DIAGRAM_VIEWBOX_WIDTH - MARGIN_X * 2) / totalWidth,
    );
    const nodeWidth = DIAGRAM_NODE_WIDTH * scale;
    const gap = COLUMN_GAP * scale;
    const left =
      (DIAGRAM_VIEWBOX_WIDTH -
        (nodes.length * nodeWidth + Math.max(0, nodes.length - 1) * gap)) /
      2;
    nodes.forEach((node, index) => {
      result.push({
        node,
        x: left + index * (nodeWidth + gap),
        y: MARGIN_Y + level * (DIAGRAM_NODE_HEIGHT + ROW_GAP),
        width: nodeWidth,
        height: DIAGRAM_NODE_HEIGHT,
        lines: wrapDiagramText(node.text, Math.max(12, Math.floor(22 * scale))),
      });
    });
  }
  return result;
}

function edgeGeometry(
  edge: DiagramEdge,
  nodes: ReadonlyMap<string, DiagramNodeLayout>,
): DiagramEdgeLayout | null {
  const from = nodes.get(edge.fromNodeId);
  const to = nodes.get(edge.toNodeId);
  if (!from || !to || from.node.id === to.node.id) return null;
  const fromCx = from.x + from.width / 2;
  const fromCy = from.y + from.height / 2;
  const toCx = to.x + to.width / 2;
  const toCy = to.y + to.height / 2;
  const horizontal = Math.abs(toCx - fromCx) >= Math.abs(toCy - fromCy);
  const x1 = horizontal
    ? fromCx + (Math.sign(toCx - fromCx) * from.width) / 2
    : fromCx;
  const y1 = horizontal
    ? fromCy
    : fromCy + (Math.sign(toCy - fromCy) * from.height) / 2;
  const x2 = horizontal
    ? toCx - (Math.sign(toCx - fromCx) * to.width) / 2
    : toCx;
  const y2 = horizontal
    ? toCy
    : toCy - (Math.sign(toCy - fromCy) * to.height) / 2;
  const middleX = (x1 + x2) / 2;
  const middleY = (y1 + y2) / 2;
  const path = horizontal
    ? `M ${x1} ${y1} L ${middleX} ${y1} L ${middleX} ${y2} L ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x1} ${middleY} L ${x2} ${middleY} L ${x2} ${y2}`;
  return {
    edge,
    path,
    labelX: middleX,
    labelY: middleY - 7,
  };
}

export function computeDiagramLayout(
  block: DiagramBlock,
  language: DocumentLanguage,
): DiagramLayoutResult {
  const hasCycle = diagramHasCycle(block);
  const fallback = block.layout === "hierarchy" && hasCycle;
  const nodes =
    fallback || block.layout === "horizontal-flow"
      ? horizontalNodes(block.nodes, language)
      : block.layout === "vertical-flow"
        ? verticalNodes(block.nodes)
        : hierarchyNodes(block);
  const byId = new Map(nodes.map((node) => [node.node.id, node]));
  const edges = block.edges
    .map((edge) => edgeGeometry(edge, byId))
    .filter((edge): edge is DiagramEdgeLayout => edge !== null);
  const bottom = nodes.reduce(
    (maximum, node) => Math.max(maximum, node.y + node.height),
    MARGIN_Y + DIAGRAM_NODE_HEIGHT,
  );
  return {
    width: DIAGRAM_VIEWBOX_WIDTH,
    height: bottom + MARGIN_Y,
    nodes,
    edges,
    hasCycle,
    fallback,
  };
}
