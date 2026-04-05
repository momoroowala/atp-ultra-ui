import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentInterventionList } from './StudentInterventionList';

interface Props {
  metricType: string;
  students: any[];
  outreachMap: Record<string, string>;
  onStatusChange: (userId: string, metricType: string, status: string) => Promise<void>;
  children: React.ReactNode;
  hoverAccent?: string;
}

export function InterventionCardExpanded({ children }: Props) {
  return <>{children}</>;
}
