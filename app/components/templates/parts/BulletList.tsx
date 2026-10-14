export interface BulletListProps {
  bullets?: string[];
  className?: string;
  itemClassName?: string;
}

export function BulletList({ bullets, className = "", itemClassName = "" }: BulletListProps) {
  if (!bullets || bullets.length === 0) return null;

  const validBullets = bullets.filter((b) => typeof b === "string" && b.trim().length > 0);
  if (validBullets.length === 0) return null;

  return (
    <ul className={`list-disc pl-5 space-y-1 text-sm text-neutral-700 ${className}`}>
      {validBullets.map((bullet, idx) => (
        <li key={idx} className={`leading-relaxed ${itemClassName}`}>
          {bullet}
        </li>
      ))}
    </ul>
  );
}
