/**
 * Loading placeholder for the deadline list.
 *
 * Uses the same `animate-pulse` block treatment Discovery.jsx already uses for its
 * program grid, so loading looks like one app rather than two.
 */
export default function DeadlineSkeleton({ rows = 4 }) {
  return (
    <div aria-hidden="true" className="divide-y divide-secondary-100">
      {Array.from({ length: rows }, (_, row) => (
        <div className="flex animate-pulse gap-4 px-5 py-4" key={row}>
          <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-secondary-200" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-48 rounded bg-secondary-200" />
              <div className="h-4 w-16 rounded-full bg-secondary-100" />
            </div>
            <div className="mt-2.5 h-3 w-32 rounded bg-secondary-100" />
          </div>
          <div className="h-6 w-16 shrink-0 rounded-lg bg-secondary-100" />
        </div>
      ))}
    </div>
  )
}
