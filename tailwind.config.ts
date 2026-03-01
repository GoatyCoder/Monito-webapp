import type { Config } from 'tailwindcss';

const config: Config = {
  // Percorsi da scansionare per classi Tailwind.
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Placeholder token colori mappati al Design.md.
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        accent: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
        background: '#F9FAFB',
        surface: '#FFFFFF'
      }
    }
  },
  plugins: []
};

export default config;
