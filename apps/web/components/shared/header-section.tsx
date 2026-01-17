interface HeaderSectionProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export function HeaderSection({ label, title, subtitle }: HeaderSectionProps) {
  // Parent components already pass translated strings, so just use them directly
  const localizedContent = { label, title, subtitle };

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
