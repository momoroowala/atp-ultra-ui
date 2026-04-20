// Icon imports - Add your Flaticon Lottie JSON files here
// Download animated icons from https://www.flaticon.com/animated-icons
// Save them as JSON files in this folder (src/assets/icons/)

// Example imports (uncomment and add your downloaded icons):
// import homeIcon from './home.json';
// import calendarIcon from './calendar.json';
// import videoIcon from './video.json';

import {
  Home,
  Calendar,
  Video,
  MessageCircle,
  Users,
  User,
  Lock,
  Unlock,
  Check,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Star,
  Trophy,
  Flame,
  Award,
  Crown,
  Edit,
  Trash2,
  Plus,
  Minus,
  Save,
  X,
  RefreshCw,
  FileText,
  Upload,
  Download,
  Image,
  Search,
  Bell,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Heart,
  Bookmark,
  Share,
  Link,
  Clock,
  PlayCircle,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Bot,
  Facebook,
  Target,
  type LucideIcon,
} from 'lucide-react';

// Lucide fallback icons - used when Lottie icons are not available
export const lucideFallbacks: Record<string, LucideIcon> = {
  // Navigation icons
  home: Home,
  calendar: Calendar,
  video: Video,
  chat: MessageCircle,
  courses: ClipboardList,

  // AI
  bot: Bot,

  // User icons
  user: User,
  users: Users,
  logout: LogOut,
  settings: Settings,
  shield: Shield,

  // Status icons
  lock: Lock,
  unlock: Unlock,
  check: Check,
  'check-circle': CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,

  // Gamification icons
  star: Star,
  trophy: Trophy,
  flame: Flame,
  badge: Award,
  award: Award,
  crown: Crown,

  // Action icons
  edit: Edit,
  delete: Trash2,
  plus: Plus,
  minus: Minus,
  save: Save,
  close: X,
  refresh: RefreshCw,

  // File icons
  file: FileText,
  'file-text': FileText,
  upload: Upload,
  download: Download,
  image: Image,

  // UI icons
  search: Search,
  bell: Bell,
  menu: Menu,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,

  // Misc
  heart: Heart,
  bookmark: Bookmark,
  share: Share,
  link: Link,
  clock: Clock,
  'play-circle': PlayCircle,
  
  // Social
  facebook: Facebook,
  
  // Tracker
  target: Target,
};

// Icon map - maps icon names to their Lottie data
// Set to null to use Lucide fallback, or add actual Lottie JSON imports
export const iconMap: Record<string, object | null> = {
  // Navigation icons - set to null to use Lucide fallbacks
  home: null,
  calendar: null,
  video: null,
  chat: null,
  courses: null,

  // AI
  bot: null,

  // User icons
  user: null,
  users: null,
  logout: null,
  settings: null,
  shield: null,

  // Status icons
  lock: null,
  unlock: null,
  check: null,
  'check-circle': null,
  warning: null,
  error: null,
  info: null,

  // Gamification icons
  star: null,
  trophy: null,
  flame: null,
  badge: null,
  award: null,
  crown: null,

  // Action icons
  edit: null,
  delete: null,
  plus: null,
  minus: null,
  save: null,
  close: null,
  refresh: null,

  // File icons
  file: null,
  'file-text': null,
  upload: null,
  download: null,
  image: null,

  // UI icons
  search: null,
  bell: null,
  menu: null,
  'chevron-down': null,
  'chevron-up': null,
  'chevron-left': null,
  'chevron-right': null,
  'arrow-left': null,
  'arrow-right': null,

  // Misc
  heart: null,
  bookmark: null,
  share: null,
  link: null,
  clock: null,
  'play-circle': null,
  
  // Social
  facebook: null,
  
  // Tracker
  target: null,
};

// Type for icon names
export type IconName = keyof typeof iconMap;

// Helper to check if an icon exists
export const hasIcon = (name: string): name is IconName => {
  return name in iconMap;
};

// Instructions for adding Flaticon animated icons:
// 1. Download Lottie JSON from Flaticon (https://www.flaticon.com/animated-icons)
// 2. Save the JSON file in src/assets/icons/ (e.g., home.json)
// 3. Import it at the top: import homeIcon from './home.json';
// 4. Replace null with the import: home: homeIcon,
