var gulp       = require('gulp');
var uglify     = require('gulp-uglify');
var concat     = require('gulp-concat');
var usemin     = require('gulp-usemin');
var clean      = require('gulp-clean');
var browserify = require('browserify');
var sass       = require('gulp-sass');
var less       = require('gulp-less');
var es         = require('event-stream');
var minifyCss  = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var webserver  = require('gulp-webserver');
var templateCache = require('gulp-angular-templatecache');

// Server
// ----------------------------------------
gulp.task('server', function() {
  return gulp.src('./dist')
    .pipe(webserver({
      port: 4000,
      livereload: true
    }));
});

// Styles
// ----------------------------------------
gulp.task('styles', function() {
  return gulp.src('app/styles/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('app/styles'));
});

gulp.task('vendorjs', function () {
  return gulp.src(
    [
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/moment/min/moment.min.js',
      'bower_components/Simple-Ajax-Uploader/SimpleAjaxUploader.js',
      'bower_components/lodash/lodash.min.js',
      'bower_components/angular/angular.min.js',
      'bower_components/angular-recursion/angular-recursion.min.js',
      'bower_components/angular-animate/angular-animate.min.js',
      
      'bower_components/checklist-model/checklist-model.js',
      
      'bower_components/angular-bootstrap/ui-bootstrap.min.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',

      'bower_components/angular-ui/build/angular-ui.min.js',
      'bower_components/angular-ui-router/release/angular-ui-router.min.js',

    ])
  //.pipe(uglify())
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('vendorcss', function () {

  var bootstrap = gulp.src('app/styles/bootstrap.less')
    .pipe(less());

  var othercss = gulp.src(
    [
      'bower_components/startbootstrap-simple-sidebar/css/simple-sidebar.css',
      'bower_components/Jcrop/css/jquery.Jcrop.min.css',
      'bower_components/angular-ui/build/angular-ui.min.css',
      'bower_components/components-font-awesome/css/font-awesome.min.css',
      'bower_components/bootstrap-daterangepicker/daterangepicker-bs3.css',
      'bower_components/nvd3/nv.d3.css'
    ]);

  return es.merge(bootstrap, othercss)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('dist/css/'));
});

// Clean
// ----------------------------------------
gulp.task('clean', function () {
  return gulp.src('dist')
    .pipe(clean());
});

// Vendor Libs
// ----------------------------------------
gulp.task('usemin', ['styles'], function () {
  return gulp.src('./app/*.html')
    .pipe(usemin({
      html: [minifyHtml()]
    }))
    .pipe(gulp.dest('dist'));
});

// Pipeline - copying files, browserify
// ----------------------------------------
gulp.task('pipeline', function () {
  return gulp.src(['./app/fonts/**', './app/img/**', './app/sounds/**'],
                  {base: './app'})
    .pipe(gulp.dest('dist'));
});

// angular templates
gulp.task('templates', function () {
  gulp.src('./app/views/*.html')
    .pipe(templateCache('templates.js',
                        {standalone: true, root: '/views/'}))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('vendorstatic', function() {
  gulp.src('bower_components/Jcrop/css/Jcrop.gif')
    .pipe(gulp.dest('dist/css'));
});

// Watchers
// -------------------------------------------------
gulp.task('watch', ['default', 'server'], function() {
  gulp.watch([
    'app/views/*.html',
  ], ['templates']);
  gulp.watch([
    'app/styles/*.less',
  ], ['vendorcss']);
  gulp.watch([
    'app/styles/**/*.scss',
    'app/scripts/**/*.js',
    'app/*.html',
  ], ['usemin']);
});

gulp.task('default', ['vendorstatic', 'vendorjs', 'vendorcss', 'pipeline', 'usemin', 'templates']);

