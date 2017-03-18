const gulp = require('gulp');
const gutil = require('gulp-util');
const shell = require('gulp-shell');
const changed = require('gulp-changed');
const gulpSequence = require('gulp-sequence');
const argv = require('yargs').argv;
const through = require('through2');
const less = require('gulp-less');
const fs = require('fs');
const path = require('path');
const os = require('os');
const electron = require('electron-connect').server.create();
// const electron = require('gulp-electron');

var electronArgs = '';


// Simply run tsc
gulp.task('tsc', shell.task(['tsc']));

// Simply run tsc and watch for changes
gulp.task('tsc-watch', shell.task(['tsc --watch']));

// Run the global electron app
gulp.task('electron', shell.task([`electron ./ ${electronArgs}`]));

// Watch the main js for changes, and restart the whole electron app
// gulp.task('electron-watch', () => gulp.watch('dist/app/electron-main.js', ['electron']));

// Compile less files to css folder
gulp.task('less', () => {
  return gulp.src('src/less/style.less')
    .pipe(less())
    .pipe(gulp.dest('dist/css'));
});

// Compile less files to css folder
gulp.task('less-ng', () => {
  return gulp.src('src/app/renderer/**/*.less')
    .pipe(less())
    .pipe(changed('dist/app/renderer'))
    .pipe(gulp.dest('dist/app/renderer'));
});

// Copy templates to dist folder
gulp.task('template-copy', () => {
  return gulp.src('src/app/renderer/**/*.html')
    .pipe(changed('dist/app/renderer'))
    .pipe(gulp.dest('dist/app/renderer'));
});

// Watch templates for changes
gulp.task('less-ng-watch', () => gulp.watch('src/app/renderer/**/*.less', ['less-ng']));

// Watch templates for changes
gulp.task('template-watch', () => gulp.watch('src/app/renderer/**/*.html', ['template-copy']));

// Watch the less files
gulp.task('less-watch', () => gulp.watch('src/less/**/*.less', ['less']));


gulp.task('bundle', ['compile'], (done) => {
  var destFolder = 'bundle';
  destFolder = path.resolve(destFolder);
  // Copy all compiled files to the output folder
  gutil.log('Copying files...');
  gulp.src('dist/**/*.js')
    .pipe(gulp.dest(path.resolve(destFolder, 'dist')));

  gulp.src('assets/**')
    .pipe(gulp.dest(path.resolve(destFolder, 'assets')));

  // Copy the package json and install all node modules
  gulp.src('package.json')
    .pipe(gulp.dest(path.resolve(destFolder)))
    // Remove all dev dependencies and install scripts
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
      version: 'v1.4.6',
      packaging: zip,
      token: argv.token,
      platforms: platform
    }))
    .pipe(gulp.dest(''));
});

gulp.task('electron-watch', function () {

  setTimeout(() => {
    // Start browser process
    electron.start();

    // Reload renderer process
    gulp.watch('dist/app/renderer/**/*.js', electron.reload);
    gulp.watch('dist/app/ng-main.js', electron.reload);
    gulp.watch('dist/**/*.css', electron.reload);
    gulp.watch('dist/**/*.html', electron.reload);
    gulp.watch(['index.html', 'config.js', 'systemjs.config.js'], electron.reload);

    // Restart browser process
    gulp.watch('dist/app/browser/**/*.js', electron.restart);
    gulp.watch('dist/app/electron-main.js', electron.restart);
  }, 5000);
});

gulp.task('compile', ['tsc', 'less', 'template-copy', 'less-ng']);
gulp.task('run', gulpSequence('compile', 'electron'));
gulp.task('dev', ['compile', 'tsc-watch', 'less-watch', 'less-ng-watch', 'template-watch','electron-watch']);