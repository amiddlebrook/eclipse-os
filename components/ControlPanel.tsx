import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

const DATA = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    val: Math.floor(Math.random() * 100)
}));

export const MetricSector: React.FC = () => {
  return (
    <div className="h-[400px] w-full border border-void-border p-4 relative group">
        <div className="absolute top-4 left-4 font-mono text-xs text-void-dim">REAL_TIME_FLUX</div>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA}>
                <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                    cursor={{ stroke: '#FFFFFF', strokeWidth: 1 }}
                />
                <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#FFFFFF" 
                    strokeWidth={1}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};