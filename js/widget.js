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

  function updateCalculator() {
    const rawDays = daysInput.value.trim();
    const days = rawDays === "" ? Number.NaN : Number(rawDays);

    if (
      !Number.isFinite(days) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      const message =
        rawDays === ""
          ? "Вкажіть кількість діб від 1 до 30."
          : "Вкажіть ціле число діб від 1 до 30.";
      showDaysError(message);
      return;
    }

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

    const kitSurcharge = kitPrices[kitSelect.value];
    const rent = (450 + kitSurcharge) * days;
    const discount = days >= 7 ? Math.round(rent * 0.1) : 0;
    const delivery = deliveryCheckbox.checked ? 80 : 0;
    const insurance = insuranceCheckbox.checked ? 30 * days : 0;
    const total = rent - discount + delivery + insurance;

    if (![rent, discount, delivery, insurance, total].every(Number.isFinite)) {
      clearDaysError();
      clearPrices();
      console.error("Не вдалося обчислити коректну вартість оренди.");
      return;
    }

    clearDaysError();
    rentElement.textContent = formatPrice(rent);
    discountElement.textContent = formatPrice(discount);
    deliveryElement.textContent = formatPrice(delivery);
    insuranceElement.textContent = formatPrice(insurance);
    depositElement.textContent = "1000 ₴";
    totalElement.textContent = formatPrice(total);
  }

  daysInput.addEventListener("input", updateCalculator);
  kitSelect.addEventListener("change", updateCalculator);
  deliveryCheckbox.addEventListener("change", updateCalculator);
  insuranceCheckbox.addEventListener("change", updateCalculator);

  updateCalculator();
});
