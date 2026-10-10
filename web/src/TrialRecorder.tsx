'use client';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from './motion-tokens';
import './recorder.css';
export type Capture = {method:'manual'} | {method:'vessel_tally';fullVessels:number;remainderLitres:number};
export type Trial = {litres:number;durationSeconds:number;durationSource?:'timer'|'manual';spillage:boolean;completed:boolean;unitsCompleted:number;capture?:Capture};
type Props = {index:number;label:string;caption:string;value:Trial;setValue:Dispatch<SetStateAction<Trial>>;vesselLitres:number;unitsCount:number;completedTask:boolean;onRunningChange:(running:boolean)=>void};
function total(full:number,remainder:number,vessel:number){return Math.round((full*vessel+remainder)*10000)/10000;}
export function TrialRecorder({index,label,caption,value,setValue,vesselLitres,unitsCount,completedTask,onRunningChange}:Props){
  const reduced=useReducedMotion();
  const [running,setRunning]=useState(false);
  const timerStart=useRef(0);const accumulated=useRef(0);
  const tally=value.capture?.method==='vessel_tally';
  const full=value.capture?.method==='vessel_tally'?value.capture.fullVessels:0;
  const remainder=value.capture?.method==='vessel_tally'?value.capture.remainderLitres:0;
  useEffect(()=>{setValue(previous=>previous.capture?.method==='vessel_tally'?{...previous,litres:total(previous.capture.fullVessels,previous.capture.remainderLitres,vesselLitres)}:previous);},[vesselLitres,setValue]);
  useEffect(()=>{if(!running)return;const timer=window.setInterval(()=>{const elapsed=accumulated.current+(performance.now()-timerStart.current)/1000;setValue(previous=>({...previous,durationSeconds:Math.round(elapsed)}));},250);return()=>window.clearInterval(timer);},[running,setValue]);
  function start(){accumulated.current=value.durationSource==='timer'&&Number.isFinite(value.durationSeconds)?value.durationSeconds:0;timerStart.current=performance.now();setValue(previous=>({...previous,durationSeconds:Math.round(accumulated.current),durationSource:'timer'}));setRunning(true);onRunningChange(true);}
  function stop(){const elapsed=accumulated.current+(performance.now()-timerStart.current)/1000;setValue(previous=>({...previous,durationSeconds:Math.max(1,Math.round(elapsed)),durationSource:'timer'}));setRunning(false);onRunningChange(false);}
  function updateTally(nextFull:number,nextRemainder:number){setValue(previous=>({...previous,capture:{method:'vessel_tally',fullVessels:nextFull,remainderLitres:nextRemainder},litres:total(nextFull,nextRemainder,vesselLitres)}));}
  const duration=Math.max(0,Math.round(value.durationSeconds||0));
  const clock=`${String(Math.floor(duration/60)).padStart(2,'0')}:${String(duration%60).padStart(2,'0')}`;
  return <fieldset className="trial recorder"><legend><span>0{index+1}</span> {label}</legend><p className="recorder-caption">{caption}</p>
    <div className="recorder-step"><span>01</span><strong>Collect every drop</strong></div>
    <div className="capture-selector" role="radiogroup" aria-label={`${label} measurement method`}>
      <label><input type="radio" name={`capture-${index}`} checked={tally} onChange={()=>updateTally(0,0)}/>Count vessel fills</label>
      <label><input type="radio" name={`capture-${index}`} checked={!tally} onChange={()=>setValue(previous=>({...previous,capture:{method:'manual'}}))}/>Enter total litres</label>
    </div>
    {tally?<><div className="fill-counter"><span>Full {vesselLitres} L vessels</span><div><button type="button" aria-label={`Remove one full vessel from ${label}`} disabled={full<=0} onClick={()=>updateTally(Math.max(0,full-1),remainder)}>−</button><output aria-label={`${label} full vessel count`}>{full}</output><button type="button" aria-label={`Add one full vessel to ${label}`} onClick={()=>updateTally(full+1,remainder)}>+</button></div></div><label>Water in the last partial vessel (L)<input type="number" min="0" max={Math.max(0,vesselLitres-.0001)} step="any" inputMode="decimal" value={Number.isFinite(remainder)?remainder:''} onChange={e=>updateTally(full,e.target.value===''?0:e.target.valueAsNumber)}/></label><p className="recorder-hint">After the task, measure the basin water. Empty each measured jug away from the catch basin so it cannot be counted twice. Use the jug’s marked precision for the final partial amount below {vesselLitres} L.</p><div className="derived-total"><span>TOTAL ENTERED</span><motion.output key={value.litres} initial={{opacity:0,y:reduced?0:motionTokens.distance.xs}} animate={{opacity:1,y:0}} transition={{duration:reduced?motionTokens.duration.instant:motionTokens.duration.fast,ease:motionTokens.easing.smooth}}>{Number.isFinite(value.litres)?value.litres.toLocaleString(undefined,{maximumFractionDigits:4}):'—'} <small>L</small></motion.output><span>{full} × {vesselLitres} L + {remainder || 0} L</span></div></>:<label>Total water collected (L)<input type="number" min="0.0001" step="any" inputMode="decimal" placeholder="e.g. 3.5" value={value.litres||''} onChange={e=>setValue(previous=>({...previous,litres:e.target.valueAsNumber}))}/></label>}
    <div className="recorder-step"><span>02</span><strong>Time the whole task</strong></div>
    <div className={`task-timer ${running?'running':''}`}><output aria-label={`${label} elapsed time`}>{clock}</output><span>{running?'TIMER RUNNING':'MIN : SEC'}</span><div className="timer-actions"><button type="button" className="timer-primary" onClick={running?stop:start}>{running?'■ Stop':duration?'▶ Resume':'▶ Start timer'}</button><button type="button" disabled={running} onClick={()=>{setValue(previous=>({...previous,durationSeconds:0}));accumulated.current=0;}}>Reset</button></div></div>
    <details className="duration-fallback"><summary>Enter time manually</summary><label>Duration (seconds)<input type="number" min="1" step="1" disabled={running} placeholder="e.g. 90" value={value.durationSeconds||''} onChange={e=>setValue(previous=>({...previous,durationSeconds:e.target.valueAsNumber,durationSource:'manual'}))}/></label></details>
    <div className="recorder-step"><span>03</span><strong>Check the finish</strong></div>
    {completedTask&&<><label>Items completed<input type="number" min="0" max={unitsCount} step="1" placeholder={`of ${unitsCount}`} value={value.unitsCompleted||''} onChange={e=>setValue(previous=>({...previous,unitsCompleted:e.target.valueAsNumber}))}/></label><label className="checkbox"><input type="checkbox" checked={value.completed} onChange={e=>setValue(previous=>({...previous,completed:e.target.checked}))}/> All items meet the finish line</label></>}
    <label className="checkbox"><input type="checkbox" checked={value.spillage} onChange={e=>setValue(previous=>({...previous,spillage:e.target.checked}))}/> Water spilled or escaped collection</label>
    {value.spillage&&<p className="trial-warning" role="status">Repeat this trial. Missing water makes the comparison unusable.</p>}
    <p className="recorder-hint source-note">Entered by you · Self-reported measurement</p>
  </fieldset>;
}
