import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: './dist/examples',
        rollupOptions: {
            input: {
                simple: resolve(__dirname, 'examples/simple/index.html'),
                kitchenSink: resolve(__dirname, 'examples/kitchen-sink/index.html'),
            },
        },
    },
});
