import {assertCommercialDatabase} from '../src/features/commercial/isolation';
// Hosts inject environment variables directly; a local file is optional.
export function loadEnvironment(load = process.loadEnvFile) {
  try {
    load('.env');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw new Error('Unable to load local environment configuration. Private details suppressed.');
    }
  }
 if(process.env.JARVIS_OWNER_ID)throw Error('Personal application environment is prohibited in Pluto.');
 for(const key of ['DATABASE_URL','DIRECT_URL'])if(process.env[key])assertCommercialDatabase(process.env[key]!,process.env.PLUTO_SUPABASE_PROJECT_REF,key==='DIRECT_URL');
}
