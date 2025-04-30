interface PageHeaderProps {
  heading: string;
  subheading?: string;
}

export function PageHeader({ heading, subheading }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{heading}</h1>
      {subheading && (
        <p className="text-muted-foreground">{subheading}</p>
      )}
    </div>
  );
} 