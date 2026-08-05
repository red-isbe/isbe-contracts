// @ts-check

import eslint from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    globalIgnores([
        'typechain-types/**/**',
        'build/**/**',
        'coverage/**/**',
        '**/*.js',
    ]),
    {
        // * Overrides: allow _-prefixed variables to be intentionally unused
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    {
        // * Overrides: Remove no-unused-expressions rule for test files
        files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*', 'tests/**/*'], // File patterns for test files
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off', // Disable the rule for test files
        },
    }
)
