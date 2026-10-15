// «Поделиться» в статьях блога: одна кнопка .share-open открывает окно со
// ссылкой, QR-кодом и мессенджерами. QR кодируется здесь же (байтовый режим,
// уровень коррекции M, версии 1–10 — хватает для адреса статьи), без библиотек.
(function () {
  "use strict";

  // ---- QR -------------------------------------------------------------------
  // Версия → [кодовых слов коррекции на блок, [число блоков, данных в блоке], ...] для уровня M.
  var BLOCKS = [null, [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]],
    [16, [4, 27]], [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var res = [], root = 1, i, j;
    for (i = 0; i < degree - 1; i++) res.push(0);
    res.push(1);
    for (i = 0; i < degree; i++) {
      for (j = 0; j < degree; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < degree) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift();
      res.push(0);
      for (var i = 0; i < div.length; i++) res[i] ^= gfMul(div[i], f);
    });
    return res;
  }

  function encode(text) {
    var bytes = Array.from(new TextEncoder().encode(text));
    var ver, dataCw, spec;
    for (ver = 1; ver <= 10; ver++) {
      spec = BLOCKS[ver];
      dataCw = 0;
      for (var g = 1; g < spec.length; g++) dataCw += spec[g][0] * spec[g][1];
      if (4 + (ver < 10 ? 8 : 16) + 8 * bytes.length <= dataCw * 8) break;
    }
    if (ver > 10) return null;

    // Биты: режим «байты», длина, данные, терминатор, добивка до байта и байтами 0xEC/0x11.
    var bits = [];
    function put(v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, dataCw * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < dataCw * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
    var data = [];
    for (var k = 0; k < bits.length; k += 8) data.push(parseInt(bits.slice(k, k + 8).join(""), 2));

    // Блоки, коррекция Рида — Соломона и перемежение.
    var ecLen = spec[0], div = rsDivisor(ecLen), blocks = [], pos = 0;
    for (g = 1; g < spec.length; g++) {
      for (var n = 0; n < spec[g][0]; n++) {
        var d = data.slice(pos, pos + spec[g][1]);
        pos += spec[g][1];
        blocks.push([d, rsRemainder(d, div)]);
      }
    }
    var cw = [], i, b;
    for (i = 0; i < 44; i++) for (b = 0; b < blocks.length; b++) if (i < blocks[b][0].length) cw.push(blocks[b][0][i]);
    for (i = 0; i < ecLen; i++) for (b = 0; b < blocks.length; b++) cw.push(blocks[b][1][i]);

    var size = ver * 4 + 17, mod = [], fn = [];
    for (i = 0; i < size; i++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }

    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var x = c[0] + dx, y = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4);
      }
    });
    var al = ALIGN[ver], last = al.length - 1;
    al.forEach(function (ax, ia) {
      al.forEach(function (ay, ja) {
        if ((ia === 0 && ja === 0) || (ia === 0 && ja === last) || (ia === last && ja === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      });
    });
    function formatBits(mask) {
      var v = mask, rem = v; // уровень M — биты 00
      for (var j = 0; j < 10; j++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var f = ((v << 10) | rem) ^ 0x5412, bit = function (j) { return ((f >>> j) & 1) === 1; };
      for (j = 0; j <= 5; j++) set(8, j, bit(j));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (j = 9; j < 15; j++) set(14 - j, 8, bit(j));
      for (j = 0; j < 8; j++) set(size - 1 - j, 8, bit(j));
      for (j = 8; j < 15; j++) set(8, size - 15 + j, bit(j));
      set(8, size - 8, true);
    }
    formatBits(0);
    if (ver >= 7) {
      var rem = ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      var vb = (ver << 12) | rem;
      for (i = 0; i < 18; i++) {
        var on = ((vb >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3);
        set(a, c, on); set(c, a, on);
      }
    }

    // Данные — змейкой снизу справа, по два столбца, пропуская столбец 6.
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j2 = 0; j2 < 2; j2++) {
        var x = right - j2, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && bi < cw.length * 8) { mod[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
      }
    }

    var MASKS = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
      function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }];
    function applyMask(m) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x];
    }
    function penalty() {
      var p = 0, dark = 0, x, y, run, line, s;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        line = [];
        for (x = 0; x < size; x++) line.push(pass ? mod[x][y] : mod[y][x]);
        run = 1;
        for (x = 1; x <= size; x++) {
          if (x < size && line[x] === line[x - 1]) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        s = line.map(function (v) { return v ? "1" : "0"; }).join("");
        p += 40 * ((s.match(/(?=10111010000|00001011101)/g) || []).length);
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      return p + 10 * Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size));
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); formatBits(m);
      var pm = penalty();
      if (pm < bestP) { bestP = pm; best = m; }
      applyMask(m);
    }
    applyMask(best); formatBits(best);
    return mod;
  }

  function qrSvg(mod) {
    var n = mod.length, q = 4, path = "";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (mod[y][x]) path += "M" + (x + q) + "," + (y + q) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * q) + " " + (n + 2 * q) +
      '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + path + '" fill="#000"/></svg>';
  }
  function qrPng(mod, scale) {
    var n = mod.length + 8, cv = document.createElement("canvas"), ctx = cv.getContext("2d");
    cv.width = cv.height = n * scale;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#000";
    mod.forEach(function (row, y) { row.forEach(function (on, x) { if (on) ctx.fillRect((x + 4) * scale, (y + 4) * scale, scale, scale); }); });
    return cv;
  }
  window.sottoQR = { encode: encode, png: qrPng };

  // ---- окно ------------------------------------------------------------------
  var dlg = null, current = null;

  function flash(btn, text) {
    var old = btn.textContent;
    btn.textContent = text;
    setTimeout(function () { btn.textContent = old; }, 2000);
  }
  function build() {
    dlg = document.createElement("dialog");
    dlg.className = "share-dialog";
    dlg.setAttribute("aria-labelledby", "share-title");
    dlg.innerHTML =
      '<button type="button" class="share-x" data-act="close" aria-label="Закрыть">×</button>' +
      '<h3 id="share-title">Поделиться статьёй</h3>' +
      '<div class="share-qr" role="img" aria-label="QR-код со ссылкой на статью"></div>' +
      '<div class="share-row"><input class="share-url" readonly aria-label="Ссылка на статью">' +
      '<button type="button" class="btn primary small" data-act="copy" autofocus>Скопировать</button></div>' +
      '<div class="share-grid">' +
      '<a class="btn ghost small" data-net="tg" target="_blank" rel="noopener">Telegram</a>' +
      '<a class="btn ghost small" data-net="vk" target="_blank" rel="noopener">ВКонтакте</a>' +
      '<a class="btn ghost small" data-net="wa" target="_blank" rel="noopener">WhatsApp</a>' +
      '<button type="button" class="btn ghost small" data-act="qr-copy">Скопировать QR-код</button>' +
      '<button type="button" class="btn ghost small" data-act="qr-save">Скачать QR-код</button>' +
      '<button type="button" class="btn ghost small" data-act="native" hidden>Ещё…</button>' +
      "</div>";
    document.body.appendChild(dlg);
    if (navigator.share) dlg.querySelector("[data-act=native]").hidden = false;
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) return dlg.close(); // клик по фону
      var btn = e.target.closest("button");
      if (!btn) return;
      var act = btn.dataset.act, mod = current && current.mod;
      if (act === "close") dlg.close();
      else if (act === "copy") {
        var input = dlg.querySelector(".share-url");
        (navigator.clipboard ? navigator.clipboard.writeText(current.url) : Promise.reject()).then(
          function () { flash(btn, "Скопировано"); },
          function () { input.select(); flash(btn, "Нажмите Ctrl+C"); });
      } else if (act === "qr-copy" && mod) {
        qrPng(mod, 10).toBlob(function (blob) {
          if (navigator.clipboard && window.ClipboardItem) {
            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(
              function () { flash(btn, "QR-код скопирован"); },
              function () { flash(btn, "Не вышло — скачайте"); });
          } else flash(btn, "Не вышло — скачайте");
        });
      } else if (act === "qr-save" && mod) {
        var a = document.createElement("a");
        a.href = qrPng(mod, 10).toDataURL("image/png");
        a.download = "qr-" + location.pathname.split("/").filter(Boolean).pop() + ".png";
        document.body.appendChild(a); a.click(); a.remove();
      } else if (act === "native") {
        navigator.share({ title: current.title, url: current.url }).catch(function () { /* отменили */ });
      }
    });
  }
  function open(url, title) {
    if (!dlg) build();
    current = { url: url, title: title, mod: encode(url) };
    var q = encodeURIComponent;
    dlg.querySelector(".share-qr").innerHTML = current.mod ? qrSvg(current.mod) : "";
    dlg.querySelector(".share-url").value = url;
    dlg.querySelector("[data-net=tg]").href = "https://t.me/share/url?url=" + q(url) + "&text=" + q(title);
    dlg.querySelector("[data-net=vk]").href = "https://vk.com/share.php?url=" + q(url) + "&title=" + q(title);
    dlg.querySelector("[data-net=wa]").href = "https://wa.me/?text=" + q(title + " " + url);
    dlg.showModal();
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".share-open");
    if (btn) open(btn.dataset.url, btn.dataset.title);
  });
})();
