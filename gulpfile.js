/**
 * Tasks:
 * 
 * gulp scripts
 * gulp css
 * gulp watch
 *
 * Run with --dev switch to keep the Javascript and CSS files unminified
 */

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var base = {
  src: 'assets/',
  dest: 'public/assets/'
};

var paths = {
  scripts: {
    src: base.src + 'js/',
    dest: base.dest + 'js/'
  },
  styles: {
    src: base.src + 'scss/',
    dest: base.dest + 'css/'
  }
};

var app = {
  styles: paths.styles.src + 'main.scss',
  scripts: paths.scripts.src + 'main.js'
};

var plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*']
});

var isProduction = true;

if (plugins.util.env.dev === true) {
  isProduction = false;
}

gulp.task('css', function() {
  return plugins.rubySass(app.styles, {
      style: isProduction ? 'compressed' : 'expanded',
      stopOnError: true,
      emitCompileError: true
    })
    .on('error', function(err) {
      plugins.notify.onError({
        title: 'Sass Error',
        message: '<%= error.message %>'
      })(err);
      this.emit('end');
    })
    .pipe(plugins.autoprefixer())
    .pipe(isProduction ? plugins.cssmin() : plugins.util.noop())
    .pipe(plugins.size())
    .pipe(gulp.dest(paths.styles.dest));
});

function bundle(watch) {
  var props = {
    entries: [app.scripts],
    debug: !isProduction,
    transform: [['babelify', { presets: ['es2015'] }]]
  };

  var bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) {
        plugins.notify.onError({
          title: 'Bundle Error',
          message: '<%= error.message %>'
        })(err);
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(isProduction ? plugins.sourcemaps.init({ loadMaps: true }) : plugins.util.noop())
      .pipe(isProduction ? plugins.uglify() : plugins.util.noop())
      .pipe(isProduction ? plugins.sourcemaps.write('./') : plugins.util.noop())
      .pipe(plugins.size())
      .pipe(gulp.dest(paths.scripts.dest));
  }

  bundler.on('update', function() {
    rebundle();
    plugins.util.log('Rebundling...');
  });

  return rebundle();
}

gulp.task('scripts', function() {
  return bundle();
});

gulp.task('watchify', function() {
  return bundle(true);
});

gulp.task('watch', ['css', 'watchify'], function() {
  gulp.watch(paths.styles.src + '**/*.scss', ['css']);
});

gulp.task('default', ['css', 'scripts']);
