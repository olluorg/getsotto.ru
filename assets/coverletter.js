// Конструктор сопроводительного письма (/blog/soprovoditelnoe-pismo/): поля → текст, копирование.
// Черновик хранится только в этом браузере.
(function () {
  "use strict";
  var root = document.getElementById("coverletter");
  if (!root) return;
  var KEY = "sotto-coverletter-v1";
  var F = [
    ["company", "Компания", "ООО «Пример»", "input"],
    ["role", "Вакансия", "Junior Python-разработчик", "input"],
    ["why", "Почему именно эта компания или продукт (1 предложение)", "пользуюсь вашим сервисом доставки и мне интересна логистика заказов", "input"],
    ["match", "Какие 2–3 требования вакансии вы закрываете и где это видно", "пишу сервисы на FastAPI с PostgreSQL — например, мой проект трекера задач с тестами и деплоем", "area"],
    ["link", "Ссылка на проект или GitHub", "https://github.com/имя/проект", "input"],
    ["extra", "Что ещё важно (опыт из прошлой профессии, готовность к стажировке, город)", "до IT пять лет работал в логистике — понимаю процессы склада изнутри", "area"],
  ];
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }

  root.innerHTML = '<div class="tr-form cl-form">' + F.map(function (f) {
    var v = (saved[f[0]] || "").replace(/"/g, "&quot;");
    var ctl = f[3] === "area"
      ? '<textarea name="' + f[0] + '" rows="2" placeholder="' + f[2] + '">' + (saved[f[0]] || "").replace(/</g, "&lt;") + "</textarea>"
      : '<input name="' + f[0] + '" placeholder="' + f[2] + '" value="' + v + '">';
    return '<label class="wide">' + f[1] + ctl + "</label>";
  }).join("") + "</div>" +
    '<h3>Письмо</h3><pre class="cl-out"></pre>' +
    '<div class="tr-actions"><button type="button" class="btn primary small" data-act="copy">Скопировать письмо</button></div>';

  function get(n) { return root.querySelector("[name=" + n + "]").value.trim(); }
  function or(v, n) { return v || "[" + n + "]"; }
  function build() {
    var lines = [
      "Здравствуйте!",
      "",
      "Откликаюсь на вакансию «" + or(get("role"), "вакансия") + "» в " + or(get("company"), "компания") + ". " +
        "Мне интересна ваша компания, потому что " + or(get("why"), "почему именно вы") + ".",
      "",
      "Из требований вакансии: " + or(get("match"), "что вы закрываете") + ".",
    ];
    if (get("link")) lines.push("Посмотреть код можно здесь: " + get("link") + ".");
    if (get("extra")) lines.push("", get("extra").charAt(0).toUpperCase() + get("extra").slice(1) + ".");
    lines.push("", "Буду рад обсудить, чем могу быть полезен команде.", "", "С уважением,", "[Имя Фамилия], [телефон или Telegram]");
    root.querySelector(".cl-out").textContent = lines.join("\n").replace(/\.\./g, ".");
    var state = {};
    F.forEach(function (f) { state[f[0]] = get(f[0]); });
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* без сохранения */ }
  }
  root.addEventListener("input", build);
  root.addEventListener("click", function (e) {
    if (e.target.dataset.act !== "copy") return;
    var btn = e.target, text = root.querySelector(".cl-out").textContent;
    var done = function () { btn.textContent = "Скопировано"; setTimeout(function () { btn.textContent = "Скопировать письмо"; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  });
  build();
})();
