import babelConfig from './babel.config.js';

export default {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
  },
};
