// Калькулятор нагрузки для system design (/blog/system-design-dlya-nachinayushchih/):
// оценка «на салфетке» — запросы в секунду, пик, трафик и объём данных.
(function () {
  "use strict";
  var root = document.getElementById("sdcalc");
  if (!root) return;
  var F = [["dau", "Активных пользователей в день (DAU)", 1000000], ["reads", "Чтений на пользователя в день", 50],
    ["writes", "Записей на пользователя в день", 5], ["peak", "Во сколько раз пик выше среднего", 3],
    ["size", "Размер одной записи, КБ", 2], ["years", "Хранить данные, лет", 3]];
  root.innerHTML = '<div class="wc-inputs sd-inputs">' + F.map(function (f) {
    return "<label>" + f[1] + '<input type="number" min="0" step="any" name="' + f[0] + '" value="' + f[2] + '"></label>';
  }).join("") + '</div><div class="tr-stats sal-stats sd-out"></div><p class="wc-note"></p>';

  function v(n) { return Math.max(0, +root.querySelector("[name=" + n + "]").value || 0); }
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " млн";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".", ",") + " тыс.";
    return Math.round(n).toString();
  }
  function bytes(kb) {
    var u = ["КБ", "МБ", "ГБ", "ТБ", "ПБ"], i = 0;
    while (kb >= 1024 && i < u.length - 1) { kb /= 1024; i++; }
    return kb.toFixed(kb < 10 ? 1 : 0).replace(".", ",") + " " + u[i];
  }
  function calc() {
    var day = 86400, r = v("dau") * v("reads") / day, w = v("dau") * v("writes") / day;
    var perDay = v("dau") * v("writes") * v("size");
    root.querySelector(".sd-out").innerHTML = [
      [fmt(r) + " RPS", "чтение в среднем; в пик — " + fmt(r * v("peak")) + " RPS"],
      [fmt(w) + " RPS", "запись в среднем; в пик — " + fmt(w * v("peak")) + " RPS"],
      [bytes(perDay), "новых данных в день"],
      [bytes(perDay * 365 * v("years")), "за " + v("years") + " " + (v("years") === 1 ? "год" : "года") + " без реплик и индексов"]]
      .map(function (x) { return '<div class="fact"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");
    root.querySelector(".wc-note").textContent = "В сутках 86 400 секунд — на собеседовании удобно округлять до 100 000. Умножьте объём на число реплик (обычно 3) и заложите запас под рост.";
  }
  root.addEventListener("input", calc);
  calc();
})();
