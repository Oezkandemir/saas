import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

/**
 * Hook to get field status for visual feedback
 * Returns hasError and hasSuccess flags based on field state
 */
export function useFormFieldStatus<
  TFieldValues extends FieldValues = FieldValues,
>(fieldName: FieldPath<TFieldValues>) {
  const { getFieldState, watch, formState } = useFormContext<TFieldValues>();

  const fieldState = getFieldState(fieldName, formState);
  const fieldValue = watch(fieldName);
  // Use fieldState.isDirty instead of accessing dirtyFields directly to avoid TypeScript errors
  const isDirty = fieldState.isDirty;
  const hasError = !!fieldState.error;
  const hasSuccess =
    !hasError && isDirty && fieldValue !== undefined && fieldValue !== "";

  return {
    hasError,
    hasSuccess,
    isValidating: fieldState.isValidating,
    isDirty: !!isDirty,
  };
}
