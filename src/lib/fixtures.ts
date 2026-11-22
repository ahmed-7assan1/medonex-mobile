/** Fixture data for the pages phase (Ahmed, 22 Nov): every screen renders
 *  with realistic demo content until the wiring phase swaps in live API
 *  data. Shapes mirror the MedQs0 API responses exactly, so the swap is a
 *  data-source change only. */
import type { ModuleBundle } from './modules';

export const IS_DEMO = true;

const lec = (id: string, title: string, type: 'LECTURE' | 'PRACTICAL', q: number, files: number, order: number) => ({
  id,
  title,
  type,
  order,
  _count: { questions: q, flashcards: Math.round(q / 2) },
  files: Array.from({ length: files }, (_, i) => ({ id: `${id}-f${i}` })),
});

export const FIXTURE_MODULE_BUNDLE: ModuleBundle = {
  module: {
    id: 'demo',
    name: 'Anatomy & Embryology',
    imageUrl: null,
    subjects: [
      {
        id: 's-anat', name: 'Anatomy', icon: 'Bone',
        lectures: [
          lec('l1', 'Introduction to the Upper Limb', 'LECTURE', 24, 2, 1),
          lec('l2', 'The Shoulder Joint & Rotator Cuff', 'LECTURE', 31, 1, 2),
          lec('l3', 'Brachial Plexus Made Simple', 'LECTURE', 42, 3, 3),
          lec('l4', 'Nerve Injuries of the Upper Limb', 'LECTURE', 18, 0, 4),
          lec('l5', 'Cadaveric Dissection: Axilla', 'PRACTICAL', 8, 1, 5),
          lec('l6', 'Surface Anatomy of the Arm', 'PRACTICAL', 6, 0, 6),
        ],
      },
      {
        id: 's-histo', name: 'Histology', icon: 'Microscope',
        lectures: [
          lec('l7', 'Epithelial Tissue: Types & Function', 'LECTURE', 27, 2, 1),
          lec('l8', 'Connective Tissue Proper', 'LECTURE', 22, 1, 2),
          lec('l9', 'Cartilage & Bone Histology', 'LECTURE', 19, 2, 3),
          lec('l10', 'Slide Session: Skin & Glands', 'PRACTICAL', 10, 1, 4),
        ],
      },
      {
        id: 's-embryo', name: 'Embryology', icon: 'Dna',
        lectures: [
          lec('l11', 'Gametogenesis & Fertilization', 'LECTURE', 20, 1, 1),
          lec('l12', 'The First Three Weeks', 'LECTURE', 26, 2, 2),
          lec('l13', 'Folding of the Embryo', 'LECTURE', 14, 0, 3),
        ],
      },
      {
        id: 's-neuro', name: 'Neuroanatomy', icon: 'Brain',
        lectures: [],
      },
    ],
    pastPapers: [
      { id: 'p1', title: 'Anatomy Final 2025 — Upper Limb', timeLimitMin: 60, isInteractive: true, _count: { attempts: 342 } },
      { id: 'p2', title: 'Midterm Mock: Histology & Embryo', timeLimitMin: 40, isInteractive: true, _count: { attempts: 187 } },
      { id: 'p3', title: 'Anatomy Final 2024 (Legacy)', timeLimitMin: 90, isInteractive: false, _count: { attempts: 516 } },
    ],
  },
  correctBySubject: {
    's-anat': ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27', 'q28', 'q29', 'q30', 'q31', 'q32', 'q33', 'q34', 'q35', 'q36', 'q37', 'q38', 'q39', 'q40', 'q41', 'q42', 'q43', 'q44', 'q45', 'q46', 'q47', 'q48', 'q49', 'q50', 'q51', 'q52', 'q53', 'q54', 'q55', 'q56', 'q57', 'q58', 'q59', 'q60', 'q61', 'q62', 'q63', 'q64', 'q65', 'q66', 'q67', 'q68', 'q69', 'q70', 'q71', 'q72'],
    's-histo': ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20'],
    's-embryo': [],
  },
  isAdmin: false,
  canonicalPath: null,
};

