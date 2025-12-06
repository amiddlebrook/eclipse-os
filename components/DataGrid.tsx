import React from 'react';
import { motion } from 'framer-motion';

const NODES = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    status: Math.random() > 0.8 ? 'offline' : 'online'
}));

export const GridSector: React.FC = () => {
  const MotionDiv = motion.div as any;
  
  return (
    <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {NODES.map((node, i) => (
                <MotionDiv
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`
                        aspect-square border border-void-border 
                        flex items-center justify-center relative
                        hover:bg-white hover:text-black transition-colors duration-300
                        cursor-none
                    `}
                >
                    <span className="font-mono text-xs">{node.id.toString().padStart(2, '0')}</span>
                    {node.status === 'offline' && (
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full" />
                    )}
                </MotionDiv>
            ))}
        </div>
        
        <div className="mt-12 border-t border-void-border pt-8 flex justify-between font-mono text-xs text-void-dim">
            <span>GRID_STATUS: STABLE</span>
            <span>SYNC_RATE: 99.9%</span>
        </div>
    </div>
  );
};