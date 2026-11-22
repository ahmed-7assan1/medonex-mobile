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
