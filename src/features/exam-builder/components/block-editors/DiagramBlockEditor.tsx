import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  addDiagramEdge,
  addDiagramNode,
  moveDiagramNode,
  removeDiagramEdge,
  removeDiagramNode,
  type DiagramBlock,
} from "@/domain/exam";
import { createBuilderItemId } from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function DiagramBlockEditor({ block }: { block: DiagramBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const [fromNodeId, setFromNodeId] = useState(block.nodes[0]?.id ?? "");
  const [toNodeId, setToNodeId] = useState(block.nodes[1]?.id ?? "");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const nodeInputs = useRef(new Map<string, HTMLInputElement>());

  const updateDiagram = (
    updater: (diagram: DiagramBlock) => DiagramBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "diagram" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  useEffect(() => {
    if (!focusNodeId) return;
    const input = nodeInputs.current.get(focusNodeId);
    if (input) {
      input.focus({ preventScroll: true });
      setFocusNodeId(null);
    }
  }, [block.nodes, focusNodeId]);

  const nodeName = (id: string) => {
    const index = block.nodes.findIndex((node) => node.id === id);
    const node = block.nodes[index];
    return (
      node?.text.trim() ||
      t("examBuilder.blocks.diagram.nodeNumber", { number: index + 1 })
    );
  };
  const relationExists = block.edges.some(
    (edge) =>
      edge.fromNodeId === fromNodeId &&
      edge.toNodeId === toNodeId &&
      edge.label === edgeLabel,
  );
  const canAddRelation =
    Boolean(fromNodeId && toNodeId) &&
    fromNodeId !== toNodeId &&
    !relationExists;

  return (
    <BlockEditorShell type={block.type}>
      <section
        className="space-y-3"
        aria-labelledby={`diagram-main-${block.id}`}
      >
        <h4 id={`diagram-main-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.diagram.diagram")}
        </h4>
        <div className="space-y-2">
          <Label htmlFor={`diagram-title-${block.id}`}>
            {t("examBuilder.blocks.diagram.title")}
          </Label>
          <Input
            id={`diagram-title-${block.id}`}
            dir="auto"
            value={block.title}
            onChange={(event) =>
              updateDiagram(
                (diagram) => ({ ...diagram, title: event.target.value }),
                `block:${block.id}:diagram:title`,
              )
            }
            onBlur={() => endHistoryGroup(`block:${block.id}:diagram:title`)}
          />
        </div>
      </section>

      <section
        className="space-y-3"
        aria-labelledby={`diagram-nodes-${block.id}`}
      >
        <h4 id={`diagram-nodes-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.diagram.nodes")}
        </h4>
        <div className="space-y-2">
          {block.nodes.map((node, index) => {
            const name = t("examBuilder.blocks.diagram.nodeNumber", {
              number: index + 1,
            });
            const historyKey = `block:${block.id}:diagram:node:${node.id}`;
            return (
              <div
                key={node.id}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`diagram-node-${node.id}`}>{name}</Label>
                  <Input
                    ref={(input) => {
                      if (input) nodeInputs.current.set(node.id, input);
                      else nodeInputs.current.delete(node.id);
                    }}
                    id={`diagram-node-${node.id}`}
                    dir="auto"
                    value={node.text}
                    placeholder={t(
                      "examBuilder.blocks.diagram.nodePlaceholder",
                    )}
                    onChange={(event) =>
                      updateDiagram(
                        (diagram) => ({
                          ...diagram,
                          nodes: diagram.nodes.map((candidate) =>
                            candidate.id === node.id
                              ? { ...candidate, text: event.target.value }
                              : candidate,
                          ),
                        }),
                        historyKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(historyKey)}
                  />
                </div>
                <ItemActions
                  name={name}
                  index={index}
                  count={block.nodes.length}
                  onMoveUp={() =>
                    updateDiagram((diagram) =>
                      moveDiagramNode(diagram, node.id, -1),
                    )
                  }
                  onMoveDown={() =>
                    updateDiagram((diagram) =>
                      moveDiagramNode(diagram, node.id, 1),
                    )
                  }
                  onRemove={() => {
                    updateDiagram((diagram) =>
                      removeDiagramNode(diagram, node.id),
                    );
                    if (fromNodeId === node.id) setFromNodeId("");
                    if (toNodeId === node.id) setToNodeId("");
                  }}
                />
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const id = createBuilderItemId();
            updateDiagram((diagram) =>
              addDiagramNode(diagram, { id, text: "" }),
            );
            setFocusNodeId(id);
            if (!fromNodeId) setFromNodeId(id);
            else if (!toNodeId) setToNodeId(id);
          }}
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.diagram.addNode")}
        </Button>
      </section>

      <section
        className="space-y-3"
        aria-labelledby={`diagram-edges-${block.id}`}
      >
        <h4 id={`diagram-edges-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.diagram.edges")}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`diagram-from-${block.id}`}>
              {t("examBuilder.blocks.diagram.from")}
            </Label>
            <NativeSelect
              id={`diagram-from-${block.id}`}
              value={fromNodeId}
              onChange={(event) => setFromNodeId(event.target.value)}
            >
              <option value="">—</option>
              {block.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {nodeName(node.id)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`diagram-to-${block.id}`}>
              {t("examBuilder.blocks.diagram.to")}
            </Label>
            <NativeSelect
              id={`diagram-to-${block.id}`}
              value={toNodeId}
              onChange={(event) => setToNodeId(event.target.value)}
            >
              <option value="">—</option>
              {block.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {nodeName(node.id)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`diagram-edge-label-${block.id}`}>
            {t("examBuilder.blocks.diagram.edgeLabel")}
          </Label>
          <Input
            id={`diagram-edge-label-${block.id}`}
            dir="auto"
            value={edgeLabel}
            onChange={(event) => setEdgeLabel(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!canAddRelation}
          onClick={() => {
            updateDiagram((diagram) =>
              addDiagramEdge(diagram, {
                id: createBuilderItemId(),
                fromNodeId,
                toNodeId,
                label: edgeLabel,
              }),
            );
            setEdgeLabel("");
          }}
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.diagram.addEdge")}
        </Button>
        <ul className="space-y-2">
          {block.edges.map((edge) => {
            const historyKey = `block:${block.id}:diagram:edge:${edge.id}:label`;
            return (
              <li
                key={edge.id}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
              >
                <div className="min-w-0 text-sm" dir="auto">
                  {nodeName(edge.fromNodeId)}{" "}
                  {edge.label.trim() ? `— ${edge.label} →` : "→"}{" "}
                  {nodeName(edge.toNodeId)}
                </div>
                <div className="space-y-1">
                  <Label
                    className="sr-only"
                    htmlFor={`diagram-existing-edge-${edge.id}`}
                  >
                    {t("examBuilder.blocks.diagram.edgeLabel")}
                  </Label>
                  <Input
                    id={`diagram-existing-edge-${edge.id}`}
                    dir="auto"
                    value={edge.label}
                    aria-label={t("examBuilder.blocks.diagram.edgeLabelFor", {
                      relation: `${nodeName(edge.fromNodeId)} → ${nodeName(edge.toNodeId)}`,
                    })}
                    onChange={(event) =>
                      updateDiagram(
                        (diagram) => ({
                          ...diagram,
                          edges: diagram.edges.map((candidate) =>
                            candidate.id === edge.id
                              ? { ...candidate, label: event.target.value }
                              : candidate,
                          ),
                        }),
                        historyKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(historyKey)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label={t("examBuilder.blocks.diagram.removeEdge", {
                    relation: `${nodeName(edge.fromNodeId)} → ${nodeName(edge.toNodeId)}`,
                  })}
                  onClick={() =>
                    updateDiagram((diagram) =>
                      removeDiagramEdge(diagram, edge.id),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="space-y-2"
        aria-labelledby={`diagram-layout-${block.id}`}
      >
        <h4 id={`diagram-layout-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.diagram.organization")}
        </h4>
        <Label htmlFor={`diagram-layout-select-${block.id}`}>
          {t("examBuilder.blocks.diagram.layout")}
        </Label>
        <NativeSelect
          id={`diagram-layout-select-${block.id}`}
          value={block.layout}
          onChange={(event) =>
            updateDiagram((diagram) => ({
              ...diagram,
              layout: event.target.value as DiagramBlock["layout"],
            }))
          }
        >
          <option value="horizontal-flow">
            {t("examBuilder.blocks.diagram.layouts.horizontal")}
          </option>
          <option value="vertical-flow">
            {t("examBuilder.blocks.diagram.layouts.vertical")}
          </option>
          <option value="hierarchy">
            {t("examBuilder.blocks.diagram.layouts.hierarchy")}
          </option>
        </NativeSelect>
      </section>

      <BlockPointsField blockId={block.id} value={block.points} />
    </BlockEditorShell>
  );
}
