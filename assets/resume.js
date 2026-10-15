// Конструктор резюме (/blog/rezyume-bez-opyta/): форма с подсказками, предпросмотр и PDF.
// Данные — только в этом браузере. pdfmake грузится с cdnjs по нажатию «Скачать PDF»:
// его шрифт Roboto содержит кириллицу, а файлы большие — незачем тянуть их всем читателям.
(function () {
  "use strict";
  var root = document.getElementById("resume");
  if (!root) return;
  var KEY = "sotto-resume-v1";
  var PDFMAKE = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/";
  var BASIC = [["name", "Имя и фамилия", "Иван Петров"], ["role", "Роль — как в вакансии", "Junior Python-разработчик (бэкенд)"],
    ["city", "Город и формат", "Казань, готов к удалёнке"], ["phone", "Телефон", "+7 900 000-00-00"], ["email", "Почта", "ivan@example.com"],
    ["tg", "Telegram", "@ivan_dev"], ["github", "GitHub", "github.com/ivan"]];
  var LISTS = {
    projects: { title: "Проекты", add: "Добавить проект", fields: [["name", "Название", "Сервис бронирования переговорных"], ["stack", "Стек", "Python, Django, PostgreSQL, Docker"], ["what", "Что сделали и результат", "API бронирования и уведомления; покрыл тестами основные сценарии; развернул на сервере", true], ["link", "Ссылка", "github.com/ivan/booking"]] },
    jobs: { title: "Опыт работы", add: "Добавить место работы", fields: [["title", "Должность", "Бухгалтер"], ["company", "Компания", "ООО «Пример»"], ["period", "Период", "2019–2025"], ["results", "Результаты", "Автоматизировал ежемесячную сверку на Python: отчёт за час вместо двух дней", true]] },
    edu: { title: "Образование и курсы", add: "Добавить", fields: [["place", "Где", "Яндекс Практикум"], ["what", "Что", "Python-разработчик"], ["year", "Год", "2026"]] },
  };
  var EMPTY = { about: "", skills: "", projects: [{}], jobs: [], edu: [{}] };
  var d;
  try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
  d = d || JSON.parse(JSON.stringify(EMPTY));

  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function field(name, label, ph, area, val) {
    return '<label class="wide">' + label + (area
      ? '<textarea name="' + name + '" rows="2" placeholder="' + ph + '">' + esc(val) + "</textarea>"
      : '<input name="' + name + '" placeholder="' + ph + '" value="' + esc(val) + '">') + "</label>";
  }
  function form() {
    var h = '<div class="tr-form rs-basic">' + BASIC.map(function (f) {
      return '<label>' + f[1] + '<input name="' + f[0] + '" placeholder="' + f[2] + '" value="' + esc(d[f[0]]) + '"></label>';
    }).join("") + field("about", "О себе — 3–4 строки: стек и что сделали", "Пишу бэкенд на Python: Django, FastAPI, PostgreSQL. Сделал два проекта с тестами и деплоем…", true, d.about) +
      field("skills", "Навыки через запятую — только те, о которых сможете говорить", "Python, Django, FastAPI, PostgreSQL, Docker, Git, pytest", false, d.skills) + "</div>";
    Object.keys(LISTS).forEach(function (key) {
      var L = LISTS[key];
      h += "<h3>" + L.title + "</h3>" + d[key].map(function (item, i) {
        return '<div class="rs-item tr-form" data-list="' + key + '" data-i="' + i + '">' + L.fields.map(function (f) {
          return field(key + "." + i + "." + f[0], f[1], f[2], f[3], item[f[0]]);
        }).join("") + '<button type="button" class="tr-del" data-remove="' + key + '" data-i="' + i + '" aria-label="Удалить">×</button></div>';
      }).join("") + '<button type="button" class="btn ghost small" data-add="' + key + '">' + L.add + "</button>";
    });
    return h;
  }

  root.innerHTML = '<div class="rs-form"></div><h3>Подсказки</h3><ul class="rs-hints"></ul>' +
    '<h3>Предпросмотр</h3><div class="rs-preview"></div>' +
    '<div class="tr-actions"><button type="button" class="btn primary small" data-act="pdf">Скачать PDF</button>' +
    '<button type="button" class="btn ghost small" data-act="clear">Очистить</button></div><p class="wc-note rs-status"></p>';
  var formEl = root.querySelector(".rs-form");

  function redraw() { formEl.innerHTML = form(); update(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* без сохранения */ } }
  function lines(s) { return String(s || "").split(/\n|;\s*/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function filled(list) { return d[list].filter(function (x) { return Object.keys(x).some(function (k) { return x[k]; }); }); }

  function hints() {
    var h = [], about = (d.about || "").toLowerCase(), skills = (d.skills || "").split(",").filter(function (s) { return s.trim(); });
    if (!d.role) h.push(["warn", "Укажите одну роль, как в вакансии: «Junior Python-разработчик», а не «начинающий специалист»."]);
    if (/специалист|любая|ищу работу|в it\b/.test((d.role || "").toLowerCase())) h.push(["warn", "Роль слишком общая — напишите конкретную позицию и стек."]);
    if (!d.about) h.push(["warn", "Добавьте 3–4 строки о себе: стек и что вы сделали."]);
    if (about.length > 450) h.push(["info", "Блок «О себе» длинный — оставьте 3–4 строки, остальное перенесите в проекты."]);
    var cliche = ["коммуникабельн", "стрессоустойчив", "ответственн", "целеустремл", "быстро обуча", "пунктуальн"].filter(function (w) { return about.indexOf(w) >= 0; });
    if (cliche.length) h.push(["warn", "Общие слова («" + cliche.join("», «") + "…») без примеров не работают — замените их фактами."]);
    if (skills.length > 15) h.push(["info", "Навыков больше 15 — оставьте те, о которых готовы говорить на собеседовании."]);
    var pr = filled("projects");
    if (!pr.length) h.push(["warn", "Добавьте хотя бы один проект — для джуна это главный блок резюме."]);
    pr.forEach(function (p, i) {
      var n = p.name || "Проект " + (i + 1);
      if (!p.link) h.push(["warn", "«" + n + "»: нет ссылки — без неё проект не проверить."]);
      if (p.what && !/\d/.test(p.what)) h.push(["info", "«" + n + "»: добавьте цифру или наблюдаемый результат — время, объём, покрытие тестами."]);
      if (!p.stack) h.push(["info", "«" + n + "»: укажите стек."]);
    });
    filled("jobs").forEach(function (j) {
      if (/обязанност|занимал|отвечал за|участвовал/.test((j.results || "").toLowerCase())) h.push(["info", "«" + (j.title || "Опыт") + "»: опишите результаты, а не обязанности — «сделал», «сократил», «автоматизировал»."]);
    });
    if (!d.email && !d.phone && !d.tg) h.push(["warn", "Добавьте хотя бы один контакт."]);
    return h;
  }

  function preview() {
    var contacts = [d.city, d.phone, d.email, d.tg, d.github].filter(Boolean).map(esc).join(" · ");
    var sec = function (title, body) { return body ? '<h4>' + title + "</h4>" + body : ""; };
    return '<div class="rs-paper"><h2>' + esc(d.name || "Имя Фамилия") + "</h2><p class=\"rs-role\">" + esc(d.role || "Роль") + "</p><p class=\"rs-contacts\">" + contacts + "</p>" +
      sec("О себе", d.about ? "<p>" + esc(d.about) + "</p>" : "") +
      sec("Навыки", d.skills ? "<p>" + esc(d.skills) + "</p>" : "") +
      sec("Проекты", filled("projects").map(function (p) {
        return "<p><b>" + esc(p.name) + "</b>" + (p.stack ? " — " + esc(p.stack) : "") + "<br>" + lines(p.what).map(esc).join("<br>") + (p.link ? "<br><span class=\"rs-link\">" + esc(p.link) + "</span>" : "") + "</p>";
      }).join("")) +
      sec("Опыт работы", filled("jobs").map(function (j) {
        return "<p><b>" + esc(j.title) + "</b>" + (j.company ? ", " + esc(j.company) : "") + (j.period ? " · " + esc(j.period) : "") + "<br>" + lines(j.results).map(esc).join("<br>") + "</p>";
      }).join("")) +
      sec("Образование и курсы", filled("edu").map(function (e) {
        return "<p>" + [e.place, e.what, e.year].filter(Boolean).map(esc).join(" · ") + "</p>";
      }).join("")) + "</div>";
  }

  function update() {
    var h = hints();
    root.querySelector(".rs-hints").innerHTML = h.length
      ? h.map(function (x) { return '<li class="rs-' + x[0] + '">' + esc(x[1]) + "</li>"; }).join("")
      : '<li class="rs-ok">Подсказок нет — резюме выглядит собранным. Не забудьте адаптировать его под вакансию.</li>';
    root.querySelector(".rs-preview").innerHTML = preview();
    save();
  }

  formEl.addEventListener("input", function (e) {
    var n = e.target.name;
    if (!n) return;
    var p = n.split(".");
    if (p.length === 3) d[p[0]][+p[1]][p[2]] = e.target.value; else d[n] = e.target.value;
    update();
  });
  root.addEventListener("click", function (e) {
    var t = e.target;
    if (t.dataset.add) { d[t.dataset.add].push({}); redraw(); }
    else if (t.dataset.remove) { d[t.dataset.remove].splice(+t.dataset.i, 1); redraw(); }
    else if (t.dataset.act === "clear") {
      if (t.dataset.armed) { d = JSON.parse(JSON.stringify(EMPTY)); redraw(); t.textContent = "Очистить"; delete t.dataset.armed; }
      else { t.dataset.armed = "1"; t.textContent = "Точно очистить?"; setTimeout(function () { t.textContent = "Очистить"; delete t.dataset.armed; }, 4000); }
    } else if (t.dataset.act === "pdf") pdf(t);
  });

  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }
  function docDefinition() {
    var c = [], H = function (t) { c.push({ text: t.toUpperCase(), style: "h", margin: [0, 12, 0, 4] }); };
    c.push({ text: d.name || "Имя Фамилия", fontSize: 20, bold: true });
    c.push({ text: d.role || "", fontSize: 13, color: "#5b4bd6", margin: [0, 2, 0, 2] });
    c.push({ text: [d.city, d.phone, d.email, d.tg, d.github].filter(Boolean).join("  ·  "), fontSize: 9, color: "#555" });
    if (d.about) { H("О себе"); c.push({ text: d.about }); }
    if (d.skills) { H("Навыки"); c.push({ text: d.skills }); }
    var pr = filled("projects");
    if (pr.length) {
      H("Проекты");
      pr.forEach(function (p) {
        c.push({ text: [{ text: p.name || "", bold: true }, p.stack ? "  —  " + p.stack : ""], margin: [0, 4, 0, 1] });
        if (lines(p.what).length) c.push({ ul: lines(p.what) });
        if (p.link) c.push({ text: p.link, color: "#5b4bd6", fontSize: 9 });
      });
    }
    var jb = filled("jobs");
    if (jb.length) {
      H("Опыт работы");
      jb.forEach(function (j) {
        c.push({ text: [{ text: j.title || "", bold: true }, j.company ? ", " + j.company : "", j.period ? "  ·  " + j.period : ""], margin: [0, 4, 0, 1] });
        if (lines(j.results).length) c.push({ ul: lines(j.results) });
      });
    }
    var ed = filled("edu");
    if (ed.length) { H("Образование и курсы"); ed.forEach(function (e) { c.push({ text: [e.place, e.what, e.year].filter(Boolean).join("  ·  ") }); }); }
    return { content: c, defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.25 }, styles: { h: { fontSize: 10, bold: true, color: "#333", characterSpacing: 0.5 } }, pageMargins: [48, 48, 48, 48], info: { title: "Резюме — " + (d.name || "") } };
  }
  function pdf(btn) {
    var status = root.querySelector(".rs-status");
    btn.disabled = true; status.textContent = "Готовлю PDF…";
    var ready = window.pdfMake && window.pdfMake.vfs ? Promise.resolve() : load(PDFMAKE + "pdfmake.min.js").then(function () { return load(PDFMAKE + "vfs_fonts.min.js"); });
    ready.then(function () {
      var name = "rezyume-" + (d.name || "kandidat").toLowerCase().replace(/\s+/g, "-") + ".pdf";
      return window.pdfMake.createPdf(docDefinition()).download(name);
    }).then(function () { status.textContent = "PDF скачан. Откройте его и проверьте перед отправкой."; },
      function () { status.textContent = "Не получилось загрузить генератор PDF. Можно распечатать страницу и выбрать «Сохранить как PDF»."; })
      .then(function () { btn.disabled = false; });
  }
  window.sottoResume = { doc: docDefinition };
  redraw();
})();
