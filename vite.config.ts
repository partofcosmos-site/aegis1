import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    define: {
      '__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY),
    },
    // other configuration options
  };
});