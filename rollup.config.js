import typescript from 'rollup-plugin-typescript';
import path from 'path';
let buildTarget
if (process.env.bg) {
    buildTarget = 'background';
}
console.log(buildTarget)
export default {
    entry: `src/scripts/${buildTarget || 'content'}/Main.ts`,
    dest: `dist/scripts/${buildTarget || 'content'}/main.js`,
    format: 'iife',
    sourceMap: 'inline',
    external: ['react', 'react-dom', 'classnames'],
    plugins: [
        typescript({
            // target: 'es5',
            typescript: require('typescript')
        })
    ]
}
