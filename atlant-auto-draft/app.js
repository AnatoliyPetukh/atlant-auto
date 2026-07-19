document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
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

document.querySelector(".request-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const note = event.currentTarget.querySelector(".form-note");
  if (note) note.textContent = event.currentTarget.dataset.success || "";
});
