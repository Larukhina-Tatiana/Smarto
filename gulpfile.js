// Основной модуль
import gulp from "gulp";

// Импорт путей
import { path } from "./gulp/config/path.js";

global.app = {
  isBuild: process.argv.includes("--build"),
  isDev: !process.argv.includes("--build"),
  path: path,
  gulp: gulp,
  plugins: plugins,
};

// Импорт задач
import { copysprite } from "./gulp/tasks/copysprite.js";
import { copyicons } from "./gulp/tasks/copyicons.js";
import { copyfonts } from "./gulp/tasks/copyfonts.js";
import { copy } from "./gulp/tasks/copy.js";
import { reset } from "./gulp/tasks/reset.js";
import { html } from "./gulp/tasks/html.js";
import { server } from "./gulp/tasks/server.js";
import { scss } from "./gulp/tasks/scss.js";
import { js } from "./gulp/tasks/js.js";
import { imgAvif, imgWebp, imgImage } from "./gulp/tasks/images.js";
// import { svgStack, svgSymbol } from "./gulp/tasks/svg.js";
// import { OtfToTtf, ttfToWoff, fontStyle } from "./gulp/tasks/fonts.js";

// Импорт плагинов
import { plugins } from "./gulp/config/plugins.js";

function watcher() {
  gulp.watch(path.watch.files, copy);
  gulp.watch(path.watch.html, html);
  gulp.watch(path.watch.scss, scss);
  gulp.watch(path.watch.js, js);
  gulp.watch(path.watch.images, images);
  // gulp.watch(path.watch.icons, copyicons);
  // gulp.watch(path.watch.sprite, gulp.series("svgStack", "svgSymbol"));
}
// Последовательная обработка шрифтов
const images = gulp.series(imgAvif, imgWebp, imgImage);
// const sprite = gulp.series(svgStack, svgSymbol);
// Основные задачи
const mainTasks = gulp.series(
  gulp.parallel(copy, copysprite, copyicons, copyfonts, html, scss, js, images)
);
// Построение сценариев
const dev = gulp.series(reset, mainTasks, gulp.parallel(watcher, server));
const build = gulp.series(reset, mainTasks);

export { dev };
export { build };

gulp.task("default", dev);
