// Чек-лист подготовки в статьях блога: <div class="checklist" data-key="…">.
// Отметки — в localStorage этого браузера; без него список просто не запоминается.
(function () {
  "use strict";
  document.querySelectorAll(".checklist[data-key]").forEach(function (box) {
    var key = "sotto-checklist-" + box.dataset.key;
    var items = box.querySelectorAll("input[type=checkbox]");
    var progress = box.querySelector(".checklist-progress");
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { saved = {}; }

    function update() {
      var done = 0, state = {};
      items.forEach(function (cb, i) { if (cb.checked) { done++; state[i] = 1; } });
      if (progress) progress.textContent = "Готово " + done + " из " + items.length + (done === items.length ? " — можно идти на собеседование" : "");
      box.style.setProperty("--done", items.length ? done / items.length : 0);
      try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* приватный режим: не запоминаем */ }
    }
    items.forEach(function (cb, i) {
      cb.checked = !!saved[i];
      cb.addEventListener("change", update);
    });
    update();
  });
})();
