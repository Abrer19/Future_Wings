const shared = {
  updated: 'September 2026',
  readTime: '6 min read',
}

export const destinationArticles = [
  {
    ...shared, slug: 'united-states', name: 'United States', flag: '🇺🇸', tier: 'Tier 1',
    description: 'Top-ranked universities worldwide',
    headline: 'Why the United States remains a global magnet for ambitious students',
    standfirst: 'A vast university system, flexible degrees and deep research funding create exceptional choice—but students need a careful cost and visa plan.',
    stats: [['Typical tuition', '$25k–$65k/year'], ['Study length', '4 years bachelor’s'], ['Work option', 'OPT after study']],
    sections: [
      ['The academic opportunity', 'More than 4,000 institutions range from liberal-arts colleges to large research universities. Students can explore subjects before declaring a major, combine disciplines, and access strong laboratory, entrepreneurship and alumni networks.'],
      ['What it may cost', 'Tuition varies sharply by institution and state. Add housing, insurance, books and travel when comparing offers. Merit aid can be substantial, so the published price is not always the final price.'],
      ['Admissions and visa planning', 'Competitive applications usually combine grades, essays, recommendations and activities. After admission, the university issues an I-20 for the F-1 visa process. Students should prepare credible funding evidence and a clear study plan.'],
    ],
    checklist: ['Compare total cost after scholarships', 'Check test-optional rules at each university', 'Prepare one year of funding evidence', 'Review CPT and OPT eligibility'],
  },
  {
    ...shared, slug: 'united-kingdom', name: 'United Kingdom', flag: '🇬🇧', tier: 'Tier 1',
    description: 'World-class education heritage',
    headline: 'The UK advantage: focused degrees with a faster route to graduation',
    standfirst: 'Shorter, specialized programs and globally recognized universities make the UK attractive to students who know what they want to study.',
    stats: [['Typical tuition', '£15k–£35k/year'], ['Study length', '3 years bachelor’s'], ['Work option', 'Graduate Route']],
    sections: [
      ['Focused from day one', 'UK degrees usually begin with the chosen subject instead of a broad general curriculum. This creates depth and often reduces the total time and living cost required to graduate.'],
      ['Applications and academic fit', 'Most undergraduate applications use UCAS, while postgraduate students commonly apply directly. A strong personal statement should explain subject readiness, not simply list extracurricular activities.'],
      ['Budget and student visa', 'London costs more than most regional cities. Students should calculate tuition, accommodation and the official maintenance requirement, then keep funds in the required form and period before applying.'],
    ],
    checklist: ['Compare London and regional living costs', 'Confirm course-specific entry requirements', 'Plan CAS and visa timing', 'Check current Graduate Route rules'],
  },
  {
    ...shared, slug: 'canada', name: 'Canada', flag: '🇨🇦', tier: 'Tier 1',
    description: 'Inclusive and affordable options',
    headline: 'Studying in Canada: quality, community and a practical career pathway',
    standfirst: 'Canada pairs respected institutions with multicultural cities, but new policy changes make program and permit research more important than ever.',
    stats: [['Typical tuition', 'C$20k–C$45k/year'], ['Study length', '2–4 years'], ['Work option', 'PGWP eligible programs']],
    sections: [
      ['Choosing the right institution', 'Universities offer research-led degrees, while colleges emphasize applied learning. Confirm that the institution is designated and that the specific program supports your post-study goals.'],
      ['Affordability beyond tuition', 'Housing varies widely between Toronto, Vancouver and smaller cities. Include winter clothing, health coverage, transport and initial settlement costs in the first-year budget.'],
      ['A credible permit application', 'A study permit file should connect the course to your academic and career history, show sufficient funds, and explain why the chosen Canadian program is a logical next step.'],
    ],
    checklist: ['Verify DLI and PGWP eligibility', 'Price housing in the exact city', 'Explain program progression clearly', 'Check the latest permit requirements'],
  },
  {
    ...shared, slug: 'germany', name: 'Germany', flag: '🇩🇪', tier: 'Tier 2',
    description: 'Low-tuition STEM powerhouse',
    headline: 'Germany offers serious academic value—if you prepare for the details',
    standfirst: 'Low public-university tuition and strong engineering links are compelling, while language, documentation and blocked-account rules demand early preparation.',
    stats: [['Typical tuition', 'Low at public universities'], ['Study length', '3–4 years'], ['Language', 'German or English']],
    sections: [
      ['High value, high expectations', 'Public universities often charge modest semester contributions rather than large tuition fees. Admission can be strict about prerequisite modules, grades and document formats.'],
      ['Language changes the experience', 'Many master’s programs are taught in English, but German expands internship, part-time work and daily-life options. Even basic proficiency can make integration considerably easier.'],
      ['Finance and visa preparation', 'Students commonly need a blocked account or other accepted proof of funds. Start document certification, APS requirements where applicable, health insurance and accommodation research well before departure.'],
    ],
    checklist: ['Match prerequisite modules carefully', 'Check Uni-Assist requirements', 'Plan blocked-account funding', 'Begin German language study'],
  },
  {
    ...shared, slug: 'australia', name: 'Australia', flag: '🇦🇺', tier: 'Tier 1',
    description: 'High quality of life & research',
    headline: 'Australia combines research strength with an outdoor student lifestyle',
    standfirst: 'Globally ranked universities, diverse cities and industry-linked courses draw students south—along with a substantial financial commitment.',
    stats: [['Typical tuition', 'A$25k–A$50k/year'], ['Study length', '3 years bachelor’s'], ['Intakes', 'February & July']],
    sections: [
      ['Courses built for global careers', 'Australian universities are particularly visible in health, environmental science, engineering and business. Many courses include placements, projects or professional accreditation.'],
      ['Planning the real budget', 'Tuition is only one part of the cost. Compare rent, transport and insurance across Sydney, Melbourne, Brisbane, Adelaide and regional study locations before choosing.'],
      ['The student visa story', 'Applicants should be ready to demonstrate genuine study intentions, financial capacity and English proficiency. Course choice should make sense in light of previous study and future career plans.'],
    ],
    checklist: ['Check professional accreditation', 'Compare metro and regional costs', 'Budget for OSHC insurance', 'Prepare a coherent study narrative'],
  },
  {
    ...shared, slug: 'japan', name: 'Japan', flag: '🇯🇵', tier: 'Tier 2',
    description: 'Innovation meets tradition',
    headline: 'Japan’s universities open a door to technology, culture and discovery',
    standfirst: 'Expanding English-taught programs and major government scholarships are making Japan more accessible to international students.',
    stats: [['Typical tuition', '¥535k–¥1.5m/year'], ['Study length', '4 years bachelor’s'], ['Major award', 'MEXT scholarship']],
    sections: [
      ['A distinctive academic setting', 'Japan is strong in robotics, materials, engineering, design and social research. Students can choose national universities, private institutions or specialist graduate schools.'],
      ['Language and daily life', 'English-taught degrees reduce the academic language barrier, but Japanese ability transforms everyday life and employment prospects. Students should plan language study alongside the degree.'],
      ['Funding the experience', 'National-university fees can be competitive, and MEXT or university awards may cover tuition and living support. Scholarship timelines often begin far earlier than admission deadlines.'],
    ],
    checklist: ['Search English-taught degree databases', 'Start MEXT research early', 'Plan Japanese language learning', 'Check housing and guarantor support'],
  },
]
