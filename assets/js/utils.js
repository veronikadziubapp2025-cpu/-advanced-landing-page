(() => {
  const numberFormatter = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  });
  const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function getTodayValue() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  function addDays(dateValue, days) {
    const date = new Date(`${dateValue}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function formatPrice(amount) {
    return `${numberFormatter.format(amount)} ₴`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    return dateFormatter.format(new Date(`${dateValue}T00:00:00Z`));
  }

  function formatPhone(value) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("380")) digits = digits.slice(3);
    else if (digits.startsWith("38") && digits.length > 2) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0")) digits = digits.slice(1);

    digits = digits.slice(0, 9);
    let formatted = "+380 ";
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ` ${digits.slice(2, 5)}`;
    if (digits.length > 5) formatted += ` ${digits.slice(5, 7)}`;
    if (digits.length > 7) formatted += ` ${digits.slice(7, 9)}`;
    return formatted;
  }

  window.NeighborCraftUtils = {
    getTodayValue,
    addDays,
    formatPrice,
    formatDate,
    formatPhone,
  };
})();
