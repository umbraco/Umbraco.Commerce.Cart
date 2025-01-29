import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: "umbraco-commerce-cart"
        },
        outDir: '../wwwroot/',
        emptyOutDir: true,
        sourcemap: true,
    }
});
