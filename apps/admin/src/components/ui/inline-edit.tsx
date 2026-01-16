import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "../../lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  validate?: (value: string) => boolean | string;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder,
  className,
  disabled = false,
  validate,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  const handleSave = async () => {
    if (validate) {
      const validation = validate(editValue);
      if (validation !== true) {
        setError(typeof validation === "string" ? validation : "Invalid value");
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          placeholder={placeholder}
          className={cn(error && "border-destructive")}
          autoFocus
        />
        <Button
          size="icon"
          onClick={handleSave}
          disabled={saving}
          variant="ghost"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={handleCancel}
          disabled={saving}
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span>{value || placeholder || "—"}</span>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleStartEdit}
          className="h-6 w-6"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
