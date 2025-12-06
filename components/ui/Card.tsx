import React from 'react';
import { motion } from 'framer-motion';

interface VoidPanelProps {
  children: React.ReactNode;
  title: string;
  isActive: boolean;
}

export const VoidPanel: React.FC<VoidPanelProps> = ({ children, title, isActive }) => {
  const MotionDiv = motion.div as any;

  if (!isActive) return null;

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-full h-full flex flex-col p-8 md:p-12"
    >
      <div className="mb-8 border-b border-void-border pb-4 flex justify-between items-end">
        <h1 className="text-4xl md:text-6xl font-light tracking-tighter uppercase text-white">{title}</h1>
        <div className="text-xs font-mono text-void-dim tracking-widest">SYS.ACTIVE</div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {children}
      </div>
    </MotionDiv>
  );
};