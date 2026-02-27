/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                ocean: {
                    950: '#020d18',
                    900: '#04182e',
                    800: '#072943',
                    700: '#0c3d5e',
                    600: '#135580',
                    500: '#1a6fa4',
                    400: '#2490cc',
                    300: '#4db8e8',
                    200: '#87d4f4',
                    100: '#c3eafb',
                    50: '#eaf7fe',
                },
                accent: '#00d4ff',
                danger: '#ff4d6d',
                warning: '#fbbf24',
                surface: '#071e2b',
                card: '#0a2539',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
