export function BooleanField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange(checked: boolean): void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium"
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
