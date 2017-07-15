const gulp = require('gulp')
const sass = require('gulp-sass')
const BUILD_DIR_PATH = "./dist"



gulp.task('sass', function () {
    gulp.src('./src/**/*.sass')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(BUILD_DIR_PATH))
});