import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import reactRefresh from "eslint-plugin-react-refresh";
import noSecrets from "eslint-plugin-no-secrets";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";
import prettier from "eslint-plugin-prettier";
import _import from "eslint-plugin-import";
import react from "eslint-plugin-react";
import filenameRules from "eslint-plugin-filename-rules";
import tanstackEslintPluginQuery from "@tanstack/eslint-plugin-query";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: [
            "**/.DS_*",
            "**/*.log",
            "**/logs",
            "**/*.backup.*",
            "**/*.back.*",
            "**/dist",
            "**/node_modules",
            "**/bower_components",
            "**/*.sublime*",
            "**/psd",
            "**/thumb",
            "**/sketch",
            "node_modules",
            ".pnp",
            "**/.pnp.js",
            "coverage",
            ".next/",
            "out/",
            "build",
            "**/.DS_Store",
            "**/*.pem",
            "**/npm-debug.log*",
            "**/yarn-debug.log*",
            "**/yarn-error.log*",
            "**/.pnpm-debug.log*",
            "**/.env*.local",
            "**/.vercel",
            "**/*.tsbuildinfo",
            "**/next-env.d.ts",
            "**/vite-env.d.ts",
            "**/vite.config.ts",
            "**/eslint.config.mjs",
            "**/postcss.config.js",
            "**/tailwind.config.ts",
            "dist-extension",
            "dist-web",
        ],
    },
    ...fixupConfigRules(
        compat.extends(
            "eslint:recommended",
            "plugin:react/jsx-runtime",
            "plugin:react/recommended",
            "plugin:import/recommended",
            "plugin:@typescript-eslint/strict",
            "plugin:jsx-a11y/recommended",
            "plugin:prettier/recommended",
            "plugin:perfectionist/recommended-natural-legacy",
            "plugin:react-hooks/recommended",
        ),
    ),
    {
        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
            "simple-import-sort": simpleImportSort,
            "react-refresh": reactRefresh,
            "no-secrets": noSecrets,
            "jsx-a11y": fixupPluginRules(jsxA11Y),
            "prefer-arrow-functions": preferArrowFunctions,
            prettier: fixupPluginRules(prettier),
            import: fixupPluginRules(_import),
            react: fixupPluginRules(react),
            "filename-rules": filenameRules,
            "@tanstack/query": tanstackEslintPluginQuery,
        },

        linterOptions: {
            reportUnusedDisableDirectives: true,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.app.json",

                ecmaFeatures: {
                    impliedStrict: true,
                    jsx: true,
                },
            },
        },

        settings: {
            react: {
                version: "detect",
            },
        },

        rules: {
            "no-unused-vars": "error",
            "no-alert": "error",
            "require-unicode-regexp": "error",
            "no-template-curly-in-string": "error",
            "prefer-template": "warn",
            "no-implicit-coercion": "warn",
            "require-await": "warn",

            "no-plusplus": [
                "warn",
                {
                    allowForLoopAfterthoughts: true,
                },
            ],

            "no-restricted-imports": "off",
            curly: "warn",
            "object-shorthand": "warn",

            "no-console": [
                "warn",
                {
                    allow: [
                        "warn",
                        "error",
                        "info",
                        "dir",
                        "table",
                        "assert",
                        "count",
                        "time",
                        "timeLog",
                        "trace",
                        "groupCollapsed",
                        "groupEnd",
                    ],
                },
            ],

            "@typescript-eslint/no-explicit-any": "error",

            "@typescript-eslint/consistent-type-assertions": [
                "error",
                {
                    assertionStyle: "never",
                },
            ],

            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/prefer-ts-expect-error": "error",

            "@typescript-eslint/ban-ts-comment": [
                "error",
                {
                    "ts-expect-error": "allow-with-description",
                    "ts-ignore": true,
                    "ts-nocheck": true,
                    "ts-check": false,
                    minimumDescriptionLength: 3,
                },
            ],

            "@typescript-eslint/restrict-template-expressions": "error",
            "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],

            "@typescript-eslint/no-unused-expressions": [
                "error",
                {
                    allowShortCircuit: true,
                    allowTernary: true,
                    enforceForJSX: true,
                },
            ],

            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    ignoreVoid: true,
                    ignoreIIFE: true,
                },
            ],

            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksVoidReturn: {
                        arguments: false,
                        attributes: false,
                    },
                },
            ],

            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unnecessary-type-arguments": "warn",
            "@typescript-eslint/no-unnecessary-condition": "warn",

            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],

            "padding-line-between-statements": [
                "warn",
                {
                    blankLine: "always",
                    prev: "*",
                    next: ["function", "try", "throw", "case", "default"],
                },
            ],

            "@typescript-eslint/switch-exhaustiveness-check": "warn",

            "@typescript-eslint/naming-convention": [
                "warn",
                {
                    selector: "default",
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "variable",
                    format: ["PascalCase", "camelCase", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "parameter",
                    format: ["camelCase", "PascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "property",
                    format: ["camelCase", "PascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "typeMethod",
                    format: ["camelCase", "PascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "objectLiteralMethod",
                    format: ["camelCase", "PascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "objectLiteralProperty",
                    format: null,
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"],
                },
                {
                    selector: "import",
                    format: null,
                },
            ],

            "@typescript-eslint/no-restricted-imports": [
                "warn",
                {
                    name: "react-redux",
                    importNames: ["useSelector", "useDispatch"],
                    message: "Use typed hooks `useAppDispatch` and `useAppSelector` instead.",
                },
            ],

            "@typescript-eslint/no-shadow": "off",
            "@typescript-eslint/quotes": "off",
            "@typescript-eslint/comma-dangle": "off",
            "react/prefer-stateless-function": "error",
            "react/button-has-type": "off",
            "react/jsx-pascal-case": "error",
            "react/jsx-no-script-url": "error",
            "react/no-children-prop": "off",
            "react/no-danger": "error",
            "react/no-danger-with-children": "error",

            "react/no-unstable-nested-components": [
                "error",
                {
                    allowAsProps: true,
                },
            ],

            "react/jsx-fragments": "error",

            "react/destructuring-assignment": [
                "error",
                "always",
                {
                    destructureInSignature: "always",
                },
            ],

            "react/jsx-no-leaked-render": [
                "error",
                {
                    validStrategies: ["ternary"],
                },
            ],

            "react/jsx-max-depth": [
                "error",
                {
                    max: 5,
                },
            ],

            "react/function-component-definition": [
                "warn",
                {
                    namedComponents: "arrow-function",
                },
            ],

            "react/jsx-key": [
                "error",
                {
                    checkFragmentShorthand: true,
                    checkKeyMustBeforeSpread: true,
                    warnOnDuplicates: true,
                },
            ],

            "react/jsx-no-useless-fragment": "warn",
            "react/jsx-curly-brace-presence": "warn",
            "react/no-typos": "warn",
            "react/display-name": "off",
            "react/self-closing-comp": "warn",
            "react/jsx-sort-props": "off",
            "react/react-in-jsx-scope": "off",
            "react/jsx-one-expression-per-line": "off",
            "react/prop-types": "off",
            "react-refresh/only-export-components": "warn",

            "import/no-extraneous-dependencies": [
                "error",
                {
                    devDependencies: ["**/*.{test,spec,story,stories}.{ts,tsx}"],
                },
            ],

            "import/no-default-export": "error",
            "import/named": "off",
            "simple-import-sort/imports": "warn",
            "simple-import-sort/exports": "warn",
            "perfectionist/sort-imports": "off",
            "perfectionist/sort-named-imports": "off",

            "prefer-arrow-functions/prefer-arrow-functions": [
                "warn",
                {
                    classPropertiesAllowed: true,
                    disallowPrototype: true,
                    returnStyle: "unchanged",
                },
            ],

            "arrow-body-style": "warn",

            "prefer-arrow-callback": [
                "warn",
                {
                    allowNamedFunctions: true,
                },
            ],

            // https://github.com/dolsem/eslint-plugin-filename-rules/pull/21
            // "filename-rules/match": [
            //     2,
            //     {
            //         ".ts": "camelcase",
            //         ".tsx": "pascalcase",
            //     },
            // ],

            "no-secrets/no-secrets": [
                "error",
                {
                    ignoreContent: "https",
                    tolerance: 4.2,
                },
            ],

            "import/no-unresolved": [
                "error",
                {
                    ignore: ["\\.svg\\?url"],
                },
            ],
        },
    },
    {
        files: ["src/routes/**/*"],

        rules: {
            "filename-rules/match": "off",
            "import/no-extraneous-dependencies": "off",
        },
    },
    {
        files: ["pages/**/*", "app/**/*"],

        rules: {
            "import/no-default-export": "off",
            "react-refresh/only-export-components": "off",
        },
    },
    {
        files: ["app/**/*", "hooks/**/*"],

        rules: {
            "filename-rules/match": "off",
        },
    },
    {
        files: ["**/options.tsx", "**/content.tsx", "**/main.tsx"],

        rules: {
            "filename-rules/match": "off",
        },
    },
];
