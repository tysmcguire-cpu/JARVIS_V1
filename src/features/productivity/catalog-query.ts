import 'server-only';
import {entities,entityFor} from '@/features/tracking/config';
import {canvasProjection} from '@/features/tracking/canvas-projection';
export function catalogSql(keys=entities.map(e=>e.key),searchable=false){
 return keys.map(key=>{const e=entityFor(key),p=canvasProjection(e,'$1::uuid'),date=e.fields.find(f=>f.type==='date'),status=e.fields.some(f=>f.name==='status');
 return `(WITH ${p.ctes.length?p.ctes.join(',')+',':''} records AS(SELECT * FROM ${p.table} WHERE "userId"=$1::uuid)
 SELECT '${key}'::text AS key,'${e.module}'::text AS module,id,title,${date?`"${date.name}"::text`:`''::text`} AS date,${status?'status::text':`''::text`} AS status,${key==='Event'?'"endDate"::text':"''::text"} AS "endDate","updatedAt"::text AS updated${searchable?(key==='Note'?',concat_ws(\' \',title,tag,content) AS searchable':',title AS searchable'):''} FROM records)`;
 }).join(' UNION ALL ');
}
