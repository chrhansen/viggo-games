import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = env.BURB_ALLOWED_HOSTS
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) ?? [];

  return {
    server: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
      allowedHosts,
    },
  };
});
