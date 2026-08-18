const header = document.querySelector(".topbar");
const toggle = header?.querySelector(".nav-toggle");
const navigation = header?.querySelector(".nav");

function closeNavigation() {
  if (!header || !toggle) return;
  header.classList.remove("nav-open");
  toggle.setAttribute("aria-expanded", "false");
}

toggle?.addEventListener("click", () => {
  const open = !header.classList.contains("nav-open");
  header.classList.toggle("nav-open", open);
  toggle.setAttribute("aria-expanded", String(open));
});

navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeNavigation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

document.addEventListener("click", (event) => {
  if (header?.classList.contains("nav-open") && !header.contains(event.target)) closeNavigation();
});
