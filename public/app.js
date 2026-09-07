const tbody = document.getElementById("loot-body");
const form = document.getElementById("filters");
const clearBtn = document.getElementById("clear");

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function loadLoot(params = {}) {
  tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
  const res = await fetch(`/api/loot?${qs}`);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="6">Failed to load (${res.status})</td></tr>`;
    return;
  }
  const { results } = await res.json();
  if (!results.length) {
    tbody.innerHTML = '<tr><td colspan="6">No results</td></tr>';
    return;
  }
  tbody.innerHTML = results
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.awarded_at)}</td>
        <td>${escapeHtml(r.raid)}</td>
        <td>${escapeHtml(r.boss)}</td>
        <td>${escapeHtml(r.item_name)}</td>
        <td>${escapeHtml(r.winner)}</td>
        <td>${escapeHtml(r.response)}</td>
      </tr>`
    )
    .join("");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  loadLoot(data);
});

clearBtn.addEventListener("click", () => {
  form.reset();
  loadLoot();
});

loadLoot();
