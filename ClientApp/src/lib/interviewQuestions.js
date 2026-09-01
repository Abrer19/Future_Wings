/**
 * Interview question bank, generated from FutureWings' own knowledge base.
 *
 * "Knowledge base" here means real application data, not an invented corpus:
 *   - GET /profile   -> the student's CGPA, major, budget, degree level
 *   - GET /discovery -> the seeded country / university / program catalogue
 *
 * Each question carries a reference answer and a rubric of key points. Scoring
 * compares the student's answer against BOTH (see useAnswerScoring.js): the research
 * on automated short-answer grading is consistent that similarity to a reference alone
 * tracks topical overlap rather than whether the answer is actually any good, and that
 * rubric key-point coverage is the stronger evaluative signal.
 */

const money = (value) => `$${Number(value).toLocaleString('en-US')}`

/**
 * Builds a question set for this specific student.
 * Questions only reference facts that exist in the loaded data.
 */
export function buildQuestionSet(profile, programs) {
  const questions = []
  const top = programs?.[0]
  const countries = [...new Set((programs ?? []).map((program) => program.country))]

  // 1. Motivation — always askable.
  questions.push({
    id: 'motivation',
    category: 'Motivation',
    prompt: profile?.major
      ? `Why do you want to study ${profile.major} abroad rather than at home?`
      : 'Why do you want to study abroad rather than at home?',
    reference: profile?.major
      ? `I want to study ${profile.major} abroad because the programs I am targeting offer specialisation, research facilities and industry links that are stronger than my local options. I have compared specific universities and their course content, and I want the international experience and career network that comes with studying overseas. My long-term plan is to build expertise I can bring back and apply.`
      : 'I want to study abroad because the programs I am targeting offer specialisation, facilities and industry links stronger than my local options. I have compared specific universities and course content, and I want the international experience and career network that comes with it.',
    keyPoints: [
      { label: 'A specific academic reason (course content, specialisation, facilities)', probe: 'This program offers specialised course content, modules and research facilities that suit me.' },
      { label: 'Evidence you compared particular universities or programs', probe: 'I compared specific universities and looked at their programs, modules and rankings.' },
      { label: 'A career or long-term goal the degree serves', probe: 'My long-term career goal is to work in this field after I graduate.' },
      { label: 'Something your home country option lacks', probe: 'My local universities lack these facilities, so studying here gives me something they cannot.' },
    ],
    tip: 'Name a specific program feature. Generic answers about "better education" score poorly.',
  })

  // 2. Program choice — only when a real program is loaded.
  if (top) {
    questions.push({
      id: 'program-choice',
      category: 'Program fit',
      prompt: `Why have you chosen ${top.name} at ${top.university} in ${top.country}?`,
      reference: `I chose ${top.name} at ${top.university} because the curriculum matches my background and goals, and ${top.country} offers a strong environment for this field. The course runs for ${Math.round(top.durationMonths / 12) || 1} year(s) and costs about ${money(top.annualTuitionUsd)} per year, which I have planned for. The university's reputation and the specific modules on offer make it a better fit than the alternatives I considered.`,
      keyPoints: [
        { label: 'A reason tied to the curriculum, modules, or faculty', probe: 'The curriculum, modules and faculty of this course match what I want to study.' },
        { label: 'Awareness of the cost or duration', probe: 'The tuition costs this much per year and the course runs for this long.' },
        { label: 'Why this country in particular', probe: 'I chose this country because of its education system, industry and opportunities.' },
        { label: 'A comparison against alternatives you considered', probe: 'I considered other universities and courses before deciding on this one.' },
      ],
      tip: `Mention concrete details: the tuition is about ${money(top.annualTuitionUsd)} per year.`,
    })
  }

  // 3. Finance — grounded in the student's real budget when they have set one.
  questions.push({
    id: 'funding',
    category: 'Finances',
    prompt: 'How will you fund your studies and living costs?',
    reference: profile?.budgetUsd
      ? `My annual budget is around ${money(profile.budgetUsd)}, which covers tuition and living costs. It is funded through a combination of family support and personal savings, and I have documentary evidence of these funds. I have also researched scholarships and part-time work rules for my destination, and I have accounted for one-off costs such as flights, insurance and the visa fee.`
      : 'I have calculated tuition plus living costs for a full year and can evidence funds covering both, through a mix of family support and savings. I have also researched scholarships and the part-time work rules for my destination, and budgeted for flights, insurance and visa fees.',
    keyPoints: [
      { label: 'A specific funding source (savings, sponsor, loan, scholarship)', probe: 'My studies are funded by family sponsorship, personal savings, a loan and scholarships.' },
      { label: 'Evidence the funds can be documented', probe: 'I have bank statements and documents proving these funds are available.' },
      { label: 'Awareness that living costs are separate from tuition', probe: 'Besides tuition I have budgeted for accommodation and living expenses.' },
      { label: 'Additional costs such as flights, insurance, visa fees', probe: 'I have also budgeted for flights, health insurance and the visa fee.' },
    ],
    tip: 'Visa officers look for specific, evidenced numbers rather than reassurance.',
  })

  // 4. Post-study intent — the classic visa credibility question.
  questions.push({
    id: 'post-study',
    category: 'Visa intent',
    prompt: 'What do you plan to do after you finish your degree?',
    reference: 'After my degree I plan to gain relevant experience in my field and then apply what I have learned in my career. I have a clear plan tied to my qualification, I understand the post-study work rules for my destination, and I have ties to my home country including family and career opportunities that I intend to return to.',
    keyPoints: [
      { label: 'A concrete plan linked to the qualification', probe: 'After graduating I plan to work in this specific role using this qualification.' },
      { label: 'Awareness of post-study work or visa rules', probe: 'I understand the post-study work visa rules and how long I can stay.' },
      { label: 'Genuine ties to your home country', probe: 'I have family and career opportunities at home that I intend to return to.' },
      { label: 'Consistency with your reason for choosing the course', probe: 'This plan follows directly from the course I chose and why I chose it.' },
    ],
    tip: 'Answer consistently with your earlier answers — contradictions are the usual failure mode.',
  })

  // 5. Academic record — only when the student has entered a CGPA.
  if (profile?.cgpa) {
    questions.push({
      id: 'academics',
      category: 'Academics',
      prompt: `Your CGPA is ${profile.cgpa}. How does your academic record prepare you for this program?`,
      reference: `My CGPA of ${profile.cgpa} reflects consistent performance, and I performed particularly well in the subjects most relevant to this program. Beyond grades I have taken on projects and coursework that map directly onto the modules I will study. Where my record has weaker points I can explain the circumstances and what I did about them.`,
      keyPoints: [
        { label: 'Connects specific subjects or results to the program', probe: 'I scored well in the subjects that are most relevant to this program.' },
        { label: 'Evidence beyond grades (projects, work, coursework)', probe: 'I have completed projects and coursework related to this field.' },
        { label: 'An honest account of any weaker areas', probe: 'Where my grades were weaker I can explain the reason and what I did to improve.' },
        { label: 'Readiness for this level of study', probe: 'My background has prepared me for postgraduate level study in this subject.' },
      ],
      tip: 'Link results to the specific course rather than listing achievements.',
    })
  }

  // 6. Destination knowledge — only when the catalogue actually loaded.
  if (countries.length > 1) {
    questions.push({
      id: 'destination',
      category: 'Destination',
      prompt: `You are considering destinations such as ${countries.slice(0, 3).join(', ')}. What made you narrow it down?`,
      reference: `I compared these destinations on cost of study and living, the reputation of universities in my field, language of instruction, post-study work rights and how welcoming each is to international students. I weighed those factors against my budget and my career plan, which is how I narrowed the list rather than choosing on reputation alone.`,
      keyPoints: [
        { label: 'Named comparison criteria (cost, ranking, work rights)', probe: 'I compared destinations on cost, university rankings, language and work rights.' },
        { label: 'A trade-off you actually weighed', probe: 'One country was cheaper but another had better rankings, so I weighed that trade-off.' },
        { label: 'Connection to your budget or career plan', probe: 'I matched these options against my budget and my career plan.' },
        { label: 'Evidence of real research, not general impressions', probe: 'I researched official sources and specific university data rather than general impressions.' },
      ],
      tip: 'Show the criteria you used, not just the conclusion.',
    })
  }

  return questions
}
