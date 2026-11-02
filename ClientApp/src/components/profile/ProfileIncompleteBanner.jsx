import { FOCUS } from '../ui/styles.js'

export default function ProfileIncompleteBanner({
  profileCompletion,
  onNavigateToProfile,
}) {
  if (!profileCompletion || profileCompletion.isComplete) return null

  const { completedCount, totalRequired, missingFields } = profileCompletion

  return (
    <div
      className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-xs sm:text-sm text-warning-900 shadow-sm"
      role="alert"
      data-testid="profile-incomplete-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <svg
          className="h-5 w-5 shrink-0 text-warning-600 mt-0.5 sm:mt-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div>
          <p className="font-bold text-warning-950">
            Your profile is incomplete ({completedCount} of {totalRequired} core fields completed)
          </p>
          <p className="text-warning-800 text-xs mt-0.5">
            Recommendations, scholarship matching, and the roadmap may not work correctly until you complete it.
            {missingFields?.length > 0 && (
              <span className="font-semibold ml-1">
                (Missing: {missingFields.join(', ')})
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-warning-600 hover:bg-warning-700 px-4 py-2 text-xs font-bold text-white transition active:scale-[0.98] ${FOCUS}`}
        onClick={onNavigateToProfile}
        type="button"
        data-testid="banner-complete-profile-btn"
      >
        Complete Profile &rarr;
      </button>
    </div>
  )
}
