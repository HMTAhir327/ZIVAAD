import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          950: '#111111'
        },
        sand: {
          50: '#f9f6f1',
          100: '#f2ece0',
          200: '#e6dcc7'
        }
      },
      boxShadow: {
        luxury: '0 16px 48px -24px rgba(17,17,17,0.35)'
      },
      letterSpacing: {
        luxury: '0.18em'
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
};

export default config;
