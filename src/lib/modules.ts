import { useQuery } from '@tanstack/react-query';
import { apiV1, ApiError } from './api';

/** /api/v1/modules/catalog response (MedQs0 catalog-types.ts). */
export interface ModuleWithStats {
  id: string;
  name: string;
  imageUrl: string | null;
  subjectsCount: number;
  lecturesCount: number;
  questionsCount: number;
  percentage: number;
}

export interface CatalogView {
  hasAnyModules: boolean;
  inProgressStats: ModuleWithStats[];
  completedStats: ModuleWithStats[];
  semesterGroups: { semesterId: string; name: string; yearNumber: number; modules: ModuleWithStats[] }[];
  totalModules: number;
  totalLectures: number;
  totalQuestions: number;
  overallPercent: number;
  sortedByLectures: ModuleWithStats[];
}

export interface ModulesCatalogResponse {
  isGuest: boolean;
  isAdmin: boolean;
  hasNoSemester: boolean;
  view: CatalogView;
  continueHref: string | null;
}

export function useModulesCatalog() {
  return useQuery({
    queryKey: ['modules-catalog'],
    queryFn: () => apiV1.get<ModulesCatalogResponse>('/modules/catalog'),
    staleTime: 5 * 60 * 1000,
  });
}

/** GET /api/v1/modules/[moduleId]/bundle response (MedQs0 bundle route). */
export interface BundleLecture {
  id: string;
  title: string;
  _count: { questions: number; flashcards: number };
}
export interface BundleSubject {
  id: string;
  name: string;
  icon: string | null;
  lectures: BundleLecture[];
}
export interface BundlePaper {
  id: string;
  title: string;
  timeLimitMin: number | null;
  isInteractive: boolean;
  _count: { attempts: number };
}
export interface ModuleBundle {
  module: {
    id: string;
    name: string;
    imageUrl: string | null;
    subjects: BundleSubject[];
    pastPapers: BundlePaper[];
  };
  correctBySubject: Record<string, string[]>;
  isAdmin: boolean;
  canonicalPath: string | null;
}

export function useModuleBundle(moduleId: string) {
  return useQuery({
    queryKey: ['module-bundle', moduleId],
    queryFn: () => apiV1.get<ModuleBundle>(`/modules/${encodeURIComponent(moduleId)}/bundle`),
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => !(err instanceof Error && 'status' in err && (err as { status: number }).status === 401) && count < 2,
  });
}
