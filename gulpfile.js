const gulp = require('gulp');
const shell = require('gulp-shell');
var gulpSequence = require('gulp-sequence')
const less = require('gulp-less');
const path = require('path');
const os = require('os');

var electronArgs = '';

if (os.type() == 'Linux')
    electronArgs += ' --enable-transparent-visuals --disable-gpu';


// Simply run tsc
gulp.task('tsc', shell.task(['tsc']));

// Simply run tsc and watch for changes
gulp.task('tsc-watch', shell.task(['tsc --watch']));

// Run the global electron app
gulp.task('electron', shell.task([`electron ./ ${electronArgs}`]));

// Watch the main js for changes, and restart the whole electron app
gulp.task('electron-watch', function() {
    gulp.watch('app/main.js', ['electron']);
});

// Compile less files to css folder
gulp.task('less', function () {
  return gulp.src('./less/**/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./css'));
});

// Watch the less files
gulp.task('less-watch', function() {
    gulp.watch('less/**/*.less', ['less']);
});

gulp.task('dev', ['tsc-watch', 'less-watch', 'electron-watch']);
gulp.task('build', ['tsc', 'less']);
gulp.task('run', gulpSequence('build', 'electron'));