export type GradeInput={label:string;earned:string;possible:string;weight:string};
export function calculateGrade(rows:GradeInput[],mode:'points'|'weighted'){
 if(!rows.length||rows.length>20)throw Error('Add between 1 and 20 assessments.');
 const number=(value:string,name:string)=>{if(!/^\d+(\.\d{1,4})?$/.test(value.trim()))throw Error(`Enter a valid ${name}.`);const n=Number(value);if(n>1000000)throw Error(`${name} must not exceed 1,000,000.`);return n};
 let earned=0,possible=0,weighted=0,weights=0;
 for(const row of rows){const e=number(row.earned,'score'),p=number(row.possible,'possible points');if(p===0)throw Error('Possible points must be greater than zero.');earned+=e;possible+=p;if(mode==='weighted'){const w=number(row.weight,'weight');weighted+=e/p*100*w;weights+=w}}
 if(mode==='weighted'&&weights===0)throw Error('At least one weight must be greater than zero.');
 return {percent:mode==='points'?earned/possible*100:weighted/weights,earned,possible,weights};
}
export function requiredFinalScore(current:number,target:string,weight:string){
 if(!/^\d+(\.\d{1,4})?$/.test(target.trim())||!/^\d+(\.\d{1,4})?$/.test(weight.trim()))throw Error('Enter a target and final-exam weight.');
 const t=Number(target),w=Number(weight);if(t<0||t>100||w<=0||w>100)throw Error('Target must be 0–100%; final weight must be greater than 0 and at most 100%.');
 return (t-current*(1-w/100))/(w/100);
}
