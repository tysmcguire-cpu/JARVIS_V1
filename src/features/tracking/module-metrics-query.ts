import {type Entity} from './config';
export function moduleFactsSql(entity:Entity,owner:string){
 const has=(name:string)=>entity.fields.some(f=>f.name===name),date=entity.fields.find(f=>f.type==='date')?.name;
 const today=`(CURRENT_TIMESTAMP AT TIME ZONE COALESCE((SELECT timezone FROM "UserSettings" WHERE "userId"=${owner}),'America/Chicago'))::date`;
 const count=(test:string)=>`count(*) FILTER(WHERE ${test})::int`;
 const status=(value:string)=>has('status')?count(`status='${value}'`):'0';
 const open=has('status')?`status NOT IN ('done','rejected','withdrawn')`:'true';
 const attributes=[`'count'`,'count(*)::int',`'today'`,`${today}::text`,`'upcoming'`,date?count(`"${date}">=${today} AND ${open}`):'0',`'overdue'`,date?count(`"${date}"<${today} AND ${open}${has('status')?" AND status<>'unknown'":''}`):'0',`'unknown'`,status('unknown'),`'done'`,status('done'),`'active'`,status('active'),`'interviews'`,status('interview'),`'offers'`,status('offer'),`'minutes'`,has('minutes')?'COALESCE(sum(minutes),0)::int':'0',`'earned'`,has('pointsEarned')?'COALESCE(sum("pointsEarned"),0)::text':"'0'",`'possible'`,has('pointsPossible')?'COALESCE(sum("pointsPossible"),0)::text':"'0'",`'reached'`,has('current')?count('target>0 AND current>=target'):'0',`'tags'`,has('tag')?`count(DISTINCT NULLIF(tag,''))::int`:'0',`'tagged'`,has('tag')?count("tag<>''"):'0',`'units'`,has('unit')?`to_jsonb(ARRAY(SELECT DISTINCT unit FROM filtered ORDER BY unit LIMIT 4))`:"'[]'::jsonb"];
 return `(SELECT jsonb_build_object(${attributes.join(',')}) FROM filtered)`;
}
