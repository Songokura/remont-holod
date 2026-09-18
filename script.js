/* ============================================================
   holodilnikremont.kz - скрипт страницы.
   Плиты и дверь холодильника (герой + фото-плиты) · дисплей температуры ·
   подбор по симптомам · перевод RU/KZ (словарь kk грузится по кнопке) ·
   меню · бегущие строки · лента отзывов с кнопками · WhatsApp с готовым
   текстом · форма в WhatsApp. Библиотек нет.
   ============================================================ */
(function(){
"use strict";
var WA = "77015001777";
var RED = matchMedia("(prefers-reduced-motion: reduce)").matches;
var HAS_IO = typeof IntersectionObserver === "function";
var root = document.documentElement;

/* ---------------- КОНВЕРСИИ GOOGLE ADS ----------------
   Ярлыки задаёт index.html (window.RH_CONV): phone, contact, lead. Пусто - не шлём. */
function conv(key){
  var id = (window.RH_CONV || {})[key];
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {send_to: id, value: 1.0, currency: "USD", transport_type: "beacon"});
}
document.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.indexOf("tel:") === 0) conv("phone");
  else if (h.indexOf("wa.me") > -1) conv("contact");
}, true);

/* ---------------- КАЗАХСКИЙ СЛОВАРЬ ----------------
   Лежит в assets/lang/kk.js и грузится только по выбору KZ (или ?lang=kk / сохранённый выбор).
   В разметке и здесь казахского текста нет - проверка Google Ads видит русский сайт. */
var ASSET_V = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || "";
var KK = null, KZ = {};
function loadKK(done){
  if (KK) return done();
  var s = document.createElement("script");
  s.src = "assets/lang/kk.js" + (ASSET_V ? "?v=" + ASSET_V : "");
  s.onload = function(){ if (window.SITE_KK){ KK = window.SITE_KK; KZ = KK.dict || {}; } done(); };
  s.onerror = function(){ done(); };
  document.head.appendChild(s);
}

/* готовые тексты WhatsApp */
var WA_RU = {
  hero:"Здравствуйте! Нужен ремонт холодильника.\nЧто случилось: ",
  sym:"Здравствуйте! Нужен ремонт холодильника.\nСимптом: {t}\nМарка и адрес: ",
  work:"Здравствуйте! Интересует:\n{t}\nМарка холодильника и адрес: ",
  price:"Здравствуйте! Подскажите цену ремонта.\nЧто случилось и марка: ",
  biz:"Здравствуйте! Пишу от компании. Интересует договор на ремонт и обслуживание холодильного оборудования.\nКомпания: ",
  kontakty:"Здравствуйте! Пишу с сайта holodilnikremont.kz. Что случилось: "
};
function waTxt(){ return (curLang() === "kk" && KK && KK.wa) ? KK.wa : WA_RU; }

