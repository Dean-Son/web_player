import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import terser from "@rollup/plugin-terser";

const isProduction = process.env.NODE_ENV === "production";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "deanVideoPlayer",
      sourcemap: true,
      globals: {
        // 외부 의존성이 있다면 여기에 추가
      },
    },
  ],
  external: [
    // 번들에 포함하지 않을 외부 의존성들
  ],
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationMap: true,
    }),
    postcss({
      extract: true,
      minimize: isProduction,
      sourceMap: true,
    }),
    // 프로덕션 환경에서만 압축
    isProduction && terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.warn"],
      },
      mangle: {
        properties: {
          regex: /^_/, // private 프로퍼티만 압축
        },
      },
      format: {
        comments: false,
      },
    }),
  ].filter(Boolean),
  
  // Tree shaking 최적화
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
};
