const gulp = require('gulp');
const gutil = require('gulp-util');
const shell = require('gulp-shell');
const gulpSequence = require('gulp-sequence');
const argv = require('yargs').argv;
const through = require('through2');
const less = require('gulp-less');
const fs = require('fs');
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


gulp.task('bundle', ['compile'], function(cb) {
    var outFolder = argv.out === void 0 ? 'out' : argv.out;
    outFolder = path.resolve(outFolder);
    // Copy all compiled files to the output folder
    gutil.log('Copying files...');
    gulp.src('app/**/*.js')
    .pipe(gulp.dest( path.resolve(outFolder, 'app') ));

    gulp.src('css/**/*.css')
    .pipe(gulp.dest( path.resolve(outFolder, 'css') ));

    gulp.src('templates/**')
    .pipe(gulp.dest( path.resolve(outFolder, 'templates') ));

    gulp.src('lib/**')
    .pipe(gulp.dest( path.resolve(outFolder, 'lib') ));

    // Copy the package json and install all node modules
    gulp.src('package.json')
    .pipe(gulp.dest( path.resolve(outFolder) ))
    // Remove all  dev dependencies and install scripts
    .pipe(through.obj((file, enc, cb) => {
        gutil.log('Removing dev dependencies...');
        var json = JSON.parse(file.contents.toString());
        delete json.scripts;
        delete json.devDependencies;
        file.contents = Buffer.from(JSON.stringify(json));
        fs.writeFile(`${outFolder}/package.json`, JSON.stringify(json, null, 2), () => cb(null, file));
    }))
    // Run npm install without dev deps and no install scripts
    .pipe(through.obj((file, enc, cb) => {
        gutil.log('Installing node modules...');
        var exec = require('child_process').exec;
        exec(`cd ${outFolder} && npm install`, () => {
         gutil.log(`App bundle created at ${outFolder}`);
            cb(null, file);
        });
    }));
});

gulp.task('dev', ['tsc-watch', 'less-watch', 'electron-watch']);
gulp.task('compile', ['tsc', 'less']);
gulp.task('run', gulpSequence('compile', 'electron'));