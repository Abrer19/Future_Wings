import { BTN_PRIMARY, CARD, CONTROL } from './styles.js'
import { PlusIcon, SpinnerIcon } from './icons.jsx'

const categories = ['Application', 'Scholarship', 'Visa', 'Exam', 'Document', 'Other']

const TITLE_MAX = 200
const NOTES_MAX = 1000

/**
 * Add-deadline card.
 *
 * Field limits mirror the server's DataAnnotations (Title 200, Notes 1000) so the
 * browser stops over-long input before it can come back as a raw .NET validation
 * string. `minDueAt` is "now" in the local format datetime-local expects, so a
 * past-dated deadline can't be picked by accident.
 */
export default function AddDeadlineForm({ form, saving, minDueAt, titleRef, onChange, onSubmit }) {
  const set = (name) => (event) => onChange({ ...form, [name]: event.target.value })
  const titleLeft = TITLE_MAX - form.title.length

  return (
    <section className={`h-fit p-5 lg:sticky lg:top-6 ${CARD}`}>
      <h2 className="text-base font-bold text-secondary-950">Add a deadline</h2>
      <p className="mt-1 text-sm text-secondary-500">Track anything with a date attached.</p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="text-sm font-medium text-secondary-700" htmlFor="title">
              Task
            </label>
            {titleLeft <= 40 && (
              <span
                className={`text-xs tabular-nums ${titleLeft === 0 ? 'text-danger-600' : 'text-secondary-400'}`}
              >
                {titleLeft} left
              </span>
            )}
          </div>
          <input
            className={`w-full ${CONTROL}`}
            id="title"
            maxLength={TITLE_MAX}
            name="title"
            onChange={set('title')}
            placeholder="Submit university application"
            ref={titleRef}
            required
            type="text"
            value={form.title}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-700" htmlFor="category">
            Category
          </label>
          <select className={`w-full ${CONTROL}`} id="category" onChange={set('category')} value={form.category}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-700" htmlFor="dueAt">
            Due date and time
          </label>
          <input
            className={`w-full ${CONTROL}`}
            id="dueAt"
            min={minDueAt}
            name="dueAt"
            onChange={set('dueAt')}
            required
            type="datetime-local"
            value={form.dueAt}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-700" htmlFor="notes">
            Notes <span className="font-normal text-secondary-400">(optional)</span>
          </label>
          <textarea
            className={`min-h-20 w-full ${CONTROL}`}
            id="notes"
            maxLength={NOTES_MAX}
            onChange={set('notes')}
            placeholder="Anything you need to remember"
            value={form.notes}
          />
        </div>

        <button className={`w-full ${BTN_PRIMARY}`} disabled={saving} type="submit">
          {saving ? <SpinnerIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {saving ? 'Adding…' : 'Add deadline'}
        </button>
      </form>
    </section>
  )
}
