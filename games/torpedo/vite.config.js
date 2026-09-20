import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: (loadEnv(mode, process.cwd(), '').TORPEDO_ALLOWED_HOSTS ?? '')
      .split(',').map((host) => host.trim()).filter(Boolean)
  }
}));
