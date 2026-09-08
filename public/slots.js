// Wrapped in an IIFE so its top-level names don't clash with app.js/summary.js,
// loaded on the same page as the other tabs.
(() => {
  const head = document.getElementById("slots-head");
  const tbody = document.getElementById("slots-body");

  // Recognized slots sort in this order (mirrors the guild's old spreadsheet);
  // anything else observed in the data (typos, new gear types) is appended
  // alphabetically rather than dropped, since `slot` is free text on ingest.
  const CANONICAL_ORDER = [
    "Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist",
    "Legs", "Feet", "Ring", "Trinket", "Weapon", "Off Hand", "Ranged", "Relic",
  ];

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function sortSlots(slots) {
    return [...slots].sort((a, b) => {
      const ra = CANONICAL_ORDER.indexOf(a);
      const rb = CANONICAL_ORDER.indexOf(b);
      if (ra !== -1 || rb !== -1) {
        return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
      }
      return a.localeCompare(b);
    });
  }

  async function load() {
    const res = await fetch("/api/stats");
    if (!res.ok) {
      tbody.innerHTML = `<tr><td>Failed to load (${res.status})</td></tr>`;
      return;
    }
    const { results } = await res.json();

    const allSlots = sortSlots([...new Set(results.flatMap((r) => r.slots_received))]);
    const players = [...results].sort((a, b) => a.player.localeCompare(b.player));

    head.innerHTML = `<tr><th>Name</th>${allSlots.map((s) => `<th>${escapeHtml(s)}</th>`).join("")}</tr>`;

    if (!players.length) {
      tbody.innerHTML = '<tr><td>No players yet</td></tr>';
      return;
    }
    if (!allSlots.length) {
      tbody.innerHTML = '<tr><td>No awards with a recorded slot yet</td></tr>';
      return;
    }

    tbody.innerHTML = players
      .map((p) => {
        const received = new Set(p.slots_received);
        const cells = allSlots.map((s) => `<td class="slot-cell">${received.has(s) ? "✓" : ""}</td>`).join("");
        return `<tr><td>${escapeHtml(p.player)}</td>${cells}</tr>`;
      })
      .join("");
  }

  load();
})();