/* симптомы: заголовок причины, описание, время, подсвечиваемые узлы, работы с ценами */
var SYM_RU = [
  {c:"Утечка фреона, компрессор или нарушение циркуляции воздуха", d:"Чаще всего уходит фреон через микротрещину в контуре, реже - потеря производительности компрессора, забит капилляр или нарушение циркуляции воздуха. Найдём течеискателем и починим на месте.", t:"30-60 мин", p:["pt-evap","pt-comp","pt-cap","pt-fan"], l:"испаритель · компрессор · вентилятор", w:[["Поиск и устранение утечки фреона","от 5 000 ₸"],["Заправка фреоном","от 20 000 ₸"],["Замена компрессора на обычный 220 В","35 000 ₸"],["Вентилятор, капилляр, фильтр-осушитель","после диагностики"]]},
  {c:"Холодильник не включается", k:"", d:"", dp:["Если холодильник не работает и внутри не горит свет, в первую очередь проверьте розетку.","Подключите к ней любой другой бытовой прибор - например, зарядное устройство, фен или настольную лампу.","Если розетка исправна, вероятнее всего, неисправность находится в самом холодильнике. В этом случае потребуется диагностика мастера.","<b>📞 Вызовите меня - я проведу диагностику и определю причину неисправности.</b>"], t:"10-30 мин", p:["pt-relay","pt-board"], l:"реле · плата", w:[["Замена плавкого предохранителя","от 5 000 ₸"],["Замена пуско-защитного реле","от 10 000 ₸"],["Ремонт платы управления","после диагностики"]]},
  {c:"Засор дренажа", d:"Вода под ящиками или на полу - забит слив талой воды. Прочищаем дренаж и проверяем испаритель, чтобы не повторилось.", t:"5-15 мин", p:["pt-drain"], l:"дренаж", w:[["Прочистка дренажной системы","после диагностики"],["Пайка алюминиевого испарителя","после диагностики"]]},
  {c:"Вентилятор или компрессор", d:"Гул, дребезг и скрежет дают вентилятор испарителя, изношенный компрессор или ослабшие крепления. Определим по звуку и заменим деталь.", t:"10-20 мин", p:["pt-fan","pt-comp"], l:"вентилятор · компрессор", w:[["Замена вентилятора испарителя или конденсатора","после диагностики"],["Замена компрессора на обычный 220 В","35 000 ₸"],["Мелкий ремонт","от 5 000 ₸"]]},
  {c:"Оттайка No Frost или уплотнитель", d:"Снежная шуба - не работает ТЭН, датчик или таймер оттайки, либо дверь не прилегает и тянет тёплый воздух. Меняем узел, регулируем дверь.", t:"10-30 мин", p:["pt-evap","pt-seal"], l:"испаритель · уплотнитель", w:[["Автоматика No Frost: ТЭН, датчик, таймер оттайки","после диагностики"],["Перенавеска и регулировка дверей","после диагностики"],["Мелкий ремонт","от 5 000 ₸"]]},
  {c:"Пуско-защитное реле", d:"Щелчок и тишина каждые несколько минут - реле пытается запустить компрессор и уходит в защиту. Обычно хватает замены реле, реже нужен компрессор.", t:"5-10 мин", p:["pt-relay","pt-comp"], l:"реле · компрессор", w:[["Замена пуско-защитного реле","от 10 000 ₸"],["Замена компрессора на обычный 220 В","35 000 ₸"]]},
  {c:"Плата или датчик температуры", d:"Код ошибки на дисплее - сбой датчика, платы управления или вентилятора. Считываем код, проверяем цепь и меняем неисправный узел.", t:"10-30 мин", p:["pt-board","pt-therm"], l:"плата · датчик", w:[["Плата управления или датчик температуры","после диагностики"],["Замена вентилятора","после диагностики"]]},
  {c:"Регулятор, фреон или уплотнитель", d:["регулятор температуры установлен на максимальное значение","холодильник не может набрать заданную температуру","нарушение циркуляции холодного воздуха (для систем No Frost)","недостаточное количество хладагента (фреона)","возможная утечка хладагента","неплотное прилегание дверей вследствие износа или повреждения уплотнителя"], t:"10-30 мин", p:["pt-therm","pt-seal","pt-fan","pt-evap"], l:"терморегулятор · вентилятор · уплотнитель", w:[["Замена терморегулятора","после диагностики"],["Поиск и устранение утечки фреона","от 5 000 ₸"],["Заправка фреоном","от 20 000 ₸"]]}
];
function symData(){ return (curLang() === "kk" && KK && KK.sym) ? KK.sym : SYM_RU; }

