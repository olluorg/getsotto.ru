// Калькулятор «сколько на руки» (/blog/tk-ip-samozanyatost-gph/): ТК и ГПХ,
// самозанятость, ИП на УСН 6%. Ставки — на 2026 год, источники — в статье.
(function () {
  "use strict";
  var root = document.getElementById("workcalc");
  if (!root) return;

  // Прогрессивный НДФЛ с 2025 года: [верхняя граница годового дохода, ставка].
  var NDFL = [[2400000, 0.13], [5000000, 0.15], [20000000, 0.18], [50000000, 0.20], [Infinity, 0.22]];
  var IP_FIXED = 57390, IP_EXTRA_CAP = 321818, NPD_LIMIT = 2400000, VAT_LIMIT = 20000000;

  function ndfl(year) {
    var tax = 0, prev = 0;
    for (var i = 0; i < NDFL.length; i++) {
      var top = NDFL[i][0];
      if (year > prev) tax += (Math.min(year, top) - prev) * NDFL[i][1];
      prev = top;
    }
    return tax;
  }
  function rub(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }

  root.innerHTML =
    '<div class="wc-inputs">' +
    '<label>Оклад по трудовому договору или сумма по ГПХ, в месяц<input type="number" name="tk" min="0" step="5000" value="150000"></label>' +
    '<label>Сумма по договору с ИП или самозанятым, в месяц<input type="number" name="ip" min="0" step="5000" value="150000"></label>' +
    "</div>" +
    '<div class="table-wrap"><table class="wc-table"><thead><tr><th>Формат</th><th>Налоги и взносы за год</th><th>На руки в месяц</th><th>За год, если отдыхать 4 недели</th></tr></thead><tbody></tbody></table></div>' +
    '<p class="wc-note"></p>';

  var tk = root.querySelector('[name=tk]'), ip = root.querySelector('[name=ip]');

  function calc() {
    var a = Math.max(0, +tk.value || 0) * 12, b = Math.max(0, +ip.value || 0) * 12;
    var notes = [];
    // Отпуск: по ТК 4 недели оплачиваются, в остальных форматах это месяц без дохода (~0,92 месяца).
    var rest = 28 / 30.4;
    var tkTax = ndfl(a);
    var npdTax = b * 0.06;
    var extra = Math.min(Math.max(0, b - 300000) * 0.01, IP_EXTRA_CAP);
    var ipContrib = IP_FIXED + extra;
    var ipTax = Math.max(0, b * 0.06 - ipContrib);
    var rows = [
      ["Трудовой договор", tkTax, (a - tkTax) / 12, a - tkTax],
      ["ГПХ", tkTax, (a - tkTax) / 12, (a - tkTax) * (12 - rest) / 12],
      ["Самозанятый (6% с компаний)", b > NPD_LIMIT ? null : npdTax, (b - npdTax) / 12, (b - npdTax) * (12 - rest) / 12],
      ["ИП на УСН 6%", ipTax + ipContrib, (b - ipTax - ipContrib) / 12, (b - ipTax - ipContrib) * (12 - rest) / 12],
    ];
    root.querySelector("tbody").innerHTML = rows.map(function (r) {
      if (r[1] === null) return "<tr><td><b>" + r[0] + "</b></td><td colspan=\"3\">Нельзя: доход больше лимита самозанятости 2,4 млн ₽ в год</td></tr>";
      return "<tr><td><b>" + r[0] + "</b></td><td>" + rub(r[1]) + "</td><td><b>" + rub(r[2]) + "</b></td><td>" + rub(r[3]) + "</td></tr>";
    }).join("");
    if (b > VAT_LIMIT) notes.push("ИП с доходом больше 20 млн ₽ за прошлый год платит на УСН ещё и НДС — калькулятор его не учитывает.");
    notes.push("ИП: налог по УСН уменьшен на фиксированные взносы " + rub(IP_FIXED) + " и 1% с дохода свыше 300 000 ₽ (" + rub(extra) + "). Комиссии банка и сервисов не учтены.");
    notes.push("Самозанятый: без разового вычета 10 000 ₽ и без добровольных взносов на пенсию и больничный.");
    root.querySelector(".wc-note").textContent = notes.join(" ");
  }
  tk.addEventListener("input", calc);
  ip.addEventListener("input", calc);
  calc();
})();
