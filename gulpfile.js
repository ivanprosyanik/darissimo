const { src, dest, watch, parallel, series } = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff2 = require('gulp-ttf2woff2');
const fileInclude = require('gulp-file-include');
const cleanCSS = require('gulp-clean-css');

const avif = require('gulp-avif');
const webp = require('gulp-webp');
const newer = require('gulp-newer');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'app/'
    },
    notify: false
  })
}

function styles() {
  return src('app/scss/style.scss')
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(concat('style.min.css'))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 10 versions'],
        grid: true
      })
    )
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function scripts() {
  return src([
    'app/js/main.js',
    'app/js/libs.min.js',
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function libsJS() {
  return src([

    // Пример подключения плагинов JS:

    // './node_modules/lightgallery/lightgallery.min.js',
    // './node_modules/lightgallery/plugins/pager/lg-pager.min.js',
    // './node_modules/starry-rating/dist/starry.min.js',
    // './node_modules/nouislider/dist/nouislider.min.js',
    './node_modules/aos/dist/aos.js',
    './node_modules/choices.js/public/assets/scripts/choices.min.js',
    './node_modules/swiper/swiper-bundle.min.js'

  ])
    .pipe(concat('libs.min.js'))
    .pipe(dest('app/js'));
}

function libsCSS() {
  return src([

    // Пример подключения плагинов CSS:
    './node_modules/aos/dist/aos.css',
    './node_modules/choices.js/public/assets/styles/base.min.css',
    './node_modules/choices.js/public/assets/styles/choices.min.css',
    './node_modules/swiper/swiper-bundle.css'
  ])
    .pipe(concat('libs.min.css'))
    .pipe(cleanCSS())
    .pipe(dest('app/css'));
}

function images() {
  return src(['app/images/src/**/*.*', '!app/images/src/*.svg'])
    .pipe(newer('app/images/dist'))
    .pipe(avif({ quality: 50 }))

    .pipe(src('app/images/src/**/*.*'))
    .pipe(newer('app/images/dist'))
    .pipe(webp())

    .pipe(src('app/images/src/**/*.*'))
    .pipe(newer('app/images/dist'))
    .pipe(imagemin())

    .pipe(dest('app/images/dist'))
}

const htmlInclude = () => {
  return src(['app/html/*.html']) // Находит любой .html файл в папке "html", куда будем подключать другие .html файлы													
    .pipe(fileInclude({
      prefix: '@',
      basepath: '@file',
    }))
    .pipe(dest('app')) // указываем, в какую папку поместить готовый файл html
    .pipe(browserSync.stream());
}

function svgSprites() {
  return src('app/images/icons/*.svg') // выбираем в папке с иконками все файлы с расширением svg
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg', // указываем имя файла спрайта и путь
          },
        },
      })
    )
    .pipe(dest('app/images')); // указываем, в какую папку поместить готовый файл спрайта
}

function convertFonts() {
  return src('app/fonts/*.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'));
}

function build() {
  return src(
    [
      'app/*.html',
      'app/favicon/**/*.*',
      'app/fonts/**/*.*',
      'app/css/style.min.css',
      'app/js/main.min.js',
      'app/images/dist/**/*.*',
      'app/images/sprite.svg'
    ],

    // [
    //   'app/*.html',
    //   'app/favicon/**/*.*',
    //   'app/fonts/**/*.*',
    //   'app/css/style.min.css',
    //   'app/js/main.min.js',
    //   // 'app/images/**/*.*'
    //   'app/images/dist/*.*',
    //   'app/images/sprite.svg'
    // ],

    { base: 'app' })
    .pipe(dest('dist'));
}

function cleanDist() {
  return del('dist')
}

function watching() {
  watch(['app/scss/**/*.scss'], styles);
  watch(['app/js/main.js'], scripts);
  watch(['app/images/icons/*.svg'], svgSprites);
  watch(['app/images/src'], images);
  watch(['app/**/*.html']).on('change', browserSync.reload);
  watch(['app/html/**/*.html'], htmlInclude);
}

exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.browsersync = browsersync;
exports.images = images;
exports.cleanDist = cleanDist;
exports.svgSprites = svgSprites;
exports.convertFonts = convertFonts;
exports.htmlInclude = htmlInclude;
exports.libsJS = libsJS;
exports.libsCSS = libsCSS;

exports.libs = parallel(libsCSS, libsJS);
exports.default = parallel(styles, scripts, browsersync, htmlInclude, svgSprites, images, watching);
exports.build = series(cleanDist, build);