var TICK = ["Samsung","LG","Bosch","Miele","Liebherr","Haier","Ariston","Indesit","Beko","Atlant","Sub-Zero","Whirlpool","Electrolux","Siemens","Hitachi","Toshiba","Sharp","Daewoo","Gorenje","Vestfrost"];
var BR = [
  ["Samsung","LG","Bosch","Miele","Liebherr","Haier","Ariston","Indesit","Beko","Atlant","Sub-Zero"],
  ["Whirlpool","Electrolux","Siemens","Hitachi","Toshiba","Sharp","Daewoo","Gorenje","Hotpoint","Vestfrost","Stinol"],
  ["Smeg","AEG","Panasonic","Midea","Hansa","Candy","Zanussi","Biryusa","Pozis","Kuppersberg","Hisense"]
];
var CL = ["Мадлен","Мельница","Каганат","Страна Мимиории","Segafredo Zanetti","Усть-Каменогорская птицефабрика","ТД Рахмет","ТД Гульжан","ТЦ Евразия","Гиппократ","Курочка Ряба","Happy Cake"];

/* ---------------- ПЕРЕВОД ---------------- */
var RU = {};
function snapshot(){
  document.querySelectorAll("[data-i]").forEach(function(el){ if (RU[el.dataset.i] === undefined) RU[el.dataset.i] = el.innerHTML; });
  document.querySelectorAll("[data-i-alt]").forEach(function(el){ RU[el.dataset.iAlt] = el.alt; });
  document.querySelectorAll("[data-i-aria]").forEach(function(el){ RU[el.dataset.iAria] = el.getAttribute("aria-label"); });
  document.querySelectorAll("[data-i-c]").forEach(function(el){ RU[el.dataset.iC] = el.getAttribute("content"); });
  var t = document.querySelector("title[data-i-t]"); if (t) RU[t.dataset.iT] = t.textContent;
}
function pick(k, kk){ return (kk && KZ[k] !== undefined) ? KZ[k] : RU[k]; }
function curLang(){ return root.lang === "kk" ? "kk" : "ru"; }

/* текст заявки собирается заранее (при смене языка/симптома), а не в момент клика -
   так трекер LeadBot спокойно дописывает код обращения в href */
function setWaLinks(){
  var W = waTxt();
  document.querySelectorAll("[data-wa]").forEach(function(a){
    var key = a.dataset.wa, t = W[key] || W.hero;
    if (t.indexOf("{t}") > -1) {
      var card = a.closest(".card, .txt"), h = card ? card.querySelector("h3, h2") : null;
      t = t.replace("{t}", h ? h.textContent.trim() : "");
    }
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);
    a.target = "_blank"; a.rel = "noopener";
  });
}

