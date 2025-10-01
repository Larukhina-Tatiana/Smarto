import { initProjectRenderer, renderProjectsForTab } from "./renderProjects.js";

/**
 * Инициализирует функциональность вкладок для портфолио.
 */
async function initPortfolioTabs() {
  // --- DOM-элементы ---
  const tabsContainer = document.querySelector(".tabs");
  const allTabButtons = document.querySelectorAll(".tabs__btn");
  const contentWrapper = document.querySelector(".tabs-content");
  const portfolioSection = document.querySelector(".portfolio");
  const stickyWrapper = document.querySelector(".portfolio-sticky-wrapper");
  const allTabPanels = document.querySelectorAll(".tabs-content__item"); // Получаем все панели содержимого

  // Проверка на существование основных элементов
  if (!tabsContainer || !allTabButtons.length || !contentWrapper) {
    console.warn("Не найдены основные элементы для инициализации вкладок.");
    return;
  }

  // Присваиваем уникальные ID кнопкам и панелям, а также устанавливаем ARIA-атрибуты
  allTabButtons.forEach((button, index) => {
    const tabId = `tab-${index}`;
    const panelId = `panel-${index}`;

    button.setAttribute("id", tabId);
    button.setAttribute("aria-controls", panelId); // Связываем кнопку с панелью

    if (allTabPanels[index]) {
      allTabPanels[index].setAttribute("id", panelId);
      allTabPanels[index].setAttribute("role", "tabpanel");
      allTabPanels[index].setAttribute("aria-labelledby", tabId); // Связываем панель с кнопкой
      allTabPanels[index].setAttribute("hidden", "true"); // Скрываем все панели по умолчанию
    }
  });

  /**
   * Активирует вкладку, обновляет UI и запускает перерисовку проектов.
   * @param {string} path - Идентификатор вкладки (например, "all", "business").
   * @param {boolean} [shouldScroll=true] - Нужно ли прокручивать к началу контента.
   */
  function activateTab(path, shouldScroll = true) {
    let targetBtn = null;
    let targetPanel = null; // Добавляем переменную для целевой панели

    // Оптимизированный поиск кнопки без создания нового массива
    for (let i = 0; i < allTabButtons.length; i++) {
      const btn = allTabButtons[i];
      if (btn.dataset.path === path) {
        targetBtn = btn;
        targetPanel = allTabPanels[i]; // Находим соответствующую панель
        break;
      }
    }

    if (!targetBtn) {
      console.warn(`Вкладка с путем "${path}" не найдена.`);
      return;
    }

    // Обновляем активное состояние кнопок и aria-атрибуты
    allTabButtons.forEach((btn) => {
      btn.classList.remove("tabs__btn--active");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1");
    });

    targetBtn.classList.add("tabs__btn--active");
    targetBtn.setAttribute("aria-selected", "true");
    targetBtn.setAttribute("tabindex", "0");

    // Обновляем состояние панелей содержимого
    allTabPanels.forEach((panel) => {
      panel.setAttribute("hidden", "true"); // Скрываем все панели
    });

    if (targetPanel) {
      targetPanel.removeAttribute("hidden"); // Показываем только активную панель
    }
    // Плавная прокрутка к началу контента
    if (shouldScroll) {
      // Получаем высоту хедера из CSS-переменной, если она задана
      const headerHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height"
          )
        ) || 0;
      // Получаем высоту контейнера вкладок
      const tabsHeight = tabsContainer.offsetHeight || 0;
      const totalOffset = headerHeight + tabsHeight;

      // Вычисляем позицию для прокрутки
      const topPosition =
        contentWrapper.getBoundingClientRect().top +
        window.scrollY -
        totalOffset;

      // Используем requestAnimationFrame для плавной прокрутки
      requestAnimationFrame(() => {
        window.scrollTo({
          top: topPosition,
          behavior: "smooth",
        });
      });
    }

    // Отрисовка карточек проектов для выбранной вкладки
    renderProjectsForTab(path);
  }

  /**
   * Определяет, какую вкладку активировать при загрузке страницы.
   */
  function initializeActiveTab() {
    // Приоритет: хэш URL -> параметр URL -> sessionStorage -> "all"
    let tabId = window.location.hash.replace("#", "");
    if (!tabId) {
      tabId = new URLSearchParams(window.location.search).get("tab");
    }
    if (!tabId) {
      tabId = sessionStorage.getItem("tab");
    }

    // Если tabId был взят из sessionStorage, удаляем его
    if (tabId && sessionStorage.getItem("tab") === tabId) {
      sessionStorage.removeItem("tab");
    }

    const initialTab = tabId || "all";
    activateTab(initialTab, false);
  }

  // --- Обработчики событий ---

  // Делегирование события клика для кнопок вкладок
  tabsContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest(".tabs__btn");
    if (targetButton) {
      e.preventDefault(); // Предотвращаем стандартное действие ссылки
      const path = targetButton.dataset.path;
      if (path) {
        activateTab(path);
        // Обновляем URL без перезагрузки страницы
        history.pushState(null, "", `#${path}`);
      }
    }
  });

  // Обработка изменения URL (например, при использовании кнопок "назад/вперед" в браузере)
  window.addEventListener("popstate", () => {
    initializeActiveTab();
  });

  // --- Sticky tabs при входе в секцию ---
  // Если stickyWrapper и portfolioSection существуют, настраиваем Intersection Observer
  if (stickyWrapper && portfolioSection) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Добавляем/удаляем класс 'is-sticky' в зависимости от видимости секции
        stickyWrapper.classList.toggle("is-sticky", entry.isIntersecting);
      },
      {
        root: null, // Отслеживаем относительно viewport
        threshold: 0, // Срабатывает, как только элемент становится видимым/невидимым
      }
    );
    observer.observe(portfolioSection); // Начинаем наблюдение за секцией портфолио
  }

  // --- Инициализация ---
  // Ожидаем готовности рендерера проектов перед инициализацией вкладок
  const rendererReady = await initProjectRenderer();
  if (rendererReady) {
    initializeActiveTab();
  }
}

// Запускаем инициализацию вкладок после полной загрузки DOM
document.addEventListener("DOMContentLoaded", initPortfolioTabs);
