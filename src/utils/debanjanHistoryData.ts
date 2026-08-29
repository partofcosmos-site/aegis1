/**
 * @file debanjanHistoryData.ts
 * @description
 * Verified Historical Study Logs, Goals, and Journal entries for Debanjan Biswas (April 1 - August 29, 2026).
 * Covers IIT Kharagpur i-KITES residential program (May 16 - Jun 26), NSEP prep, Cosmos Lab simulator build, and Part of Cosmos.
 */

export interface HistoricalLog {
  id: string;
  uid: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  problemsSolved: number;
  notes?: string;
  createdAt: string;
}

export interface HistoricalGoal {
  id: string;
  uid: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  milestones: Array<{ id: string; text: string; done: boolean }>;
  createdAt: string;
}

export interface HistoricalJournal {
  id: string;
  uid: string;
  date: string;
  title: string;
  notes: string;
  mood: number;
  createdAt: string;
}

export function getDebanjanHistoricalSeedData(uid: string) {
  let _id = Date.now();
  const mkId = (prefix: string, idx: number) => `${prefix}_deb_${idx}_${_id++}`;

  const log = (idx: number, date: string, subject: string, topic: string, mins: number, problems = 0, notes = ''): HistoricalLog => ({
    id: mkId('log', idx),
    uid,
    date,
    subject,
    topic,
    durationMinutes: mins,
    problemsSolved: problems,
    notes,
    createdAt: new Date(`${date}T10:00:00`).toISOString()
  });

  const goal = (idx: number, title: string, description: string, category: string, targetDate: string, progress = 0, milestones: Array<{ id: string; text: string; done: boolean }> = []): HistoricalGoal => ({
    id: mkId('goal', idx),
    uid,
    title,
    description,
    category,
    targetDate,
    progress,
    milestones,
    createdAt: new Date().toISOString()
  });

  const journal = (idx: number, date: string, title: string, notes: string, mood = 4): HistoricalJournal => ({
    id: mkId('jrn', idx),
    uid,
    date,
    title,
    notes,
    mood,
    createdAt: new Date(`${date}T21:00:00`).toISOString()
  });

  const logs: HistoricalLog[] = [
    // Period 1: Apr 1 - May 15
    log(1, '2026-04-01', 'Physics', 'Rotational Mechanics — Moment of Inertia derivations', 75, 8),
    log(2, '2026-04-03', 'Physics', 'Irodov Ch. 1 — Kinematics problems', 90, 12),
    log(3, '2026-04-05', 'Mathematics', 'Integration techniques — by parts and substitution', 60, 10),
    log(4, '2026-04-07', 'Physics', 'Angular momentum conservation problems', 70, 7),
    log(5, '2026-04-09', 'Physics', 'Oscillations — SHM and energy analysis', 80, 9),
    log(6, '2026-04-11', 'Mathematics', 'Differential equations — first order', 45, 5),
    log(7, '2026-04-13', 'Physics', 'Gravitation — Kepler laws and orbital mechanics', 90, 10),
    log(8, '2026-04-14', 'Physics', 'Cosmos Lab project — orbit simulator JS/Canvas coding', 120, 0, 'Building interactive Newtonian mechanics simulator for debanjanbiswas.pages.dev'),
    log(9, '2026-04-16', 'Physics', 'Thermodynamics — Carnot engine and entropy', 70, 8),
    log(10, '2026-04-18', 'Physics', 'IPhO Compendium writing — Mechanics chapter', 90, 0, 'Drafting IPhO preparation compendium document'),
    log(11, '2026-04-20', 'Chemistry', 'Organic Chemistry — reaction mechanisms overview', 50, 4),
    log(12, '2026-04-22', 'Physics', 'Irodov problems — wave motion and acoustics', 85, 9),
    log(13, '2026-04-23', 'Physics', 'Cosmos Lab — adding velocity vector drag launch', 100, 0, 'Implementing drag-to-launch satellite feature'),
    log(14, '2026-04-25', 'Physics', 'Electrostatics — Gauss law and field calculations', 80, 10),
    log(15, '2026-04-27', 'Mathematics', 'Vectors and 3D geometry problems', 55, 6),
    log(16, '2026-04-29', 'Physics', 'Electromagnetic induction — Faradays law', 75, 8),
    log(17, '2026-05-01', 'Physics', 'NSEP Tactical Cracker doc — past paper analysis', 60, 0, 'Writing NSEP preparation strategy document'),
    log(18, '2026-05-03', 'Physics', 'Optics — wave optics and interference', 90, 10),
    log(19, '2026-05-05', 'Mathematics', 'Calculus revision — limits, continuity, differentiability', 70, 8),
    log(20, '2026-05-07', 'Physics', 'Modern Physics — photoelectric effect and de Broglie', 80, 7),
    log(21, '2026-05-09', 'Physics', 'Cosmos Lab — N-body gravity toggle feature', 75, 0, 'Implementing mutual gravity between planets'),
    log(22, '2026-05-11', 'Physics', 'NSEP past papers 2023-24 — full paper attempt', 120, 40, 'Scored ~65% — weak in magnetism and thermodynamics'),
    log(23, '2026-05-12', 'Chemistry', 'Chemical Equilibrium — Le Chatelier principle', 50, 5),
    log(24, '2026-05-14', 'Physics', 'Packing for IIT Kharagpur — organized notes', 30, 0, 'Final prep before leaving for i-KITES program'),

    // Period 2: May 16 - June 26 (IIT Kharagpur i-KITES 42 days)
    log(25, '2026-05-16', 'General', 'i-KITES Arrival & Orientation — IIT Kharagpur', 120, 0, 'Arrived at IIT KGP campus. Hall of Residence assigned. Met programme coordinators.'),
    log(26, '2026-05-17', 'Physics', 'i-KITES Lecture — Classical Mechanics, Lagrangian dynamics', 180, 0, 'IIT KGP faculty lecture on Lagrangian and Hamiltonian mechanics'),
    log(27, '2026-05-18', 'Mathematics', 'i-KITES Lecture — Linear Algebra and matrix operations', 150, 10),
    log(28, '2026-05-19', 'Physics', 'i-KITES Lab — Electronics fundamentals, breadboard circuits', 120, 0),
    log(29, '2026-05-20', 'Chemistry', 'i-KITES Lecture — Physical Chemistry fundamentals', 150, 0),
    log(30, '2026-05-21', 'Physics', 'i-KITES Lecture — Fluid Mechanics and Bernoulli', 120, 5),
    log(31, '2026-05-22', 'Mathematics', 'i-KITES Problem Session — Calculus and ODEs', 90, 15),
    log(32, '2026-05-23', 'Physics', 'i-KITES Lecture — Electrodynamics and Maxwell equations', 180, 0),
    log(33, '2026-05-24', 'Physics', 'i-KITES Lab — Robotics intro, Arduino programming basics', 150, 0, 'Started DIY Arduino project — UV sensor build'),
    log(34, '2026-05-25', 'Mathematics', 'i-KITES Lecture — Differential equations and eigenvalues', 120, 8),
    log(35, '2026-05-26', 'Chemistry', 'i-KITES Lecture — Organic reaction mechanisms', 150, 0),
    log(36, '2026-05-27', 'Physics', 'i-KITES Lab — UV sensor circuit assembly', 120, 0, 'Soldering and integrating UV sensor with Arduino Uno'),
    log(37, '2026-05-28', 'Biology', 'i-KITES Seminar — Biophysics and molecular mechanics', 90, 0),
    log(38, '2026-05-29', 'Physics', 'i-KITES Problem Session — Wave mechanics and optics', 120, 12),
    log(39, '2026-05-30', 'Physics', 'i-KITES Lecture — Nuclear Physics and radioactive decay', 150, 0),
    log(40, '2026-05-31', 'Physics', 'i-KITES Lecture — Quantum Mechanics introduction', 180, 0, 'Schrödinger equation, particle in a box, wave-particle duality'),
    log(41, '2026-06-01', 'Physics', 'i-KITES Lab — Obstacle detection robot chassis assembly', 120, 0),
    log(42, '2026-06-02', 'Chemistry', 'i-KITES Lecture — Statistical Mechanics and kinetic theory', 150, 0),
    log(43, '2026-06-03', 'Physics', 'i-KITES Lecture — Special Relativity — time dilation, mass-energy', 150, 0),
    log(44, '2026-06-04', 'Mathematics', 'i-KITES Problem session — Complex numbers and transforms', 90, 10),
    log(45, '2026-06-05', 'Physics', 'i-KITES Lab — Motor driver coding for obstacle-avoidance robot', 120, 0),
    log(46, '2026-06-06', 'Physics', 'i-KITES Lecture — Astrophysics and stellar evolution', 150, 0),
    log(47, '2026-06-07', 'Chemistry', 'i-KITES Lecture — Electrochemistry and fuel cells', 120, 5),
    log(48, '2026-06-08', 'Physics', 'i-KITES Lab — UV sensor integration with display, coding alerts', 120, 0),
    log(49, '2026-06-09', 'Biology', 'i-KITES Seminar — DNA mechanics and bioinformatics intro', 90, 0),
    log(50, '2026-06-10', 'Physics', 'i-KITES Problem session — Electrodynamics numericals', 120, 14),
    log(51, '2026-06-11', 'Mathematics', 'i-KITES Lecture — Fourier analysis and signal processing', 150, 0),
    log(52, '2026-06-12', 'Physics', 'i-KITES Lab — 3D model design for robot casing (CAD)', 120, 0),
    log(53, '2026-06-13', 'Physics', 'i-KITES Lecture — Condensed Matter physics intro', 120, 0),
    log(54, '2026-06-14', 'Chemistry', 'i-KITES Lab — Spectroscopy experiment and data analysis', 120, 0),
    log(55, '2026-06-15', 'Physics', 'i-KITES Problem session — Quantum and Modern physics MCQs', 90, 18),
    log(56, '2026-06-16', 'Physics', 'i-KITES Lab — Line-follower robot — IR sensor calibration', 120, 0, 'Third project: line follower robot with IR sensors'),
    log(57, '2026-06-17', 'Mathematics', 'i-KITES Revision session — full syllabus problem set', 120, 20),
    log(58, '2026-06-18', 'General', 'i-KITES Project documentation and report writing', 90, 0),
    log(59, '2026-06-19', 'Physics', 'i-KITES Mock exam — full physics paper', 120, 35, 'Internal assessment exam at IIT KGP'),
    log(60, '2026-06-20', 'Physics', 'i-KITES Final project refinement — obstacle detection robot', 150, 0),
    log(61, '2026-06-21', 'General', 'i-KITES Lab — Final project testing and debugging', 120, 0),
    log(62, '2026-06-22', 'General', 'PRAVAH Science Fair preparation — poster and demo prep', 90, 0, 'PRAVAH is the i-KITES science showcase event'),
    log(63, '2026-06-23', 'General', 'PRAVAH Science Fair preparation — rehearsal', 60, 0),
    log(64, '2026-06-24', 'General', 'PRAVAH Science Showcase Day 1 — project demonstration', 180, 0, 'Showcased UV sensor and obstacle-avoidance robot at PRAVAH'),
    log(65, '2026-06-25', 'General', 'PRAVAH Science Showcase Day 2 — closing ceremony and awards', 120, 0),
    log(66, '2026-06-26', 'General', 'i-KITES Farewell — departure from IIT Kharagpur', 60, 0, 'End of residential program. Returning home.'),

    // Period 3: Jun 27 - Aug 29
    log(67, '2026-06-28', 'General', 'Rest and recovery after IIT KGP — organising notes', 30, 0),
    log(68, '2026-06-30', 'Physics', 'Review of i-KITES notes — Quantum Mechanics summary', 60, 0),
    log(69, '2026-07-02', 'Physics', 'Irodov problems — Optics chapter revisit', 75, 8),
    log(70, '2026-07-05', 'Physics', 'Electrodynamics — Electromagnetic waves and polarization', 80, 7),
    log(71, '2026-07-07', 'Mathematics', 'Calculus — integral applications and area under curves', 60, 8),
    log(72, '2026-07-09', 'Physics', 'Irodov — Thermodynamics and kinetic theory problems', 90, 10),
    log(73, '2026-07-11', 'Chemistry', 'Organic Chemistry — named reactions (Aldol, Cannizzaro)', 55, 5),
    log(74, '2026-07-13', 'Physics', 'Modern Physics — Atomic spectra and Bohr model', 70, 7),
    log(75, '2026-07-15', 'Physics', 'Wave mechanics — Standing waves and resonance', 65, 6),
    log(76, '2026-07-17', 'Mathematics', 'Complex numbers — polar form and de Moivre', 50, 5),
    log(77, '2026-07-19', 'Physics', 'Special Relativity — revision and problems', 80, 6),
    log(78, '2026-07-21', 'Physics', 'IPhO Compendium — Electrodynamics chapter writing', 90, 0),
    log(79, '2026-07-23', 'Chemistry', 'Chemical Kinetics — rate laws and Arrhenius equation', 60, 5),
    log(80, '2026-07-25', 'Physics', 'Irodov — Optics problems continued', 85, 9),
    log(81, '2026-07-26', 'Physics', 'NSEP 2024-25 past paper full attempt', 120, 40, 'Targeting Nov 2026 NSEP exam'),
    log(82, '2026-07-28', 'Physics', 'Irodov — Electrodynamics section problems', 90, 10),
    log(83, '2026-07-30', 'Mathematics', 'Statistics and probability — combinatorics for JEE', 55, 6),
    log(84, '2026-08-01', 'Physics', 'Mechanics revision — rotational dynamics full set', 90, 12),
    log(85, '2026-08-03', 'Chemistry', 'Inorganic Chemistry — p-block elements', 60, 5),
    log(86, '2026-08-05', 'Physics', 'Thermodynamics — entropy and second law deep dive', 80, 8),
    log(87, '2026-08-07', 'Mathematics', 'Matrices and determinants — applications', 65, 8),
    log(88, '2026-08-09', 'Physics', 'Irodov — Optics and photometry problems', 85, 10),
    log(89, '2026-08-11', 'Physics', 'Part of Cosmos — video script writing: Orbital Mechanics', 75, 0, 'Creating YouTube content for @part_of_cosmos'),
    log(90, '2026-08-13', 'Chemistry', 'Coordination Chemistry — naming and isomerism', 50, 4),
    log(91, '2026-08-15', 'Physics', 'Electrostatics and Magnetism — combined problems', 90, 10),
    log(92, '2026-08-17', 'Physics', 'NSEP Mock Test 1 — full paper under timed conditions', 120, 50, 'Scored 72% — improving on magnetism, weak on nuclear'),
    log(93, '2026-08-19', 'Mathematics', 'Trigonometry and inverse functions — advanced problems', 60, 7),
    log(94, '2026-08-21', 'General', 'NSEP 2026-27 Enrollment — registered on iapt.org.in', 30, 0, 'NSEP enrollment opens today. Registered successfully. Exam: Nov 22, 2026'),
    log(95, '2026-08-22', 'Physics', 'Nuclear Physics — radioactive decay chains and half-life', 75, 7),
    log(96, '2026-08-24', 'Physics', 'Irodov — Modern Physics and atomic problems', 90, 10),
    log(97, '2026-08-26', 'Chemistry', 'Electrochemistry — Nernst equation and galvanic cells', 60, 5),
    log(98, '2026-08-27', 'Physics', 'Wave Optics — diffraction and resolving power', 75, 8),
    log(99, '2026-08-28', 'Mathematics', 'Differential Equations & Vectors review', 80, 12),
    log(100, '2026-08-29', 'Physics', 'NSEP Mock Test 2 — full paper', 120, 50, 'Feeling stronger on optics and mechanics. Thermodynamics still needs work.')
  ];

  const goals: HistoricalGoal[] = [
    goal(
      1,
      'Qualify NSEP 2026-27 (INPhO Stage 1)',
      'Score in top 300 nationally in NSEP on Nov 22, 2026 to qualify for INPhO camp.',
      'Physics', '2026-11-22', 30,
      [
        { id: mkId('m', 1), text: 'Complete all Irodov problems (Mechanics + Optics)', done: false },
        { id: mkId('m', 2), text: 'Attempt 3 full NSEP past papers under timed conditions', done: true },
        { id: mkId('m', 3), text: 'Complete IPhO Compendium — Mechanics & Electrodynamics chapters', done: false },
        { id: mkId('m', 4), text: 'NSEP enrollment done (Aug 21)', done: true },
      ]
    ),
    goal(
      2,
      'Complete IIT KGP i-KITES 2026 Program',
      'Attend and complete the 6-week residential STEM program at IIT Kharagpur (May 16–Jun 26).',
      'General', '2026-06-26', 100,
      [
        { id: mkId('m', 5), text: 'Attend orientation and all week 1 lectures', done: true },
        { id: mkId('m', 6), text: 'Complete DIY Arduino UV sensor project', done: true },
        { id: mkId('m', 7), text: 'Complete obstacle-avoidance robot project', done: true },
        { id: mkId('m', 8), text: 'Present at PRAVAH Science Showcase', done: true },
        { id: mkId('m', 9), text: 'Complete farewell and departure on Jun 26', done: true },
      ]
    ),
    goal(
      3,
      'Build and Launch Cosmos Lab (debanjanbiswas.pages.dev/lab.html)',
      'Complete the interactive Newtonian orbit simulator and publish on personal portfolio.',
      'Physics', '2026-05-10', 100,
      [
        { id: mkId('m', 10), text: 'Core simulation engine with gravity', done: true },
        { id: mkId('m', 11), text: 'Drag-to-launch velocity vector feature', done: true },
        { id: mkId('m', 12), text: 'N-body mutual gravity toggle', done: true },
        { id: mkId('m', 13), text: 'Kepler 2nd law area sweep visualization', done: true },
        { id: mkId('m', 14), text: 'Deploy to Cloudflare Pages', done: true },
      ]
    ),
    goal(
      4,
      'Write IPhO Preparation Compendium',
      'Complete comprehensive IPhO study guide covering all major physics domains from first principles.',
      'Physics', '2026-11-01', 25,
      [
        { id: mkId('m', 15), text: 'Chapter 1: Classical Mechanics', done: true },
        { id: mkId('m', 16), text: 'Chapter 2: Electrodynamics', done: false },
        { id: mkId('m', 17), text: 'Chapter 3: Thermodynamics & Statistical Mechanics', done: false },
        { id: mkId('m', 18), text: 'Chapter 4: Optics & Waves', done: false },
        { id: mkId('m', 19), text: 'Chapter 5: Modern & Nuclear Physics', done: false },
      ]
    ),
    goal(
      5,
      'Grow Part of Cosmos YouTube channel to 500 subscribers',
      'Publish consistent physics content on @part_of_cosmos YouTube channel.',
      'General', '2026-12-31', 40,
      [
        { id: mkId('m', 20), text: 'Publish Orbital Mechanics explained video', done: false },
        { id: mkId('m', 21), text: 'Publish 5 IPhO problem walkthroughs', done: false },
        { id: mkId('m', 22), text: 'Launch Amazon KDP physics notes book', done: true },
      ]
    ),
    goal(
      6,
      'Score 90%+ in Class 11 Term 1 Finals',
      'Maintain strong CBSE academic performance at Bandhan School Aranghata alongside olympiad prep.',
      'General', '2026-09-30', 60,
      [
        { id: mkId('m', 23), text: 'Complete Term 1 syllabus for Physics, Chemistry, Math', done: true },
        { id: mkId('m', 24), text: 'Attempt all school unit tests', done: true },
        { id: mkId('m', 25), text: 'Score 90+ in Physics mid-term', done: false },
      ]
    ),
  ];

  const journalEntries: HistoricalJournal[] = [
    journal(1, '2026-04-14', 'Built Cosmos Lab — the orbit simulator is alive 🌍',
      'Spent 2 hours coding the Newtonian orbit simulator. When I finally got the planet to orbit the star correctly with the gravitational equation working, it felt unreal. This is real physics in code. Deploying it to my portfolio tomorrow.',
      5),
    journal(2, '2026-04-18', 'IPhO Compendium progress — starting to feel structured',
      "Started writing the IPhO compendium today. It's more work than expected but it's forcing me to actually understand things deeply rather than just solving problems. Mechanics chapter is taking shape.",
      4),
    journal(3, '2026-05-11', 'NSEP past paper attempt — honest assessment',
      'Did the full NSEP 2023-24 paper today. Got roughly 65%. Strong on mechanics and optics, weak on magnetism and thermodynamics. These two need serious work before November. At least I know where the gaps are.',
      3),
    journal(4, '2026-05-14', 'Tomorrow I leave for IIT Kharagpur 🚀',
      "Packed my bags. 6 weeks at IIT KGP. I honestly can't believe I got selected for i-KITES. The stipend, the accommodation, the IIT campus — it's happening. Going in with zero ego and maximum curiosity.",
      5),
    journal(5, '2026-05-16', 'Day 1 at IIT Kharagpur — surreal',
      'Arrived at IIT Kharagpur today. The campus is enormous. Met the other selected students — everyone is sharp. The orientation covered the program structure. Physics, Maths, Chemistry, Biology — all of it. Three DIY lab projects. This is going to be intense.',
      5),
    journal(6, '2026-05-31', 'Quantum Mechanics lecture hit different today',
      "The Schrödinger equation lecture today. The professor derived it from scratch — wave-particle duality to the full time-dependent equation. I've read about this before but hearing it derived live by a faculty who actually does quantum research changed how I see it. This is what IIT is.",
      5),
    journal(7, '2026-06-10', 'Mid-program check-in — am I learning or just surviving?',
      'Week 4 at IIT KGP. The pace is relentless. Three robot projects, daily lectures, problem sessions. I think I am learning a lot but it is hard to tell in the moment. The obstacle-avoidance robot is working now. UV sensor project done. One more project to go.',
      3),
    journal(8, '2026-06-24', 'PRAVAH Science Showcase — we presented today',
      "Showcased the UV sensor and the obstacle-avoidance robot at PRAVAH today. A lot of visitors, including some IIT faculty. The demonstration went well. Someone asked me to explain the PWM motor control and I actually explained it clearly. 6 weeks of work on display.",
      5),
    journal(9, '2026-06-26', 'Last day at IIT Kharagpur — leaving with more than I came with',
      '6 weeks. Over. I came in knowing physics reasonably well. I leave knowing what actual science culture feels like. The faculty, the campus, the peers, the late-night problem sessions. I am going back home a different version of myself. NSEP is the next target.',
      5),
    journal(10, '2026-07-26', 'NSEP 2026-27 is the mission now',
      'Attempted the NSEP 2024-25 paper today for practice. Scored better than before the i-KITES program — the mechanics and modern physics lectures at IIT KGP clearly helped. Enrollment opens August 21. November 22 is the date. That is the target.',
      4),
    journal(11, '2026-08-17', 'NSEP Mock Test 1 — 72%, nuclear still weak',
      'First full mock under timed exam conditions. 72%. Magnetism improved a lot — the electrodynamics foundations from IIT KGP are showing. Nuclear physics and radioactive decay chains are still rough. Need to drill those in the next 3 months.',
      4),
    journal(12, '2026-08-21', 'Registered for NSEP 2026-27 today',
      'Enrollment opened today on iapt.org.in. Registered. Name confirmed. Exam: November 22, 2026 at 8:30 AM. The countdown starts now. Every day from here until then is NSEP prep time.',
      5),
    journal(13, '2026-08-29', 'End of August — where I stand',
      'Two full mocks done. Mechanics: strong. Optics: strong. Electrostatics: good. Magnetism: improving. Thermodynamics: needs work. Nuclear: needs work. 3 months left. The IIT KGP program gave me the foundation — now I need to sharpen the edge. Going to finish Irodov Optics and Thermodynamics sections before September ends.',
      4),
  ];

  return { logs, goals, journalEntries };
}

