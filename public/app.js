const tbody = document.getElementById("loot-body");
const form = document.getElementById("filters");
const clearBtn = document.getElementById("clear");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageStatus = document.getElementById("page-status");

const PAGE_SIZE = 25;
const state = { offset: 0, total: 0, filters: {} };

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function loadLoot() {
  tbody.innerHTML = '<tr><td colspan="8">Loading…</td></tr>';
  const params = { ...state.filters, limit: PAGE_SIZE, offset: state.offset };
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v || v === 0)));
  const res = await fetch(`/api/loot?${qs}`);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="8">Failed to load (${res.status})</td></tr>`;
    return;
  }
  const { results, total } = await res.json();
  state.total = total ?? 0;
  updatePaginationControls();

  if (!results.length) {
    tbody.innerHTML = '<tr><td colspan="8">No results</td></tr>';
    return;
  }
  tbody.innerHTML = results
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.awarded_at)}</td>
        <td>${escapeHtml(r.raid)}</td>
        <td>${escapeHtml(r.boss)}</td>
        <td>${escapeHtml(r.item_name)}</td>
        <td>${escapeHtml(r.slot)}</td>
        <td>${escapeHtml(r.winner)}</td>
        <td>${escapeHtml(r.response)}</td>
        <td>${escapeHtml(r.difficulty)}</td>
      </tr>`
    )
    .join("");
}

function updatePaginationControls() {
  const shownFrom = state.total === 0 ? 0 : state.offset + 1;
  const shownTo = Math.min(state.offset + PAGE_SIZE, state.total);
  pageStatus.textContent = `${shownFrom}–${shownTo} of ${state.total}`;
  prevBtn.disabled = state.offset === 0;
  nextBtn.disabled = state.offset + PAGE_SIZE >= state.total;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  state.filters = Object.fromEntries(new FormData(form).entries());
  state.offset = 0;
  loadLoot();
});

clearBtn.addEventListener("click", () => {
  form.reset();
  state.filters = {};
  state.offset = 0;
  loadLoot();
});

prevBtn.addEventListener("click", () => {
  state.offset = Math.max(0, state.offset - PAGE_SIZE);
  loadLoot();
});

nextBtn.addEventListener("click", () => {
  state.offset += PAGE_SIZE;
  loadLoot();
});

loadLoot();
