// Wrapped in an IIFE so its top-level names don't clash with app.js/summary.js,
// loaded on the same page as the other tabs.
(() => {
  const head = document.getElementById("slots-head");
  const tbody = document.getElementById("slots-body");
  const playerFilter = document.getElementById("slots-filter-player");

  // Fetched once and re-rendered locally as the filter changes -- same
  // reasoning as the Player summary tab: this dataset is small enough to
  // hold in memory, so there's no need to round-trip the server per keystroke.
  let allPlayers = [];
  let allSlots = [];

  // The 16 real WotLK (3.3.5) equipment slots, in paperdoll order (Shirt and
  // Tabard omitted -- cosmetic, never loot-councilled), each mapped to every
  // spelling actually seen across this guild's own data: the item-priority
  // sheets used "Finger"/"Ring"/"Shield"/"Ranged", LOOT_LOG used
  // "Wrist"/"Hands"/"Feet", and the RESULTS sheet used "Bracer"/"Gloves"/
  // "Boots"/"Ring 1"/"Ring 2"/"Weapon 2/Offhand"/"Relic/Ranged". Two more
  // categories the guild's own sheet tracked even though they aren't
  // paperdoll slots -- "Token" (tier tokens) and "Mount" (BoP mount drops)
  // -- are ranked right after. Anything else (typos, future item types) is
  // appended alphabetically rather than dropped, since `slot` is free text
  // on ingest.
  const SLOT_GROUPS = [
    ["Head"],
    ["Neck"],
    ["Shoulder"],
    ["Back", "Cloak"],
    ["Chest"],
    ["Wrist", "Bracer", "Bracers"],
    ["Hands", "Gloves", "Gauntlets"],
    ["Waist", "Belt"],
    ["Legs"],
    ["Feet", "Boots"],
    ["Finger", "Ring", "Ring 1", "Ring 2", "Finger 1", "Finger 2"],
    ["Trinket", "Trinket 1", "Trinket 2"],
    ["Weapon", "Weapon 1", "Main Hand"],
    ["Off Hand", "Weapon 2", "Weapon 2/Offhand", "Shield", "Held In Off-hand"],
    ["Ranged", "Relic", "Relic/Ranged", "Wand", "Idol", "Libram", "Sigil", "Totem"],
    ["Shirt"],
    ["Tabard"],
    ["Token"],
    ["Mount"],
  ];
  const RANK_BY_SLOT = new Map(
    SLOT_GROUPS.flatMap((names, rank) => names.map((name) => [name.toLowerCase(), rank]))
  );

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function sortSlots(slots) {
    return [...slots].sort((a, b) => {
      const ra = RANK_BY_SLOT.get(a.toLowerCase());
      const rb = RANK_BY_SLOT.get(b.toLowerCase());
      if (ra !== undefined || rb !== undefined) {
        return (ra ?? Infinity) - (rb ?? Infinity);
      }
      return a.localeCompare(b);
    });
  }

  function render() {
    head.innerHTML = `<tr><th>Name</th>${allSlots.map((s) => `<th>${escapeHtml(s)}</th>`).join("")}</tr>`;

    if (!allPlayers.length) {
      tbody.innerHTML = '<tr><td>No players yet</td></tr>';
      return;
    }
    if (!allSlots.length) {
      tbody.innerHTML = '<tr><td>No awards with a recorded slot yet</td></tr>';
      return;
    }

    const filter = playerFilter.value.toLowerCase();
    const players = filter
      ? allPlayers.filter((p) => p.player.toLowerCase().includes(filter))
      : allPlayers;

    if (!players.length) {
      tbody.innerHTML = '<tr><td>No players match that filter</td></tr>';
      return;
    }

    tbody.innerHTML = players
      .map((p) => {
        const cells = allSlots
          .map((s) => {
            const count = p.slot_counts[s] ?? 0;
            // Tier tokens are cumulative toward a set bonus, unlike a gear
            // slot (binary: filled or not), so show the actual count.
            const display = s.toLowerCase() === "token" ? (count || "") : (count > 0 ? "✓" : "");
            return `<td class="slot-cell">${display}</td>`;
          })
          .join("");
        return `<tr><td>${escapeHtml(p.player)}</td>${cells}</tr>`;
      })
      .join("");
  }

  async function load() {
    const res = await fetch("/api/stats");
    if (!res.ok) {
      tbody.innerHTML = `<tr><td>Failed to load (${res.status})</td></tr>`;
      return;
    }
    const { results } = await res.json();
    allSlots = sortSlots([...new Set(results.flatMap((r) => Object.keys(r.slot_counts)))]);
    allPlayers = [...results].sort((a, b) => a.player.localeCompare(b.player));
    render();
  }

  playerFilter.addEventListener("input", render);

  load();
})();
