// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///home/project/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@features": path.resolve(__vite_injected_original_dirname, "./src/features"),
      "@shared": path.resolve(__vite_injected_original_dirname, "./src/shared"),
      "@data": path.resolve(__vite_injected_original_dirname, "./src/data"),
      "@types": path.resolve(__vite_injected_original_dirname, "./src/types"),
      "@config": path.resolve(__vite_injected_original_dirname, "./src/config")
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.ts"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor": ["@supabase/supabase-js"],
          "utils": ["papaparse", "xlsx"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSAnQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbc3ZlbHRlKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAZmVhdHVyZXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvZmVhdHVyZXMnKSxcbiAgICAgICdAc2hhcmVkJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3NoYXJlZCcpLFxuICAgICAgJ0BkYXRhJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2RhdGEnKSxcbiAgICAgICdAdHlwZXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvdHlwZXMnKSxcbiAgICAgICdAY29uZmlnJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2NvbmZpZycpLFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvdGVzdHMvc2V0dXAudHMnXSxcbiAgICBpbmNsdWRlOiBbJ3NyYy90ZXN0cy8qKi8qLnRlc3QudHMnXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3ZlbmRvcic6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgICAgJ3V0aWxzJzogWydwYXBhcGFyc2UnLCAneGxzeCddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLFNBQVMsY0FBYztBQUN2QixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUFBLEVBQ2xCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGFBQWEsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLE1BQ3JELFdBQVcsS0FBSyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUNqRCxTQUFTLEtBQUssUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDN0MsVUFBVSxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQy9DLFdBQVcsS0FBSyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxJQUNuRDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQyxzQkFBc0I7QUFBQSxJQUNuQyxTQUFTLENBQUMsd0JBQXdCO0FBQUEsRUFDcEM7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxVQUNsQyxTQUFTLENBQUMsYUFBYSxNQUFNO0FBQUEsUUFDL0I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
