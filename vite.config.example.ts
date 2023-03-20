import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: './dist/example',
    },
});
