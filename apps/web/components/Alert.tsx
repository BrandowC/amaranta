export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success'; children: React.ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-sage-100 bg-sage-50 text-sage-600';

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
