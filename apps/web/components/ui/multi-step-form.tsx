"use client";

import * as React from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface Step<T extends FieldValues> {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields?: Path<T>[];
  component: React.ComponentType<{ form: UseFormReturn<T> }>;
}

interface MultiStepFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  steps: Step<T>[];
  onSubmit: (data: T) => Promise<void> | void;
  onStepChange?: (stepIndex: number) => void;
  defaultStep?: number;
  className?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  autoSave?: boolean;
}

export function MultiStepForm<T extends FieldValues>({
  form,
  steps,
  onSubmit,
  onStepChange,
  defaultStep = 0,
  className,
  showProgress = true,
  allowSkip = false,
  autoSave = false,
}: MultiStepFormProps<T>) {
  const [currentStep, setCurrentStep] = React.useState(defaultStep);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Validate current step before moving forward
  const validateStep = async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex];
    if (!step.fields || step.fields.length === 0) {
      return true;
    }

    const fieldsToValidate = step.fields as Path<T>[];
    const result = await form.trigger(fieldsToValidate);
    
    if (result) {
      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        newSet.add(stepIndex);
        return newSet;
      });
    }
    
    return result;
  };

  const handleNext = async () => {
    // Only validate required fields - optional fields shouldn't block navigation
    const isValid = await validateStep(currentStep);
    if (!isValid && !allowSkip) {
      return;
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      
      // Mark current step as completed to allow navigation back
      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
      
      // Scroll to top
      window.scrollTo({ top: 0 });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
      
      // Scroll to top
      window.scrollTo({ top: 0 });
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Always allow navigation to any step - users can click on any step
    // Validation will happen on final submit, not during navigation
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First validate the current step
    const currentStepValid = await validateStep(currentStep);
    if (!currentStepValid && !allowSkip) {
      // Show error message
      const errors = form.formState.errors;
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        form.setFocus(firstError as Path<T>);
      }
      return;
    }

    // Validate all steps before submitting
    let allValid = true;
    let firstInvalidStep = -1;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.fields || step.fields.length === 0) {
        // Step has no fields to validate, skip it
        continue;
      }
      
      const isValid = await validateStep(i);
      if (!isValid) {
        allValid = false;
        if (firstInvalidStep === -1) {
          firstInvalidStep = i;
        }
      }
    }

    if (!allValid && firstInvalidStep !== -1) {
      // Jump to first invalid step
      setCurrentStep(firstInvalidStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Show error toast
      const stepTitle = steps[firstInvalidStep]?.title || `Schritt ${firstInvalidStep + 1}`;
      const { toast } = await import("sonner");
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus", {
        description: `Bitte vervollständigen Sie: ${stepTitle}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate entire form before submitting
      const isValid = await form.trigger();
      if (!isValid) {
        const errors = form.formState.errors;
        const firstErrorField = Object.keys(errors)[0] as Path<T>;
        if (firstErrorField) {
          // Find which step contains this field
          const errorStepIndex = steps.findIndex(step => 
            step.fields?.some(field => field === firstErrorField)
          );
          if (errorStepIndex !== -1) {
            setCurrentStep(errorStepIndex);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          form.setFocus(firstErrorField);
        }
        const { toast } = await import("sonner");
        toast.error("Bitte korrigieren Sie die Fehler im Formular");
        return;
      }
      
      await onSubmit(form.getValues());
    } catch (error) {
      console.error("Form submission error:", error);
      // Don't close form on error - let user fix it
      const { toast } = await import("sonner");
      toast.error("Fehler beim Speichern", {
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = currentStepData.component;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Schritt {currentStep + 1} von {steps.length}
            </span>
            <span>{Math.round(progress)}% abgeschlossen</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Indicator - Responsive */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index) || index < currentStep;
            // All steps are always clickable - no restrictions
            const isClickable = true;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "flex items-center justify-center rounded-full border-2 transition-all relative",
                      // Responsive sizes - etwas größer ohne Text
                      "size-8 sm:size-9 md:size-10 lg:size-11",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
                      isCompleted &&
                        !isActive &&
                        "border-primary bg-primary/10 text-primary hover:bg-primary/20",
                      !isCompleted &&
                        !isActive &&
                        "border-muted bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent",
                      "cursor-pointer hover:scale-110 active:scale-95"
                    )}
                    aria-label={`Gehe zu Schritt ${index + 1}: ${step.title}`}
                    title={`${step.title}${step.description ? ` - ${step.description}` : ""}`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="size-4 sm:size-4 md:size-5 lg:size-5" />
                    ) : step.icon ? (
                      <span className="size-4 sm:size-4 md:size-5 lg:size-5 [&>svg]:size-full">
                        {step.icon}
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base md:text-lg font-semibold">{index + 1}</span>
                    )}
                  </button>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      "mx-2 sm:mx-3 md:mx-4",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator - Simplified for small screens */}
      <div className="mb-4 sm:hidden">
        <div className="flex items-center gap-1.5">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index) || index < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(index)}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all",
                  isActive && "bg-primary h-2",
                  isCompleted && !isActive && "bg-primary/50",
                  !isCompleted && !isActive && "bg-muted"
                )}
                aria-label={`Gehe zu Schritt ${index + 1}: ${step.title}`}
              />
            );
          })}
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium">{currentStepData.title}</p>
          {currentStepData.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {currentStepData.description}
            </p>
          )}
        </div>
      </div>

      {/* Form Content */}
      <form 
        onSubmit={(e) => {
          // Always prevent default form submission
          // Form submission is handled manually via the "Speichern" button
          e.preventDefault();
        }} 
        className="space-y-6"
        onKeyDown={(e) => {
          // Prevent Enter key from submitting form unless on last step
          if (e.key === "Enter" && !isLastStep) {
            e.preventDefault();
            handleNext();
          }
        }}
      >
        <div className="min-h-[400px]">
          <CurrentStepComponent form={form} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting}
            className="gap-1.5 text-sm h-8"
          >
            <ChevronLeft className="size-3.5" />
            Zurück
          </Button>

          <div className="flex items-center gap-2">
            {/* Speichern Button - immer sichtbar */}
            <Button 
              type="button"
              size="sm"
              disabled={isSubmitting} 
              className="gap-1.5 text-sm h-8"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Validate current step before submitting
                const isValid = await validateStep(currentStep);
                if (!isValid && !allowSkip) {
                  const errors = form.formState.errors;
                  const firstError = Object.keys(errors)[0];
                  if (firstError) {
                    form.setFocus(firstError as Path<T>);
                  }
                  const { toast } = await import("sonner");
                  toast.error("Bitte füllen Sie alle erforderlichen Felder aus", {
                    description: `Bitte vervollständigen Sie: ${currentStepData.title}`,
                  });
                  return;
                }
                // Manually call handleSubmit with a synthetic event
                const syntheticEvent = {
                  preventDefault: () => {},
                  stopPropagation: () => {},
                } as React.FormEvent;
                await handleSubmit(syntheticEvent);
              }}
            >
              {isSubmitting ? "Speichert..." : "Speichern"}
            </Button>

            {/* Weiter Button - nur wenn nicht letzter Schritt */}
            {!isLastStep && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={isSubmitting}
                className="gap-1.5 text-sm h-8"
              >
                Weiter
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

