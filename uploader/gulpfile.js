var del = require('del');
var gulp = require('gulp');
var webpack = require('gulp-webpack-build');
var WEBPACK_CONFIG_FILENAME = webpack.config.CONFIG_FILENAME;

var src = './src';
var dest = './output';

var onError = function (err) {
    console.log('error:', err.message || err);
};

// task - clean
gulp.task('clean', function () {
    del(dest);
});

// task - build
gulp.task('build', ['clean'], function () {
    return gulp.src(WEBPACK_CONFIG_FILENAME)
        .pipe(webpack.init({useMemoryFs: true}))
        .pipe(webpack.run())
        .pipe(webpack.format({
            version: false,
            timings: true
        }))
        .pipe(webpack.failAfter({
            errors: true,
            warnings: true
        }))
        .pipe(gulp.dest('.'));
});

// task - watch
gulp.task('watch', ['build'], function () {
    gulp.src(WEBPACK_CONFIG_FILENAME)
        .pipe(webpack.init({useMemoryFs: true}))
        .pipe(webpack.watch(function (err, stats) {

            var jsonStats = stats.toJson();

            if (err) {
                return onError(err);
            }

            if (jsonStats.errors.length > 0) {
                jsonStats.errors.forEach(onError);
            }

            gulp.src(this.path, {base: this.base})
                .pipe(webpack.proxy(err, stats))
                // .pipe(webpack.format({
                //     verbose: true,
                //     version: false
                // }))
                .pipe(gulp.dest('.'));
        }));
});