/** @type {import("prettier").Config} */

module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.ts',
  tailwindFunctions: ['cn', 'clsx', 'cva'],

  // basic config
  printWidth: 120,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  endOfLine: 'auto',
  htmlWhitespaceSensitivity: 'ignore',
  bracketSameLine: true,
}
