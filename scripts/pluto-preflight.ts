import {argument,setup,setupEnvironment,assertSetupTarget,migrationInventory,assertReviewedMigrations} from './pluto-setup-lib';
function main(){
 const env=setupEnvironment(argument('env'));
 assertSetupTarget(env);assertReviewedMigrations();
 const key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'';
 if(!key||key.startsWith('sb_secret_'))throw Error('A public Supabase publishable key is required, never a secret key.');
 if(key.split('.').length===3){let payload;try{payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString())}catch{throw Error('Legacy publishable key payload is invalid.')}if(payload.role!=='anon'||payload.ref!==setup.projectRef)throw Error('Legacy Auth key is not an anon key for this project.');}
 else if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw Error('Publishable key format is not recognized.');
 const enabled=Object.keys(env).filter(k=>/ENABLED|APPROVED|REGISTRATION|MIGRATIONS|^PLUTO_ALLOW_/.test(k)&&['true','approved'].includes(env[k]??''));
 console.info(JSON.stringify({mode:'offline; no network or database connection',projectRef:setup.projectRef,authUrlMatches:env.NEXT_PUBLIC_SUPABASE_URL===`https://${setup.projectRef}.supabase.co`,publishableKeyFormatValid:true,reviewedMigrations:migrationInventory().length,databaseUrlConfigured:!!env.DATABASE_URL,migrationUrlConfigured:!!env.DIRECT_URL,enabledFlagNames:enabled,next:!env.DIRECT_URL?'Save the separate project administrator connection URL locally; no remote execution is authorized.':!env.DATABASE_URL?'Review migrations and request explicit execution approval, then provision only the app runtime role.':'Ready for separately approved remote acceptance; credentials have not been authenticated.'},null,2));
 if(!env.NEXT_PUBLIC_SUPABASE_URL)throw Error('Commercial Auth URL is missing.');
}
try{main()}catch(error){console.error(error instanceof Error?error.message:'Offline preflight failed; private details suppressed.');process.exitCode=1}
