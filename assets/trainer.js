// Тренажёр алгоритмической секции (/blog/algoritmicheskaya-sekciya/): случайная
// классическая задача, таймер на 45 минут и подсказка, чем заняться на этом отрезке.
(function () {
  "use strict";
  var root = document.getElementById("trainer");
  if (!root) return;

  // [название, slug на LeetCode, приём, уровень, подсказка к идее]
  var TASKS = [
    ["Две суммы", "two-sum", "хеш-таблица", "easy", "Храните в словаре уже виденные числа: для каждого x ищите target − x. Один проход, O(n)."],
    ["Правильные скобки", "valid-parentheses", "стек", "easy", "Открывающие кладите в стек, на закрывающей проверяйте пару с вершиной. В конце стек пуст."],
    ["Слияние интервалов", "merge-intervals", "сортировка + проход", "medium", "Отсортируйте по началу; если начало следующего ≤ концу текущего — расширяйте конец. O(n log n)."],
    ["Вставка интервала", "insert-interval", "интервалы", "medium", "Три фазы: интервалы левее нового, пересекающиеся (сливаем), правее. Сортировать не нужно."],
    ["Пересечение списков интервалов", "interval-list-intersections", "два указателя", "medium", "Пересечение — [max(начал), min(концов)], если оно непустое; двигайте указатель того, чей интервал кончается раньше."],
    ["Непересекающиеся интервалы", "non-overlapping-intervals", "жадный алгоритм", "medium", "Сортируйте по концу и берите интервал, если он начинается не раньше конца последнего взятого."],
    ["Диапазоны в массиве", "summary-ranges", "один проход", "easy", "Идите по отсортированному массиву, держите начало текущего диапазона; разрыв — закрываете диапазон."],
    ["Группировка анаграмм", "group-anagrams", "хеш-таблица", "medium", "Ключ группы — отсортированная строка или счётчик букв. Словарь ключ → список слов."],
    ["Подстрока без повторов", "longest-substring-without-repeating-characters", "скользящее окно", "medium", "Окно [left, right] и словарь последних позиций символов; повтор — сдвигаете left за прошлую позицию."],
    ["Все анаграммы в строке", "find-all-anagrams-in-a-string", "скользящее окно", "medium", "Окно фиксированной длины и счётчики букв; сравнивайте счётчики при каждом сдвиге."],
    ["Сжатие строки", "string-compression", "два указателя", "medium", "Указатель чтения считает длину серии, указатель записи пишет символ и число. Память O(1)."],
    ["Переместить нули", "move-zeroes", "два указателя", "easy", "Указатель на место для следующего ненулевого; проходите и меняйте местами."],
    ["Произведение кроме себя", "product-of-array-except-self", "префиксы", "medium", "Произведения слева и справа от каждого элемента — двумя проходами, без деления."],
    ["Подмассивы с суммой k", "subarray-sum-equals-k", "префиксные суммы", "medium", "Словарь «префиксная сумма → сколько раз встречалась»; на каждом шаге ищите prefix − k."],
    ["Самая длинная последовательность", "longest-consecutive-sequence", "множество", "medium", "Положите всё в set; начинайте счёт только от чисел, у которых нет x − 1. O(n)."],
    ["Топ-K частых элементов", "top-k-frequent-elements", "куча", "medium", "Посчитайте частоты, затем куча размера k или раскладка по корзинам частот."],
    ["K-й по величине элемент", "kth-largest-element-in-an-array", "куча", "medium", "Мин-куча размера k: в конце на вершине ответ. O(n log k)."],
    ["Бинарный поиск", "binary-search", "бинарный поиск", "easy", "Границы lo, hi и условие цикла — договоритесь о полуинтервале и не меняйте его посередине."],
    ["Слить два отсортированных списка", "merge-two-sorted-lists", "связный список", "easy", "Фиктивная голова и указатель хвоста; в конце прицепите остаток."],
    ["Развернуть список", "reverse-linked-list", "связный список", "easy", "Три указателя: prev, cur, next. Итеративно, память O(1)."],
    ["Глубина дерева", "maximum-depth-of-binary-tree", "дерево, рекурсия", "easy", "1 + max(глубина левого, глубина правого); пустое дерево — 0."],
    ["Проверить BST", "validate-binary-search-tree", "дерево", "medium", "Передавайте вниз допустимые границы (min, max), а не сравнивайте только с родителем."],
    ["Обход дерева по уровням", "binary-tree-level-order-traversal", "BFS", "medium", "Очередь; на каждой итерации обрабатывайте ровно столько узлов, сколько в ней было."],
    ["Количество островов", "number-of-islands", "BFS/DFS по сетке", "medium", "Нашли сушу — запускаете обход и помечаете весь остров посещённым; считаете запуски."],
    ["Расписание курсов", "course-schedule", "граф, топосортировка", "medium", "Есть ли цикл в ориентированном графе: алгоритм Кана по входящим степеням или DFS с цветами."],
    ["Лестница", "climbing-stairs", "динамика", "easy", "f(n) = f(n − 1) + f(n − 2); достаточно двух переменных."],
    ["Купить и продать акцию", "best-time-to-buy-and-sell-stock", "один проход", "easy", "Держите минимум цены слева и лучшую разницу с ним."],
    ["Контейнер с водой", "container-with-most-water", "два указателя", "medium", "Указатели с краёв; двигайте тот, у которого стенка ниже."],
    ["LRU-кэш", "lru-cache", "хеш-таблица + список", "medium", "Словарь ключ → узел двусвязного списка; свежие — в голову, вытесняется хвост. Обе операции O(1)."],
    ["Стек с минимумом", "min-stack", "стек", "medium", "Второй стек (или пары) с текущим минимумом на каждом уровне."],
  ];
  var PHASES = [[5, "Уточните условие: входные данные, ограничения, крайние случаи. Разберите пример."],
    [15, "Предложите наивное решение, затем лучше. Назовите сложность по времени и памяти до кода."],
    [35, "Пишите код и проговаривайте шаги, как будто вас слушает интервьюер."],
    [45, "Прогоните код на примере вручную, проверьте крайние случаи: пусто, один элемент, дубликаты."]];
  var LIMIT = 45 * 60;

  var levelSel = "all", task = null, start = 0, elapsed = 0, timer = null;

  root.innerHTML =
    '<div class="tn-controls"><select aria-label="Уровень"><option value="all">Любой уровень</option><option value="easy">Только easy</option><option value="medium">Только medium</option></select>' +
    '<button type="button" class="btn primary small" data-act="next">Дать задачу</button></div>' +
    '<div class="tn-task" hidden><p class="tn-pattern"></p><h3></h3>' +
    '<p><a target="_blank" rel="noopener nofollow">Условие на LeetCode</a></p>' +
    '<div class="tn-time"><b>45:00</b><div class="tn-bar"><i></i></div><p class="tn-phase"></p></div>' +
    '<div class="tn-buttons"><button type="button" class="btn ghost small" data-act="start">Старт</button>' +
    '<button type="button" class="btn ghost small" data-act="hint">Подсказка к идее</button></div>' +
    '<p class="tn-hint" hidden></p></div>';

  var q = function (s) { return root.querySelector(s); };
  q("select").addEventListener("change", function (e) { levelSel = e.target.value; });

  function fmt(sec) {
    var s = Math.abs(sec), m = Math.floor(s / 60), r = s % 60;
    return (sec < 0 ? "+" : "") + (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }
  function tick() {
    var sec = elapsed + (timer ? Math.floor((Date.now() - start) / 1000) : 0);
    q(".tn-time b").textContent = fmt(LIMIT - sec);
    q(".tn-bar i").style.width = Math.min(100, 100 * sec / LIMIT) + "%";
    var mins = sec / 60, text = "Время вышло. Как на настоящей секции: доведите мысль до конца и назовите, что бы улучшили.";
    for (var i = 0; i < PHASES.length; i++) if (mins < PHASES[i][0]) { text = PHASES[i][1]; break; }
    q(".tn-phase").textContent = text;
  }
  function stop() {
    if (timer) { elapsed += Math.floor((Date.now() - start) / 1000); clearInterval(timer); timer = null; }
    q('[data-act="start"]').textContent = elapsed ? "Продолжить" : "Старт";
  }

  root.addEventListener("click", function (e) {
    var act = e.target.dataset && e.target.dataset.act;
    if (act === "next") {
      var pool = TASKS.filter(function (t) { return levelSel === "all" || t[3] === levelSel; });
      var next;
      do { next = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && next === task);
      task = next; stop(); elapsed = 0;
      q(".tn-task").hidden = false;
      q(".tn-pattern").textContent = task[2] + " · " + task[3];
      q(".tn-task h3").textContent = task[0];
      q(".tn-task a").href = "https://leetcode.com/problems/" + task[1] + "/";
      q(".tn-hint").textContent = task[4];
      q(".tn-hint").hidden = true;
      q('[data-act="hint"]').textContent = "Подсказка к идее";
      tick();
    } else if (act === "start") {
      if (timer) { stop(); q('[data-act="start"]').textContent = "Продолжить"; }
      else { start = Date.now(); timer = setInterval(tick, 1000); e.target.textContent = "Пауза"; }
    } else if (act === "hint") {
      var h = q(".tn-hint"); h.hidden = !h.hidden;
      e.target.textContent = h.hidden ? "Подсказка к идее" : "Скрыть подсказку";
    }
  });
})();
