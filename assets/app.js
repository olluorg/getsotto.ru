// Лендинги sotto: заявка на доступ, видео и цели Метрики. Без зависимостей.
(function () {
  "use strict";
  var cfg = window.SOTTO || {};

  // Цель Яндекс Метрики, если счётчик подключён.
  function goal(name, params) {
    if (cfg.metrika && typeof window.ym === "function") {
      try { window.ym(cfg.metrika, "reachGoal", name, params || {}); } catch (e) {}
    }
  }

  // Метки рекламы запоминаются с первого захода: человек может прийти по
  // рекламе, уйти и вернуться напрямую — заявка всё равно скажет откуда.
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      if (q.get(k)) utm[k] = q.get(k).slice(0, 120);
    });
    if (Object.keys(utm).length) localStorage.setItem("sotto.utm", JSON.stringify(utm));
    else utm = JSON.parse(localStorage.getItem("sotto.utm") || "{}");
  } catch (e) {}

  // ---- заявка ----
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    var started = false;
    form.addEventListener("input", function () {
      if (!started) { started = true; goal("lead_start"); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get("website")) return; // поле-ловушка для ботов
      var body = {
        contact: String(data.get("contact") || "").trim(),
        name: String(data.get("name") || "").trim(),
        scenario: String(data.get("scenario") || ""),
        comment: String(data.get("comment") || "").trim(),
        page: location.pathname,
        utm: utm,
        consent: !!data.get("consent")
      };
      if (!body.contact) { status.className = "form-status bad"; status.textContent = "Укажите почту или Telegram."; return; }
      if (!body.consent) { status.className = "form-status bad"; status.textContent = "Нужно согласие на обработку данных."; return; }
      button.disabled = true;
      status.className = "form-status";
      status.textContent = "Отправляю…";
      fetch(cfg.leadUrl || "/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        status.className = "form-status ok";
        status.textContent = "Спасибо! Пришлём промокод и ссылку на программу в течение дня.";
        form.reset();
        goal("lead", { scenario: body.scenario });
      }).catch(function () {
        status.className = "form-status bad";
        status.textContent = "Не отправилось. Напишите нам: " + (cfg.contact || "почта в подвале страницы") + ".";
      }).then(function () { button.disabled = false; });
    });
  });

  // ---- видео: пока ролика нет — заставка вместо пустого плеера ----
  document.querySelectorAll(".video").forEach(function (box) {
    var video = box.querySelector("video");
    if (!video) return;
    var source = video.querySelector("source");
    var missing = function () { box.classList.add("missing"); };
    if (source) source.addEventListener("error", missing);
    video.addEventListener("error", missing);
    fetch(source ? source.src : video.src, { method: "HEAD" }).then(function (r) { if (!r.ok) missing(); }).catch(missing);
    video.addEventListener("play", function () { goal("video_play"); }, { once: true });
  });

  // ---- цели: дошли до тарифов, нажали «получить доступ» ----
  var plans = document.getElementById("pricing");
  if (plans && "IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && !seen) { seen = true; goal("pricing_view"); } });
    }, { threshold: 0.4 }).observe(plans);
  }
  document.querySelectorAll("a[href='#access']").forEach(function (a) {
    a.addEventListener("click", function () { goal("cta_click", { where: a.dataset.where || "" }); });
  });
})();
