// Калькулятор зарплатной вилки (/blog/kak-govorit-o-zarplate/). Медианы — Хабр Карьера,
// первое полугодие 2026: для разработчиков — по городам, для остальных — нижняя граница,
// медиана и верхняя граница диапазона с графиков отчёта. Тыс. ₽ в месяц.
(function () {
  "use strict";
  var root = document.getElementById("salary");
  if (!root) return;

  // [название, Москва, Санкт-Петербург, регионы]
  var CITY = [
    ["Бэкенд-разработчик", 278, 251, 220], ["Фронтенд-разработчик", 260, 230, 200],
    ["Разработчик мобильных приложений", 320, 299, 263], ["Фулстек-разработчик", 241, 234, 188],
    ["Программист 1С", 272, 198, 174], ["Разработчик баз данных", 264, 261, 177],
    ["Разработчик игр", 235, 215, 150], ["Десктоп-разработчик", 223, 181, 161],
    ["Инженер встраиваемых систем", 200, 204, 138], ["Веб-разработчик", 195, 150, 130],
    ["Системный инженер", 250, 210, 182], ["Архитектор ПО", 497, 508, 420]];
  // [название, нижняя граница, медиана, верхняя граница] — без разбивки по городам
  var RANGE = [
    ["Инженер по автоматизации тестирования", 100, 220, 379], ["Инженер по обеспечению качества (QA)", 86, 190, 334],
    ["DevOps-инженер", 90, 230, 430], ["Инженер по доступности сервисов (SRE)", 126, 300, 538],
    ["Системный аналитик", 90, 200, 364], ["Аналитик данных", 70, 160, 317], ["Инженер по данным", 100, 240, 413],
    ["Продуктовый аналитик", 100, 230, 399], ["Бизнес-аналитик", 75, 168, 307], ["BI-разработчик", 104, 200, 369],
    ["Системный администратор", 60, 120, 240]];
  var CITIES = ["Москва", "Санкт-Петербург", "другие регионы"];

  var opts = CITY.map(function (r, i) { return '<option value="c' + i + '">' + r[0] + "</option>"; }).join("") +
    '<option disabled>──────────</option>' +
    RANGE.map(function (r, i) { return '<option value="r' + i + '">' + r[0] + "</option>"; }).join("");
  root.innerHTML =
    '<div class="wc-inputs"><label>Специализация<select name="spec">' + opts + '</select></label>' +
    '<label>Город<select name="city">' + CITIES.map(function (c, i) { return '<option value="' + i + '">' + c + "</option>"; }).join("") + "</select></label></div>" +
    '<div class="tr-stats sal-stats sl-out"></div><p class="wc-note"></p>';
  root.querySelectorAll("select").forEach(function (s) { s.classList.add("sl-select"); });

  function k(n) { return Math.round(n) + " тыс. ₽"; }
  function calc() {
    var spec = root.querySelector("[name=spec]").value, city = +root.querySelector("[name=city]").value;
    var citySel = root.querySelector("[name=city]"), out = root.querySelector(".sl-out"), note = root.querySelector(".wc-note");
    if (spec[0] === "c") {
      citySel.disabled = false;
      var r = CITY[+spec.slice(1)], med = r[1 + city];
      out.innerHTML = '<div class="fact"><b>' + k(med) + '</b><span>медиана: половина специалистов получает больше, половина — меньше</span></div>' +
        '<div class="fact"><b>' + Math.round(med) + "–" + Math.round(med * 1.15) + ' тыс. ₽</b><span>вилка, которую можно называть, если вы уверенно на уровне рынка</span></div>';
      note.textContent = "Медиана по всем грейдам в городе «" + CITIES[city] + "». Джуны обычно получают заметно ниже медианы, сеньоры — выше. Верх вилки +15% — ориентир для торга, а не данные отчёта.";
    } else {
      citySel.disabled = true;
      var x = RANGE[+spec.slice(1)];
      out.innerHTML = '<div class="fact"><b>' + k(x[2]) + '</b><span>медиана по России</span></div>' +
        '<div class="fact"><b>' + x[1] + "–" + x[3] + ' тыс. ₽</b><span>нижняя и верхняя границы диапазона на графике отчёта</span></div>';
      note.textContent = "Для этой специализации отчёт даёт только общую медиану и диапазон без разбивки по городам. Нижняя граница ближе к старту карьеры, верхняя — к опытным специалистам.";
    }
  }
  root.addEventListener("change", calc);
  calc();
})();
