import { describe, expect, it } from 'vitest'
import {
  checkCoreAcademicField,
  evaluateProfileCompletion,
  validateProfileForm,
  isProfilePromptDismissed,
  dismissProfilePrompt,
  clearProfilePromptDismissal,
} from './profileCompletion.js'

describe('profileCompletion utility', () => {
  describe('checkCoreAcademicField', () => {
    it('validates CGPA within 0.0 to 4.0 range', () => {
      expect(checkCoreAcademicField('cgpa', 3.8)).toBe(true)
      expect(checkCoreAcademicField('cgpa', 0)).toBe(true)
      expect(checkCoreAcademicField('cgpa', 4.0)).toBe(true)
      expect(checkCoreAcademicField('cgpa', '3.75')).toBe(true)
      expect(checkCoreAcademicField('cgpa', -0.5)).toBe(false)
      expect(checkCoreAcademicField('cgpa', 4.1)).toBe(false)
      expect(checkCoreAcademicField('cgpa', '   ')).toBe(false)
      expect(checkCoreAcademicField('cgpa', null)).toBe(false)
      expect(checkCoreAcademicField('cgpa', undefined)).toBe(false)
    })

    it('validates budgetUsd strictly greater than 0', () => {
      expect(checkCoreAcademicField('budgetUsd', 25000)).toBe(true)
      expect(checkCoreAcademicField('budgetUsd', '15000')).toBe(true)
      expect(checkCoreAcademicField('budgetUsd', 0)).toBe(false)
      expect(checkCoreAcademicField('budgetUsd', -500)).toBe(false)
      expect(checkCoreAcademicField('budgetUsd', '0')).toBe(false)
      expect(checkCoreAcademicField('budgetUsd', '')).toBe(false)
      expect(checkCoreAcademicField('budgetUsd', null)).toBe(false)
    })

    it('validates major as non-empty after trimming', () => {
      expect(checkCoreAcademicField('major', 'Computer Science')).toBe(true)
      expect(checkCoreAcademicField('major', '  AI  ')).toBe(true)
      expect(checkCoreAcademicField('major', '')).toBe(false)
      expect(checkCoreAcademicField('major', '   ')).toBe(false)
      expect(checkCoreAcademicField('major', null)).toBe(false)
    })

    it('validates degreeLevel as non-empty after trimming', () => {
      expect(checkCoreAcademicField('degreeLevel', "Master's")).toBe(true)
      expect(checkCoreAcademicField('degreeLevel', "Bachelor's")).toBe(true)
      expect(checkCoreAcademicField('degreeLevel', '')).toBe(false)
      expect(checkCoreAcademicField('degreeLevel', '   ')).toBe(false)
      expect(checkCoreAcademicField('degreeLevel', null)).toBe(false)
    })
  })

  describe('evaluateProfileCompletion', () => {
    it('returns 0 of 4 for empty or null profile', () => {
      const result = evaluateProfileCompletion(null)
      expect(result.isComplete).toBe(false)
      expect(result.completedCount).toBe(0)
      expect(result.totalRequired).toBe(4)
      expect(result.completionPercent).toBe(0)
      expect(result.missingFields).toEqual(['CGPA', 'Target Major', 'Annual Budget', 'Target Degree Level'])
    })

    it('returns exactly 4 of 4 and isComplete=true when all four academic core fields are valid', () => {
      const profile = {
        cgpa: 3.85,
        major: 'Computer Science',
        budgetUsd: 30000,
        degreeLevel: "Master's",
      }
      const result = evaluateProfileCompletion(profile)
      expect(result.isComplete).toBe(true)
      expect(result.completedCount).toBe(4)
      expect(result.totalRequired).toBe(4)
      expect(result.completionPercent).toBe(100)
      expect(result.missingFields).toEqual([])
      expect(result.fieldStatus.cgpa).toBe(true)
      expect(result.fieldStatus.major).toBe(true)
      expect(result.fieldStatus.budgetUsd).toBe(true)
      expect(result.fieldStatus.degreeLevel).toBe(true)
    })

    it('correctly calculates partial completion (e.g. 2 of 4)', () => {
      const profile = {
        cgpa: 3.5,
        major: '   ', // whitespace = incomplete
        budgetUsd: 20000,
        degreeLevel: '', // empty = incomplete
      }
      const result = evaluateProfileCompletion(profile)
      expect(result.isComplete).toBe(false)
      expect(result.completedCount).toBe(2)
      expect(result.totalRequired).toBe(4)
      expect(result.completionPercent).toBe(50)
      expect(result.missingFields).toEqual(['Target Major', 'Target Degree Level'])
    })
  })

  describe('validateProfileForm', () => {
    it('validates all required personal and academic fields', () => {
      const validForm = {
        firstName: 'John',
        lastName: 'Doe',
        cgpa: '3.7',
        major: 'Robotics',
        budgetUsd: '35000',
        degreeLevel: "Master's",
      }
      const result = validateProfileForm(validForm)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('catches invalid fields and returns specific inline error messages', () => {
      const invalidForm = {
        firstName: '',
        lastName: '   ',
        cgpa: '4.5',
        major: '',
        budgetUsd: '-100',
        degreeLevel: '',
      }
      const result = validateProfileForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.firstName).toBeDefined()
      expect(result.errors.lastName).toBeDefined()
      expect(result.errors.cgpa).toBeDefined()
      expect(result.errors.major).toBeDefined()
      expect(result.errors.budgetUsd).toBeDefined()
      expect(result.errors.degreeLevel).toBeDefined()
    })
  })

  describe('session dismissal functions', () => {
    it('manages temporary session dismissal without marking profile as complete', () => {
      const userId = 'test-student-42'
      clearProfilePromptDismissal(userId)
      expect(isProfilePromptDismissed(userId)).toBe(false)

      dismissProfilePrompt(userId)
      expect(isProfilePromptDismissed(userId)).toBe(true)

      clearProfilePromptDismissal(userId)
      expect(isProfilePromptDismissed(userId)).toBe(false)
    })
  })
})
