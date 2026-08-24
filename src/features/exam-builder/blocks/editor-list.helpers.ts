export function moveArrayItem<Item>(
  items: readonly Item[],
  index: number,
  offset: -1 | 1,
): Item[] {
  const destination = index + offset;
  if (index < 0 || destination < 0 || destination >= items.length) {
    return items as Item[];
  }

  const moved = [...items];
  const [item] = moved.splice(index, 1);
  moved.splice(destination, 0, item!);
  return moved;
}

export function createBuilderItemId(): string {
  return createId();
}

export function focusEditorField(id: string): void {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}
import { createId } from "@/lib/create-id";
