// @vitest-environment node

import type { DiagramBlock } from "@/domain/exam";
import { computeDiagramLayout } from "@/features/exam-renderer/components/blocks/diagram-layout";

function diagram(layout: DiagramBlock["layout"]): DiagramBlock {
  return {
    id: `diagram-${layout}`,
    type: "diagram",
    startsNewQuestion: true,
    order: 0,
    title: "Flow",
    layout,
    nodes: [
      { id: "a", text: "Production" },
      { id: "b", text: "Transport" },
      { id: "c", text: "Distribution" },
    ],
    edges: [
      { id: "ab", fromNodeId: "a", toNodeId: "b", label: "moves" },
      { id: "bc", fromNodeId: "b", toNodeId: "c", label: "" },
    ],
  };
}

describe("Diagram layout", () => {
  it("mirrors horizontal positions for Arabic without reversing Domain nodes", () => {
    const source = diagram("horizontal-flow");
    const fr = computeDiagramLayout(source, "fr");
    const ar = computeDiagramLayout(source, "ar");
    expect(fr.nodes.map((node) => node.node.id)).toEqual(["a", "b", "c"]);
    expect(ar.nodes.map((node) => node.node.id)).toEqual(["a", "b", "c"]);
    expect(fr.nodes[0]!.x).toBeLessThan(fr.nodes[2]!.x);
    expect(ar.nodes[0]!.x).toBeGreaterThan(ar.nodes[2]!.x);
  });

  it("keeps vertical progression top to bottom in both languages", () => {
    const source = diagram("vertical-flow");
    for (const language of ["fr", "ar"] as const) {
      const result = computeDiagramLayout(source, language);
      expect(result.nodes.map((node) => node.y)).toEqual(
        [...result.nodes.map((node) => node.y)].sort((a, b) => a - b),
      );
    }
  });

  it("lays out a hierarchy and uses a bounded fallback for a cycle", () => {
    const source = diagram("hierarchy");
    const hierarchy = computeDiagramLayout(source, "fr");
    expect(hierarchy.hasCycle).toBe(false);
    expect(hierarchy.nodes[0]!.y).toBeLessThan(hierarchy.nodes[1]!.y);

    const cyclic = {
      ...source,
      edges: [
        ...source.edges,
        { id: "ca", fromNodeId: "c", toNodeId: "a", label: "cycle" },
      ],
    };
    const fallback = computeDiagramLayout(cyclic, "fr");
    expect(fallback.hasCycle).toBe(true);
    expect(fallback.fallback).toBe(true);
    expect(fallback.nodes).toHaveLength(3);
  });

  it("handles a targeted 20-node, 25-edge stress fixture", () => {
    const nodes = Array.from({ length: 20 }, (_, index) => ({
      id: `n${index}`,
      text: `Node ${index}`,
    }));
    const edges = Array.from({ length: 25 }, (_, index) => ({
      id: `e${index}`,
      fromNodeId: `n${index % 19}`,
      toNodeId: `n${(index % 19) + 1}`,
      label: index < 19 ? "" : `relation ${index}`,
    }));
    const result = computeDiagramLayout(
      { ...diagram("horizontal-flow"), nodes, edges },
      "fr",
    );
    expect(result.nodes).toHaveLength(20);
    expect(result.edges).toHaveLength(25);
    expect(result.height).toBeGreaterThan(0);
  });
});
