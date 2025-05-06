interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-semibold">{heading}</h1>
        {text && <p className="text-base text-muted-foreground">{text}</p>}
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        {actions && <div className="mr-2">{actions}</div>}
        {children}
      </div>
    </div>
  );
}
