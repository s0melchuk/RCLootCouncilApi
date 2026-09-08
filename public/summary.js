const tbody = document.getElementById("summary-body");
const sortButtons = document.querySelectorAll(".sort-btn");

// Whole-roster dataset is small (dozens of rows), so sorting/rendering is
// done client-side against one fetched snapshot rather than round-tripping
// the server per click, unlike the loot log's server-side sort+pagination.
const state = { rows: [], sort: "player", order: "asc" };

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function countBy(breakdown, response, difficulty) {
  return breakdown
    .filter((b) => b.response === response && (difficulty === null || b.difficulty === difficulty))
    .reduce((sum, b) => sum + b.count, 0);
}

function toRow(entry) {
  return {
    player: entry.player,
    class: entry.class,
    spec: entry.spec,
    msNm: countBy(entry.breakdown, "MainSpec", "NM"),
    osNm: countBy(entry.breakdown, "OffSpec", "NM"),
    msHc: countBy(entry.breakdown, "MainSpec", "HC"),
    osHc: countBy(entry.breakdown, "OffSpec", "HC"),
    bis: countBy(entry.breakdown, "BiS", null),
    item_count: entry.item_count,
    slots_received: entry.slots_received,
    last_award_at: entry.last_award_at,
  };
}

function updateSortIndicators() {
  sortButtons.forEach((btn) => {
    const isActive = btn.dataset.sort === state.sort;
    btn.classList.toggle("active", isActive);
    btn.textContent = btn.textContent.replace(/ [▲▼]$/, "");
    if (isActive) {
      btn.textContent += state.order === "asc" ? " ▲" : " ▼";
    }
  });
}

function render() {
  const sorted = [...state.rows].sort((a, b) => {
    const [x, y] = [a[state.sort], b[state.sort]];
    const cmp = typeof x === "string" ? (x ?? "").localeCompare(y ?? "") : (x ?? 0) - (y ?? 0);
    return state.order === "asc" ? cmp : -cmp;
  });

  updateSortIndicators();

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="11">No players yet</td></tr>';
    return;
  }

  tbody.innerHTML = sorted
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.player)}</td>
        <td>${escapeHtml(r.class)}</td>
        <td>${escapeHtml(r.spec)}</td>
        <td>${r.msNm}</td>
        <td>${r.osNm}</td>
        <td>${r.msHc}</td>
        <td>${r.osHc}</td>
        <td>${r.bis}</td>
        <td>${r.item_count}</td>
        <td>${escapeHtml(r.slots_received.join(", "))}</td>
        <td>${escapeHtml(r.last_award_at)}</td>
      </tr>`
    )
    .join("");
}

async function load() {
  tbody.innerHTML = '<tr><td colspan="11">Loading…</td></tr>';
  const res = await fetch("/api/stats");
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="11">Failed to load (${res.status})</td></tr>`;
    return;
  }
  const { results } = await res.json();
  state.rows = results.map(toRow);
  render();
}

sortButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const column = btn.dataset.sort;
    if (state.sort === column) {
      state.order = state.order === "asc" ? "desc" : "asc";
    } else {
      state.sort = column;
      state.order = "asc";
    }
    render();
  });
});

load();
