module.exports = {
  '**/*.{js,ts,tsx,jsx,json,css,md}': ['prettier --write'],
  '**/*.{js,ts,tsx,jsx}': ['eslint --fix', 'vitest related --run'],
};
