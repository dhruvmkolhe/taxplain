import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split PDF processing libraries (pdfjs ~3MB + jspdf + html2canvas)
            'pdf-libs': ['pdfjs-dist', 'jspdf', 'html2canvas'],
            // Split OCR library (tesseract.js worker ~4MB)
            'ocr-lib': ['tesseract.js'],
            // Split charting library
            'recharts': ['recharts'],
            // Split animation library
            'motion': ['motion'],
            // Split Radix UI primitives
            'radix-ui': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-dialog',
              '@radix-ui/react-progress',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
