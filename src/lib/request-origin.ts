// Render terminates public HTTPS before forwarding to the Node HTTP listener.
// Trust the platform's configured public URL, never caller-supplied forwarded headers.
export function matchesRequestOrigin(request:Request){
 try{
  const expected=process.env.RENDER==='true'?new URL(process.env.RENDER_EXTERNAL_URL??''):new URL(request.url);
  if(process.env.RENDER==='true'&&expected.protocol!=='https:')return false;
  return request.headers.get('origin')===expected.origin;
 }catch{return false}
}
