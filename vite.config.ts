import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or whatever framework you're using
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(), // your existing plugins
    tailwindcss(),
  ],
});
