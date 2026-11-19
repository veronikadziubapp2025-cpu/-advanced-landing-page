// Шаблон (регулярний вираз) для перевірки email: текст + @ + домен + крапка + зона мінімум з 2 літер.
const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Шаблон для суворого українського формату: початок рядка, +380, рівно 9 цифр, кінець рядка.
const REGEX_PHONE = /^\+380\d{9}$/;

// Чекаємо, поки весь HTML-документ повністю завантажиться в браузері, і тільки тоді запускаємо скрипт.
document.addEventListener("DOMContentLoaded", () => {
  // Знаходимо в HTML головну форму за її id.
  const form = document.getElementById("feedback-form");
  // Знаходимо контейнер (темний оверлей) модального вікна.
  const successModal = document.getElementById("successModal");
  // Всередині модалки шукаємо саму білу картку діалогу за атрибутом role="dialog" (знак ? захищає від помилки, якщо successModal не знайдено).
  const successDialog = successModal?.querySelector('[role="dialog"]');
  // Знаходимо кнопку закриття всередині модального вікна.
  const closeModalBtn = document.getElementById("closeModalBtn");
  // Знаходимо текстове повідомлення всередині модального вікна.
  const successText = document.getElementById("successText");
  // Знаходимо абзац, де буде з'являтися підказка для телефону.
  const phoneHint = document.getElementById("phoneHint");
  // Знаходимо текстовий елемент всередині підказки телефону.
  const phoneHintText = document.getElementById("phoneHintText");
  // Знаходимо кнопку "Виправити", яка підставить запропонований номер.
  const phoneFixButton = document.getElementById("phoneFixButton");
  // Знаходимо кнопку відправки форми (type="submit").
  const submitButton = form?.querySelector('button[type="submit"]');
  // Створюємо колекцію Set (унікальний список) для збереження полів, з якими користувач уже взаємодіяв.
  const touchedFields = new Set();
  // Змінна для збереження запропонованого правильного номера телефону (спочатку порожня).
  let suggestedPhoneValue = null;
  // Змінна, щоб запам'ятати, де був фокус до відкриття модалки (щоб повернути його туди після закриття).
  let lastFocusedElement = null;
  // Додаткова дія, яку потрібно виконати після закриття модального вікна.
  let modalCloseCallback = null;
  // Масив, у якому збережемо попередній стан фонових блоків (header, main, footer) перед блокуванням.
  let backgroundState = [];
  // Прапорець, який показує, чи зараз іде процес відправки (захист від подвійного кліку).
  let isSubmitting = false;

  // Наступні 8 блоків if — це захисні перевірки (Fail-Fast). Якщо в HTML немає потрібного тегу, скрипт зупиниться і видасть зрозумілу помилку в консоль:
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Форму зворотного зв’язку "#feedback-form" не знайдено.');
  }
  if (!(successModal instanceof HTMLDivElement)) {
    throw new Error('Модальне вікно "#successModal" не знайдено.');
  }
  if (!(successDialog instanceof HTMLDivElement)) {
    throw new Error('Діалог у "#successModal" не знайдено.');
  }
  if (!(closeModalBtn instanceof HTMLButtonElement)) {
    throw new Error('Кнопку закриття "#closeModalBtn" не знайдено.');
  }
  if (!(phoneHint instanceof HTMLParagraphElement)) {
    throw new Error('Підказку "#phoneHint" не знайдено.');
  }
  if (!(phoneHintText instanceof HTMLSpanElement)) {
    throw new Error('Текст підказки "#phoneHintText" не знайдено.');
  }
  if (!(phoneFixButton instanceof HTMLButtonElement)) {
    throw new Error(
      'Кнопку виправлення телефону "#phoneFixButton" не знайдено.',
    );
  }
  if (!(submitButton instanceof HTMLButtonElement)) {
    throw new Error("Не знайдено кнопку надсилання форми.");
  }

  // Отримуємо посилання на всі 5 полів форми через нашу допоміжну функцію getInput.
  const nameInput = getInput("name");
  const emailInput = getInput("email");
  const phoneInput = getInput("phone");
  const messageInput = getInput("message");
  const agreementInput = getInput("consent");
  // Об'єднуємо всі поля в один масив, щоб потім було зручно проходити по них циклом.
  const formFields = [
    nameInput,
    emailInput,
    phoneInput,
    messageInput,
    agreementInput,
  ];
  // Знаходимо основні блоки сторінки (хедер, мейн, футер), які треба буде заблокувати під час відкриття модалки.
  const backgroundElements = [
    document.querySelector("header"),
    document.querySelector("main"),
    document.querySelector("footer"),
    // Відфільтровуємо тільки ті елементи, які реально існують на сторінці.
  ].filter((element) => element instanceof HTMLElement);

  // Допоміжна функція: шукає поле вводу (input або textarea) за id і перевіряє, чи воно існує.
  function getInput(id) {
    const element = document.getElementById(id);
    if (!(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    )) {
      throw new Error(`Поле з id="${id}" не знайдено.`);
    }
    return element;
  }

  // Допоміжна функція: знаходить абзац <p> з текстом помилки для конкретного поля (наприклад, nameError).
  function getErrorElement(id) {
    const element = document.getElementById(`${id}Error`);
    if (!(element instanceof HTMLParagraphElement)) {
      throw new Error(`Повідомлення про помилку для поля "${id}" не знайдено.`);
    }
    return element;
  }

  // Допоміжна функція: знаходить SVG-іконки (хрестик і галочку) всередині обгортки поля.
  function getStatusIcons(inputElement) {
    // Шукаємо найближчий батьківський блок із класом .relative.
    const wrapper = inputElement.closest(".relative");
    // Збираємо всі SVG-іконки всередині цієї обгортки в масив.
    const icons = Array.from(wrapper?.querySelectorAll("svg") ?? []);
    // Знаходимо іконку помилки за специфічним Tailwind-класом.
    const errorIcon = icons.find((icon) =>
      icon.classList.contains("peer-aria-[invalid=true]:block"),
    );
    // Знаходимо іконку успіху за специфічним Tailwind-класом.
    const successIcon = icons.find((icon) =>
      icon.classList.contains("peer-data-[valid=true]:block"),
    );
    // Якщо якоїсь іконки немає в HTML — повідомляємо про помилку.
    if (!errorIcon || !successIcon) {
      throw new Error(`Не знайдено іконки станів поля "${inputElement.id}".`);
    }
    // Повертаємо обидві знайдені іконки об'єктом.
    return { errorIcon, successIcon };
  }

  // Функція вмикає стан ПОМИЛКИ для поля:
  function showErr(inputElement, errorElement, message) {
    // Дістаємо іконки цього поля.
    const { errorIcon, successIcon } = getStatusIcons(inputElement);
    // Ставимо атрибут aria-invalid="true" (це сигналізує скрінрідерам про помилку і вмикає червону рамку в CSS).
    inputElement.setAttribute("aria-invalid", "true");
    // Видаляємо атрибут успішної валідації, якщо він був.
    inputElement.removeAttribute("data-valid");
    // Записуємо текст помилки в абзац під полем.
    errorElement.textContent = message;
    // Робимо текст помилки видимим (прибираємо Tailwind-клас hidden).
    errorElement.classList.remove("hidden");
    // Показуємо червону іконку помилки.
    errorIcon.classList.remove("hidden");
    // Ховаємо зелену іконку галочки.
    successIcon.classList.add("hidden");
  }

  // Функція вмикає стан УСПІХУ для поля:
  function showSuccess(inputElement, errorElement) {
    // Дістаємо іконки цього поля.
    const { errorIcon, successIcon } = getStatusIcons(inputElement);
    // Ставимо data-valid="true" (вмикає зелену рамку в CSS).
    inputElement.setAttribute("data-valid", "true");
    // Вказуємо, що помилки немає.
    inputElement.setAttribute("aria-invalid", "false");
    // Ховаємо абзац помилки.
    errorElement.classList.add("hidden");
    // Очищаємо текст помилки.
    errorElement.textContent = "";
    // Ховаємо червону іконку.
    errorIcon.classList.add("hidden");
    // Показуємо зелену галочку.
    successIcon.classList.remove("hidden");
  }

  // Функція скидає поле до НЕЙТРАЛЬНОГО стану (ні помилки, ні успіху):
  function clearError(inputElement, errorElement) {
    const { errorIcon, successIcon } = getStatusIcons(inputElement);
    // Скидаємо обидва стани (і помилку, і валідність).
    inputElement.setAttribute("aria-invalid", "false");
    inputElement.removeAttribute("data-valid");
    // Ховаємо та очищаємо текст помилки.
    errorElement.classList.add("hidden");
    errorElement.textContent = "";
    // Ховаємо обидві іконки.
    errorIcon.classList.add("hidden");
    successIcon.classList.add("hidden");
    // Якщо це поле телефону — додатково ховаємо підказку автовиправлення.
    if (inputElement === phoneInput) {
      hidePhoneHint();
    }
  }

  // Приховує блок із підказкою для телефону та скидає збережений варіант виправлення.
  function hidePhoneHint() {
    suggestedPhoneValue = null;
    phoneHint.classList.add("hidden");
    phoneHintText.textContent = "";
    // Відв'язуємо підказку від поля телефону в атрибуті доступності aria-describedby.
    updateDescribedBy(phoneInput, "phoneHint", false);
  }

  // Керує списком ID в атрибуті aria-describedby (щоб скрінрідери знали, що до поля прив'язана підказка).
  function updateDescribedBy(inputElement, descriptionId, include) {
    // Розбиваємо поточні значення атрибута на масив і кладемо в Set, щоб уникнути дублікатів.
    const ids = new Set(
      (inputElement.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter(Boolean),
    );
    // Якщо include === true, додаємо ID підказки; якщо false — видаляємо.
    if (include) {
      ids.add(descriptionId);
    } else {
      ids.delete(descriptionId);
    }
    // Записуємо оновлений список назад в атрибут поля через пробіл.
    inputElement.setAttribute("aria-describedby", Array.from(ids).join(" "));
  }

  // Аналізує введений телефон і намагається сформувати правильний формат +380XXXXXXXXX:
  function suggestPhoneFix(value) {
    // Видаляємо з рядка всі пробіли, дужки та дефіси.
    const cleanedValue = value.replace(/[\s()-]/g, "");

    // Якщо номер починається з 0 і має ще 9 цифр (напр. 0991234567) — додаємо спереду +38.
    if (/^0\d{9}$/.test(cleanedValue)) {
      return `+38${cleanedValue}`;
    }
    // Якщо номер починається з 380 і має ще 9 цифр (напр. 380991234567) — додаємо спереду +.
    if (/^380\d{9}$/.test(cleanedValue)) {
      return `+${cleanedValue}`;
    }
    // Якщо номер вже правильний (+380...), просто повертаємо очищений від пробілів/дужок варіант.
    if (/^\+380\d{9}$/.test(cleanedValue)) {
      return cleanedValue;
    }
    // Якщо введено щось незрозуміле або занадто коротке — нічого не пропонуємо.
    return null;
  }

  // Валідація поля ІМ'Я:
  function validateName() {
    const inputElement = nameInput;
    const errorElement = getErrorElement("name");
    // Прибираємо зайві пробіли на початку і в кінці рядка.
    const value = inputElement.value.trim();
    // Перевіряємо, щоб довжина була від 2 до 50 символів.
    const valid = value.length >= 2 && value.length <= 50;
    if (valid) {
      showSuccess(inputElement, errorElement);
    } else {
      showErr(
        inputElement,
        errorElement,
        "Ім'я повинно містити не менше 2 символів.",
      );
    }
    return valid;
  }

  // Валідація поля EMAIL:
  function validateEmail() {
    const inputElement = emailInput;
    const errorElement = getErrorElement("email");
    const value = inputElement.value.trim();
    // Перевіряємо, щоб рядок не був порожнім, не перевищував 254 символи (стандарт для пошти) і відповідав REGEX_EMAIL.
    const valid =
      value.length > 0 && value.length <= 254 && REGEX_EMAIL.test(value);
    if (valid) {
      showSuccess(inputElement, errorElement);
    } else {
      showErr(
        inputElement,
        errorElement,
        "Введіть коректну електронну адресу (наприклад: user@mail.com).",
      );
    }
    return valid;
  }

  // Валідація поля ТЕЛЕФОН:
  function validatePhone() {
    const inputElement = phoneInput;
    const errorElement = getErrorElement("phone");
    const value = inputElement.value.trim();

    // Якщо поле взагалі порожнє — показуємо помилку і ховаємо підказку автовиправлення.
    if (!value) {
      showErr(inputElement, errorElement, "Введіть номер телефону.");
      hidePhoneHint();
      return false;
    }

    // Якщо номер відповідає суворому шаблону +380XXXXXXXXX — все супер, вмикаємо успіх.
    if (REGEX_PHONE.test(value)) {
      showSuccess(inputElement, errorElement);
      hidePhoneHint();
      return true;
    }

    // Якщо формат не збігся — показуємо помилку.
    showErr(
      inputElement,
      errorElement,
      "Формат має бути строго українським: +380XXXXXXXXX.",
    );

    // Пробуємо вгадати, що мав на увазі користувач, і показати кнопку підказки.
    suggestedPhoneValue = suggestPhoneFix(value);
    if (suggestedPhoneValue) {
      phoneHintText.textContent = `Можливо, ви мали на увазі ${suggestedPhoneValue}?`;
      phoneHint.classList.remove("hidden");
      updateDescribedBy(phoneInput, "phoneHint", true);
    } else {
      hidePhoneHint();
    }
    return false;
  }

  // Валідація поля ПОВІДОМЛЕННЯ:
  function validateMessage() {
    const inputElement = messageInput;
    const errorElement = getErrorElement("message");
    const value = inputElement.value.trim();
    // Перевіряємо довжину тексту: від 10 до 1000 символів.
    const valid = value.length >= 10 && value.length <= 1000;
    if (valid) {
      showSuccess(inputElement, errorElement);
    } else {
      showErr(
        inputElement,
        errorElement,
        "Повідомлення має містити щонайменше 10 символів.",
      );
    }
    return valid;
  }

  // Валідація чекбокса ЗГОДИ:
  function validateAgreement() {
    const inputElement = agreementInput;
    const errorElement = getErrorElement("consent");
    // Перевіряємо властивість .checked (чи стоїть галочка).
    if (inputElement.checked) {
      showSuccess(inputElement, errorElement);
      return true;
    }
    showErr(
      inputElement,
      errorElement,
      "Підтвердьте згоду, щоб надіслати повідомлення.",
    );
    return false;
  }

  // Функція-диспетчер: викликає потрібну функцію валідації залежно від того, яке поле передали.
  function validateTouchedField(inputElement) {
    if (inputElement === nameInput) return validateName();
    if (inputElement === emailInput) return validateEmail();
    if (inputElement === phoneInput) return validatePhone();
    if (inputElement === messageInput) return validateMessage();
    return validateAgreement();
  }

  // Імітація відправки форми на сервер (оскільки бекенд не підключений):
  function simulateSubmit() {
    // Якщо вже йде відправка — нічого не робимо (захист від повторних кліків).
    if (isSubmitting) return;
    isSubmitting = true;
    // Запам'ятовуємо кнопку, щоб повернути на неї фокус після закриття модалки.
    lastFocusedElement = submitButton;
    // Робимо кнопку неактивною і міняємо її текст.
    submitButton.disabled = true;
    submitButton.textContent = "Надсилаємо…";

    // Запускаємо таймер на 600 мс (імітуємо затримку відповіді сервера).
    window.setTimeout(() => {
      // Встановлюємо текст для звичайної форми зворотного зв'язку.
      if (successText instanceof HTMLElement) {
        successText.textContent =
          "Дякуємо! Ваше повідомлення успішно надіслано.";
      }
      modalCloseCallback = null;
      // Відкриваємо модальне вікно успіху.
      openModal();
      // Очищаємо всі введені дані у формі.
      form.reset();
      // Очищаємо список торкань до полів.
      touchedFields.clear();
      // Проходимо по всіх полях і скидаємо їхні зелені рамки та іконки до початкового стану.
      for (const inputElement of formFields) {
        clearError(inputElement, getErrorElement(inputElement.id));
      }
      // Повертаємо кнопці активний стан і початковий текст.
      submitButton.disabled = false;
      submitButton.textContent = "Надіслати";
      isSubmitting = false;
    }, 600);
  }

  // Блокує фоновий контент сайту, коли відкрите модальне вікно:
  function disableBackground() {
    // Зберігаємо поточні атрибути inert та aria-hidden для header, main, footer.
    backgroundState = backgroundElements.map((element) => ({
      element,
      wasInert: element.hasAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    // Вішаємо на них inert (забороняє кліки і перехід клавішею Tab) та aria-hidden="true" (ховає від скрінрідерів).
    for (const { element } of backgroundState) {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }
    // Забороняємо прокручування (скрол) сторінки.
    document.body.classList.add("overflow-hidden");
  }

  // Розблоковує фоновий контент після закриття модального вікна:
  function enableBackground() {
    // Відновлюємо кожному фоновому блоку його початкові атрибути.
    for (const { element, wasInert, ariaHidden } of backgroundState) {
      if (!wasInert) {
        element.removeAttribute("inert");
      }
      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    }
    backgroundState = [];
    // Повертаємо можливість прокручувати сторінку.
    document.body.classList.remove("overflow-hidden");
  }

  // "Пастка фокусу" (Focus Trap) для клавіатури всередині модального вікна:
  function trapModalFocus(event) {
    // Якщо натиснули клавішу Escape — закриваємо модальне вікно.
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    // Якщо натиснули будь-яку іншу клавішу, крім Tab — ігноруємо.
    if (event.key !== "Tab") return;

    // Знаходимо всі інтерактивні елементи всередині модалки, на які можна перейти клавішею Tab.
    const focusableElements = Array.from(
      successDialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element instanceof HTMLElement);
    // Якщо таких елементів немає — тримаємо фокус на самому вікні.
    if (focusableElements.length === 0) {
      event.preventDefault();
      successDialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    // Якщо в модалці лише один елемент (кнопка закриття) — не даємо фокусу вийти за її межі.
    if (focusableElements.length === 1) {
      event.preventDefault();
      firstElement.focus();
      // Якщо натиснуто Shift+Tab на першому елементі — перекидаємо фокус на останній (замикаємо коло).
    } else if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      // Якщо натиснуто Tab на останньому елементі — перекидаємо фокус на перший.
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  // Відкриває модальне вікно:
  function openModal() {
    disableBackground();
    // Показуємо вікно (замінюємо hidden на flex для центрування).
    successModal.classList.remove("hidden");
    successModal.classList.add("flex");
    // Вмикаємо прослуховування клавіш (Escape і Tab).
    document.addEventListener("keydown", trapModalFocus);
    // Переводимо фокус на кнопку закриття модального вікна.
    closeModalBtn.focus();
  }

  // Закриває модальне вікно:
  function closeModal() {
    // Вимикаємо прослуховування клавіш модалки.
    document.removeEventListener("keydown", trapModalFocus);
    // Ховаємо вікно.
    successModal.classList.remove("flex");
    successModal.classList.add("hidden");
    enableBackground();
    // Повертаємо фокус на елемент, який відкрив модальне вікно.
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;

    // Вмикаємо додаткову логіку конкретної форми після закриття модалки.
    if (typeof modalCloseCallback === "function") {
      const callback = modalCloseCallback;
      modalCloseCallback = null;
      callback();
    }
  }

  // Публічний метод для показу модалки іншою формою без дублювання розмітки.
  window.openSuccessModal = ({ text, returnFocus, onClose }) => {
    const successText = document.getElementById("successText");
    if (successText instanceof HTMLElement) successText.textContent = text;
    lastFocusedElement = returnFocus;
    modalCloseCallback = onClose ?? null;
    openModal();
  };

  // --- НИЖЧЕ ЙДУТЬ СЛУХАЧІ ПОДІЙ (РЕАКЦІЯ НА ДІЇ КОРИСТУВАЧА) ---

  // Клік по кнопці-підказці біля телефону: підставляє правильний номер і перевіряє поле.
  phoneFixButton.addEventListener("click", () => {
    if (!suggestedPhoneValue) return;
    phoneInput.value = suggestedPhoneValue;
    touchedFields.add(phoneInput);
    validatePhone();
  });

  // Подія "input" (коли користувач друкує в полі):
  for (const inputElement of [
    nameInput,
    emailInput,
    phoneInput,
    messageInput,
  ]) {
    inputElement.addEventListener("input", () => {
      // Перевіряємо поле на льоту ТІЛЬКИ якщо користувач вже виходив із нього (воно є в touchedFields).
      if (touchedFields.has(inputElement)) {
        validateTouchedField(inputElement);
      }
    });
  }

  // Подія "blur" (коли користувач клікнув у поле, а потім перейшов в інше місце):
  for (const inputElement of [
    nameInput,
    emailInput,
    phoneInput,
    messageInput,
    agreementInput,
  ]) {
    inputElement.addEventListener("blur", () => {
      // Записуємо поле в список "торкнутих" і одразу перевіряємо його.
      touchedFields.add(inputElement);
      validateTouchedField(inputElement);
    });
  }

  // Подія "change" для чекбокса: перевіряємо його миттєво при натисканні.
  agreementInput.addEventListener("change", () => {
    touchedFields.add(agreementInput);
    validateAgreement();
  });

  // Перевіряє одразу всі 5 полів (викликається при натисканні кнопки "Надіслати"):
  function validateForm() {
    const results = [
      validateName(),
      validateEmail(),
      validatePhone(),
      validateMessage(),
      validateAgreement(),
    ];
    // Шукаємо перше поле в списку, яке не пройшло перевірку (повернуло false).
    const firstInvalidField = formFields.find(
      (inputElement, index) => !results[index],
    );
    // Повертаємо об'єкт: чи вся форма валідна (results.every(Boolean)) і посилання на перше поле з помилкою.
    return { valid: results.every(Boolean), firstInvalidField };
  }

  // Подія "submit" (спроба відправити форму):
  form.addEventListener("submit", (event) => {
    // Скасовуємо стандартне перезавантаження сторінки браузером.
    event.preventDefault();
    if (isSubmitting) return;

    // Позначаємо всі поля як "торкнуті", щоб далі вони перевірялися при кожному натисканні клавіші.
    for (const inputElement of formFields) {
      touchedFields.add(inputElement);
    }
    // Запускаємо загальну перевірку форми.
    const result = validateForm();
    // Якщо є хоч одна помилка — ставимо курсор (фокус) у перше невалідне поле і зупиняємо відправку.
    if (!result.valid && result.firstInvalidField) {
      result.firstInvalidField.focus();
      return;
    }

    // Якщо всі поля заповнені правильно — запускаємо імітацію відправки.
    simulateSubmit();
  });

  // Закриття модального вікна при кліку на кнопку "Закрити".
  closeModalBtn.addEventListener("click", closeModal);
  // Закриття модального вікна при кліку на темний фон (оверлей):
  successModal.addEventListener("click", (event) => {
    // Перевіряємо, що клік був саме по темному фону (successModal), а не по білій картці всередині нього.
    if (event.target === successModal) {
      closeModal();
    }
  });
});
