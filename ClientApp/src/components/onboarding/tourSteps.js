/**
 * Guided Onboarding Tour Steps Definition
 *
 * Designed to progressively introduce international student applicants
 * to the FutureWings command center:
 *
 * 1. Welcome to FutureWings (Workspace Overview)
 * 2. Academic & Living Budget Profile (Calibration)
 * 3. AI-Powered Tiered Recommendations (Reach, Target, Safety)
 * 4. Application Tracking Pipeline & Deadlines
 * 5. Visa Readiness Scoring & AI Mock Interview Prep
 * 6. Ready to Take Off! (Summary & Next Steps)
 */

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    stepNumber: 1,
    page: 'Dashboard',
    selector: null, // Centered modal
    placement: 'center',
    category: 'Welcome to FutureWings',
    title: 'Your AI-Powered Study Abroad Command Center',
    description:
      'FutureWings replaces fragmented spreadsheets, agents, and forums with a synchronized platform designed to take you from initial university discovery to landing on campus.',
    highlights: [
      'Calibrated profile matching across 1,200+ global degree programs',
      'Unified multi-country application pipeline with automated deadline alerts',
      'AI-powered visa grant probability analysis and consular mock interviews',
    ],
    primaryAction: 'Start Guided Tour',
    badgeColor: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  {
    id: 'profile',
    stepNumber: 2,
    page: 'Profile',
    selector: '[data-tour="profile-fields"]',
    fallbackSelector: '[data-tour="profile-header"]',
    placement: 'bottom',
    category: 'Step 1: Calibration',
    title: 'Calibrate Your Academic & Budget Baseline',
    description:
      'Your CGPA, field of study, English scores (IELTS/TOEFL), and annual budget directly feed our matching algorithm. As your profile completeness reaches 100%, match precision increases.',
    highlights: [
      'Set target degree level and major to filter verified curriculums',
      'Calculate realistic budget coverage across tuition and living costs',
      'Update your credentials anytime as test results arrive',
    ],
    primaryAction: 'Next: University Matches',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'recommendations',
    stepNumber: 3,
    page: 'Recommendations',
    selector: '[data-tour="recommendations-header"]',
    fallbackSelector: '[data-tour="recommendations-container"]',
    placement: 'bottom',
    category: 'Step 2: Intelligence',
    title: 'Discover Tiered University Matches',
    description:
      'Programs are algorithmically categorized into 3 realistic admission tiers: Reach (ambitious Ivy/TU9), Target (strong matches aligned with your GPA), and Safety (high-probability low-tuition options).',
    highlights: [
      'View quantitative match percentages updated against your profile',
      'Inspect annual tuition, duration, and post-study graduate work permits (OPT/PGWP)',
      'Shortlist dream programs directly to your application tracker',
    ],
    primaryAction: 'Next: Application Pipeline',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'applications',
    stepNumber: 4,
    page: 'Applications',
    selector: '[data-tour="applications-header"]',
    fallbackSelector: '[data-tour="applications-tracker"]',
    placement: 'bottom',
    category: 'Step 3: Organization',
    title: 'Track Multi-Country Applications',
    description:
      'Manage multiple university submissions across the US, UK, Canada, Germany, Australia, and Japan in one unified dashboard. Track milestones from Draft through Review to Final Acceptance.',
    highlights: [
      'Centralized tracking pipeline from submission to COE/I-20 receipt',
      'Integrated document checklist to verify transcripts and SOPs',
      'Intake deadline reminders so you never miss a priority date',
    ],
    primaryAction: 'Next: Visa Readiness',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'visa',
    stepNumber: 5,
    page: 'Visa Check',
    selector: '[data-tour="visa-check-header"]',
    fallbackSelector: '[data-tour="visa-check-engine"]',
    placement: 'bottom',
    category: 'Step 4: Pre-Flight Audit',
    title: 'Visa Grant Probability & AI Mock Coaching',
    description:
      'Before booking your consular appointment, evaluate your visa approval odds based on home-country ties, funding adequacy, and jurisdiction refusal trends. Then practice with our voice-enabled AI interviewer.',
    highlights: [
      'Real-time 98.4% accurate consular risk scoring',
      'Identifies red flags like funding gaps or vague study rationale',
      'Voice-enabled AI consular officer for realistic interview rehearsal',
    ],
    primaryAction: 'Finish Tour',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'complete',
    stepNumber: 6,
    page: 'Dashboard',
    selector: null, // Centered celebration modal
    placement: 'center',
    category: 'Tour Complete',
    title: "You're Ready to Begin Your Journey!",
    description:
      'Your FutureWings student workspace is fully unlocked. Complete your profile, explore scholarships, and keep your upcoming deadlines on track.',
    highlights: [
      'You can relaunch this product tour anytime from your Profile page or sidebar',
      'Explore 1,200+ universities and free AI diagnostic tools',
      'Our counselors and AI advisors are here to help you every step of the way',
    ],
    primaryAction: 'Go to My Workspace',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
]