function applyLang(lang){
  var kk = lang === "kk" && !!KK;
  root.setAttribute("lang", kk ? "kk" : "ru");
  document.querySelectorAll("[data-i]").forEach(function(el){
    var v = pick(el.dataset.i, kk); if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i-alt]").forEach(function(el){
    var v = pick(el.dataset.iAlt, kk); if (v !== undefined) el.alt = v;
  });
  document.querySelectorAll("[data-i-aria]").forEach(function(el){
    var v = pick(el.dataset.iAria, kk); if (v !== undefined) el.setAttribute("aria-label", v);
  });
  document.querySelectorAll("[data-i-c]").forEach(function(el){
    var v = pick(el.dataset.iC, kk); if (v !== undefined) el.setAttribute("content", v);
  });
  var t = document.querySelector("title[data-i-t]");
  if (t) { var tv = pick(t.dataset.iT, kk); if (tv !== undefined) t.textContent = tv; }
  var og = document.querySelector('meta[property="og:locale"]');
  if (og) og.setAttribute("content", kk ? "kk_KZ" : "ru_RU");
  document.querySelectorAll(".lang button").forEach(function(b){
    var on = b.getAttribute("data-lang") === (kk ? "kk" : "ru");
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  try { localStorage.setItem("rh-lang", kk ? "kk" : "ru"); } catch(e){}
  setWaLinks();
  fillTicker();
  showSym(curSym);
  requestAnimationFrame(fitText);
}
/* ?lang= в URL сильнее localStorage: русское объявление не должно открыть казахскую версию.
   Язык по navigator.language не угадываем - казахский только явным выбором. */
function initLang(){
  var url = new URLSearchParams(location.search).get("lang");
  var saved = null;
  try { saved = localStorage.getItem("rh-lang"); } catch(e){}
  var lang = (url === "kk" || url === "ru") ? url : (saved === "kk" ? "kk" : "ru");
  setLang(lang);
}
function setLang(lang){
  if (lang === "kk") loadKK(function(){ applyLang("kk"); });
  else applyLang("ru");
}
document.querySelectorAll(".lang button").forEach(function(b){
  b.addEventListener("click", function(){ setLang(b.getAttribute("data-lang")); });
});

/* дисплейные строки: казахский длиннее - ужимаем, пока не влезет */
function fitText(){
  fitPlates();
  document.querySelectorAll(".h1 span, .kphone").forEach(function(el){
    el.style.fontSize = "";
    var box = el.parentElement.clientWidth;
    if (!box) return;
    var size = parseFloat(getComputedStyle(el).fontSize), base = size;
    while (el.scrollWidth > box + 1 && size > base * 0.5) {
      size *= 0.95;
      el.style.fontSize = size + "px";
    }
  });
}

/* фото-плиты на узком и низком экране: если текст + фото не влезают в экран,
   плита растёт по содержимому (.pw-long), иначе остаётся полноэкранной и липкой.
   Считается после смены языка, шрифтов и размера окна (вызов вместе с fitText). */
function fitPlates(){
  var W = innerWidth, H = innerHeight;
  var hh = parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 64;
  document.querySelectorAll(".pw").forEach(function(pw){
    var txt = pw.querySelector(".plate.pp .txt"); if (!txt) return;
    if (W > 900) { pw.classList.remove("pw-long"); return; }
    var need = hh + 8 + txt.offsetHeight + 16 + 200 + (W <= 760 ? 80 : 24);
    pw.classList.toggle("pw-long", need > H);
  });
}

/* ---------------- БЕГУЩИЕ ЛЕНТЫ ---------------- */
function fillOne(el, list, speed){
  if (!el) return;
  var one = list.map(function(t){ return "<b>" + t + "</b>"; }).join("");
  el.innerHTML = one;
  var w = el.scrollWidth || 1000;
  var need = Math.max(2, Math.ceil((innerWidth * 2) / w) + 1);
  var html = "";
  for (var i = 0; i < need; i++) html += one;
  el.innerHTML = html;
  el.style.setProperty("--tkw", w + "px");
  el.style.setProperty("--tkd", Math.max(12, w / speed) + "s");
}
function fillTicker(){
  fillOne(document.getElementById("ticker"), TICK, 50);
  fillOne(document.getElementById("br1"), BR[0], 34);
  fillOne(document.getElementById("br2"), BR[1], 28);
  fillOne(document.getElementById("br3"), BR[2], 40);
  fillOne(document.getElementById("cl1"), (curLang() === "kk" && KK && KK.cl) ? KK.cl : CL, 30);
}
var tkTimer;
addEventListener("resize", function(){ clearTimeout(tkTimer); tkTimer = setTimeout(function(){ fillTicker(); fitText(); lanes.forEach(function(l){ l.state(); }); }, 200); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fillTicker(); fitText(); });

/* ---------------- МЕНЮ ---------------- */
var burger = document.getElementById("burger");
var mnav = document.getElementById("mnav");
function closeMenu(){
  document.body.classList.remove("menu-open");
  if (burger) burger.setAttribute("aria-expanded", "false");
}
if (burger) burger.addEventListener("click", function(){
  var open = document.body.classList.toggle("menu-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
if (mnav) mnav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
addEventListener("keydown", function(e){ if (e.key === "Escape") closeMenu(); });

/* ---------------- ЯКОРЯ ----------------
   Якорь симптома (#ne-morozit и т.п.) ведёт на блок симптомов и сразу выбирает его. */
var HH = function(){ return parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 64; };
/* каталог услуг убран 18.09.2026 - его якоря ведут на симптом с этими работами */
var OLD = {"uslugi":"ne-morozit","utechka-freona":"ne-morozit","invertornyy-kompressor":"ne-morozit","filtr-osushitel":"ne-morozit","kapillyar":"ne-morozit",
  "rele":"shchelkaet","predohranitel":"ne-vklyuchaetsya","melkiy-remont":"shumit","ventilyator":"shumit","no-frost":"namerzaet-led","perenaveska-dverey":"namerzaet-led",
  "isparitel":"techet-voda","drenazh":"techet-voda","termoregulyator":"ne-otklyuchaetsya","diagnostika":"oshibka","vinnye-shkafy":"miele"};
function goTo(id, smooth){
  if (OLD[id]) id = OLD[id];
  var t = document.getElementById(id); if (!t) return false;
  var chip = t.classList.contains("chip");
  if (chip) { selectSym(+t.dataset.s); t = document.getElementById("simptomy"); }
  var top = t.getBoundingClientRect().top + scrollY - (t.classList.contains("pw") ? 0 : HH() + 8);
  scrollTo({ top: Math.max(0, top), behavior: (smooth && !RED) ? "smooth" : "auto" });
  return true;
}
document.addEventListener("click", function(e){
  var a = e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href").slice(1); if (!id) return;
  if (!document.getElementById(id)) return;
  e.preventDefault();
  closeMenu();
  goTo(id, true);
  try { history.pushState(null, "", "#" + id); } catch(err){}
});

/* ---------------- ШАПКА ---------------- */
var hdr = document.getElementById("hdr");
function hdrState(){ if (hdr) hdr.classList.toggle("solid", scrollY > 40); }

/* ---------------- ДИСПЛЕЙ ТЕМПЕРАТУРЫ (7 сегментов) ---------------- */
var SEG = {"0":"abcdef","1":"bc","2":"abged","3":"abgcd","4":"fgbc","5":"afgcd","6":"afgedc","7":"abc","8":"abcdefg","9":"abfgcd","-":"g","+":"+"," ":""};
var SEGP = {a:"3,2 17,2 15,4 5,4", b:"18,3 18,17 16,15 16,5", c:"18,19 18,33 16,31 16,21", d:"3,34 17,34 15,32 5,32", e:"2,19 2,33 4,31 4,21", f:"2,3 2,17 4,15 4,5", g:"3,18 17,18 15,20 5,20"};
function segSvg(ch){
  var on = SEG[ch] || "";
  if (ch === "+") return '<svg viewBox="0 0 20 36"><rect x="9" y="11" width="2.6" height="14" rx="1"/><rect x="3.5" y="16.7" width="13.5" height="2.6" rx="1"/></svg>';
  if (ch === "°") return '<svg viewBox="0 0 12 36"><circle cx="6" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var s = '<svg viewBox="0 0 20 36">';
  "abcdefg".split("").forEach(function(k){ s += '<polygon class="' + (on.indexOf(k) > -1 ? "on" : "off") + '" fill="currentColor" points="' + SEGP[k] + '"/>'; });
  return s + "</svg>";
}
var lcd = document.getElementById("lcd"), lcdv = document.getElementById("lcdv"), lcdLast = null;
function setLcd(str){
  if (!lcdv || str === lcdLast) return;
  lcdLast = str;
  lcdv.innerHTML = str.split("").map(segSvg).join("");
}
function lcdTemp(stay, intro){
  if (!lcd) return;
  if (intro < 0.35) { setLcd("--"); return; }
  var v = Math.round(14 - 10 * easeOut(stay));
  setLcd("+" + v + "°");
  lcd.classList.toggle("cold", v <= 6);
}

/* ---------------- ПЛИТЫ ----------------
   Один слушатель scroll через rAF. На каждую .pw пишем --enter/--exit/--stay
   и --open (угол двери: уплотнитель «держит» в начале, потом дверь распахивается). */
var heroPw = document.getElementById("top");
var hero = document.getElementById("hero");
var pws = [].slice.call(document.querySelectorAll(".pw"));
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 2.4); }
function doorEase(p){           /* 0..0.12 - уплотнитель держит, дальше распахивание */
  p = clamp(p);
  if (p < 0.12) return 0.04 * (p / 0.12);
  return 0.04 + 0.96 * easeOut((p - 0.12) / 0.88);
}
function update(){
  var H = innerHeight || root.clientHeight;
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    var open  = pw === heroPw ? doorEase(stay) : doorEase((enter - 0.3) / 0.7);
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.style.setProperty("--open",  open.toFixed(3));
    pw.classList.toggle("gone", exit >= 1);
    pw.classList.toggle("on", enter > 0.62);
    if (pw === heroPw) {
      pw.style.setProperty("--f", introK.toFixed(3));
      lcdTemp(stay, introK);
    }
  });
  hdrState();
  if (bar) {
    var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
    bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
  }
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  if (hero) hero.classList.add("on");
  setLcd("+4°"); if (lcd) lcd.classList.add("cold");
  addEventListener("scroll", function(){ hdrState(); if (bar) bar.classList.toggle("show", scrollY > innerHeight * 0.55); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("resize", update);
  addEventListener("load", update);
  /* интро 1250 мс: иней сходит, дисплей включается, текст поднимается.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    if (hero) hero.classList.add("on");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1250);
      introK = easeOut(p);
      update();
      if (p < 1) requestAnimationFrame(step);
      else introDone = true;
    };
    requestAnimationFrame(function(){ if (hero) hero.classList.add("on"); requestAnimationFrame(step); });
    setTimeout(function(){ if (hero) hero.classList.add("on"); }, 400);
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 1800);
  }
}
window.plateSync = function(){ introDone = true; introK = 1; if (hero) hero.classList.add("on"); update(); };
addEventListener("hashchange", function(){ root.classList.add("no-intro"); var id = location.hash.slice(1); if (id && (document.getElementById(id) || OLD[id])) goTo(id, false); });

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ ---------------- */
if (HAS_IO) {
  if (!RED) root.classList.add("js");
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:.08, rootMargin:"0px 0px -5% 0px"});
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  setTimeout(function(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
  }); }, 1500);
} else {
  document.querySelectorAll(".rv").forEach(function(el){ el.classList.add("in"); });
}

