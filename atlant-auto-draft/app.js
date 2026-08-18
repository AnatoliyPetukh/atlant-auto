const catalogueStatusOrder = { "on-site": 0, "in-transit": 1, sold: 2 };

document.querySelectorAll(".cars-grid").forEach((grid) => {
  [...grid.querySelectorAll(":scope > .car-card[data-status]")]
    .sort((first, second) =>
      (catalogueStatusOrder[first.dataset.status] ?? 99) -
      (catalogueStatusOrder[second.dataset.status] ?? 99)
    )
    .forEach((card) => grid.append(card));
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    let visible = 0;
    document.querySelectorAll(".car-card[data-status]").forEach((card) => {
      const show = filter === "all" || card.dataset.status === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    const empty = document.querySelector("[data-empty-state]");
    if (empty) empty.hidden = visible > 0;
  });
});

document.querySelectorAll("[data-service-package]").forEach((link) => {
  link.addEventListener("click", () => {
    const select = document.querySelector('.request-form select[name="service"]');
    if (select) select.value = link.dataset.servicePackage || "general";
  });
});

const requestedVehicle = new URLSearchParams(window.location.search).get("car");
if (requestedVehicle) {
  const message = document.querySelector('.request-form textarea[name="message"]');
  if (message && !message.value) {
    const prefix = document.documentElement.lang === "pl" ? "Interesuje mnie samochód:" : "I am interested in:";
    message.value = `${prefix} ${requestedVehicle}`;
  }
}

document.querySelector(".request-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  const data = new FormData(form);
  const service = form.querySelector('select[name="service"]')?.selectedOptions[0]?.textContent || "";
  const lines = [
    [form.dataset.labelName, data.get("name")],
    [form.dataset.labelContact, data.get("contact")],
    [form.dataset.labelService, service],
    [form.dataset.labelBudget, data.get("budget")],
    [form.dataset.labelMessage, data.get("message")]
  ].filter(([, value]) => String(value || "").trim()).map(([label, value]) => `${label}: ${String(value).trim()}`);
  const mailto = `mailto:${form.dataset.recipient}?subject=${encodeURIComponent(form.dataset.subject || "Atlant Auto")}&body=${encodeURIComponent(lines.join("\n\n"))}`;
  const note = form.querySelector(".form-note");
  if (note) note.textContent = form.dataset.success || "";
  window.location.href = mailto;
});
