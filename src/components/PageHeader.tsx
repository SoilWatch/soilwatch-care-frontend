interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e1810]">{title}</h1>
        {description && <p className="text-sm text-[#97928f] mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
