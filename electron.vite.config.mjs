import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    // --- START ADDITION ---
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js'), // Assuming this is your main preload script
          screenshotSelectionPreload: resolve(
            __dirname,
            'src/preload/screenshotSelectionPreload.js'
          ) // Add this line, assuming file is moved
        }
      }
    }
    // --- END ADDITION ---
  },
  renderer: {
    // --- FIX: Removed 'root' property from renderer config ---
    // When 'root' is not explicitly set, Vite defaults to the project root.
    // This allows the 'input' paths to be absolute from the config file's location,
    // which is often more robust for resolving HTML entry points.
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          // Using absolute paths for input, resolved from the config file's directory.
          // This explicitly tells Vite/Rollup where to find the HTML files.
          index: resolve(__dirname, 'src/renderer/index.html'),
          screenshotSelection: resolve(__dirname, 'src/renderer/screenshotSelection.html'),
          screenshotSelectionRenderer: resolve(
            __dirname,
            'src/renderer/screenshotSelectionRenderer.js'
          )
        }
      }
    }
  }
})
