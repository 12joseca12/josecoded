import {
  ArrowRight,
  Briefcase,
  Clock,
  Download,
  LogIn,
  LogOut,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  Search,
  Store,
  User,
  X,
} from 'lucide-react';

import type { IconName } from '@josecoded/types';
import type { LucideIcon } from 'lucide-react';

// Named imports only: the bundle carries exactly these glyphs. `IconName` (in @josecoded/types)
// and this table must list the same names; the compiler checks it.
export const icons = {
  'arrow-right': ArrowRight,
  briefcase: Briefcase,
  clock: Clock,
  download: Download,
  'log-in': LogIn,
  'log-out': LogOut,
  maximize: Maximize2,
  menu: Menu,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  'package-check': PackageCheck,
  search: Search,
  store: Store,
  user: User,
  x: X,
} as const satisfies Record<IconName, LucideIcon>;
