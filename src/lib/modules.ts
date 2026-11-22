import { useQuery } from '@tanstack/react-query';
import { apiV1 } from './api';

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
