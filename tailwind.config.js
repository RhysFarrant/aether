/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// Dark fantasy theme colors
				background: {
					primary: "#0a0e14", // Very dark blue-black
					secondary: "#1a1f2e", // Slightly lighter dark
					tertiary: "#252b3d", // Card backgrounds
				},
				// Gold accent colors (inspired by classic D&D)
				gold: {
					50: "#fdf8e8",
					100: "#faf0c8",
					200: "#f5e199",
					300: "#f0cb5f",
					400: "#ebb535",
					500: "#d4a017", // Main gold
					600: "#b8860b", // Dark goldenrod
					700: "#956a0b",
					800: "#7a550f",
					900: "#664610",
				},
				// Fantasy-themed neutrals
				stone: {
					50: "#f8f9fa",
					100: "#e9ecef",
					200: "#d3d9e0",
					300: "#b8c1cc",
					400: "#9ca6b3",
					500: "#7d8a99",
					600: "#5e6c7d",
					700: "#475261",
					800: "#2f3845",
					900: "#1e242e",
				},
			},
			// Custom shadows for depth and glow effects
			boxShadow: {
				"gold-glow": "0 0 20px rgba(212, 160, 23, 0.3)",
				"gold-glow-lg": "0 0 30px rgba(212, 160, 23, 0.4)",
				"inner-dark": "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
			},
			// Custom background patterns
			backgroundImage: {
				"subtle-pattern":
					"radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 0)",
			},
			backgroundSize: {
				pattern: "40px 40px",
			},
		},
	},
	plugins: [],
};
