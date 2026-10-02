export default {
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings=0',
  ],
  '**/*.{ts,tsx,js,mjs}': () => 'tsc --noEmit',
  '**/*.{json,md}': [],
}
