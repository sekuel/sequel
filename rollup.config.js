import {nodeResolve} from "@rollup/plugin-node-resolve"

export default {
  input: "assets/js/editor.js",
  output: {
    file: "assets/js/lib/editor.bundle.js",
    format: "iife",
    name: "editor"
  },
  plugins: [nodeResolve()]
}