import dotenv from 'dotenv';
import {
  ConfigEnv,
  Plugin,
  PreviewServerForHook,
  ViteDevServer,
  defineConfig,
} from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

dotenv.config();

interface VitePluginScanditOptions {
  licenseKey: string;
  licenseKeyPlaceholder: string;
}

function scandit(options: VitePluginScanditOptions): Plugin {
  let config: ConfigEnv;

  function setupServer(server: ViteDevServer | PreviewServerForHook): void {
    server.config.preview.port = Number(process.env.PORT) || 8080;
    server.config.server.port = Number(process.env.PORT) || 8080;
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      next();
    });
  }

  return {
    name: 'vite-plugin-scandit',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transform(code) {
      const shouldReplaceLicenseKey =
        config.command === 'serve' || !process.env.SKIP_LICENSE_KEY_REPLACEMENT;
      if (shouldReplaceLicenseKey) {
        return {
          code: code.replace(options.licenseKeyPlaceholder, options.licenseKey),
        };
      }
    },
    transformIndexHtml(html) {
      return html.replace(
        '<script type="module" crossorigin src="./index.js"></script>',
        '<script data-id="scandit-main" type="module" crossorigin src="./index.js"></script>'
      );
    },
    configureServer: setupServer,
    configurePreviewServer: setupServer,
  };
}

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: '[name].js',
      },
    },
  },
  envPrefix: 'SCANDIT',
  plugins: [
    viteStaticCopy({
      targets: [
        ...['core', 'id'].map((module) => ({
          src: `./node_modules/scandit-web-datacapture-${module}/build/engine/*`,
          dest: './library/engine',
        })),
        {
          src: './node_modules/html2canvas/dist/html2canvas.min.js',
          dest: './library',
        },
        {
          src: './node_modules/jspdf/dist/jspdf.umd.min.js',
          dest: './library',
        },
      ],
    }),
    scandit({
      licenseKey: process.env.SCANDIT_LICENSE_KEY ?? '',
      licenseKeyPlaceholder: '-- ENTER YOUR SCANDIT LICENSE KEY HERE --',
    }),
  ],
  optimizeDeps: {
    include: ['html2canvas', 'jspdf'],
  },
});
