(() => {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = {
    loot: document.getElementById("loot-panel"),
    summary: document.getElementById("summary-panel"),
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabButtons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });
      Object.entries(panels).forEach(([name, panel]) => {
        panel.hidden = name !== target;
      });
    });
  });
})();
