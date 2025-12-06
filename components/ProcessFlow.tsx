import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
    { id: '01', title: 'INITIATE_HANDSHAKE', duration: '20ms' },
    { id: '02', title: 'VERIFY_INTEGRITY', duration: '140ms' },
    { id: '03', title: 'ESTABLISH_LINK', duration: '80ms' },
    { id: '04', title: 'TRANSFER_PACKET', duration: '1.2s' },
    { id: '05', title: 'TERMINATE', duration: '10ms' },
];

export const SequenceSector: React.FC = () => {
    const MotionDiv = motion.div as any;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-0 border-l border-void-border">
        {STEPS.map((step, i) => (
            <MotionDiv 
                key={step.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="group relative pl-8 py-8 border-b border-void-border/50 hover:bg-void-dim/10 transition-colors"
            >
                {/* Timeline Marker */}
                <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] bg-black border border-void-dim group-hover:bg-white transition-colors" />
                
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-xs text-void-dim">{step.id}</span>
                        <h4 className="text-xl font-light tracking-wide">{step.title}</h4>
                    </div>
                    <span className="font-mono text-xs text-white opacity-50 group-hover:opacity-100">{step.duration}</span>
                </div>
            </MotionDiv>
        ))}
    </div>
  );
};