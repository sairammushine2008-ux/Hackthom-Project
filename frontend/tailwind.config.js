/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          primary: '#3B82F6',
          hover: '#2563EB',
        },
        dept: {
          sales: '#8B5CF6',
          finance: '#EC4899',
          it: '#06B6D4',
          cs: '#10B981',
          security: '#EF4444',
          operations: '#64748B'
        },
        status: {
          blocked: '#EF4444',
          pending: '#F59E0B',
          ready: '#10B981',
          completed: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
