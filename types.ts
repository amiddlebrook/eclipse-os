export enum SectorID {
  STATUS = 'STATUS',
  GRID = 'GRID',
  SEQUENCE = 'SEQUENCE',
  METRICS = 'METRICS'
}

export interface SectorConfig {
  id: SectorID;
  label: string;
  quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}