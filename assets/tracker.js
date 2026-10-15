// Трекер откликов и собеседований (/blog/tracker/). Данные — только в
// localStorage этого браузера: на сервер ничего не уходит. Поля и списки —
// те же, что в шаблоне landing/tools/tracker_xlsx.py, чтобы CSV ложился в него.
(function () {
  "use strict";
  var root = document.getElementById("tracker");
  if (!root) return;

  var KEY = "sotto-tracker-v1";
  var SOURCES = ["hh.ru", "Хабр Карьера", "getmatch", "GeekJob", "Сайт компании", "Стажировка", "Telegram", "Рекомендация", "Напрямую", "Другое"];
  var STAGES = ["Отклик", "Ответили", "Собеседование", "Финал", "Оффер"];
  var RESULTS = ["В процессе", "Отказ", "Без ответа"];
  var FIELDS = ["date", "company", "role", "source", "stage", "result", "link", "notes"];
  var HEAD = ["Дата отклика", "Компания", "Вакансия", "Источник", "Этап", "Итог", "Ссылка на вакансию", "Заметки"];

  var rows = load();
  var storageOk = true;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(rows)); storageOk = true; } catch (e) { storageOk = false; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function options(list, value) {
    return list.map(function (v) { return '<option' + (v === value ? " selected" : "") + ">" + esc(v) + "</option>"; }).join("");
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function step(r) { return STAGES.indexOf(r.stage) + 1; }
  function pct(a, b) { return b ? Math.round(100 * a / b) + "%" : "—"; }
  function ruDate(iso) { return iso && iso.length === 10 ? iso.slice(8) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4) : esc(iso); }

  root.innerHTML =
    '<form class="tr-form">' +
    '<label>Компания<input name="company" required maxlength="80" placeholder="ООО «Пример»"></label>' +
    '<label>Вакансия<input name="role" maxlength="80" placeholder="Junior Python-разработчик"></label>' +
    '<label>Источник<select name="source">' + options(SOURCES, "hh.ru") + "</select></label>" +
    '<label>Дата отклика<input name="date" type="date"></label>' +
    '<label>Этап<select name="stage">' + options(STAGES, "Отклик") + "</select></label>" +
    '<label>Итог<select name="result">' + options(RESULTS, "В процессе") + "</select></label>" +
    '<label class="wide">Ссылка на вакансию<input name="link" type="url" maxlength="300" placeholder="https://"></label>' +
    '<label class="wide">Заметки: что спрашивали, что повторить<textarea name="notes" rows="2" maxlength="1000"></textarea></label>' +
    '<button class="btn primary small" type="submit">Добавить</button>' +
    "</form>" +
    '<div class="tr-stats"></div><div class="tr-funnel"></div><div class="tr-list"></div>' +
    '<div class="tr-actions">' +
    '<button class="btn ghost small" type="button" data-act="csv">Скачать CSV</button>' +
    '<label class="btn ghost small">Загрузить CSV<input type="file" accept=".csv,text/csv" hidden></label>' +
    '<button class="btn ghost small" type="button" data-act="clear">Очистить всё</button>' +
    "</div><p class=\"tr-note\"></p>";

  var form = root.querySelector(".tr-form");
  form.date.value = today();

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    FIELDS.forEach(function (f) { r[f] = form[f].value.trim(); });
    rows.unshift(r);
    save();
    form.company.value = form.role.value = form.link.value = form.notes.value = "";
    form.company.focus();
    render();
  });

  root.addEventListener("change", function (ev) {
    var t = ev.target, tr = t.closest("tr[data-id]");
    if (tr && t.name) {
      var r = rows.find(function (x) { return x.id === tr.dataset.id; });
      if (r) { r[t.name] = t.value; save(); render(); }
    }
    if (t.type === "file" && t.files[0]) importCsv(t.files[0], t);
  });

  var clearArmed = false;
  root.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.dataset.del) {
      rows = rows.filter(function (x) { return x.id !== t.dataset.del; });
      save(); render();
    } else if (t.dataset.act === "csv") {
      exportCsv();
    } else if (t.dataset.act === "clear") {
      // Без confirm(): второе нажатие в течение 4 секунд подтверждает.
      if (!clearArmed) {
        clearArmed = true; t.textContent = "Точно удалить всё?";
        setTimeout(function () { clearArmed = false; t.textContent = "Очистить всё"; }, 4000);
      } else {
        rows = []; save(); render(); clearArmed = false; t.textContent = "Очистить всё";
      }
    }
  });

  function render() {
    var n = rows.length;
    var replied = rows.filter(function (r) { return step(r) >= 2; }).length;
    var interviews = rows.filter(function (r) { return step(r) >= 3; }).length;
    var offers = rows.filter(function (r) { return step(r) >= 5; }).length;
    root.querySelector(".tr-stats").innerHTML = n ? [
      ["Откликов", n, ""], ["Ответили", replied, pct(replied, n)],
      ["Собеседований", interviews, pct(interviews, n)], ["Офферов", offers, pct(offers, n)]
    ].map(function (s) { return '<div class="fact"><b>' + s[1] + "</b><span>" + s[0] + (s[2] ? " · " + s[2] + " от откликов" : "") + "</span></div>"; }).join("") : "";

    var by = {};
    rows.forEach(function (r) {
      var b = by[r.source] || (by[r.source] = [0, 0, 0, 0]);
      b[0]++; if (step(r) >= 2) b[1]++; if (step(r) >= 3) b[2]++; if (step(r) >= 5) b[3]++;
    });
    var srcs = Object.keys(by).sort(function (a, b) { return by[b][0] - by[a][0]; });
    root.querySelector(".tr-funnel").innerHTML = n ? '<h3>Откуда приходят приглашения</h3><div class="table-wrap"><table><thead><tr><th>Источник</th><th>Откликов</th><th>Ответили</th><th>Собеседований</th><th>Офферов</th><th>До собеседования</th></tr></thead><tbody>' +
      srcs.map(function (s) { var b = by[s]; return "<tr><td>" + esc(s) + "</td><td>" + b[0] + "</td><td>" + b[1] + "</td><td>" + b[2] + "</td><td>" + b[3] + "</td><td>" + pct(b[2], b[0]) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" : "";

    root.querySelector(".tr-list").innerHTML = n ? '<h3>Все отклики</h3><div class="table-wrap"><table class="tr-rows"><thead><tr><th>Дата</th><th>Компания и вакансия</th><th>Источник</th><th>Этап</th><th>Итог</th><th>Заметки</th><th></th></tr></thead><tbody>' +
      rows.map(function (r) {
        var name = esc(r.company) + (r.role ? "<br><small>" + esc(r.role) + "</small>" : "");
        if (/^https?:\/\//.test(r.link)) name = '<a href="' + esc(r.link) + '" rel="noopener nofollow" target="_blank">' + name + "</a>";
        return '<tr data-id="' + esc(r.id) + '"><td>' + ruDate(r.date) + "</td><td>" + name + "</td><td>" + esc(r.source) +
          '</td><td><select name="stage" aria-label="Этап">' + options(STAGES, r.stage) + '</select></td><td><select name="result" aria-label="Итог">' + options(RESULTS, r.result) +
          "</select></td><td><small>" + esc(r.notes) + '</small></td><td><button type="button" class="tr-del" data-del="' + esc(r.id) + '" aria-label="Удалить">×</button></td></tr>';
      }).join("") + "</tbody></table></div>" :
      '<p class="tr-empty">Пока пусто. Добавьте первый отклик — статистика по источникам появится сама.</p>';

    root.querySelector(".tr-note").textContent = storageOk
      ? "Данные хранятся только в этом браузере и никуда не отправляются. Чтобы перенести их на другой компьютер или в таблицу — скачайте CSV."
      : "Браузер не даёт сохранять данные (приватный режим?): после закрытия вкладки они пропадут. Скачайте CSV, чтобы не потерять.";
  }

  function csvCell(v) {
    v = String(v == null ? "" : v);
    // Формула в ячейке CSV исполнится в таблице: экранируем =, +, -, @.
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function exportCsv() {
    var lines = [HEAD.join(";")].concat(rows.map(function (r) { return FIELDS.map(function (f) { return csvCell(r[f]); }).join(";"); }));
    // BOM и «;» — чтобы русский Excel открыл файл двойным щелчком без кракозябр.
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "otkliki-" + today() + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function parseCsv(text) {
    var out = [], row = [], cell = "", q = false, sep = text.indexOf(";") >= 0 ? ";" : ",";
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
      } else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); out.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); out.push(row); }
    return out;
  }
  function importCsv(file, input) {
    var reader = new FileReader();
    reader.onload = function () {
      var data = parseCsv(String(reader.result).replace(/^﻿/, "")).slice(1).filter(function (r) { return r.join("").trim(); });
      data.forEach(function (cells) {
        var r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
        FIELDS.forEach(function (f, i) { r[f] = (cells[i] || "").replace(/^'/, "").slice(0, 1000); });
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(r.date)) r.date = r.date.slice(6) + "-" + r.date.slice(3, 5) + "-" + r.date.slice(0, 2);
        rows.push(r);
      });
      save(); render(); input.value = "";
    };
    reader.readAsText(file, "utf-8");
  }

  render();
})();