/** Lecture detail fixture — mirrors getCachedLectureDetail (MedQs0). */
export const FIXTURE_LECTURE = {
  id: 'l1',
  title: 'Introduction to the Upper Limb',
  type: 'LECTURE' as const,
  subject: { id: 's-anat', name: 'Anatomy', module: { id: 'demo', name: 'Anatomy & Embryology' } },
  videos: [
    { id: 'v1', title: 'Upper Limb — Part 1: Bones & Landmarks', url: 'https://youtu.be/demo1', likesCount: 214, commentsCount: 31 },
    { id: 'v2', title: 'Upper Limb — Part 2: Muscles & Movements', url: 'https://youtu.be/demo2', likesCount: 168, commentsCount: 22 },
  ],
  records: [
    { id: 'r1', title: 'Rapid Revision — Upper Limb in 20 Minutes', url: 'https://youtu.be/demo3', sourceType: 'YOUTUBE' },
    { id: 'r2', title: 'Audio Recall: Brachial Plexus', url: 'https://open.spotify.com/demo', sourceType: 'SPOTIFY' },
  ],
  files: [
    { id: 'f1', name: 'Upper Limb — Lecture Slides.pdf', url: '#', mimeType: 'application/pdf' },
    { id: 'f2', name: 'Bones Summary Sheet.pdf', url: '#', mimeType: 'application/pdf' },
    { id: 'f3', name: 'Muscle Tables.docx', url: '#', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ],
  notesMarkdown: '# Upper Limb Overview\n\nThe upper limb is divided into **shoulder**, **arm**, **forearm** and **hand**.\n\n- The brachial plexus supplies the whole limb.\n- Key landmark: the surgical neck of the humerus.\n\n> Clinical note: axillary nerve injury affects abduction.',
  noteCardsMarkdown: '',
  flashcards: Array.from({ length: 18 }, (_, i) => ({ id: `fc${i}`, front: `Card ${i + 1} front`, back: `Card ${i + 1} back` })),
  questions: Array.from({ length: 24 }, (_, i) => ({ id: `q${i}`, body: `Question ${i + 1}`, questionType: 'MCQ', difficulty: 'MEDIUM' })),
  checklist: null as null | { items: { id: string; content: string; isCritical: boolean; points: number }[] },
};

export const FIXTURE_LECTURE_PRACTICAL = {
  ...FIXTURE_LECTURE,
  id: 'l5',
  title: 'Cadaveric Dissection: Axilla',
  type: 'PRACTICAL' as const,
  checklist: {
    items: [
      { id: 'c1', content: 'Identify the boundaries of the axilla', isCritical: false, points: 5 },
      { id: 'c2', content: 'Trace the axillary artery and its branches', isCritical: true, points: 10 },
      { id: 'c3', content: 'Demonstrate the cords of the brachial plexus', isCritical: true, points: 10 },
      { id: 'c4', content: 'Clean and reflect the pectoralis minor', isCritical: false, points: 5 },
    ],
  },
};

export function fixtureLecture(id: string) {
  return id === 'l5' || id === 'l6' ? FIXTURE_LECTURE_PRACTICAL : FIXTURE_LECTURE;
}

/* ─── Quiz player fixtures (mirror MedQs0 QuizClient Question shape) ─── */

export interface FixtureQuizQuestion {
  id: string;
  questionType: 'MCQ' | 'ESSAY';
  body: string;
  imageUrl?: string | null;
  choices: { key: string; text: string }[];
  answer: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface FixtureQuiz {
  id: string;
  title: string;
  timeLimitMin: number | null;
  questions: FixtureQuizQuestion[];
}

const mcq = (
  id: string,
  difficulty: FixtureQuizQuestion['difficulty'],
  body: string,
  choices: [string, string, string, string],
  answer: string,
  explanation: string,
): FixtureQuizQuestion => ({
  id,
  questionType: 'MCQ',
  body,
  choices: [
    { key: 'A', text: choices[0] },
    { key: 'B', text: choices[1] },
    { key: 'C', text: choices[2] },
    { key: 'D', text: choices[3] },
  ],
  answer,
  explanation,
  difficulty,
});

export const FIXTURE_QUIZ: FixtureQuiz = {
  id: 'demo',
  title: 'Upper Limb — Mock Paper 1',
  timeLimitMin: null,
  questions: [
    mcq('q1', 'EASY',
      'A patient presents with wrist drop after a midshaft humeral fracture. Which nerve is most likely injured in the spiral groove?',
      ['Radial nerve', 'Ulnar nerve', 'Median nerve', 'Axillary nerve'],
      'A',
      'The radial nerve winds around the posterior humerus in the spiral (radial) groove, so midshaft humeral fractures classically injure it, causing wrist drop.'),
    mcq('q2', 'MEDIUM',
      'Numbness of the lateral three and a half fingers with thenar wasting suggests compression of which structure?',
      ['Ulnar nerve at the cubital tunnel', 'Median nerve in the carpal tunnel', 'Radial nerve at the arcade of Frohse', 'Musculocutaneous nerve in the coracobrachialis'],
      'B',
      'Carpal tunnel syndrome compresses the median nerve under the flexor retinaculum, affecting the lateral 3½ digits and thenar muscles (LOAF).'),
    mcq('q3', 'HARD',
      'Erb-Duchenne palsy ("waiter\'s tip" posture) results from injury to which roots of the brachial plexus?',
      ['C8–T1', 'C5–C6', 'C7–C8', 'T1 only'],
      'B',
      'Excessive downward traction on the shoulder tears the upper trunk (C5–C6), paralyzing deltoid, biceps, and brachialis — the waiter\'s tip posture.'),
    mcq('q4', 'EASY',
      'The deltoid muscle is innervated by which nerve?',
      ['Axillary nerve', 'Radial nerve', 'Suprascapular nerve', 'Long thoracic nerve'],
      'A',
      'The axillary nerve (C5–C6) supplies the deltoid and teres minor, with sensation over the regimental badge area.'),
    mcq('q5', 'MEDIUM',
      'Which rotator cuff muscle initiates the first 15 degrees of arm abduction?',
      ['Infraspinatus', 'Teres minor', 'Subscapularis', 'Supraspinatus'],
      'D',
      'The supraspinatus (suprascapular nerve) initiates abduction; the deltoid continues it beyond 15 degrees.'),
    mcq('q6', 'HARD',
      'Klumpke\'s paralysis, often from upward traction of the arm, classically involves which structures?',
      ['Upper trunk C5–C6', 'Middle trunk C7', 'Lower trunk C8–T1', 'Posterior cord'],
      'C',
      'Lower trunk injury (C8–T1) paralyzes the intrinsic hand muscles and finger flexors — "claw hand" — and may include Horner syndrome.'),
    mcq('q7', 'MEDIUM',
      'The floor of the anatomical snuffbox is formed mainly by which bone?',
      ['Lunate', 'Scaphoid', 'Hamate', 'Pisiform'],
      'B',
      'The snuffbox floor is the scaphoid (and trapezium). Tenderness here after a fall on an outstretched hand suggests a scaphoid fracture.'),
    mcq('q8', 'EASY',
      'Which superficial vein of the upper limb begins at the lateral end of the dorsal venous arch?',
      ['Basilic vein', 'Cephalic vein', 'Median cubital vein', 'Axillary vein'],
      'B',
      'The cephalic vein starts laterally from the dorsal venous arch and runs in the deltopectoral groove to drain into the axillary vein.'),
  ],
};

/** Same paper for any id in the pages phase; wiring phase replaces this. */
export function fixtureQuiz(id: string): FixtureQuiz {
  return { ...FIXTURE_QUIZ, id };
}

/* ─── Taskat fixtures (DailyFocus tasks + curriculum checklist) ─── */

export interface FixtureTask {
  id: string;
  title: string;
  time?: string;
  lectureId?: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

export const FIXTURE_TASKS: FixtureTask[] = [
  { id: 't1', title: 'Study: Brachial Plexus Made Simple', time: '09:00 AM', lectureId: 'l3', priority: 'HIGH', completed: true },
  { id: 't2', title: 'Revise upper limb flashcards', time: '01:30 PM', priority: 'MEDIUM', completed: false },
  { id: 't3', title: 'Solve 20 MCQs — Nerve Injuries', time: '06:00 PM', lectureId: 'l4', priority: 'MEDIUM', completed: false },
  { id: 't4', title: 'Watch dissection recording (Axilla)', priority: 'LOW', completed: false },
];

/** Checklist completion per lecture id (mirrors activities[0].isCompleted). */
export const FIXTURE_COMPLETIONS: Record<string, boolean> = {
  l1: true, l2: true, l3: true, l4: false, l5: false, l6: false,
  l7: true, l8: false, l9: false, l10: false,
  l11: false, l12: false, l13: false,
};

/* ─── Teams fixtures (directory + team profile) ─── */

export interface FixtureTeam {
  id: string;
  name: string;
  description: string;
  faculty: string;
  followersCount: number;
  lectures: number;
  posts: number;
}

export const FIXTURE_TEAMS: FixtureTeam[] = [
  {
    id: 'team-1',
    name: 'Anatomy Warriors',
    description: 'Daily anatomy spotters, mnemonics and dissection-room tips. Curated by top-ranked students for practical exam mastery.',
    faculty: 'Medicine',
    followersCount: 1284,
    lectures: 46,
    posts: 312,
  },
  {
    id: 'team-2',
    name: 'Pharma Squad',
    description: 'Pharmacology made simple: drug cards, interaction alerts and weekly quizzes on high-yield medications.',
    faculty: 'Pharmacy',
    followersCount: 862,
    lectures: 31,
    posts: 198,
  },
  {
    id: 'team-3',
    name: 'Clinical Skills Hub',
    description: 'OSCE stations, history-taking frameworks and physical-exam checklists with peer practice sessions.',
    faculty: 'Medicine',
    followersCount: 643,
    lectures: 22,
    posts: 141,
  },
];

export const FIXTURE_TEAM_MEMBERS = [
  { userId: 'u1', name: 'Mariam Khaled', role: 'LEADER' },
  { userId: 'u2', name: 'Omar El-Sayed', role: 'ADMIN' },
  { userId: 'u3', name: 'Sara Mostafa', role: 'MEMBER' },
  { userId: 'u4', name: 'Youssef Adel', role: 'MEMBER' },
  { userId: 'u5', name: 'Nour Ibrahim', role: 'MEMBER' },
];

export const FIXTURE_TEAM_POSTS = [
  {
    id: 'tp1',
    content: 'New spotter set is up: 20 high-yield brachial plexus images. Solve them before Thursday\'s session and compare your answers in the comments.',
    imageUrl: null,
    attachments: [],
    author: { id: 'u1', name: 'Mariam Khaled', image: null },
    isAnonymous: false,
    forumId: 'team-1',
    forumName: 'Anatomy Warriors',
    isPinned: true,
    hashtags: ['anatomy', 'spotters'],
    reactionCounts: { like: 48, love: 12 },
    userReaction: null,
    commentCount: 17,
    shareCount: 3,
    isSaved: false,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tp2',
    content: 'Mnemonic of the week for the rotator cuff: SITS — Supraspinatus, Infraspinatus, Teres minor, Subscapularis. Save it for the practical!',
    imageUrl: null,
    attachments: [],
    author: { id: 'u2', name: 'Omar El-Sayed', image: null },
    isAnonymous: false,
    forumId: 'team-1',
    forumName: 'Anatomy Warriors',
    isPinned: false,
    hashtags: ['mnemonics'],
    reactionCounts: { like: 31 },
    userReaction: 'like',
    commentCount: 6,
    shareCount: 1,
    isSaved: true,
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
];

/* ── Profile (site: ProfileServerView) ─────────────────────────────── */

export type FixtureProfileStat = { label: string; value: string; accent?: boolean };

export type FixtureProfileUser = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  university: string;
  semester: string;
  rank: string;
  rankColor: string;
  streak: number;
  joined: string;
  verified: boolean;
  stats: FixtureProfileStat[];
  quizHistory: { id: string; title: string; score: number; date: string }[];
  achievements: { id: string; title: string; desc: string; unlocked: boolean }[];
};

export const FIXTURE_PROFILE_USERS: Record<string, FixtureProfileUser> = {
  'u1': {
    id: 'u1',
    name: 'Mariam Khaled',
    handle: 'mariam.k',
    bio: 'Year 4 med student @ Cairo University. Anatomy nerd, spotter-set curator for Anatomy Warriors. Coffee first, dissection second.',
    university: 'Cairo University',
    semester: 'Semester 7',
    rank: 'Expert',
    rankColor: '#E8C777',
    streak: 12,
    joined: 'September 2024',
    verified: true,
    stats: [
      { label: 'Experience points', value: '1,840', accent: true },
      { label: 'Completed quizzes', value: '96' },
      { label: 'Average accuracy', value: '87%' },
      { label: 'Followers', value: '342' },
    ],
    quizHistory: [
      { id: 'qh1', title: 'Brachial Plexus Spotters', score: 92, date: '2 days ago' },
      { id: 'qh2', title: 'Upper Limb Anatomy — Midterm Set', score: 85, date: '5 days ago' },
      { id: 'qh3', title: 'Cardiac Cycle Rapid Review', score: 78, date: '1 week ago' },
    ],
    achievements: [
      { id: 'a1', title: 'Spotter Master', desc: '50 anatomy spotter sets solved', unlocked: true },
      { id: 'a2', title: 'On Fire', desc: '10-day study streak', unlocked: true },
      { id: 'a3', title: 'Team Player', desc: '100 helpful community posts', unlocked: true },
      { id: 'a4', title: 'Perfectionist', desc: '100% on any full exam', unlocked: false },
    ],
  },
  me: {
    id: 'me',
    name: 'Ahmed Hassan',
    handle: 'ahmed.hassan',
    bio: 'Founder of MedOneX. Med student building the study tools I always wanted.',
    university: 'Cairo University',
    semester: 'Semester 5',
    rank: 'Contributor',
    rankColor: '#7CC4FF',
    streak: 5,
    joined: 'January 2025',
    verified: true,
    stats: [
      { label: 'Experience points', value: '620', accent: true },
      { label: 'Completed quizzes', value: '41' },
      { label: 'Average accuracy', value: '81%' },
      { label: 'Followers', value: '128' },
    ],
    quizHistory: [
      { id: 'qh1', title: 'Anatomy Quick Drill', score: 88, date: '1 day ago' },
      { id: 'qh2', title: 'Physiology Basics Set', score: 74, date: '4 days ago' },
    ],
    achievements: [
      { id: 'a1', title: 'First Steps', desc: 'Completed your first quiz', unlocked: true },
      { id: 'a2', title: 'On Fire', desc: '10-day study streak', unlocked: false },
    ],
  },
};

export const FIXTURE_PROFILE_POSTS: Record<string, typeof FIXTURE_TEAM_POSTS> = {
  u1: [FIXTURE_TEAM_POSTS[0], FIXTURE_TEAM_POSTS[1]],
  me: [FIXTURE_TEAM_POSTS[1]],
};

/* ── Dr Q chat (site: DrQChat) ─────────────────────────────────────── */

export type FixtureChatMessage = { id: string; role: 'user' | 'assistant'; text: string; time: string };

export const FIXTURE_DRQ_MESSAGES: FixtureChatMessage[] = [
  { id: 'm1', role: 'user', text: 'Explain the renin-angiotensin-aldosterone system in simple steps', time: '09:41' },
  {
    id: 'm2', role: 'assistant',
    text: 'Think of RAAS as the body\'s blood-pressure rescue team:\n\n1. Low pressure or low Na⁺ at the kidney → juxtaglomerular cells release **renin**.\n2. Renin converts angiotensinogen (from the liver) into **angiotensin I**.\n3. ACE in the lungs converts it into **angiotensin II** — the main actor.\n4. Angiotensin II vasoconstricts, triggers **aldosterone** (Na⁺ and water retention), ADH release, and thirst.\n\nNet effect: higher volume + higher resistance = pressure restored.',
    time: '09:41',
  },
  { id: 'm3', role: 'user', text: 'Give me one quick MCQ on it', time: '09:42' },
  {
    id: 'm4', role: 'assistant',
    text: 'A drug blocks ACE. Which change do you expect?\n\nA) ↑ Angiotensin II\nB) ↓ Aldosterone\nC) ↑ Blood pressure\nD) ↓ Renin\n\n**Answer: B** — no ACE means no angiotensin II, so aldosterone falls (and renin actually rises by feedback).',
    time: '09:42',
  },
];

export const FIXTURE_DRQ_SUGGESTIONS = [
  'Explain the cardiac action potential',
  'Quiz me on antibiotics',
  'Summarize the nephron in 5 points',
];

/* ── Atlas (site: atlas/page.tsx) ──────────────────────────────────── */

export type FixtureAtlasSystem = {
  systemId: string; label: string; desc: string; iconName: string; iconColor: string;
};

export type FixtureAtlasStructure = {
  id: string; slug: string; name: string; latin?: string; type: string; desc: string;
  region?: string; systemId: string; fn?: string; blood?: string; nerve?: string;
  relations?: string[]; clinical?: string;
};

export const FIXTURE_ATLAS_SYSTEMS: FixtureAtlasSystem[] = [
  { systemId: 'skeletal', label: 'Skeletal', desc: 'Bones, joints and the axial/appendicular framework', iconName: 'bone', iconColor: '#2DD4BF' },
  { systemId: 'muscular', label: 'Muscular', desc: 'Skeletal muscles, compartments and actions', iconName: 'dumbbell', iconColor: '#F87171' },
  { systemId: 'nervous', label: 'Nervous', desc: 'Brain, spinal cord, plexuses and peripheral nerves', iconName: 'brain', iconColor: '#C084FC' },
  { systemId: 'cardio', label: 'Cardiovascular', desc: 'Heart, great vessels and arterial trees', iconName: 'heart', iconColor: '#FB7185' },
  { systemId: 'respiratory', label: 'Respiratory', desc: 'Airways, lungs and the pleural cavities', iconName: 'wind', iconColor: '#38BDF8' },
  { systemId: 'digestive', label: 'Digestive', desc: 'GI tract, liver, pancreas and peritoneum', iconName: 'utensils', iconColor: '#34D399' },
];

export const FIXTURE_ATLAS_STRUCTURES: FixtureAtlasStructure[] = [
  {
    id: 'st1', slug: 'humerus', name: 'Humerus', latin: 'Humerus', type: 'bone', systemId: 'skeletal',
    region: 'Upper limb', desc: 'The longest bone of the upper limb, articulating with the scapula at the shoulder and the radius/ulna at the elbow.',
    fn: 'Lever for arm movement; attachment for deltoid, pectoralis major, rotator cuff muscles.',
    blood: 'Anterior & posterior humeral circumflex arteries; profunda brachii.',
    nerve: 'Axillary nerve (surgical neck), radial nerve (spiral groove) at risk in fractures.',
    relations: ['Scapula', 'Radius', 'Ulna'],
    clinical: 'Mid-shaft fracture endangers the radial nerve in the spiral groove → wrist drop.',
  },
  {
    id: 'st2', slug: 'scapula', name: 'Scapula', latin: 'Scapula', type: 'bone', systemId: 'skeletal',
    region: 'Shoulder girdle', desc: 'Flat triangular bone on the posterolateral thorax carrying the glenoid cavity.',
    fn: 'Socket for the humeral head; origin/insertion for 17 muscles.',
    relations: ['Humerus', 'Clavicle'],
  },
  {
    id: 'st3', slug: 'biceps-brachii', name: 'Biceps Brachii', latin: 'Musculus biceps brachii', type: 'muscle', systemId: 'muscular',
    region: 'Anterior arm', desc: 'Two-headed muscle of the anterior compartment of the arm.',
    fn: 'Powerful supinator of the forearm; flexes the elbow; weak shoulder flexor.',
    blood: 'Brachial artery.', nerve: 'Musculocutaneous nerve (C5–C7).',
    clinical: 'Rupture of the long head tendon produces the "Popeye" deformity.',
  },
  {
    id: 'st4', slug: 'brachial-plexus', name: 'Brachial Plexus', type: 'nerve', systemId: 'nervous',
    region: 'Neck / axilla', desc: 'Network formed by ventral rami C5–T1 supplying the entire upper limb.',
    fn: 'Motor and sensory innervation of the upper limb (roots → trunks → divisions → cords → branches).',
    clinical: 'Erb palsy (C5–C6): "waiter\'s tip" hand; Klumpke palsy (C8–T1): claw hand.',
  },
  {
    id: 'st5', slug: 'heart', name: 'Heart', latin: 'Cor', type: 'organ', systemId: 'cardio',
    region: 'Middle mediastinum', desc: 'Four-chambered muscular pump inside the pericardium, two-thirds left of the midline.',
    fn: 'Pumps systemic and pulmonary circuits; intrinsic conduction via SA → AV node → His–Purkinje.',
    blood: 'Right & left coronary arteries from the ascending aorta.',
    nerve: 'Cardiac plexus (sympathetic T1–T5, parasympathetic vagus).',
    clinical: 'LAD occlusion → anterior wall MI, the classic "widow maker".',
  },
  {
    id: 'st6', slug: 'lung', name: 'Lung', latin: 'Pulmo', type: 'organ', systemId: 'respiratory',
    region: 'Thoracic cavity', desc: 'Paired spongy organs of respiration; the right has 3 lobes, the left 2 with the cardiac notch.',
    fn: 'Gas exchange across ~70 m² of alveolar surface.',
    blood: 'Pulmonary arteries (deoxygenated) + bronchial arteries (systemic supply).',
    clinical: 'Pleural effusion collects first in the costodiaphragmatic recess when upright.',
  },
  {
    id: 'st7', slug: 'liver', name: 'Liver', latin: 'Hepar', type: 'organ', systemId: 'digestive',
    region: 'Right upper quadrant', desc: 'Largest internal organ, under the diaphragm, with dual blood supply.',
    fn: 'Bile production, metabolism, detoxification, storage of glycogen and vitamins.',
    blood: 'Hepatic portal vein (75%) + proper hepatic artery (25%).',
    nerve: 'Hepatic plexus (sympathetic + vagal).',
    clinical: 'Portal hypertension → caput medusae, splenomegaly, esophageal varices.',
  },
  {
    id: 'st8', slug: 'radius', name: 'Radius', latin: 'Radius', type: 'bone', systemId: 'skeletal',
    region: 'Forearm', desc: 'Lateral forearm bone, wide distally at the wrist.',
    relations: ['Humerus', 'Ulna'],
    clinical: 'Colles fracture: distal radius fracture with dorsal displacement ("dinner fork").',
  },
];

/* ── Secondary pages (about / founders / podcasts / downloads / drawmed) ── */

export const FIXTURE_PLATFORM_TEAM = [
  {
    id: 'tm1', name: 'Ahmed Hassan', role: 'Founder & Lead Developer',
    description: 'Medical student with a passion for software engineering. Built MedOneX to revolutionize medical education.',
    icon: 'code', color: '#A78BFA', bg: '#A78BFA1A',
  },
  {
    id: 'tm2', name: 'Dr. Q AI', role: 'Chief Medical Intelligence',
    description: 'An advanced AI system fine-tuned to answer medical queries, generate quizzes, and assist students 24/7.',
    icon: 'sparkles', color: '#FBBF24', bg: '#FBBF241A',
  },
];

export const FIXTURE_EPISODES = [
  { id: 'ep1', title: 'Cardiac Cycle in 20 Minutes', show: 'Physiology Bites', duration: '21:14', date: '2 days ago', plays: '4.2k' },
  { id: 'ep2', title: 'Antibiotics You Must Know', show: 'Pharma Fridays', duration: '34:02', date: '5 days ago', plays: '3.1k' },
  { id: 'ep3', title: 'Brachial Plexus Made Easy', show: 'Anatomy Lounge', duration: '27:48', date: '1 week ago', plays: '2.8k' },
  { id: 'ep4', title: 'Acid-Base Without Tears', show: 'Physiology Bites', duration: '18:37', date: '2 weeks ago', plays: '5.6k' },
];

export const FIXTURE_DOWNLOADS = [
  { id: 'dl1', name: 'Cardiology — Full Summary.pdf', group: 'PDF', size: '4.8 MB', date: 'Today' },
  { id: 'dl2', name: 'Brachial Plexus Diagram.png', group: 'IMAGE', size: '1.2 MB', date: 'Yesterday' },
  { id: 'dl3', name: 'Cardiac Cycle — Lecture 4.mp4', group: 'LECTURE', size: '182 MB', date: '2 days ago' },
  { id: 'dl4', name: 'Pharmacology Tables.pdf', group: 'PDF', size: '2.1 MB', date: 'Last week' },
  { id: 'dl5', name: 'Renal Physiology — Lecture 2.mp4', group: 'LECTURE', size: '156 MB', date: 'Last week' },
];
