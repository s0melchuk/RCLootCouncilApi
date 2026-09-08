(() => {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = {
    summary: document.getElementById("summary-panel"),
    slots: document.getElementById("slots-panel"),
    loot: document.getElementById("loot-panel"),
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
