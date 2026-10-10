'use client';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens, shouldAnimate } from './motion-tokens';

export function MeasurementVisual({ baseline, intervention }: {baseline?: number; intervention?: number}) {
  const reduced = useReducedMotion();
  const active = !reduced && shouldAnimate();
  const measured = baseline !== undefined && intervention !== undefined;
  const maximum = measured ? Math.max(baseline, intervention, .01) : 1;
  return <figure className={`measurement-visual ${measured?'measured':''}`}>
    <div className="instrument-heading"><span>{measured?'YOUR COLLECTED VOLUMES':'THE EXPERIMENT / A → B'}</span><span className="instrument-cross">＋</span></div>
    <svg viewBox="0 0 430 260" role="img" aria-label={measured?`Baseline ${baseline} litres, changed habit ${intervention} litres`:'Two measuring vessels with the same scale, ready for a baseline and changed-habit trial'}>
      <defs><pattern id="instrument-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d6d8cc" strokeWidth=".5"/></pattern></defs>
      <rect width="430" height="260" fill="url(#instrument-grid)"/>
      {[{x:75,label:'A',value:baseline,color:'#9aa88b'},{x:255,label:'B',value:intervention,color:'#b5cc75'}].map((v,i)=><g key={v.label}>
        <path d={`M${v.x-8} 34h116M${v.x} 34v174q0 14 14 14h72q14 0 14-14V34`} fill="#fffef7" stroke="#354a40" strokeWidth="1.5"/>
        {measured && <motion.rect x={v.x+4} y="52" width="92" height="166" rx="8" fill={v.color} style={{transformOrigin:'center bottom',transformBox:'fill-box'}} initial={{scaleY:active?0:Math.max((v.value??0)/maximum,.002)}} animate={{scaleY:Math.max((v.value??0)/maximum,.002)}} transition={{duration:active?motionTokens.duration.slow:motionTokens.duration.instant,ease:motionTokens.easing.smooth,delay:active?i*motionTokens.duration.fast:0}}/>}
        {[58,95,132,169].map(y=><path key={y} d={`M${v.x+80} ${y}h16`} stroke="#617161" strokeWidth="1"/>)}
        <text x={v.x+50} y="145" textAnchor="middle" className="vessel-letter">{v.label}</text>
        <text x={v.x+50} y="249" textAnchor="middle" className="vessel-caption">{i===0?'BASELINE':'CHANGED HABIT'}</text>
      </g>)}
      <path d="M190 127h42m-5-5 5 5-5 5" fill="none" stroke="#647658" strokeWidth="1.5"/>
    </svg>
    <figcaption>{measured?'Both vessels use one shared scale. Volumes come from your entries.':'Same task. Same finish line. Change one habit.'}</figcaption>
  </figure>;
}
