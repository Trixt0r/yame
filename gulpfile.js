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
const electron = require('gulp-electron');

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
gulp.task('electron-watch', () => gulp.watch('app/main.js', ['electron']) );

// Compile less files to css folder
gulp.task('less',  () => {
  return gulp.src('./less/**/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./css'));
});

// Watch the less files
gulp.task('less-watch', () => gulp.watch('less/**/*.less', ['less']));


gulp.task('bundle', ['compile'], (done) => {
    var destFolder = 'bundle';
    destFolder = path.resolve(destFolder);
    // Copy all compiled files to the output folder
    gutil.log('Copying files...');
    gulp.src('app/**/*.js')
    .pipe(gulp.dest( path.resolve(destFolder, 'app') ));

    gulp.src('css/**/*.css')
    .pipe(gulp.dest( path.resolve(destFolder, 'css') ));

    gulp.src('templates/**')
    .pipe(gulp.dest( path.resolve(destFolder, 'templates') ));

    gulp.src('lib/**')
    .pipe(gulp.dest( path.resolve(destFolder, 'lib') ));

    // Copy the package json and install all node modules
    gulp.src('package.json')
    .pipe(gulp.dest( path.resolve(destFolder) ))
    // Remove all  dev dependencies and install scripts
    .pipe(through.obj((file, enc, cb) => {
        gutil.log('Removing dev dependencies...');
        var json = JSON.parse(file.contents.toString());
        delete json.scripts;
        delete json.devDependencies;
        file.contents = Buffer.from(JSON.stringify(json));
        fs.writeFile(`${destFolder}/package.json`, JSON.stringify(json, null, 2), () => cb(null, file));
    }))
    // Run npm install without dev deps and no install scripts
    .pipe(through.obj((file, enc, cb) => {
        gutil.log('Installing node modules...');
        var exec = require('child_process').exec;
        exec(`cd ${destFolder} && npm install`, () => {
            gutil.log(`App bundle created at ${destFolder}`);
            cb(null, file);
            done();
        });
    }));
});

gulp.task('package', ['bundle'], () => {
    let srcFolder = argv.src === void 0 ? 'bundle' : argv.src;
    let packageJson = require(path.resolve(srcFolder, 'package.json'));
    let outFolder = argv.out === void 0 ? 'builds' : argv.out;
    let zip = !!(argv.zip);
    let platform = argv.platform;
    if (!platform)
        platform = [`${process.platform}-${process.arch}`];
    else
        platform = platform.split(',');

    gulp.src('bundle')
    .pipe(electron({
        src: srcFolder,
        packageJson: packageJson,
        release: outFolder,
        cache: path.resolve(os.tmpdir(), 'yame-build', 'electron'),
        version: 'v1.4.3',
        packaging: zip,
        token: argv.token,
        platforms: platform
    }))
    .pipe(gulp.dest(''));
});

gulp.task('dev', ['tsc-watch', 'less-watch', 'electron-watch']);
gulp.task('compile', ['tsc', 'less']);
gulp.task('run', gulpSequence('compile', 'electron'));