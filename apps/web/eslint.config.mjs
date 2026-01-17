import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.contentlayer/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      'next.config.js',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': hooksPlugin,
      'tailwindcss': tailwindPlugin,
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...tailwindPlugin.configs.recommended.rules,
      // Next.js specific
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'warn', // Warn instead of error
      // React specific
      'react/jsx-key': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'warn', // Warn instead of error for quotes
      'react/no-unknown-property': 'warn', // Warn for custom properties (tw, jsx, etc.)
      // React Hooks
      'react-hooks/exhaustive-deps': 'warn', // Warn instead of error
      // Tailwind CSS
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/enforces-shorthand': 'warn',
      'tailwindcss/no-contradicting-classname': 'warn', // Warn instead of error
      'tailwindcss/enforces-negative-arbitrary-values': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        callees: ['cn', 'clsx', 'classNames'],
        config: 'tailwind.config.ts',
        removeDuplicates: true,
      },
      next: {
        rootDir: true,
      },
    },
  },
];
