// === DOM-элементы ===
const container = document.querySelector(".tabs-content");
const loadMoreBtn = document.querySelector(".portfolio__btn-more");

// === Состояние ===
export let projects = [];
let currentStep = 1; // Начинаем с 1, так как первая порция загружается при инициализации
const BATCH_SIZE = 3; // Количество проектов, загружаемых за один раз
let activeFilter = "all"; // Текущий активный фильтр

// === Вспомогательные функции ===

/**
 * Создаёт DOM-элемент с указанными параметрами.
 * @param {string} tag - HTML-тег для элемента.
 * @param {object} [options={}] - Параметры для элемента.
 * @param {string} [options.className] - CSS-класс(ы) для добавления.
 * @param {string} [options.textContent] - Текстовое содержимое элемента.
 * @param {object} [options.attributes] - Объект с атрибутами для установки (например, { src: 'path/to/img' }).
 * @param {string} [options.innerHTML] - Внутреннее HTML-содержимое.
 * @returns {HTMLElement} Созданный элемент.
 */
function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.textContent) el.textContent = options.textContent;
  if (options.innerHTML) el.innerHTML = options.innerHTML;
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

/**
 * Преобразует тип проекта из JSON в системный ключ для фильтрации.
 * @param {string} type - Исходный тип, например, "Бізнес".
 * @returns {string} - Нормализованный ключ, например, "business".
 */
export function normalizeType(type) {
  // Обрабатывает возможные вариации данных (например, кириллицу и латиницу)
  const typeMap = {
    Бізнес: "business",
    Комфорт: "comfort",
    Comfort: "comfort",
    Преміум: "premium",
    Premium: "premium",
  };
  return typeMap[type?.trim()] || "unknown"; // Возвращаем "unknown", если тип не найден
}

// === Основная логика ===

/**
 * Загружает список проектов из JSON-файла.
 */