/* ---------------- СИМПТОМЫ ---------------- */
var curSym = 0;
var chips = [].slice.call(document.querySelectorAll(".chip"));
function showSym(i){
  var S = symData(); var s = S[i]; if (!s) return;
  var t = document.getElementById("sa-t"), d = document.getElementById("sa-d"), tm = document.getElementById("sa-time"), wa = document.getElementById("sa-wa"), lb = document.getElementById("xlbl");
  if (t) t.textContent = s.c;
  /* описание - строка или список причин (массив) */
  var li = document.getElementById("sa-l"), isList = Array.isArray(s.d);
  /* d - строка; массив - список причин; массив в dp - абзацы. k:"" прячет кикер «Вероятная причина» */
  if (d) {
    d.hidden = isList;
    if (s.dp) d.innerHTML = s.dp.map(function(x){ return "<p>" + x + "</p>"; }).join("");
    else d.textContent = isList ? "" : s.d;
  }
  var kk = document.getElementById("sa-k"); if (kk) kk.hidden = s.k === "";
  if (li) { li.hidden = !isList; li.innerHTML = isList ? s.d.map(function(x){ return "<li>" + x + "</li>"; }).join("") : ""; }
  if (tm) tm.textContent = s.t;
  if (lb) lb.textContent = s.l;
  var pr = document.getElementById("sa-pr");
  if (pr) pr.innerHTML = (s.w || []).map(function(w){
    return '<li><span>' + w[0] + '</span><i></i><b' + (/\d/.test(w[1]) ? '' : ' class="dim"') + '>' + w[1] + '</b></li>';
  }).join("");
  document.querySelectorAll(".fridge .pt").forEach(function(g){ g.classList.toggle("lit", s.p.indexOf(g.id) > -1); });
  if (wa) {
    var chip = chips[i], name = chip ? chip.textContent.trim() : "";
    wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(waTxt().sym.replace("{t}", name));
  }
}
function selectSym(i){
  curSym = i;
  chips.forEach(function(c){ c.setAttribute("aria-selected", +c.dataset.s === i ? "true" : "false"); });
  showSym(i);
}
chips.forEach(function(c){ c.addEventListener("click", function(){ selectSym(+c.dataset.s); try { history.replaceState(null, "", "#" + c.id); } catch(e){} }); });

