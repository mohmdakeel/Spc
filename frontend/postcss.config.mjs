// postcss.config.js
// Force lightningcss to use native bindings (WASM pkg not shipped)
if (process.env.CSS_TRANSFORMER_WASM) {
  delete process.env.CSS_TRANSFORMER_WASM;
}
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
