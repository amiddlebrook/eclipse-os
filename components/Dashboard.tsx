import React from 'react';
import { motion } from 'framer-motion';

const StatRow = ({ label, value, delay }: any) => {
    const MotionDiv = motion.div as any;
    return (
        <MotionDiv 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ delay, duration: 1 }}
            className="flex items-end justify-between border-b border-void-border py-6 group hover:border-white transition-colors cursor-crosshair"
        >
            <span className="text-sm font-mono text-void-dim group-hover:text-white transition-colors uppercase tracking-widest">{label}</span>
            <span className="text-2xl font-light text-white tracking-tighter">{value}</span>
        </MotionDiv>
    );
};

export const StatusSector: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div>
            <h3 className="text-void-dim font-mono text-xs tracking-widest mb-8 border-l border-void-dim pl-4">SYSTEM_HEALTH</h3>
            <StatRow label="CPU_CORE_01" value="98.2%" delay={0.4} />
            <StatRow label="MEMORY_ALLOC" value="12.4 GB" delay={0.5} />
            <StatRow label="NETWORK_LATENCY" value="24ms" delay={0.6} />
            <StatRow label="UPTIME" value="482:12:04" delay={0.7} />
        </div>
        
        <div className="flex flex-col justify-between">
            <h3 className="text-void-dim font-mono text-xs tracking-widest mb-8 border-l border-void-dim pl-4">ACTIVE_NODES</h3>
            <div className="flex-1 border border-void-border p-8 flex items-center justify-center relative overflow-hidden group">
                 {/* Visualizer Placeholder */}
                 <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                     {[...Array(10)].map((_,i) => (
                         <div key={i} className="w-2 bg-white h-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                     ))}
                 </div>
                 <span className="text-6xl font-light text-white z-10">42</span>
            </div>
        </div>
    </div>
  );
};