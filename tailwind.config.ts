import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				brand: getColorScale('pink'),
				gray: getColorScale('slate'),
				success: getColorScale('jade'),
				danger: getColorScale('ruby')
			}
		}
	},

	plugins: []
} satisfies Config;

function getColorScale(name) {
	let scale = {};
	for (let i = 1; i <= 12; i++) {
		scale[i] = `var(--${name}-${i})`;
	}

	return scale;
}
