"use client";

import * as React from "react";
import { useFormContext, Controller, FieldPath, FieldValues } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField } from "./form";
import { Input, InputProps } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldEnhancedProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label?: string;
  description?: string;
  control?: any;
  render?: (props: {
    field: any;
    hasError: boolean;
    hasSuccess: boolean;
    isValidating: boolean;
  }) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  validateOnBlur?: boolean;
}

export function FormFieldEnhanced<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  control,
  render,
  children,
  className,
  validateOnBlur = true,
}: FormFieldEnhancedProps<TFieldValues, TName>) {
  const form = useFormContext<TFieldValues>();
  const formControl = control || form.control;
  const [isValidating, setIsValidating] = React.useState(false);
  
  const fieldState = form.getFieldState(name as any);
  const fieldValue = form.watch(name as any);
  const isDirty = form.formState.dirtyFields[name as any];
  const hasError = !!fieldState.error;
  const hasSuccess = !hasError && isDirty && fieldValue !== undefined && fieldValue !== "";

  const handleBlur = async (onBlur: () => void) => {
    if (validateOnBlur) {
      setIsValidating(true);
      await form.trigger(name as any);
      setIsValidating(false);
    }
    onBlur();
  };

  return (
    <Controller
      name={name as any}
      control={formControl}
      render={({ field }) => {
        const enhancedField = {
          ...field,
          onBlur: () => handleBlur(field.onBlur),
        };

        if (render) {
          return (
            <FormItem className={className}>
              {label && <FormLabel>{label}</FormLabel>}
              <FormControl>
                {render({
                  field: enhancedField,
                  hasError,
                  hasSuccess,
                  isValidating,
                })}
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          );
        }

        if (children) {
          return (
            <FormItem className={className}>
              {label && <FormLabel>{label}</FormLabel>}
              <FormControl>
                {React.cloneElement(children as React.ReactElement<any>, {
                  ...enhancedField,
                  hasError,
                  hasSuccess,
                } as any)}
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          );
        }

        // Fallback: return a default FormItem if neither render nor children are provided
        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <Input {...enhancedField} />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

