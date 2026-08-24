import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ValidatedNumberField({
  id,
  label,
  value,
  error,
  min,
  step,
  optional,
  isValid,
  onValueChange,
  onEditEnd,
}: {
  id: string;
  label: string;
  value: number | undefined;
  error: string;
  min: number;
  step: number;
  optional: boolean;
  isValid(value: number): boolean;
  onValueChange(value: number | undefined): void;
  onEditEnd(): void;
}) {
  const [invalidInput, setInvalidInput] = useState<string | null>(null);
  const errorId = `${id}-error`;

  const handleChange = (raw: string) => {
    if (raw === "" && optional) {
      setInvalidInput(null);
      onValueChange(undefined);
      return;
    }

    const parsed = Number(raw);
    if (raw === "" || !Number.isFinite(parsed) || !isValid(parsed)) {
      setInvalidInput(raw);
      return;
    }

    setInvalidInput(null);
    onValueChange(parsed);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        dir="ltr"
        min={min}
        step={step}
        value={invalidInput ?? value ?? ""}
        aria-invalid={invalidInput !== null}
        aria-describedby={invalidInput !== null ? errorId : undefined}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => {
          setInvalidInput(null);
          onEditEnd();
        }}
      />
      {invalidInput !== null ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
