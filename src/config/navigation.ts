import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  BookOpen, 
  Settings, 
  Gamepad2, 
  BarChart3, 
  MessageCircle, 
  FileText,
  Target,
  BarChart2,
  MessageSquare
} from 'lucide-react';

export type EloraRole = 'teacher' | 'student' | 'parent';

export interface NavItem {
  id: string;
  label: string;
  href: (isDemo: boolean) => string;
  icon: any;
  isCopilot?: boolean;
  badge?: string;
  isActive?: (pathname: string, hash: string, isDemo: boolean) => boolean;
}

const getDashboardPath = (role: EloraRole, isDemo: boolean) => {
  if (isDemo) return `/${role}/demo`;
  return `/dashboard/${role}`;
};

export const navigationConfig: Record<EloraRole, NavItem[]> = {
  teacher: [
    { 
      id: 'overview', 
      label: 'Overview', 
      href: (isDemo) => getDashboardPath('teacher', isDemo) + '#overview',
      icon: LayoutDashboard,
      isActive: (p, h, isDemo) => p === getDashboardPath('teacher', isDemo) && (!h || h === '#overview')
    },
    { 
      id: 'copilot', 
      label: 'Copilot', 
      href: (isDemo) => isDemo ? '/teacher/demo/copilot' : '/teacher/copilot', 
      icon: Sparkles, 
      isCopilot: true,
      isActive: (p, _, isDemo) => p.startsWith(isDemo ? '/teacher/demo/copilot' : '/teacher/copilot')
    },
    { 
      id: 'classes', 
      label: 'My Classes', 
      href: (isDemo) => getDashboardPath('teacher', isDemo) + '#classes', 
      icon: BookOpen,
      isActive: (p, h, isDemo) => p === getDashboardPath('teacher', isDemo) && h === '#classes'
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      href: (isDemo) => getDashboardPath('teacher', isDemo) + '#assignments', 
      icon: FileText,
      isActive: (p, h, isDemo) => p === getDashboardPath('teacher', isDemo) && h === '#assignments'
    },
    { 
      id: 'practice', 
      label: 'Practice', 
      href: (isDemo) => getDashboardPath('teacher', isDemo) + '#practice', 
      icon: Target,
      isActive: (p, h, isDemo) => p === getDashboardPath('teacher', isDemo) && h === '#practice'
    },
    { 
      id: 'students', 
      label: 'Students', 
      href: (isDemo) => getDashboardPath('teacher', isDemo) + '#students', 
      icon: Users,
      isActive: (p, h, isDemo) => p === getDashboardPath('teacher', isDemo) && h === '#students'
    },
  ],
  student: [
    { 
      id: 'overview', 
      label: 'Overview', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#overview',
      icon: LayoutDashboard,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && (!h || h === '#overview')
    },
    { 
      id: 'copilot', 
      label: 'Copilot', 
      href: (isDemo) => isDemo ? '/student/demo/copilot' : '/student/copilot', 
      icon: Sparkles, 
      isCopilot: true,
      isActive: (p, _, isDemo) => p.startsWith(isDemo ? '/student/demo/copilot' : '/student/copilot')
    },
    { 
      id: 'practice', 
      label: 'Practice', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#practice', 
      icon: Target,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && h === '#practice'
    },
    { 
      id: 'quizzes', 
      label: 'Quizzes', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#quizzes', 
      icon: FileText,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && h === '#quizzes'
    },
    { 
      id: 'learn', 
      label: 'Learn', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#assignments', 
      icon: BookOpen,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && h === '#assignments'
    },
    { 
      id: 'games', 
      label: 'Games', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#games', 
      icon: Gamepad2,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && h === '#games'
    },
    { 
      id: 'progress', 
      label: 'Progress', 
      href: (isDemo) => getDashboardPath('student', isDemo) + '#reports', 
      icon: BarChart3,
      isActive: (p, h, isDemo) => p === getDashboardPath('student', isDemo) && h === '#reports'
    },
  ],
  parent: [
    { 
      id: 'overview', 
      label: 'Overview', 
      href: (isDemo) => getDashboardPath('parent', isDemo) + '#overview',
      icon: LayoutDashboard,
      isActive: (p, h, isDemo) => p === getDashboardPath('parent', isDemo) && (!h || h === '#overview')
    },
    { 
      id: 'copilot', 
      label: 'Copilot', 
      href: (isDemo) => isDemo ? '/parent/demo/copilot' : '/parent/copilot', 
      icon: Sparkles, 
      isCopilot: true,
      isActive: (p, _, isDemo) => p.startsWith(isDemo ? '/parent/demo/copilot' : '/parent/copilot')
    },
    { 
      id: 'children', 
      label: 'Children', 
      href: (isDemo) => getDashboardPath('parent', isDemo) + '#children', 
      icon: Users,
      isActive: (p, h, isDemo) => p === getDashboardPath('parent', isDemo) && h === '#children'
    },
    { 
      id: 'progress', 
      label: 'Progress & Reports', 
      href: (isDemo) => getDashboardPath('parent', isDemo) + '#progress', 
      icon: BarChart2,
      isActive: (p, h, isDemo) => p === getDashboardPath('parent', isDemo) && h === '#progress'
    },
    { 
      id: 'assignments', 
      label: 'Assignments & Quizzes', 
      href: (isDemo) => getDashboardPath('parent', isDemo) + '#assignments', 
      icon: FileText,
      isActive: (p, h, isDemo) => p === getDashboardPath('parent', isDemo) && h === '#assignments'
    },
    { 
      id: 'messages', 
      label: 'Messages', 
      href: (isDemo) => getDashboardPath('parent', isDemo) + '#messages', 
      icon: MessageSquare,
      isActive: (p, h, isDemo) => p === getDashboardPath('parent', isDemo) && h === '#messages'
    },
  ],
};
