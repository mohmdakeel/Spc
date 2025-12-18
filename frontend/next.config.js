/** @type {import('next').NextConfig} */
if (process.env.CSS_TRANSFORMER_WASM) {
  delete process.env.CSS_TRANSFORMER_WASM;
}

module.exports = {
  output: 'export',
  images: { unoptimized: true },
  experimental: { optimizeCss: false },
};
