'use strict';
const FIELDS=['development','companions','treasure','exploration'];
function specialty(raw,deviation){for(const k of FIELDS)if(!Number.isFinite(raw[k])||raw[k]<0||!Number.isFinite(deviation[k]))throw Error('Invalid raw/deviation');const eligible=FIELDS.filter(k=>raw[k]>0);if(!eligible.length)return [];const maximum=Math.max(...eligible.map(k=>deviation[k]));return eligible.filter(k=>Math.abs(deviation[k]-maximum)<=1e-12);}
const skillStatus=s=>({...s,evaluationStatus:s.id==='D04'?'対象外・別枠':'評価対象',excludedFromAptitude:s.id==='D04'});
module.exports={FIELDS,specialty,skillStatus};