/* ---------------- ЛЕНТЫ С КНОПКАМИ ---------------- */
var lanes = [];
document.querySelectorAll(".lane-w").forEach(function(w){
  var lane = w.querySelector(".lane"), sec = w.closest(".sec");
  var prev = sec && sec.querySelector(".lbtn.prev"), next = sec && sec.querySelector(".lbtn.next");
  if (!lane || !prev || !next) return;
  function stepW(){
    var c = lane.firstElementChild; if (!c) return 300;
    var cs = getComputedStyle(lane);
    var gap = parseFloat(cs.columnGap || cs.gap) || 14;
    return c.getBoundingClientRect().width + gap;
  }
  function state(){
    var max = lane.scrollWidth - lane.clientWidth;
    var none = max <= 1;
    prev.hidden = none; next.hidden = none;
    prev.disabled = lane.scrollLeft <= 5;
    next.disabled = lane.scrollLeft >= max - 1;
  }
  prev.addEventListener("click", function(){ lane.scrollBy({left: -stepW(), behavior: RED ? "auto" : "smooth"}); });
  next.addEventListener("click", function(){ lane.scrollBy({left: stepW(), behavior: RED ? "auto" : "smooth"}); });
  lane.addEventListener("scroll", state, {passive:true});
  lane.addEventListener("keydown", function(e){
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); prev.click(); }
  });
  state();
  requestAnimationFrame(state);
  addEventListener("load", state);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(state);
  lanes.push({state: state});
});

