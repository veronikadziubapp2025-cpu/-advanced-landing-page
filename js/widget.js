document.addEventListener("DOMContentLoaded", () => {
  const daysInput = document.getElementById("rent-days");
  const kitSelect = document.getElementById("kit-type");
  const deliveryCheckbox = document.getElementById("delivery-opt");
  const insuranceCheckbox = document.getElementById("insurance-opt");
  const totalElement = document.getElementById("total-price");
  const errorElement = document.getElementById("error-days");
  const rentElement = document.getElementById("bd-rent");
  const discountElement = document.getElementById("bd-discount");
  const deliveryElement = document.getElementById("bd-delivery");
  const insuranceElement = document.getElementById("bd-insurance");
  const depositElement = document.getElementById("bd-deposit");

  if (
    !(daysInput instanceof HTMLInputElement) ||
    !(kitSelect instanceof HTMLSelectElement) ||
    !(deliveryCheckbox instanceof HTMLInputElement) ||
    !(insuranceCheckbox instanceof HTMLInputElement) ||
    !(totalElement instanceof HTMLElement) ||
    !(errorElement instanceof HTMLParagraphElement) ||
    !(rentElement instanceof HTMLElement) ||
    !(discountElement instanceof HTMLElement) ||
    !(deliveryElement instanceof HTMLElement) ||
    !(insuranceElement instanceof HTMLElement) ||
    !(depositElement instanceof HTMLElement)
  ) {
    throw new Error("Не знайдено всі елементи калькулятора оренди.");
  }

  const kitPrices = {
    basic: 0,
    drills: 50,
    full: 90,
  };
  const formatter = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  });
  const formatPrice = (amount) => `${formatter.format(amount)} ₴`;

  window.calculateRentalPrice = (days, kitType, hasDelivery, hasInsurance) => {
    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30 ||
      !Object.prototype.hasOwnProperty.call(kitPrices, kitType)
    ) {
      return null;
    }

    const rent = (450 + kitPrices[kitType]) * days;
    const discount = days >= 7 ? Math.round(rent * 0.1) : 0;
    const delivery = hasDelivery ? 80 : 0;
    const insurance = hasInsurance ? 30 * days : 0;
    const total = rent - discount + delivery + insurance;

    if (![rent, discount, delivery, insurance, total].every(Number.isFinite)) {
      return null;
    }

    return { rent, discount, delivery, insurance, total };
  };

  function clearPrices() {
    totalElement.textContent = "—";
    rentElement.textContent = "—";
    discountElement.textContent = "—";
    deliveryElement.textContent = "—";
    insuranceElement.textContent = "—";
    depositElement.textContent = "1000 ₴";
  }

  function showDaysError(message) {
    daysInput.setAttribute("aria-invalid", "true");
    daysInput.classList.remove(
      "focus-visible:border-[#121212]",
      "focus-visible:ring-[#121212]",
    );
    daysInput.classList.add(
      "border-[#B91C1C]",
      "focus-visible:border-[#B91C1C]",
      "focus-visible:ring-[#B91C1C]",
    );
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
    clearPrices();
  }

  function clearDaysError() {
    daysInput.setAttribute("aria-invalid", "false");
    daysInput.classList.remove(
      "border-[#B91C1C]",
      "focus-visible:border-[#B91C1C]",
      "focus-visible:ring-[#B91C1C]",
    );
    daysInput.classList.add(
      "focus-visible:border-[#121212]",
      "focus-visible:ring-[#121212]",
    );
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }

  function updateCalculator(showEmptyError = true) {
    const rawDays = daysInput.value.trim();
    const days = rawDays === "" ? Number.NaN : Number(rawDays);

    if (
      !Number.isFinite(days) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      if (rawDays === "" && !daysInput.dataset.validationMessage) {
        clearDaysError();
        clearPrices();
        return;
      }
      const message =
        daysInput.dataset.validationMessage ||
        (rawDays === ""
          ? "Вкажіть кількість діб від 1 до 30."
          : "Вкажіть ціле число діб від 1 до 30.");
      delete daysInput.dataset.validationMessage;
      showDaysError(message);
      return;
    }

    delete daysInput.dataset.validationMessage;
    const hasKitPrice = Object.prototype.hasOwnProperty.call(
      kitPrices,
      kitSelect.value,
    );
    if (!hasKitPrice) {
      clearDaysError();
      clearPrices();
      console.error(
        `Невідома комплектація калькулятора: ${kitSelect.value}`,
      );
      return;
    }

    const calculation = window.calculateRentalPrice(
      days,
      kitSelect.value,
      deliveryCheckbox.checked,
      insuranceCheckbox.checked,
    );
    if (!calculation) {
      clearDaysError();
      clearPrices();
      console.error("Не вдалося обчислити коректну вартість оренди.");
      return;
    }

    clearDaysError();
    rentElement.textContent = formatPrice(calculation.rent);
    discountElement.textContent = formatPrice(calculation.discount);
    deliveryElement.textContent = formatPrice(calculation.delivery);
    insuranceElement.textContent = formatPrice(calculation.insurance);
    depositElement.textContent = "1000 ₴";
    totalElement.textContent = formatPrice(calculation.total);
  }

  daysInput.addEventListener("input", () => updateCalculator(true));
  kitSelect.addEventListener("change", () => updateCalculator(true));
  deliveryCheckbox.addEventListener("change", () => updateCalculator(true));
  insuranceCheckbox.addEventListener("change", () => updateCalculator(true));

  updateCalculator(false);
});
