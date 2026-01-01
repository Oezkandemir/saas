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
    const isValid = await validateStep(currentStep);
    if (!isValid && !allowSkip) {
      return;
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      
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
    // Only allow clicking on completed steps or next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      // Validate all steps up to the clicked step
      let canNavigate = true;
      for (let i = currentStep; i < stepIndex; i++) {
        const isValid = await validateStep(i);
        if (!isValid && !allowSkip) {
          canNavigate = false;
          break;
        }
      }
      
      if (canNavigate) {
        setCurrentStep(stepIndex);
        onStepChange?.(stepIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps
    let allValid = true;
    for (let i = 0; i < steps.length; i++) {
      const isValid = await validateStep(i);
      if (!isValid) {
        allValid = false;
        // Jump to first invalid step
        setCurrentStep(i);
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      }
    }

    if (!allValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form.getValues());
    } catch (error) {
      console.error("Form submission error:", error);
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

      {/* Step Indicator */}
      <div className="mb-8 hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index) || index < currentStep;
            const isClickable = index <= currentStep || completedSteps.has(index - 1);

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full border-2",
                      isActive &&
                        "border-primary bg-primary text-primary-foreground",
                      isCompleted &&
                        !isActive &&
                        "border-primary bg-primary/10 text-primary",
                      !isCompleted &&
                        !isActive &&
                        "border-muted bg-background text-muted-foreground",
                      isClickable && "cursor-pointer",
                      !isClickable && "cursor-not-allowed opacity-50"
                    )}
                    aria-label={`Gehe zu Schritt ${index + 1}: ${step.title}`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="size-5" />
                    ) : (
                      step.icon || <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-foreground",
                        !isActive && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="mb-6 md:hidden">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index) || index < currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  isActive && "bg-primary",
                  isCompleted && !isActive && "bg-primary/50",
                  !isCompleted && !isActive && "bg-muted"
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">{currentStepData.title}</p>
          {currentStepData.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {currentStepData.description}
            </p>
          )}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="min-h-[400px]">
          <CurrentStepComponent form={form} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Zurück
          </Button>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="gap-2"
              >
                Weiter
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? "Wird gespeichert..." : "Abschließen"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

