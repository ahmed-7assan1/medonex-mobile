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
