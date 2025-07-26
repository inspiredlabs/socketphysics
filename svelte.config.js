import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	},
	vitePlugin: {
    exclude: [],
    // experimental options
		inspector: {
			toggleKeyCombo: 'meta-shift',
			holdMode: false,
			showToggleButton: 'never', //always
			toggleButtonPos: 'bottom-left'
		}
  }
};

export default config;
