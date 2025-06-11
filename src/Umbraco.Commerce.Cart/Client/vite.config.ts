import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["iife"],
            name: 'ucc',
            fileName: (format) => `umbraco-commerce-cart.js`
        },
        outDir: '../wwwroot/',
        emptyOutDir: true,
        sourcemap: true,
    }
});
