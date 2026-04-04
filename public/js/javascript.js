
document.addEventListener("DOMContentLoaded", function () {
  const forms = document.querySelectorAll(".needs-validation");

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });

  const bookingForms = document.querySelectorAll("[data-booking-form]");
  const numberFormatter = new Intl.NumberFormat("en-IN");
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  bookingForms.forEach(function (form) {
    const nightlyPrice = Number(form.dataset.nightlyPrice || 0);
    const checkInInput = form.querySelector("[data-checkin]");
    const checkOutInput = form.querySelector("[data-checkout]");
    const guestsInput = form.querySelector("[data-guests]");
    const nightsOutput = form.querySelector("[data-booking-nights]");
    const guestsOutput = form.querySelector("[data-booking-guests]");
    const totalOutput = form.querySelector("[data-booking-total]");

    function parseDate(value) {
      if (!value) {
        return null;
      }

      const parsedDate = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }

      return parsedDate;
    }

    function updateSummary() {
      const checkInDate = parseDate(checkInInput.value);
      const checkOutDate = parseDate(checkOutInput.value);
      const guests = Number(guestsInput.value || 1);
      let nights = 0;

      if (checkInDate && checkOutDate) {
        const difference = (checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY;
        if (Number.isInteger(difference) && difference > 0) {
          nights = difference;
        }
      }

      const total = nights * nightlyPrice;
      nightsOutput.textContent = nights;
      guestsOutput.textContent = guests > 0 ? guests : 1;
      totalOutput.textContent = numberFormatter.format(total);

      if (checkInInput.value) {
        const nextDay = new Date(checkInDate.getTime() + MS_PER_DAY);
        const nextDayValue = nextDay.toISOString().split("T")[0];
        checkOutInput.min = nextDayValue;

        if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = "";
        }
      }
    }

    checkInInput.addEventListener("input", updateSummary);
    checkOutInput.addEventListener("input", updateSummary);
    guestsInput.addEventListener("input", updateSummary);
    updateSummary();
  });
});
