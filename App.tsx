import React, { useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { SectorID } from './types';
import { TheEclipse } from './components/SolarNavigation';
import { VoidPanel } from './components/ui/Card';

// Sectors
import { StatusSector } from './components/Dashboard';
import { GridSector } from './components/DataGrid';
import { SequenceSector } from './components/ProcessFlow';
import { MetricSector } from './components/ControlPanel';

const App: React.FC = () => {
  const [activeSector, setActiveSector] = useState<SectorID | null>(null);

  // When active, we mount the content inside the "ring" container visually
  // but architecturally, the Ring is in TheEclipse component, and content is overlayed.
  // We use Z-index to place content "inside" the active ring.

  return (
    <div className="h-screen w-screen bg-void-bg text-white relative overflow-hidden selection:bg-white selection:text-black">
      {/* Cinematic Grain Overlay */}
      <div className="noise-overlay" />

      <LayoutGroup>
        {/* Navigation & Ring Architecture */}
        <TheEclipse 
            activeSector={activeSector} 
            onActivate={setActiveSector} 
            onReset={() => setActiveSector(null)} 
        />

        {/* 
            Content Layer 
            Positioned absolutely in the center.
            It only renders when a sector is active.
            It sits visually "inside" the expanded ring border.
        */}
        <div className={`
            fixed inset-0 z-40 flex items-center justify-center pointer-events-none
            transition-all duration-500
        `}>
            {/* 
                We use a container that matches the expanded ring's dimensions (95vw, 90vh)
                to ensure content aligns with the border.
            */}
            <div className={`
                w-[95vw] h-[90vh] pointer-events-auto
                ${activeSector ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
                {activeSector === SectorID.STATUS && (
                    <VoidPanel title="System Status" isActive={activeSector === SectorID.STATUS}>
                        <StatusSector />
                    </VoidPanel>
                )}
                {activeSector === SectorID.GRID && (
                    <VoidPanel title="Node Grid" isActive={activeSector === SectorID.GRID}>
                        <GridSector />
                    </VoidPanel>
                )}
                {activeSector === SectorID.SEQUENCE && (
                    <VoidPanel title="Sequence" isActive={activeSector === SectorID.SEQUENCE}>
                        <SequenceSector />
                    </VoidPanel>
                )}
                {activeSector === SectorID.METRICS && (
                    <VoidPanel title="Metrics" isActive={activeSector === SectorID.METRICS}>
                        <MetricSector />
                    </VoidPanel>
                )}
            </div>
        </div>
      </LayoutGroup>
    </div>
  );
};

export default App;