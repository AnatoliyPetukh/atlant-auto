(() => {
  const storageKey = "atlantAutoCookieConsent";
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  let savedChoice = null;
  try {
    savedChoice = window.localStorage.getItem(storageKey);
  } catch {
    savedChoice = null;
  }

  if (!savedChoice) banner.hidden = false;

  banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.cookieChoice;
      try {
        window.localStorage.setItem(storageKey, choice);
      } catch {
        // The preference remains valid for the current page even if storage is blocked.
      }
      banner.hidden = true;
      document.dispatchEvent(new CustomEvent("atlant:cookie-consent", { detail: { choice } }));
    });
  });
})();
