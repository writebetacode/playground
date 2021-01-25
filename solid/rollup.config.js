import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import styles from "rollup-plugin-styles";
import replace from '@rollup/plugin-replace';
import solidHotLoader from "rollup-plugin-solid-hot-loader";
import injectHotCSS from "rollup-plugin-inject-hot-css";
import { terser } from "rollup-plugin-terser";

const html = require('@rollup/plugin-html'),
  isProduction = process.env.NODE_ENV === "production",
  publicPath = process.env.PUBLIC_PATH || "/";

export default {
  input: "main.js",
  output: {
    dir: "build",
    entryFileNames: "bundle-[hash].js",
    assetFileNames: "bundle-[name]-[hash].[ext]",
    format: "es",
    sourcemap: isProduction ? true : "inline"
  },
  preserveEntrySignatures: false,
  plugins: [
    !isProduction && solidHotLoader({
      include: [
        "**/projects/**/components/**/*.jsx"
      ]
    }),
    resolve({ extensions: [ ".js", ".jsx" ]}),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: [
        "solid",
        ["@babel/preset-env", {
          "useBuiltIns": "usage",
          "corejs": 3,
        }]
      ]
    }),
    commonjs(),
    replace({ "process.env.NODE_ENV": `"${process.env.NODE_ENV}"` }),
    styles({
      autoModules: true,
      mode: "extract",
      minimize: true,
      sourceMap: isProduction ? true : "inline",
    }),
    !isProduction && injectHotCSS(),
    isProduction && terser({
      compress: { global_defs: { storeonDevtools: false }}
    }),
    html({
      publicPath,
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'minimum-scale=1, initial-scale=1, width=device-width'
        },
      ],
      title: "Playground Projects",
    }),
  ]
};

if (!isProduction) {
  require("open")("http://localhost:8080");
}
