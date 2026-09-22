export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success'; children: React.ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-ocean-100 bg-ocean-50 text-ocean-600';

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
