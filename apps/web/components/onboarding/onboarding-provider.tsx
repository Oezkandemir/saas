"use client";

import { useEffect, useState } from "react";
import { OnboardingWizard } from "./onboarding-wizard";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    
    // Only show onboarding for new users
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      {children}
    </>
  );
}

