/** @typedef  {import("prettier").Config} PrettierConfig */

/** @type { PrettierConfig | import("@ianvs/prettier-plugin-sort-imports").PluginConfig} } */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
