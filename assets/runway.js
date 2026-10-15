// Калькулятор «на сколько хватит денег» (/blog/gde-vzyat-dengi/): запас в месяцах
// и сколько смен подработки закрывают разрыв между расходами и доходами.
(function () {
  "use strict";
  var root = document.getElementById("runway");
  if (!root) return;

  var FIELDS = [
    ["savings", "Накопления, ₽", 150000],
    ["spend", "Обязательные расходы в месяц, ₽", 60000],
    ["income", "Доходы в месяц сейчас (пособие, подработка), ₽", 0],
    ["shift", "Сколько приносит одна смена подработки, ₽", 3500],
  ];
  root.innerHTML = '<div class="wc-inputs">' + FIELDS.map(function (f) {
    return '<label>' + f[1] + '<input type="number" min="0" step="1000" name="' + f[0] + '" value="' + f[2] + '"></label>';
  }).join("") + '</div><div class="tr-stats sal-stats rw-out"></div><p class="wc-note"></p>';

  function val(n) { return Math.max(0, +root.querySelector("[name=" + n + "]").value || 0); }
  function rub(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }

  function calc() {
    var gap = val("spend") - val("income"), out = root.querySelector(".rw-out"), note = root.querySelector(".wc-note");
    if (gap <= 0) {
      out.innerHTML = '<div class="fact"><b>Хватает</b><span>доходы покрывают расходы — запас не тратится</span></div>';
      note.textContent = "";
      return;
    }
    var months = val("savings") / gap, shifts = val("shift") ? Math.ceil(gap / val("shift")) : 0;
    out.innerHTML =
      '<div class="fact"><b>' + months.toFixed(1).replace(".", ",") + ' мес.</b><span>на столько хватит накоплений при нынешних доходах</span></div>' +
      '<div class="fact"><b>' + rub(gap) + '</b><span>не хватает каждый месяц</span></div>' +
      (shifts ? '<div class="fact"><b>' + shifts + ' смен</b><span>в месяц закрывают этот разрыв полностью</span></div>' : "");
    // Средний поиск работы по Росстату — около 5 месяцев; запас короче — повод включить подработку раньше.
    note.textContent = months < 5
      ? "Запас короче среднего срока поиска работы в России (около 5 месяцев). Подработку или отсрочки по кредитам стоит включить уже сейчас, а не когда деньги закончатся."
      : "Запас больше среднего срока поиска работы в России (около 5 месяцев) — но в IT поиск часто дольше, держите план Б наготове.";
  }
  root.addEventListener("input", calc);
  calc();
})();
