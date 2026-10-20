import {describe,it,expect} from 'vitest';
import {calculateGrade,requiredFinalScore,type GradeInput} from '@/features/tracking/grade-calculation';
const row=(earned:string,possible:string,weight=''):GradeInput=>({label:'',earned,possible,weight});
describe('grade calculator',()=>{
 it('uses total points rather than averaging percentages',()=>expect(calculateGrade([row('80','100'),row('50','50')],'points').percent).toBeCloseTo(86.6666667));
 it('normalizes user weights and allows decimal points and extra credit',()=>{expect(calculateGrade([row('80','100','40'),row('50','50','60')],'weighted').percent).toBe(92);expect(calculateGrade([row('10.5','10')],'points').percent).toBe(105)});
 it('rejects incomplete, zero denominators, invalid weights and nonfinite inputs',()=>{for(const rows of [[],[row('','100')],[row('10','0')],[row('-1','100')],[row('Infinity','100')],[row('1e4','100')],[row('1000001','100')]])expect(()=>calculateGrade(rows,'points')).toThrow();expect(()=>calculateGrade([row('80','100','0')],'weighted')).toThrow()});
 it('solves the final percentage without silently capping unattainable targets',()=>{expect(requiredFinalScore(80,'90','20')).toBeCloseTo(130);expect(requiredFinalScore(92,'90','20')).toBeCloseTo(82);expect(requiredFinalScore(100,'80','10')).toBeLessThan(0);expect(requiredFinalScore(50,'90','100')).toBe(90)});
 it('validates target and final weights',()=>{for(const pair of [['','20'],['90','0'],['90','101'],['101','20'],['NaN','20']])expect(()=>requiredFinalScore(80,...pair as [string,string])).toThrow()});
});
