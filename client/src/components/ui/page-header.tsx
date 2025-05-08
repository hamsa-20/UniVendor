import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  heading,
  subheading,
  className,
  actions
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{heading}</h1>
        {subheading && (
          <p className="text-muted-foreground mt-1">{subheading}</p>
        )}
      </div>
      {actions && <div className="mt-3 md:mt-0">{actions}</div>}
    </div>
  );
}