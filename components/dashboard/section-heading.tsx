import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}

export function SectionHeading({ id, title, description, aside }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2 id={id} className="section-title">{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
