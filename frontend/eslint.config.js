// @ts-check
const { default: nextConfig } = await import('eslint-config-next')

const config = [
  ...nextConfig,
  {
    rules: {
      // react-hook-form's watch() triggers a false positive from the plugin's static analysis
      'react-hooks/incompatible-library': 'off',
    },
  },
]

export default config
