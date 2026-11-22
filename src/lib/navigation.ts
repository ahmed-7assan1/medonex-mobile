import { Sparkles, Video, GraduationCap, Rocket, Globe, Users, Trophy, Mic2, FileText, Zap, User, Settings, Download, Info, Home, BookOpen, HelpCircle, type LucideIcon } from 'lucide-react-native';

export interface PageLink { href: string; en: string; ar: string; icon: LucideIcon }
/** Only implemented local routes are listed. New parity routes are added as they land. */
export const EXPLORE_LINKS: PageLink[] = [
  { href: '/ai-chat', en: 'AI Chat', ar: 'محادثة الذكاء الاصطناعي', icon: Sparkles },
  { href: '/drawmed', en: 'DrawMed', ar: 'الرسم الطبي', icon: Rocket },
  { href: '/atlas', en: 'Atlas', ar: 'الأطلس', icon: Globe },
  { href: '/teams', en: 'Teams', ar: 'الفرق', icon: Users },
  { href: '/podcasts', en: 'Podcasts', ar: 'البودكاست', icon: Mic2 },
  { href: '/taskat', en: 'Taskat', ar: 'المهام', icon: Zap },
  { href: '/profile', en: 'Profile', ar: 'الملف الشخصي', icon: User },
];
export const DRAWER_LINKS: PageLink[] = [
  { href: '/', en: 'Home', ar: 'الرئيسية', icon: Home },
  { href: '/modules', en: 'Library', ar: 'المكتبة', icon: BookOpen },
  { href: '/social', en: 'Community', ar: 'المجتمع', icon: Users },
  { href: '/qbank', en: 'QBank', ar: 'بنك الأسئلة', icon: HelpCircle },
  ...EXPLORE_LINKS,
  { href: '/downloads', en: 'Downloads', ar: 'التنزيلات', icon: Download },
  { href: '/settings', en: 'Settings', ar: 'الإعدادات', icon: Settings },
  { href: '/about', en: 'About', ar: 'عن المنصة', icon: Info },
  { href: '/founders', en: 'Founders', ar: 'المؤسسون', icon: Users },
];
