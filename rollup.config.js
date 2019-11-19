import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";

export default {
    input: "src/wasm/Csound.js",
    output: {
        file: "dist/index.js",
        format: "umd",
        name: "Csound"
    },
    plugins: [
        resolve(),
        commonjs({
            include: "node_modules/**"
        }),
        babel({
            runtimeHelpers: true
        })
    ]
};
