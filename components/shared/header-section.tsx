interface HeaderSectionProps {
  label?: string;
  title: string;
  subtitle?: string;
  locale?: string;
  sectionKey?: string; // A key to identify which section this header belongs to
}

// German translations for headers
const deTranslations = {
  features: {
    label: "Funktionen",
    title: "Entdecken Sie alle Funktionen.",
    subtitle: "Harum quae dolore inventore repudiandae? Orrupti aut temporibus ariatur."
  },
  testimonials: {
    label: "Referenzen",
    title: "Was unsere Kunden berichten.",
    subtitle: "Entdecken Sie die begeisterten Rückmeldungen unserer zufriedenen Kunden weltweit."
  },
  pricing: {
    label: "Preise",
    title: "Starten Sie mit voller Geschwindigkeit!",
    subtitle: "Wählen Sie den perfekten Plan für Ihre Bedürfnisse."
  },
  comparePlans: {
    label: "Vergleichen",
    title: "Vergleichen Sie unsere Pläne",
    subtitle: "Finden Sie den richtigen Plan für Ihr Unternehmen."
  },
  faq: {
    label: "FAQ",
    title: "Häufig gestellte Fragen",
    subtitle: "Finden Sie Antworten auf die häufigsten Fragen zu unserem Service."
  },
  bentogrid: {
    label: "Features",
    title: "Was uns auszeichnet",
    subtitle: "Entdecken Sie die einzigartigen Funktionen unserer Plattform."
  }
};

export function HeaderSection({ 
  label, 
  title, 
  subtitle, 
  locale = "en",
  sectionKey 
}: HeaderSectionProps) {
  // Get translated content if German locale and section key exists
  const getLocalizedContent = () => {
    if (locale === 'de' && sectionKey && deTranslations[sectionKey]) {
      return {
        label: deTranslations[sectionKey].label || label,
        title: deTranslations[sectionKey].title || title,
        subtitle: deTranslations[sectionKey].subtitle || subtitle
      };
    }
    
    return { label, title, subtitle };
  };
  
  const localizedContent = getLocalizedContent();

  return (
    <div className="flex flex-col items-center text-center">
      {localizedContent.label ? (
        <div className="text-gradient_indigo-purple mb-4 font-semibold">
          {localizedContent.label}
        </div>
      ) : null}
      <h2 className="font-heading text-3xl md:text-4xl lg:text-[40px]">
        {localizedContent.title}
      </h2>
      {localizedContent.subtitle ? (
        <p className="mt-6 text-balance text-lg text-muted-foreground">
          {localizedContent.subtitle}
        </p>
      ) : null}
    </div>
  );
}