export async function fetchProjects() {
  const url = "https://test.smarto.agency/smarto_complexes_list.json";
  try {
    // 1. Выполняем GET-запрос к указанному URL
    const response = await fetch(url);
    // 2. Проверяем, успешен ли запрос (статус 200-299)
    if (!response.ok) {
      // Если запрос неуспешен, выбрасываем ошибку
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 3. Парсим JSON-ответ
    projects = await response.json();
  } catch (error) {
    console.error("❌ Не удалось загрузить проекты:", error);
    // Опционально: отобразить сообщение об ошибке пользователю в контейнере
    if (container) {
      container.innerHTML = `<p class="error-message">Не удалось загрузить проекты. Попробуйте обновить страницу.</p>`;
    }
  }
}

/**
 * Создаёт DOM-элемент для карточки одного проекта.
 * @param {object} project - Объект с данными проекта.
 * @returns {HTMLLIElement} Элемент списка (li), содержащий карточку проекта.
 */
function createProjectCard(project) {
  const normalizedProjectType = normalizeType(project.type);

  // Создаем список тегов для проекта
  const tagsList = project.tags
    .map((tag) => `<li class="project__tags">${tag}</li>`)
    .join("");

  // Создаем заголовок проекта
  const projectHeader = createElement("header", {
    className: "project__header",
  });
  projectHeader.append(
    createElement("p", {
      className: "project__year",
      textContent: `${project.year} г.`,
    }),
    createElement("a", {
      className: "project-labels",
      attributes: { href: "#", "data-tags": normalizedProjectType },
      innerHTML: `<span class="project__type">${project.type}</span>`,
    })
  );

  // Создаем блок изображения проекта
  const projectFigure = createElement("figure", {
    className: "project__figure",
  });
  projectFigure.append(
    createElement("img", {
      className: "project__image",
      attributes: {
        id: `image-${project.id}`,
        src: project.img,
        loading: "lazy", // Ленивая загрузка изображения
        decoding: "async", // Асинхронное декодирование
        alt: project.name,
        width: "416",
        height: "233",
      },
    }),
    createElement("figcaption", {
      className: "project__name",
      textContent: project.name,
    })
  );

  // Создаем ссылку для перехода к деталям проекта
  const projectLink = createElement("a", {
    className: "project__link",
    attributes: {
      href: `projects-${project.id}`,
      "aria-label": `Детали о ${project.name}`,
    },
  });
  projectLink.appendChild(projectFigure);

  // Создаем блок с деталями работ
  const projectDetails = createElement("div", {
    className: "project__details",
  });
  projectDetails.append(
    createElement("p", {
      className: "project__details-title",
      textContent: "Виды работ:",
    }),
    createElement("ul", {
      className: "project__details-list",
      innerHTML: tagsList,
    })
  );

  // Создаем основную статью проекта
  const article = createElement("article", {
    className: "project",
    attributes: { id: project.id },
  });
  article.append(
    projectHeader,
    projectLink,
    createElement("p", {
      className: "project__address",
      textContent: project.adress,
    }),
    projectDetails
  );

  // Создаем элемент списка для карточки проекта
  const listItem = createElement("li", {
    className: "tabs-content__item",
    attributes: { "data-target": normalizedProjectType },
  });
  listItem.appendChild(article);

  return listItem;
}

/**
 * Переключает видимость кнопки "Загрузить ещё".
 * @param {boolean} shouldShow - Определяет, должна ли кнопка быть видимой.
 */
function updateLoadMoreButtonVisibility(shouldShow) {
  if (loadMoreBtn) {
    loadMoreBtn.style.display = shouldShow ? "flex" : "none";
  }
}

/**
 * Отрисовывает проекты на основе текущего фильтра и шага пагинации.
 * @param {boolean} [isInitialOrTabChange=false] - Если true, контейнер будет очищен и отрисованы проекты с начала.
 *                                                Если false, проекты будут добавлены к существующим.
 */
function renderProjects(isInitialOrTabChange = false) {
  if (!container) return;

  const filteredProjects = projects.filter(
    (project) =>
      activeFilter === "all" || normalizeType(project.type) === activeFilter
  );

  let projectsToDisplay;
  let startIndex;

  if (isInitialOrTabChange) {
    // При первой загрузке или смене вкладки, очищаем контейнер и показываем первую порцию
    container.innerHTML = "";
    startIndex = 0;
    projectsToDisplay = filteredProjects.slice(
      startIndex,
      BATCH_SIZE * currentStep
    );
  } else {
    // При нажатии "Загрузить ещё", добавляем следующую порцию
    // Определяем индекс, с которого нужно начать добавлять новые проекты
    startIndex = BATCH_SIZE * (currentStep - 1);
    projectsToDisplay = filteredProjects.slice(
      startIndex,
      BATCH_SIZE * currentStep
    );
  }

  // Используем DocumentFragment для производительности: создаем узлы вне DOM-дерева
  const fragment = document.createDocumentFragment();
  projectsToDisplay.forEach((project) =>
    fragment.appendChild(createProjectCard(project))
  );

  container.appendChild(fragment);

  // Обновляем видимость кнопки "Загрузить ещё"
  updateLoadMoreButtonVisibility(
    filteredProjects.length > BATCH_SIZE * currentStep
  );
}

/**
 * Обрабатывает клик по кнопке "Загрузить ещё".
 */
function handleLoadMore() {
  currentStep++;
  renderProjects(false); // Добавляем новые проекты, не очищая контейнер
}

/**
 * Отрисовывает проекты для определённой вкладки, сбрасывая пагинацию.
 * @param {string} path - Путь фильтра (например, "business", "all").
 */
export function renderProjectsForTab(path) {
  activeFilter = path;
  currentStep = 1; // Сбрасываем шаг пагинации до первой порции
  renderProjects(true); // Очищаем контейнер и рендерим с начала
}

/**
 * Инициализирует модуль отрисовки проектов.
 */
export async function initProjectRenderer() {
  if (!container) {
    console.error(
      "Инициализация не удалась: контейнер '.tabs-content' не найден."
    );
    return false;
  }

  await fetchProjects(); // Загружаем все проекты
  renderProjectsForTab("all"); // Первоначальная отрисовка всех проектов

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", handleLoadMore);
  } else {
    console.warn(
      "Кнопка '.portfolio__btn-more' не найдена. Функция 'Загрузить ещё' отключена."
    );
  }

  return true;
}
