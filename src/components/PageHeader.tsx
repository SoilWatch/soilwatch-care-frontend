interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4" style={{ borderColor: "#e9ecef" }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1F3864" }}>{title}</h1>
        {description && <p className="text-sm mt-1" style={{ color: "#6b7280" }}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