export function seedDebanjanHistoryIfEmpty(uid: string) {
  try {
    const UID_KEY_LOGS    = `savantix_user_logs_${uid}`;
    const UID_KEY_GOALS   = `savantix_user_goals_${uid}`;
    const UID_KEY_JOURNAL = `savantix_user_journal_${uid}`;

    const seed = getDebanjanHistoricalSeedData(uid);

    const existingLogs: HistoricalLog[] = JSON.parse(localStorage.getItem(UID_KEY_LOGS) || '[]');
    const existingGoals: HistoricalGoal[] = JSON.parse(localStorage.getItem(UID_KEY_GOALS) || '[]');
    const existingJournal: HistoricalJournal[] = JSON.parse(localStorage.getItem(UID_KEY_JOURNAL) || '[]');

    const existingLogKeys = new Set(existingLogs.map(l => l.date + '_' + l.subject));
    const existingGoalKeys = new Set(existingGoals.map(g => g.title));
    const existingJournalKeys = new Set(existingJournal.map(j => j.date));

    const newLogs = seed.logs.filter(l => !existingLogKeys.has(l.date + '_' + l.subject));
    const newGoals = seed.goals.filter(g => !existingGoalKeys.has(g.title));
    const newJournal = seed.journalEntries.filter(j => !existingJournalKeys.has(j.date));

    const mergedLogs = [...newLogs, ...existingLogs];
    const mergedGoals = [...newGoals, ...existingGoals];
    const mergedJournal = [...newJournal, ...existingJournal];

    if (newLogs.length > 0) localStorage.setItem(UID_KEY_LOGS, JSON.stringify(mergedLogs));
    if (newGoals.length > 0) localStorage.setItem(UID_KEY_GOALS, JSON.stringify(mergedGoals));
    if (newJournal.length > 0) localStorage.setItem(UID_KEY_JOURNAL, JSON.stringify(mergedJournal));

    return { mergedLogs, mergedGoals, mergedJournal };
  } catch (err) {
    console.warn('Auto-seed error:', err);
    return null;
  }
}
