import React from 'react';
import { motion } from 'framer-motion';
import { SectorID } from '../types';

interface TheEclipseProps {
  activeSector: SectorID | null;
  onActivate: (id: SectorID) => void;
  onReset: () => void;
}

export const TheEclipse: React.FC<TheEclipseProps> = ({ activeSector, onActivate, onReset }) => {
  const MotionDiv = motion.div as any;
  const MotionButton = motion.button as any;

  // The 4 sectors on the ring
  const sectors = [
    { id: SectorID.STATUS, label: 'STATUS', cx: '50%', cy: '10%' },
    { id: SectorID.GRID, label: 'GRID', cx: '90%', cy: '50%' },
    { id: SectorID.SEQUENCE, label: 'SEQ', cx: '50%', cy: '90%' },
    { id: SectorID.METRICS, label: 'DATA', cx: '10%', cy: '50%' },
  ];

  return (
    <>
      {/* 
        The Ring Container.
        In Idle: It is a small centered circle.
        In Active: It expands to the screen edges (viewport).
      */}
      <MotionDiv
        layoutId="eclipse-ring"
        className={`
           fixed z-40 border-2 border-white/90 shadow-glow
           flex items-center justify-center overflow-hidden
        `}
        initial={false}
        animate={{
            width: activeSector ? '95vw' : '300px',
            height: activeSector ? '90vh' : '300px',
            borderRadius: activeSector ? '24px' : '50%',
            left: '50%',
            top: '50%',
            x: '-50%',
            y: '-50%',
            backgroundColor: activeSector ? '#000000' : 'transparent'
        }}
        transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20,
            mass: 1
        }}
      >
          {/* Inner Content Mount Point */}
          {/* This is just a visual container for the ring border effect */}
      </MotionDiv>

      {/* 
        Navigation Triggers (Only visible when Idle) 
        We position them absolutely around the center.
      */}
      {!activeSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="relative w-[300px] h-[300px] pointer-events-auto">
                {/* Center Core */}
                <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full shadow-glow-lg animate-pulse-slow" />
                
                {sectors.map((sector) => (
                    <MotionButton
                        key={sector.id}
                        className="absolute w-20 h-20 flex items-center justify-center group"
                        style={{ 
                            left: sector.cx, 
                            top: sector.cy, 
                            x: '-50%', 
                            y: '-50%' 
                        }}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => onActivate(sector.id)}
                    >
                        <span className="text-xs font-mono tracking-[0.3em] text-void-dim group-hover:text-white transition-colors duration-300">
                            {sector.label}
                        </span>
                        {/* Hover Flare */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full blur-xl transition-all duration-300" />
                    </MotionButton>
                ))}
            </div>
        </div>
      )}

      {/* 
        Close Button (Only visible when Active) 
        Floats at the bottom center of the expanded ring
      */}
      {activeSector && (
          <MotionButton
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] text-xs font-mono tracking-widest text-void-dim hover:text-white transition-colors uppercase"
            onClick={onReset}
          >
              [ Close View ]
          </MotionButton>
      )}
    </>
  );
};