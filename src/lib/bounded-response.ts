export async function readBoundedText(response:Response,maximum:number){
 const reader=response.body?.getReader();if(!reader)return '';const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>maximum){await reader.cancel();throw Error('Provider response exceeded its safe bound.')}chunks.push(next.value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder().decode(bytes);
}
