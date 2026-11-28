document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "neighborCraftState";
  const kitNames = {
    basic: "Тільки перфоратор",
    drills: "+ набір свердел",
    full: "+ набір свердел і пилозбірник",
  };
  const defaultState = {
    dateFrom: "",
    dateTo: "",
    rentDays: 0,
    kitType: "basic",
    delivery: false,
    insurance: false,
    totalPrice: 0,
    name: "",
    phone: "+380 ",
    email: "",
    comment: "",
    consent: false,
    mode: "booking",
  };
  const state = { ...defaultState };
  const { addDays, formatDate, formatPrice, getTodayValue } =
    window.NeighborCraftUtils;
  let pendingSave;

  const bookingForm = getElement("booking-form", HTMLFormElement);
  const calcForm = getElement("calc-form", HTMLFormElement);
  const feedbackForm = getElement("feedback-form", HTMLFormElement);
  const fromInput = getElement("date-from", HTMLInputElement);
  const toInput = getElement("date-to", HTMLInputElement);
  const bookingKit = getElement("booking-kit-type", HTMLSelectElement);
  const daysInput = getElement("rent-days", HTMLInputElement);
  const calcKit = getElement("kit-type", HTMLSelectElement);
  const deliveryInput = getElement("delivery-opt", HTMLInputElement);
  const insuranceInput = getElement("insurance-opt", HTMLInputElement);
  const nameInput = getElement("name", HTMLInputElement);
  const phoneInput = getElement("phone", HTMLInputElement);
  const emailInput = getElement("email", HTMLInputElement);
  const messageInput = getElement("message", HTMLTextAreaElement);
  const consentInput = getElement("consent", HTMLInputElement);
  const bookingTab = getElement("booking-mode-tab", HTMLButtonElement);
  const questionTab = getElement("question-mode-tab", HTMLButtonElement);
  const summaryPanel = getElement("booking-summary", HTMLElement);
  const summaryPrompt = getElement("booking-summary-prompt", HTMLElement);
  const messageRequiredMark = getElement(
    "message-required-mark",
    HTMLElement,
  );
  const messageOptionalMark = getElement(
    "message-optional-mark",
    HTMLElement,
  );
  const summaryFields = {
    dates: getElement("summary-dates", HTMLElement),
    days: getElement("summary-days", HTMLElement),
    kit: getElement("summary-kit", HTMLElement),
    delivery: getElement("summary-delivery", HTMLElement),
    insurance: getElement("summary-insurance", HTMLElement),
    total: getElement("summary-total", HTMLElement),
    price: getElement("booking-price-summary", HTMLElement),
  };
  const checkoutButton = getElement("proceed-to-checkout", HTMLButtonElement);
  const returnButton = getElement("return-to-booking", HTMLButtonElement);
  const submitButton = getElement(
    "feedback-form",
    HTMLFormElement,
  ).querySelector('button[type="submit"]');
  if (!(submitButton instanceof HTMLButtonElement)) {
    throw new Error('Не знайдено кнопку відправлення "#feedback-form".');
  }

  function getElement(id, ElementType) {
    const element = document.getElementById(id);
    if (!(element instanceof ElementType)) {
      throw new Error(`Не знайдено обов'язковий елемент "#${id}".`);
    }
    return element;
  }

  function readStoredState() {
    let storedValue;
    try {
      storedValue = localStorage.getItem(storageKey);
    } catch (error) {
      console.error("Не вдалося прочитати стан NeighborCraft із localStorage.", error);
      return;
    }
    if (!storedValue) return;

    try {
      const saved = JSON.parse(storedValue);
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
        throw new TypeError("Збережений стан має бути об'єктом.");
      }

      state.dateFrom = typeof saved.dateFrom === "string" ? saved.dateFrom : "";
      state.dateTo = typeof saved.dateTo === "string" ? saved.dateTo : "";
      state.rentDays =
        Number.isInteger(saved.rentDays) && saved.rentDays >= 1 && saved.rentDays <= 30
          ? saved.rentDays
          : 0;
      state.kitType = Object.prototype.hasOwnProperty.call(
        kitNames,
        saved.kitType,
      )
        ? saved.kitType
        : "basic";
      state.delivery = saved.delivery === true;
      state.insurance = saved.insurance === true;
      state.name = typeof saved.name === "string" ? saved.name : "";
      state.phone =
        typeof saved.phone === "string" && saved.phone
          ? saved.phone
          : "+380 ";
      state.email = typeof saved.email === "string" ? saved.email : "";
      state.comment = typeof saved.comment === "string" ? saved.comment : "";
      state.consent = saved.consent === true;
      state.mode = saved.mode === "question" ? "question" : "booking";
    } catch (error) {
      console.error("Збережений стан NeighborCraft пошкоджений.", error);
      try {
        localStorage.removeItem(storageKey);
      } catch (removeError) {
        console.error("Не вдалося видалити пошкоджений стан NeighborCraft.", removeError);
      }
    }
  }

  function saveState() {
    window.clearTimeout(pendingSave);
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Не вдалося зберегти стан NeighborCraft у localStorage.", error);
    }
  }

  function scheduleSave() {
    window.clearTimeout(pendingSave);
    pendingSave = window.setTimeout(saveState, 250);
  }

  function dateDifference(from, to) {
    if (!from || !to) return null;
    const start = Date.parse(`${from}T00:00:00Z`);
    const end = Date.parse(`${to}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return Math.round((end - start) / 86400000);
  }

  function readFormState() {
    state.dateFrom = fromInput.value;
    state.dateTo = toInput.value;
    state.rentDays = daysInput.value === "" ? 0 : Number(daysInput.value);
    state.kitType = calcKit.value;
    state.delivery = deliveryInput.checked;
    state.insurance = insuranceInput.checked;
    state.name = nameInput.value;
    state.phone = phoneInput.value;
    state.email = emailInput.value;
    state.comment = messageInput.value;
    state.consent = consentInput.checked;
  }

  function renderSummary() {
    const days = dateDifference(state.dateFrom, state.dateTo);
    const validDateRange =
      days !== null &&
      days >= 1 &&
      days <= 30 &&
      state.dateFrom >= getTodayValue();
    const daysForCalculation = validDateRange ? days : Number(daysInput.value);
    const calculation =
      Number.isInteger(daysForCalculation) && daysForCalculation >= 1
        ? window.calculateRentalPrice(
            daysForCalculation,
            calcKit.value,
            deliveryInput.checked,
            insuranceInput.checked,
          )
        : null;

    summaryFields.dates.textContent = validDateRange
      ? `${formatDate(state.dateFrom)} — ${formatDate(state.dateTo)}`
      : "Не обрано";
    summaryFields.days.textContent = validDateRange
      ? `${days} ${getDayWord(days)}`
      : "Не обрано";
    summaryFields.kit.textContent =
      kitNames[state.kitType] ?? kitNames.basic;
    summaryFields.delivery.textContent = state.delivery ? "Так" : "Ні";
    summaryFields.insurance.textContent = state.insurance ? "Так" : "Ні";
    summaryFields.total.textContent = calculation
      ? formatPrice(calculation.total)
      : "—";
    summaryPrompt.classList.toggle("hidden", validDateRange);

    summaryFields.price.textContent = calculation
      ? `Разом: ${formatPrice(calculation.total)} (${daysForCalculation} ${getDayWord(daysForCalculation)}) + 1 000 ₴ застава`
      : "Оберіть дати оренди, щоб побачити підсумок.";
    state.totalPrice = calculation ? calculation.total : 0;
  }

  function getDayWord(days) {
    const lastTwoDigits = days % 100;
    const lastDigit = days % 10;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "діб";
    if (lastDigit === 1) return "доба";
    if (lastDigit >= 2 && lastDigit <= 4) return "доби";
    return "діб";
  }

  function setMode(mode, persist = true) {
    state.mode = mode;
    const bookingMode = mode === "booking";
    bookingTab.setAttribute("aria-selected", String(bookingMode));
    bookingTab.tabIndex = bookingMode ? 0 : -1;
    questionTab.setAttribute("aria-selected", String(!bookingMode));
    questionTab.tabIndex = bookingMode ? -1 : 0;
    bookingTab.classList.toggle("bg-white", bookingMode);
    bookingTab.classList.toggle("shadow-sm", bookingMode);
    bookingTab.classList.toggle("text-[#121212]", bookingMode);
    bookingTab.classList.toggle("text-[#595959]", !bookingMode);
    questionTab.classList.toggle("bg-white", !bookingMode);
    questionTab.classList.toggle("shadow-sm", !bookingMode);
    questionTab.classList.toggle("text-[#121212]", !bookingMode);
    questionTab.classList.toggle("text-[#595959]", bookingMode);
    summaryPanel.classList.toggle("hidden", !bookingMode);
    messageInput.required = !bookingMode;
    messageRequiredMark.classList.toggle("hidden", bookingMode);
    messageOptionalMark.classList.toggle("hidden", !bookingMode);
    submitButton.textContent = bookingMode
      ? "Підтвердити бронювання"
      : "Надіслати повідомлення";
    if (messageInput.getAttribute("aria-invalid") === "true") {
      window.validateFeedbackMessage?.();
    }
    if (persist) saveState();
  }

  function restoreFormValues() {
    fromInput.value = state.dateFrom;
    toInput.value = state.dateTo;
    bookingKit.value = state.kitType;
    calcKit.value = state.kitType;
    daysInput.value = String(state.rentDays || "");
    deliveryInput.checked = state.delivery;
    insuranceInput.checked = state.insurance;
    nameInput.value = state.name;
    phoneInput.value = state.phone;
    emailInput.value = state.email;
    messageInput.value = state.comment;
    consentInput.checked = state.consent;

    const daysFromDates = dateDifference(state.dateFrom, state.dateTo);
    if (daysFromDates !== null && daysFromDates >= 1) {
      daysInput.value = String(daysFromDates);
    }

    toInput.min = fromInput.value ? addDays(fromInput.value, 1) : "";
    setMode(state.mode, false);
    readFormState();
    window.updateRentalCalculator();
    renderSummary();
  }

  function syncFromDates() {
    const days = dateDifference(fromInput.value, toInput.value);
    daysInput.value = days === null ? "" : String(days);
    delete daysInput.dataset.validationMessage;
  }

  function syncToDate() {
    const days = Number(daysInput.value);
    if (!fromInput.value) return;
    toInput.min = addDays(fromInput.value, 1);
    toInput.value =
      Number.isInteger(days) && days >= 1 && days <= 30
        ? addDays(fromInput.value, days)
        : "";
  }

  function handleInput(event) {
    if (event.target === daysInput) {
      syncToDate();
      readFormState();
      renderSummary();
      window.updateRentalCalculator();
    } else {
      readFormState();
    }
    scheduleSave();
  }

  function handleChange(event) {
    let updatePrices = false;
    if (event.target === fromInput || event.target === toInput) {
      syncFromDates();
      updatePrices = true;
    } else if (event.target === bookingKit) {
      calcKit.value = bookingKit.value;
      updatePrices = true;
    } else if (event.target === calcKit) {
      bookingKit.value = calcKit.value;
      updatePrices = true;
    } else if (event.target === deliveryInput || event.target === insuranceInput) {
      updatePrices = true;
    }
    readFormState();
    if (updatePrices) {
      renderSummary();
      window.updateRentalCalculator();
    }
    saveState();
  }

  daysInput.addEventListener("input", handleInput);
  for (const input of [nameInput, phoneInput, emailInput, messageInput]) {
    input.addEventListener("input", handleInput);
  }
  for (const input of [
    fromInput,
    toInput,
    bookingKit,
    calcKit,
    deliveryInput,
    insuranceInput,
    consentInput,
  ]) {
    input.addEventListener("change", handleChange);
  }

  bookingTab.addEventListener("click", () => setMode("booking"));
  questionTab.addEventListener("click", () => setMode("question"));
  for (const [tab, mode] of [
    [bookingTab, "booking"],
    [questionTab, "question"],
  ]) {
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const nextMode =
        event.key === "Home"
          ? "booking"
          : event.key === "End"
            ? "question"
            : mode === "booking"
              ? "question"
              : "booking";
      setMode(nextMode);
      (nextMode === "booking" ? bookingTab : questionTab).focus();
    });
  }

  checkoutButton.addEventListener("click", () => {
    const days = Number(daysInput.value);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      daysInput.dataset.validationMessage =
        daysInput.value.trim() === ""
          ? "Вкажіть кількість діб від 1 до 30."
          : "Вкажіть ціле число діб від 1 до 30.";
      window.updateRentalCalculator();
      daysInput.focus();
      return;
    }
    document.getElementById("feedback")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  returnButton.addEventListener("click", () => {
    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    fromInput.focus({ preventScroll: true });
  });

  window.neighborCraftState = state;
  window.resetNeighborCraftState = () => {
    window.clearTimeout(pendingSave);
    Object.assign(state, defaultState);
    bookingForm.reset();
    calcForm.reset();
    feedbackForm.reset();
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Не вдалося видалити стан NeighborCraft із localStorage.", error);
    }
    fromInput.value = "";
    toInput.value = "";
    toInput.min = "";
    daysInput.value = "";
    bookingKit.value = defaultState.kitType;
    calcKit.value = defaultState.kitType;
    deliveryInput.checked = false;
    insuranceInput.checked = false;
    nameInput.value = "";
    phoneInput.value = "+380 ";
    emailInput.value = "";
    messageInput.value = "";
    consentInput.checked = false;
    setMode("booking", false);
    window.updateRentalCalculator();
    document.dispatchEvent(new Event("neighborcraft:reset"));
    readFormState();
    renderSummary();
  };

  readStoredState();
  restoreFormValues();
});
