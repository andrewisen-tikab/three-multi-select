import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'three-multi-select',
            // the proper extensions will be added
            fileName: 'three-multi-select',
        },
        rollupOptions: {
            external: ['three', 'three-mesh-bvh'],
        },
    },
});
