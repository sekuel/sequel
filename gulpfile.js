const { series, parallel, watch, src, dest } = require('gulp');
const pump = require('pump');
const { exec } = require("child_process");

// gulp plugins and utils
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const beeper = require('beeper');
const zip = require('gulp-zip');

// postcss plugins
const easyimport = require('postcss-easy-import');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');


function serve(done) {
    livereload.listen();
    done();
}

function handleError(done) {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    pump([
        src('assets/css/screen.css', { sourcemaps: true }),
        postcss([
            easyimport,
            autoprefixer(),
            cssnano()
        ]),
        dest('assets/built/', { sourcemaps: '.' }),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src([
            'node_modules/@tryghost/shared-theme-assets/assets/js/lib/**/*.js',
            'node_modules/@tryghost/shared-theme-assets/assets/js/main.js',
            'assets/js/lib/*.js',
            'assets/js/main.js'
        ], { sourcemaps: true }),
        concat('main.min.js'),
        uglify(),
        dest('assets/built/', { sourcemaps: '.' }),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    const filename = require('./package.json').name + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!yarn-error.log'
        ]),
        zip(filename),
        dest('dist/')
    ], handleError(done));
}

let HELPERS = {
    execute: (command) => {
        const process = exec(command);
        process.stdout.on('data', (data) => { console.log(data.toString()); })
        process.stderr.on('data', (data) => { console.log(data.toString()); })
        process.on('exit', (code) => {
            console.log('Process exited with code ' + code.toString());
        })
        return process;
    }
}

function cmRollup() {
    return HELPERS.execute('node_modules/.bin/rollup -c --bundleConfigAsCjs');
}

const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs);
const cssWatcher = () => watch('assets/css/**/*.css', css);
const jsWatcher = () => watch('assets/js/**/*.js', js);
const cmWatcher = () => watch('assets/js/editor.js', cmRollup);

const watcher = parallel(hbsWatcher, cssWatcher, jsWatcher, cmWatcher);
const build = series(css, cmRollup, js );

exports.build = build;
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
