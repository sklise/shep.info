var gulp = require('gulp')
var uglify = require('gulp-uglify')
var concat = require('gulp-concat')

gulp.task('libs', function () {
  return gulp.src([
    './public/js/vendor/jquery.js',
    './public/js/vendor/underscore.js',
    './public/js/vendor/backbone.js',
    './public/js/vendor/handlebars.js',
    './public/js/vendor/string.js'
  ])
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js/'))
})
