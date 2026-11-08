import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import type { Tone } from './Charts';

// Etiqueta de estado. El color acompaña siempre a una palabra (guía visual S7).
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Iniciales del nombre visible: dos como máximo, sin datos privados adicionales.
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : parts.slice(0, 1);
  return letters.map((part) => Array.from(part)[0]!.toUpperCase()).join('') || '?';
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
