import { BTN_PRIMARY } from './styles.js'
import { CheckCircleIcon, InboxIcon, PlusIcon } from './icons.jsx'

const copy = {
  Active: {
    Icon: InboxIcon,
    title: 'Nothing on your plate',
    body: 'Add a deadline and it will show up here with a countdown.',
    cta: 'Add your first deadline',
  },
  Overdue: {
    Icon: CheckCircleIcon,
    title: 'Nothing overdue',
    body: 'Everything with a due date is still ahead of you.',
    cta: null,
  },
  Completed: {
    Icon: CheckCircleIcon,
    title: 'No completed tasks yet',
    body: 'Tick a deadline off and it will be archived here.',
    cta: null,
  },
}

/**
 * Empty states get a next action rather than dead-ending on a sentence.
 * `onAdd` focuses the add-deadline title input.
 */
export default function EmptyState({ filter, onAdd }) {
  const { Icon, title, body, cta } = copy[filter] ?? copy.Active

  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-secondary-950">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-secondary-500">{body}</p>
      {cta && (
        <button className={`mt-5 ${BTN_PRIMARY}`} onClick={onAdd} type="button">
          <PlusIcon className="h-4 w-4" />
          {cta}
        </button>
      )}
    </div>
  )
}
