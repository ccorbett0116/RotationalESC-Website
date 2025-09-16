import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createHtmlPlugin } from "vite-plugin-html"; // 👈 add this

// https://vitejs.dev/config/
export default defineConfig({
  server: { 
    host: "::", 
    port: 8080,
    proxy: {
      '/admin': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-slot']
        }
      }
    }
  },
  plugins: [
    react(),
    createHtmlPlugin({
      inject: {
        tags: [
          {
            tag: "link",
            attrs: {
              rel: "preload",
              as: "image",
              href: "/src/assets/home-banner.webp", // source path, Vite rewrites to hashed filename
              fetchpriority: "high",
            },
            injectTo: "head",
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
