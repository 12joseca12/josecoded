import {
  ArrowRight,
  Briefcase,
  Clock,
  Download,
  Maximize2,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  Store,
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
  maximize: Maximize2,
  menu: Menu,
  'message-circle': MessageCircle,
  'package-check': PackageCheck,
  search: Search,
  store: Store,
  x: X,
} as const satisfies Record<IconName, LucideIcon>;
