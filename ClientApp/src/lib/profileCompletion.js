/**
 * Profile Completion Utility
 *
 * Defines the four required academic core fields:
 *   1. CGPA: numeric and within [0.0, 4.0]
 *   2. Major: non-empty after trimming
 *   3. Budget: numeric and strictly greater than zero (> 0)
 *   4. Degree Level: selected and non-empty after trimming
 *
 * First and last name are validated for profile saving, but the four academic
 * fields determine whether the student profile is complete for recommendations,
 * scholarship matching, and roadmap knowledge-graph features.
 */

export const CORE_ACADEMIC_FIELDS = [
  { key: 'cgpa', label: 'CGPA', description: 'Undergraduate / High School CGPA (0.0 - 4.0 scale)' },
  { key: 'major', label: 'Target Major', description: 'Intended academic major' },
  { key: 'budgetUsd', label: 'Annual Budget', description: 'Annual tuition & living funds (> $0 USD)' },
  { key: 'degreeLevel', label: 'Target Degree Level', description: 'Target degree level (Bachelor, Master, etc.)' },
]

export const VALID_DEGREE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate']

/**
 * Validates a single core academic field value.
 */
export function checkCoreAcademicField(fieldKey, value) {
  if (value === null || value === undefined) return false

  if (fieldKey === 'cgpa') {
    if (typeof value === 'string' && value.trim() === '') return false
    const num = Number(value)
    return !Number.isNaN(num) && num >= 0 && num <= 4.0
  }

  if (fieldKey === 'budgetUsd') {
    if (typeof value === 'string' && value.trim() === '') return false
    const num = Number(value)
    return !Number.isNaN(num) && num > 0
  }

  if (fieldKey === 'major') {
    return typeof value === 'string' && value.trim().length > 0
  }

  if (fieldKey === 'degreeLevel') {
    return typeof value === 'string' && value.trim().length > 0
  }

  return false
}

/**
 * Evaluates profile completion status against the four core fields.
 * Works with both server-returned profile DTOs and form states.
 */
export function evaluateProfileCompletion(profile) {
  if (!profile) {
    return {
      isComplete: false,
      completedCount: 0,
      totalRequired: 4,
      missingFields: ['CGPA', 'Target Major', 'Annual Budget', 'Target Degree Level'],
      completionPercent: 0,
      fieldStatus: {
        cgpa: false,
        major: false,
        budgetUsd: false,
        degreeLevel: false,
      },
    }
  }

  const fieldStatus = {
    cgpa: checkCoreAcademicField('cgpa', profile.cgpa),
    major: checkCoreAcademicField('major', profile.major),
    budgetUsd: checkCoreAcademicField('budgetUsd', profile.budgetUsd),
    degreeLevel: checkCoreAcademicField('degreeLevel', profile.degreeLevel),
  }

  const missingFields = []
  if (!fieldStatus.cgpa) missingFields.push('CGPA')
  if (!fieldStatus.major) missingFields.push('Target Major')
  if (!fieldStatus.budgetUsd) missingFields.push('Annual Budget')
  if (!fieldStatus.degreeLevel) missingFields.push('Target Degree Level')

  const totalRequired = 4
  const completedCount = totalRequired - missingFields.length
  const isComplete = missingFields.length === 0
  const completionPercent = Math.round((completedCount / totalRequired) * 100)

  return {
    isComplete,
    completedCount,
    totalRequired,
    missingFields,
    completionPercent,
    fieldStatus,
  }
}

/**
 * Validates a profile form submission and returns field-level error messages.
 */
export function validateProfileForm(form) {
  const errors = {}

  if (!form.firstName || form.firstName.trim() === '') {
    errors.firstName = 'First name is required.'
  } else if (form.firstName.trim().length > 100) {
    errors.firstName = 'First name must not exceed 100 characters.'
  }

  if (!form.lastName || form.lastName.trim() === '') {
    errors.lastName = 'Last name is required.'
  } else if (form.lastName.trim().length > 100) {
    errors.lastName = 'Last name must not exceed 100 characters.'
  }

  if (form.cgpa === '' || form.cgpa === null || form.cgpa === undefined) {
    errors.cgpa = 'CGPA is required (0.0 to 4.0 scale).'
  } else {
    const cgpaNum = Number(form.cgpa)
    if (Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 4.0) {
      errors.cgpa = 'CGPA must be a valid number between 0.0 and 4.0.'
    }
  }

  if (!form.major || form.major.trim() === '') {
    errors.major = 'Target academic major is required.'
  } else if (form.major.trim().length > 100) {
    errors.major = 'Target major must not exceed 100 characters.'
  }

  if (form.budgetUsd === '' || form.budgetUsd === null || form.budgetUsd === undefined) {
    errors.budgetUsd = 'Annual budget is required (must be greater than $0).'
  } else {
    const budgetNum = Number(form.budgetUsd)
    if (Number.isNaN(budgetNum) || budgetNum <= 0) {
      errors.budgetUsd = 'Annual budget must be greater than $0 USD.'
    }
  }

  if (!form.degreeLevel || form.degreeLevel.trim() === '') {
    errors.degreeLevel = 'Please select your target degree level.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Checks whether the profile completion prompt has been dismissed in the current session.
 */
export function isProfilePromptDismissed(userId) {
  if (typeof window === 'undefined') return false
  const safeId = userId !== undefined && userId !== null ? String(userId).trim() : 'guest'
  try {
    return window.sessionStorage?.getItem(`futurewings.profile_dismissed.${safeId}`) === '1'
  } catch {
    return false
  }
}

/**
 * Temporarily dismisses the profile completion prompt for the current session.
 * Never marks the profile as complete.
 */
export function dismissProfilePrompt(userId) {
  if (typeof window === 'undefined') return
  const safeId = userId !== undefined && userId !== null ? String(userId).trim() : 'guest'
  try {
    window.sessionStorage?.setItem(`futurewings.profile_dismissed.${safeId}`, '1')
  } catch {
    // Ignore sessionStorage issues
  }
}

/**
 * Clears the temporary dismissal so the prompt reappears on demand or next session.
 */
export function clearProfilePromptDismissal(userId) {
  if (typeof window === 'undefined') return
  const safeId = userId !== undefined && userId !== null ? String(userId).trim() : 'guest'
  try {
    window.sessionStorage?.removeItem(`futurewings.profile_dismissed.${safeId}`)
  } catch {
    // Ignore
  }
}
