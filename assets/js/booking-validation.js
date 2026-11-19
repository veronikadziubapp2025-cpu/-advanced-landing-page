// Валідація та розрахунок ціни форми бронювання перфоратора.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  if (!(form instanceof HTMLFormElement)) return;

  const nameInput = document.getElementById("booking-name");
  const phoneInput = document.getElementById("booking-phone");
  const fromInput = document.getElementById("date-from");
  const toInput = document.getElementById("date-to");
  const commentInput = document.getElementById("comment");
  const totalElement = document.getElementById("booking-total");
  const submitButton = document.getElementById("booking-submit");
  const submitText = document.getElementById("booking-submit-text");
  const spinner = document.getElementById("booking-spinner");

  if (
    !(nameInput instanceof HTMLInputElement) ||
    !(phoneInput instanceof HTMLInputElement) ||
    !(fromInput instanceof HTMLInputElement) ||
    !(toInput instanceof HTMLInputElement) ||
    !(commentInput instanceof HTMLTextAreaElement) ||
    !(totalElement instanceof HTMLElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(submitText instanceof HTMLElement) ||
    !(spinner instanceof HTMLElement)
  ) {
    throw new Error("Не знайдено всі елементи форми бронювання.");
  }

  const touchedFields = new Set();
  const formFields = [nameInput, phoneInput, fromInput, toInput, commentInput];
  let isSubmitting = false;

  // Допоміжна функція повертає елемент повідомлення про помилку.
  function getErrorElement(inputElement) {
    const errorId = {
      [nameInput.id]: "bookingNameError",
      [phoneInput.id]: "bookingPhoneError",
      [fromInput.id]: "dateFromError",
      [toInput.id]: "dateToError",
      [commentInput.id]: "commentError",
    }[inputElement.id];
    const errorElement = document.getElementById(errorId);
    if (!(errorElement instanceof HTMLParagraphElement)) {
      throw new Error(
        `Повідомлення про помилку для поля "${inputElement.id}" не знайдено.`,
      );
    }
    return errorElement;
  }

  // Показує червону помилку під конкретним полем.
  function showError(inputElement, message) {
    const errorElement = getErrorElement(inputElement);
    inputElement.setAttribute("aria-invalid", "true");
    inputElement.removeAttribute("data-valid");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  // Ховає помилку та позначає поле валідним.
  function showSuccess(inputElement) {
    const errorElement = getErrorElement(inputElement);
    inputElement.setAttribute("aria-invalid", "false");
    inputElement.setAttribute("data-valid", "true");
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }

  // Повністю очищує стан помилки та валідності поля.
  function clearFieldState(inputElement) {
    const errorElement = getErrorElement(inputElement);
    inputElement.setAttribute("aria-invalid", "false");
    inputElement.removeAttribute("data-valid");
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }

  // Форматує поточні цифри номера у маску +380 XX XXX XX XX.
  function formatPhone(rawValue) {
    let digits = rawValue.replace(/\D/g, "");

    if (digits.startsWith("380")) {
      digits = digits.slice(3);
    } else if (digits.startsWith("38") && digits.length > 2) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 9);
    if (!digits) return "+380 ";

    let formatted = "+380 ";
    formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += " " + digits.slice(2, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 7);
    if (digits.length > 7) formatted += " " + digits.slice(7, 9);
    return formatted;
  }

  // Валідує ім'я: від 2 літер, без цифр і заборонених символів.
  function validateName() {
    const value = nameInput.value.trim();
    const letterCount = (value.match(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/g) ?? []).length;
    const lettersOnly = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'’-]+$/.test(value);

    if (!value) {
      showError(nameInput, "Введіть ім'я.");
      return false;
    }
    if (letterCount < 2) {
      showError(nameInput, "Ім'я повинно містити не менше 2 літер.");
      return false;
    }
    if (!lettersOnly) {
      showError(nameInput, "Допустимі лише літери, пробіл, апостроф і дефіс.");
      return false;
    }

    nameInput.value = value;
    showSuccess(nameInput);
    return true;
  }

  // Валідує повну маску телефону та рівно 12 цифр у номері.
  function validatePhone() {
    const value = phoneInput.value;
    const digits = value.replace(/\D/g, "");
    const valid =
      /^\+380 \d{2} \d{3} \d{2} \d{2}$/.test(value) && digits.length === 12;

    if (!value || value === "+380 ") {
      showError(phoneInput, "Введіть номер телефону.");
      return false;
    }
    if (!valid) {
      showError(
        phoneInput,
        "Введіть повний номер у форматі +380 XX XXX XX XX.",
      );
      return false;
    }

    showSuccess(phoneInput);
    return true;
  }

  // Повертає локальну дату сьогодні у форматі YYYY-MM-DD.
  function getTodayValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Додає одну добу до дати за вибраним записом.
  function addOneDay(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Валідує дату отримання.
  function validateFromDate() {
    const today = getTodayValue();
    if (!fromInput.value) {
      showError(fromInput, "Оберіть дату отримання.");
      return false;
    }
    if (fromInput.value < today) {
      showError(fromInput, "Дата отримання не може бути раніше за сьогодні.");
      return false;
    }
    showSuccess(fromInput);
    return true;
  }

  // Валідує дату повернення та мінімум одну добу оренди.
  function validateToDate() {
    if (!toInput.value) {
      showError(toInput, "Оберіть дату повернення.");
      return false;
    }
    if (!fromInput.value) {
      showError(toInput, "Спочатку оберіть дату отримання.");
      return false;
    }

    const minimumReturnDate = addOneDay(fromInput.value);
    if (toInput.value < minimumReturnDate) {
      showError(toInput, "Повернення має бути не раніше ніж через 1 добу.");
      return false;
    }

    showSuccess(toInput);
    return true;
  }

  // Коментар необов'язковий, але не може перевищувати 300 символів.
  function validateComment() {
    if (commentInput.value.length > 300) {
      showError(commentInput, "Коментар не може перевищувати 300 символів.");
      return false;
    }
    showSuccess(commentInput);
    return true;
  }

  // Перераховує кількість діб та суму оренди.
  function updatePrice() {
    if (
      !fromInput.value ||
      !toInput.value ||
      toInput.value <= fromInput.value
    ) {
      totalElement.textContent = "0 ₴";
      return;
    }

    const start = new Date(`${fromInput.value}T00:00:00`);
    const end = new Date(`${toInput.value}T00:00:00`);
    const days = Math.round((end - start) / 86400000);
    totalElement.textContent = days >= 1 ? `${days * 450} ₴` : "0 ₴";
  }

  function validateTouchedField(inputElement) {
    if (inputElement === nameInput) return validateName();
    if (inputElement === phoneInput) return validatePhone();
    if (inputElement === fromInput) return validateFromDate();
    if (inputElement === toInput) return validateToDate();
    return validateComment();
  }

  // Ініціалізує мінімальні дати та початковий стан телефону.
  const today = getTodayValue();
  fromInput.min = today;
  phoneInput.value = "+380 ";

  // Забороняє редагувати префікс і не дозволяє курсору заходити перед ним.
  phoneInput.addEventListener("keydown", (event) => {
    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      phoneInput.selectionStart <= 5
    ) {
      event.preventDefault();
      phoneInput.setSelectionRange(5, 5);
    }
  });

  phoneInput.addEventListener("click", () => {
    if ((phoneInput.selectionStart ?? 0) < 5) {
      phoneInput.setSelectionRange(5, 5);
    }
  });

  // При введенні, вставленні або видаленні одразу нормалізує маску.
  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
    phoneInput.setSelectionRange(
      phoneInput.value.length,
      phoneInput.value.length,
    );
    if (touchedFields.has(phoneInput)) validatePhone();
  });

  nameInput.addEventListener("input", () => {
    if (touchedFields.has(nameInput)) validateName();
  });
  commentInput.addEventListener("input", () => {
    if (touchedFields.has(commentInput)) validateComment();
  });

  fromInput.addEventListener("change", () => {
    toInput.min = fromInput.value ? addOneDay(fromInput.value) : "";
    updatePrice();
    if (touchedFields.has(fromInput)) validateFromDate();
    if (touchedFields.has(toInput) || toInput.value) validateToDate();
  });

  toInput.addEventListener("change", () => {
    updatePrice();
    if (touchedFields.has(toInput)) validateToDate();
  });

  for (const inputElement of formFields) {
    inputElement.addEventListener("blur", () => {
      touchedFields.add(inputElement);
      validateTouchedField(inputElement);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    for (const inputElement of formFields) touchedFields.add(inputElement);

    const results = [
      validateName(),
      validatePhone(),
      validateFromDate(),
      validateToDate(),
      validateComment(),
    ];

    const firstInvalidField = formFields.find(
      (inputElement, index) => !results[index],
    );
    if (firstInvalidField) {
      firstInvalidField.focus();
      return;
    }

    // Увімкнення стану завантаження й тимчасове блокування всіх полів форми.
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitText.textContent = "Надсилаємо...";
    spinner.classList.remove("hidden");
    for (const inputElement of formFields) inputElement.disabled = true;

    // Імітуємо мережевий запит і після затримки показуємо результат.
    window.setTimeout(() => {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.setAttribute("aria-busy", "false");
      submitText.textContent = "Забронювати";
      spinner.classList.add("hidden");
      for (const inputElement of formFields) inputElement.disabled = false;

      if (typeof window.openSuccessModal === "function") {
        window.openSuccessModal({
          text: "Ваше бронювання успішно оформлено. Очікуйте підтвердження власника.",
          returnFocus: submitButton,
          onClose: () => {
            form.reset();
            phoneInput.value = "+380 ";
            fromInput.min = today;
            toInput.min = "";
            totalElement.textContent = "0 ₴";
            touchedFields.clear();
            for (const inputElement of formFields)
              clearFieldState(inputElement);
          },
        });
      }
    }, 1500);
  });

  updatePrice();
});
