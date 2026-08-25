import type {
  DiagramBlock,
  DiagramEdge,
  DiagramNode,
  DiagramNodeId,
} from "@/domain/exam/blocks.types";

export const DIAGRAM_NODE_WARNING_THRESHOLD = 15;

export function addDiagramNode(
  block: DiagramBlock,
  node: DiagramNode,
): DiagramBlock {
  return { ...block, nodes: [...block.nodes, node] };
}

export function moveDiagramNode(
  block: DiagramBlock,
  nodeId: DiagramNodeId,
  offset: -1 | 1,
): DiagramBlock {
  const index = block.nodes.findIndex((node) => node.id === nodeId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= block.nodes.length) return block;
  const nodes = [...block.nodes];
  [nodes[index], nodes[target]] = [nodes[target]!, nodes[index]!];
  return { ...block, nodes };
}

/** Removing a node and every incident relation is one immutable mutation. */
export function removeDiagramNode(
  block: DiagramBlock,
  nodeId: DiagramNodeId,
): DiagramBlock {
  return {
    ...block,
    nodes: block.nodes.filter((node) => node.id !== nodeId),
    edges: block.edges.filter(
      (edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId,
    ),
  };
}

export function addDiagramEdge(
  block: DiagramBlock,
  edge: DiagramEdge,
): DiagramBlock {
  return { ...block, edges: [...block.edges, edge] };
}

export function removeDiagramEdge(
  block: DiagramBlock,
  edgeId: string,
): DiagramBlock {
  return { ...block, edges: block.edges.filter((edge) => edge.id !== edgeId) };
}

/** Detects directed cycles in O(nodes + edges), including disconnected graphs. */
export function diagramHasCycle(block: Pick<DiagramBlock, "nodes" | "edges">) {
  const nodeIds = new Set(block.nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  block.nodes.forEach((node) => adjacency.set(node.id, []));
  block.edges.forEach((edge) => {
    if (nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId)) {
      adjacency.get(edge.fromNodeId)!.push(edge.toNodeId);
    }
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((adjacency.get(id) ?? []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return block.nodes.some((node) => visit(node.id));
}

export function isDiagramTooDense(
  block: Pick<DiagramBlock, "nodes" | "edges">,
) {
  const count = block.nodes.length;
  return (
    count > DIAGRAM_NODE_WARNING_THRESHOLD || block.edges.length > count * 2
  );
}
