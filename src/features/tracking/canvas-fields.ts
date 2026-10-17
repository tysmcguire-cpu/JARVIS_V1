import type {Entity,RecordRow} from './config';
export function canvasFieldValue(row:RecordRow,name:string){
 if(name==='courseId')return row.courseTitle||'Not provided by Canvas';
 if(name==='status'||name==='pointsPossible'||name==='term'||name==='instructor')return 'Not provided by Canvas';
 return row[name]||'Not provided by Canvas';
}
export function canvasDetailFields(entity:Entity,row:RecordRow){
 const fields=entity.fields.map(field=>({label:entity.key==='Course'&&field.name==='title'?'Course label (from feed)':field.label,value:canvasFieldValue(row,field.name)}));
 if(entity.key==='Assignment')fields.push({label:'Due time',value:row.allDay==='true'?'All day':row.dueTime||'Not provided by Canvas'});
 const extra=[['description','Description'],['courseTitle','Course label'],['timezone','Display timezone'],['location','Location'],['sourceEnd','Original feed end'],['recurrence','Recurrence rule (not expanded)'],['sourceKind','Canvas item type'],['sourceStatus','Connection health'],['sourceUpdatedAt','Canvas updated'],['sourceFetchedAt','Last fetched'],['coverage','Coverage']] as const;
 fields.push(...extra.filter(([key])=>!!row[key]).map(([key,label])=>({label,value:row[key]})));
 return fields;
}
