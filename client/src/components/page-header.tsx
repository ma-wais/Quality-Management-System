import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  clause?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, clause, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-3">
        {clause && (
          <Badge variant="outline" className="font-mono text-xs">
            {clause}
          </Badge>
        )}
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 mt-2 sm:mt-0">{children}</div>}
    </div>
  );
}
