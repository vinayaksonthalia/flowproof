'use client';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from './motion-tokens';

export function MeasurementVisual({ baseline, intervention, reveal = false }: {baseline?: number; intervention?: number; reveal?: boolean}) {
  const reduced = useReducedMotion();
  const active = !reduced;
  const measured = baseline !== undefined || intervention !== undefined;
  const maximum = Math.max(baseline ?? 0, intervention ?? 0, 1);
  const label = (value?: number) => value === undefined ? 'Awaiting entry' : `${value.toLocaleString(undefined,{maximumFractionDigits:4})} L entered`;
  return <figure className={`measurement-visual ${measured?'measured':''}`}>
    <div className="instrument-heading"><span>{measured?'ENTERED TOTAL VOLUMES / A → B':'THE EXPERIMENT / A → B'}</span><span className="instrument-cross">＋</span></div>
    <svg viewBox="0 0 430 260" role="img" aria-label={measured?`Relative comparison on one scale: baseline ${label(baseline)}, changed habit ${label(intervention)}. Scale zero to ${maximum} litres.`:'Two empty comparison vessels, ready for baseline and changed-habit entries'}>
      <defs><pattern id="instrument-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d6d8cc" strokeWidth=".5"/></pattern></defs>
      <rect width="430" height="260" fill="url(#instrument-grid)"/>
      {[{x:75,label:'A',value:baseline,color:'#9aa88b'},{x:255,label:'B',value:intervention,color:'#b5cc75'}].map((v,i)=><g key={v.label}>
        <path d={`M${v.x-8} 34h116M${v.x} 34v174q0 14 14 14h72q14 0 14-14V34`} fill="#fffef7" stroke="#354a40" strokeWidth="1.5"/>
        {v.value !== undefined && <motion.rect x={v.x+4} y="52" width="92" height="166" rx="8" fill={v.color} style={{transformOrigin:'center bottom',transformBox:'fill-box'}} initial={{scaleY:active&&reveal?0:Math.max(v.value/maximum,.002)}} animate={{scaleY:Math.max(v.value/maximum,.002)}} transition={{duration:active?(reveal?motionTokens.duration.slow:motionTokens.duration.fast):motionTokens.duration.instant,ease:motionTokens.easing.smooth,delay:active&&reveal?i*motionTokens.duration.fast:0}}/>}
        {[58,95,132,169].map(y=><path key={y} d={`M${v.x+80} ${y}h16`} stroke="#617161" strokeWidth="1"/>)}
        <text x={v.x+50} y="145" textAnchor="middle" className="vessel-letter">{v.label}</text>
        <text x={v.x+50} y="249" textAnchor="middle" className="vessel-caption">{i===0?'BASELINE':'CHANGED HABIT'}</text>
        {measured && <text x={v.x+50} y="20" textAnchor="middle" className="vessel-caption">{v.value===undefined?'—':`${v.value.toLocaleString(undefined,{maximumFractionDigits:4})} L`}</text>}
      </g>)}
      <path d="M190 127h42m-5-5 5 5-5 5" fill="none" stroke="#647658" strokeWidth="1.5"/>
      {measured && <><text x="24" y="55" className="vessel-caption">{maximum.toLocaleString(undefined,{maximumFractionDigits:2})} L</text><text x="24" y="221" className="vessel-caption">0</text></>}
    </svg>
    <figcaption>{measured?`Relative scale: 0–${maximum.toLocaleString(undefined,{maximumFractionDigits:2})} L, across all fills. Values are entered by you, not independently verified.`:'Same task. Same finish line. Change one habit.'}</figcaption>
  </figure>;
}
