// Hosts inject environment variables directly; a local file is optional.
export function loadEnvironment(load = process.loadEnvFile) {
  try {
    load('.env');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw new Error('Unable to load local environment configuration. Private details suppressed.');
    }
  }
}