/* ---------------- ФОРМА → WhatsApp ---------------- */
var FORM_RU = {hello:"Здравствуйте! Заявка с сайта holodilnikremont.kz.", name:"Имя", phone:"Телефон", msg:"Что случилось"};
var form = document.getElementById("form");
if (form) form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = document.getElementById("fmok"), err = document.getElementById("fmerr");
  if (form.company && form.company.value) return;          /* honeypot */
  var name = form.name.value.trim(), phone = form.phone.value.trim(), msg = form.msg.value.trim();
  if (!name || phone.replace(/\D/g, "").length < 10) { err.hidden = false; ok.hidden = true; return; }
  err.hidden = true;
  var F = (curLang() === "kk" && KK && KK.form) ? KK.form : FORM_RU;
  var t = F.hello + "\n" + F.name + ": " + name + "\n" + F.phone + ": " + phone + (msg ? "\n" + F.msg + ": " + msg : "");
  ok.hidden = false;
  conv("lead");
  window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(t), "_blank", "noopener");
});

/* ---------------- СТАРТ ---------------- */
snapshot();
initLang();
fillTicker();
fitText();
hdrState();
/* прямой переход по якорю симптома: выбрать симптом и встать на блок */
if (location.hash) {
  var hid = location.hash.slice(1), hel = document.getElementById(hid);
  if ((hel && hel.classList.contains("chip")) || OLD[hid]) setTimeout(function(){ goTo(hid, false); }, 60);
}
})();
