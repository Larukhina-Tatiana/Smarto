const stack = document.querySelector(".slogan");

stack.addEventListener("click", () => {
  // Получаем актуальные элементы с классами при каждом клике
  const topItem = stack.querySelector(".slogan__item--top");
  const bottomItem = stack.querySelector(".slogan__item--bottom");

  // Проверяем, существуют ли элементы перед манипуляцией с классами
  if (topItem && bottomItem) {
    // Удаляем старые классы
    topItem.classList.remove("slogan__item--top");
    bottomItem.classList.remove("slogan__item--bottom");

    // Добавляем новые классы, меняя их местами
    topItem.classList.add("slogan__item--bottom");
    bottomItem.classList.add("slogan__item--top");
  }
});
