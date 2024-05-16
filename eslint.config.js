import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ...eslint.configs.recommended,
    rules: {
      'nonblock-statement-body-position': ['error', 'beside'],
    },
  },
  ...tseslint.configs.strict,
  {
    ignores: ['dist/*'],
  },
);
