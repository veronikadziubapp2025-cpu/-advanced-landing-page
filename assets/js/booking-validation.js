document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  const fromInput = document.getElementById("date-from");
  const toInput = document.getElementById("date-to");
  const daysInput = document.getElementById("rent-days");

  if (
    !(form instanceof HTMLFormElement) ||
    !(fromInput instanceof HTMLInputElement) ||
    !(toInput instanceof HTMLInputElement) ||
    !(daysInput instanceof HTMLInputElement)
  ) {
    throw new Error("Не знайдено всі елементи форми швидкого бронювання.");
  }

  const fromError = document.getElementById("dateFromError");
  const toError = document.getElementById("dateToError");
  if (
    !(fromError instanceof HTMLParagraphElement) ||
    !(toError instanceof HTMLParagraphElement)
  ) {
    throw new Error("Не знайдено повідомлення про помилку дати бронювання.");
  }

  const { getTodayValue, addDays } = window.NeighborCraftUtils;

  function setFieldState(input, error, message) {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) {
      input.removeAttribute("data-valid");
      error.textContent = message;
      error.classList.remove("hidden");
      return;
    }

    input.setAttribute("data-valid", "true");
    error.textContent = "";
    error.classList.add("hidden");
  }

  function validateDates() {
    const today = getTodayValue();
    fromInput.min = today;
    toInput.min = fromInput.value ? addDays(fromInput.value, 1) : "";

    let firstInvalidField = null;
    let fromMessage = "";
    let toMessage = "";
    if (!fromInput.value) {
      fromMessage = "Оберіть дату отримання.";
    } else if (fromInput.value < today) {
      fromMessage = "Дата отримання не може бути раніше за сьогодні.";
    }

    if (!toInput.value) {
      toMessage = "Оберіть дату повернення.";
    } else if (!fromInput.value) {
      toMessage = "Спочатку оберіть дату отримання.";
    } else if (toInput.value <= fromInput.value) {
      toMessage = "Повернення має бути щонайменше через 1 добу.";
    } else {
      const start = Date.parse(`${fromInput.value}T00:00:00Z`);
      const end = Date.parse(`${toInput.value}T00:00:00Z`);
      const days = Math.round((end - start) / 86400000);
      if (days > 30) {
        toMessage = "Термін оренди не може перевищувати 30 діб.";
      }
    }

    setFieldState(fromInput, fromError, fromMessage);
    setFieldState(toInput, toError, toMessage);
    if (fromMessage) firstInvalidField = fromInput;
    else if (toMessage) firstInvalidField = toInput;

    return { valid: !firstInvalidField, firstInvalidField };
  }

  fromInput.min = getTodayValue();
  fromInput.addEventListener("change", () => {
    toInput.min = fromInput.value ? addDays(fromInput.value, 1) : "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = validateDates();
    if (!result.valid) {
      result.firstInvalidField.focus();
      return;
    }

    document.getElementById("rental-calculator")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  window.validateBookingDates = validateDates;
  document.addEventListener("neighborcraft:reset", () => {
    fromInput.setAttribute("aria-invalid", "false");
    fromInput.removeAttribute("data-valid");
    fromError.textContent = "";
    fromError.classList.add("hidden");
    toInput.setAttribute("aria-invalid", "false");
    toInput.removeAttribute("data-valid");
    toError.textContent = "";
    toError.classList.add("hidden");
    fromInput.min = getTodayValue();
  });
});
