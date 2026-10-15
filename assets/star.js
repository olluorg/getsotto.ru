// Конструктор STAR-историй (/blog/povedencheskie-voprosy/): ситуация, задача, действия,
// результат → готовый рассказ; истории копятся в этом браузере.
(function () {
  "use strict";
  var root = document.getElementById("star");
  if (!root) return;
  var KEY = "sotto-star-v1";
  var F = [["q", "Вопрос, на который история отвечает", "Расскажите о сложной задаче, которую вы решили"],
    ["s", "Ситуация — где и когда это было", "Дипломный проект на курсе, команда из трёх человек, две недели до сдачи"],
    ["t", "Задача — что нужно было сделать именно вам", "Мне досталась интеграция с платёжным сервисом, о котором никто в команде не знал"],
    ["a", "Действия — что вы сделали (глаголы в первом лице)", "Разобрал документацию, написал прототип на тестовом окружении, договорился с командой о формате данных, покрыл тестами"],
    ["r", "Результат — цифры или наблюдаемый итог и вывод", "Интеграция заработала за 4 дня, проект сдали вовремя; вывод — начинать с прототипа, а не с чтения всего подряд"]];
  var stories = [];
  try { stories = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { stories = []; }

  root.innerHTML = '<div class="tr-form cl-form">' + F.map(function (f) {
    return '<label class="wide">' + f[1] + (f[0] === "q" ? '<input name="q" placeholder="' + f[2] + '">' : '<textarea name="' + f[0] + '" rows="2" placeholder="' + f[2] + '"></textarea>') + "</label>";
  }).join("") + '<button type="button" class="btn primary small" data-act="save">Сохранить историю</button></div>' +
    '<h3>Как это прозвучит</h3><pre class="cl-out"></pre><p class="wc-note st-time"></p><div class="st-list"></div>';

  function v(n) { return root.querySelector("[name=" + n + "]").value.trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function story(o) {
    return [o.s && ("Ситуация: " + o.s + "."), o.t && ("Моя задача: " + o.t + "."), o.a && ("Что я сделал: " + o.a + "."), o.r && ("Результат: " + o.r + ".")]
      .filter(Boolean).join(" ").replace(/\.\./g, ".");
  }
  function render() {
    var o = { s: v("s"), t: v("t"), a: v("a"), r: v("r") }, text = story(o);
    root.querySelector(".cl-out").textContent = text || "Заполните поля выше — здесь появится рассказ.";
    // ~130 слов в минуту — спокойный темп речи.
    var words = text ? text.split(/\s+/).length : 0;
    root.querySelector(".st-time").textContent = words ? "Около " + Math.max(1, Math.round(words / 130 * 60)) + " секунд вслух. Хороший ответ — 1–2 минуты." : "";
    root.querySelector(".st-list").innerHTML = stories.length ? "<h3>Мои истории</h3>" + stories.map(function (x, i) {
      return '<details class="st-item"><summary>' + esc(x.q || "История " + (i + 1)) + '</summary><p>' + esc(story(x)) +
        '</p><button type="button" class="tr-del" data-del="' + i + '" aria-label="Удалить">×</button></details>';
    }).join("") : "";
  }
  root.addEventListener("input", render);
  root.addEventListener("click", function (e) {
    if (e.target.dataset.act === "save" && (v("s") || v("a"))) {
      stories.push({ q: v("q"), s: v("s"), t: v("t"), a: v("a"), r: v("r") });
      root.querySelectorAll("input, textarea").forEach(function (x) { x.value = ""; });
    } else if (e.target.dataset.del) {
      stories.splice(+e.target.dataset.del, 1);
    } else return;
    try { localStorage.setItem(KEY, JSON.stringify(stories)); } catch (err) { /* без сохранения */ }
    render();
  });
  render();
})();
