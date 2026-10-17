import type {Entity} from './config';

// A read projection keeps a single source identity: no copied assignments, invented
// points, fake completion state or second reminder source. Every CTE is owner-scoped.
export function canvasProjection(entity:Entity,owner:string){
 if(!['Course','Assignment','Event'].includes(entity.key))return {ctes:[] as string[],table:`"${entity.key}"`};
 const fields=entity.fields.map(f=>`"${f.name}"`).join(',');
 const ctes=[`canvas_sources AS MATERIALIZED(
 SELECT e.*,c.status AS health,COALESCE((SELECT timezone FROM "UserSettings" WHERE "userId"=${owner}),'America/Chicago') AS timezone,
 COALESCE(NULLIF(e.payload->>'courseCode',''),substring(e.payload->>'title' from '[[]([^][]+)[]]$'),'') AS code,
 COALESCE(NULLIF(e.payload->>'canvasCourseId',''),'') AS course_id
 FROM "ExternalRecord" e JOIN "ApiConnection" c ON c.id=e."connectionId" AND c."userId"=e."userId"
 WHERE e."userId"=${owner} AND c."userId"=${owner} AND c.provider='canvas' AND c.mode='live' AND c.status<>'disconnected' AND c.selection->>'canvasTransport'='feed' AND NOT e.deleted
 )`,`canvas_dates AS MATERIALIZED(
 SELECT *,COALESCE(NULLIF(course_id,''),NULLIF(code,''),'unknown') AS course_key,
 CASE WHEN length(payload->>'dueAt')=10 THEN (payload->>'dueAt')::date ELSE ((payload->>'dueAt')::timestamptz AT TIME ZONE timezone)::date END AS start_date,
 CASE WHEN length(payload->>'dueAt')=10 THEN '' ELSE to_char((payload->>'dueAt')::timestamptz AT TIME ZONE timezone,'HH24:MI') END AS start_time,
 CASE WHEN NULLIF(payload->>'end','') IS NULL THEN NULL WHEN length(payload->>'end')=10 THEN (payload->>'end')::date ELSE ((payload->>'end')::timestamptz AT TIME ZONE timezone)::date END AS end_date,
 CASE WHEN NULLIF(payload->>'end','') IS NULL OR length(payload->>'end')=10 THEN '' ELSE to_char((payload->>'end')::timestamptz AT TIME ZONE timezone,'HH24:MI') END AS end_time
 FROM canvas_sources WHERE payload->>'dueAt' IS NOT NULL
 )`,`canvas_mapped AS MATERIALIZED(
 SELECT *,md5("userId"::text||':'||"connectionId"::text||':'||course_key)::uuid AS course_uuid,
 COALESCE(NULLIF(code,''),CASE WHEN course_id<>'' THEN 'Canvas course '||course_id ELSE 'Course not provided by Canvas' END) AS course_title
 FROM canvas_dates
 )`];
 const metadata=`jsonb_build_object('source','Canvas','readOnly','true','description',COALESCE(payload->>'description',''),'courseTitle',course_title,'dueTime',start_time,'timezone',timezone,'allDay',CASE WHEN length(payload->>'dueAt')=10 THEN 'true' ELSE 'false' END,'sourceUrl',"sourceUrl",'sourceUpdatedAt',"sourceUpdatedAt"::text,'sourceFetchedAt',"fetchedAt"::text,'sourceStatus',health,'recurrence',COALESCE(payload->>'recurrence',''),'location',COALESCE(payload->>'location',''),'sourceKind',kind,'coverage',COALESCE(payload->>'coverage',''),'sourceEnd',COALESCE(payload->>'end',''))`;
 let imported:string;
 if(entity.key==='Assignment')imported=`SELECT id,"userId","sourceUpdatedAt" AS "updatedAt",CASE WHEN code<>'' AND right(payload->>'title',length(code)+3)=' ['||code||']' THEN left(payload->>'title',length(payload->>'title')-length(code)-3) ELSE payload->>'title' END AS title,course_uuid AS "courseId",start_date AS "dueDate",'unknown'::text AS status,NULL::int AS "pointsPossible",${metadata} AS source_metadata FROM canvas_mapped WHERE kind='Assignment'`;
 else if(entity.key==='Event')imported=`SELECT id,"userId","sourceUpdatedAt" AS "updatedAt",payload->>'title' AS title,start_date AS "startDate",CASE WHEN end_date IS NOT NULL AND length(payload->>'end')=10 THEN end_date-1 ELSE end_date END AS "endDate",start_time AS "startTime",end_time AS "endTime",COALESCE(payload->>'location','') AS location,${metadata} AS source_metadata FROM canvas_mapped`;
 else imported=`SELECT course_uuid AS id,"userId",max("sourceUpdatedAt") AS "updatedAt",(array_agg(course_title ORDER BY "sourceUpdatedAt" DESC,id))[1] AS title,(array_agg(code ORDER BY "sourceUpdatedAt" DESC,id))[1] AS code,''::text AS term,''::text AS instructor,jsonb_build_object('source','Canvas','readOnly','true','coverage','Course label from dated Canvas feed items; full course name, term and instructor are not provided.') AS source_metadata FROM canvas_mapped WHERE kind='Assignment' GROUP BY course_uuid,"userId"`;
 ctes.push(`workspace_records AS(SELECT id,"userId","updatedAt",${fields},NULL::jsonb AS source_metadata FROM "${entity.key}" WHERE "userId"=${owner} UNION ALL ${imported})`);
 return {ctes,table:'workspace_records'};
}
