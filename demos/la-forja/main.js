(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = 'https://wa.me/595986125649?text=';
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function gs(n) { return 'Gs. ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /* time in Asunción */
  function pyNow() {
    try {
      var o = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Asuncion', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
        .formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; });
      return { d: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], h: (+o.hour % 24) + (+o.minute) / 60, date: new Date(Date.UTC(+o.year, +o.month - 1, +o.day)) };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours() + n.getMinutes() / 60, date: new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) }; }
  }
  var HOURS = { 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [8, 18] };
  var DAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function fmt(h) { return Math.floor(h) + ':' + ('0' + Math.round((h % 1) * 60)).slice(-2); }

  function status() {
    var n = pyNow(), t = HOURS[n.d], open = !!t && n.h >= t[0] && n.h < t[1], when = '';
    if (!open) {
      if (t && n.h < t[0]) when = 'hoy a las ' + fmt(t[0]);
      else { for (var i = 1; i < 7; i++) { var d = (n.d + i) % 7; if (HOURS[d]) { when = (i === 1 ? 'mañana' : 'el ' + DAY[d]) + ' a las ' + fmt(HOURS[d][0]); break; } } }
    }
    $$('[data-open-status]').forEach(function (el) {
      el.textContent = open ? 'Abierto · hasta las ' + fmt(t[1]) : 'Cerrado · abre ' + when.replace(' a las ', ' ');
      el.parentNode.classList.toggle('is-open', open);
    });
    $$('[data-open-status-long]').forEach(function (el) {
      el.innerHTML = open ? '<b>Abierto ahora</b>, hasta las ' + fmt(t[1]) + '. Si hay sillón libre te atendemos por orden de llegada; con turno, no esperás.'
        : '<b>Cerrado ahora.</b> Abrimos ' + when + '. Dejanos tu pedido de turno por WhatsApp y te respondemos al abrir.';
    });
    $$('.hours tr').forEach(function (tr) { tr.classList.toggle('today', tr.getAttribute('data-days').split(',').indexOf(String(n.d)) > -1); });
  }
  status(); setInterval(status, 60000);

  /* turno builder */
  var form = $('#turno-form');
  if (form) {
    var dayBox = $('#day-chips'), ticket = $('.ticket'), n0 = pyNow();
    var SLOTS = { manana: ['Mañana', 9, 12], siesta: ['Mediodía', 12, 15], tarde: ['Tarde', 15, 20] };
    // real upcoming dates
    var html = '', count = 0;
    for (var i = 0; i < 10 && count < 6; i++) {
      var d = (n0.d + i) % 7, t = HOURS[d];
      if (!t || (i === 0 && n0.h > t[1] - 1)) continue;
      var dt = new Date(n0.date.getTime() + i * 864e5), dm = dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1);
      var label = DAYS[d];
      html += '<label><input type="radio" name="day" value="' + DAY[d] + ' ' + dm + '" data-dow="' + d + '" data-today="' + (i === 0 ? 1 : 0) + '"' + (count === 0 ? ' checked' : '') + '><span>' + label + '<small>' + (i === 0 ? 'hoy · ' : i === 1 ? 'mañana · ' : '') + dm + '</small></span></label>';
      count++;
    }
    if (html) dayBox.innerHTML = html;

    function val(name) { return form.querySelector('input[name="' + name + '"]:checked'); }
    function slotRange(key, dow) { var s = SLOTS[key], a = s[1], b = s[2]; if (dow === 6) { if (key === 'manana') a = 8; if (key === 'tarde') b = 18; } return [a, b]; }
    function update(bump) {
      var day = val('day'), dow = +day.getAttribute('data-dow'), today = day.getAttribute('data-today') === '1', now = pyNow().h;
      $$('input[name="slot"]', form).forEach(function (r) {
        var rg = slotRange(r.value, dow);
        r.nextElementSibling.textContent = SLOTS[r.value][0] + ' · ' + rg[0] + ' a ' + rg[1];
        r.disabled = today && now > rg[1] - 0.75;
      });
      var slot = val('slot');
      if (!slot || slot.disabled) { var first = form.querySelector('input[name="slot"]:not(:disabled)'); if (first) { first.checked = true; slot = first; } }
      var svc = val('svc'), price = +svc.getAttribute('data-price'), rg = slotRange(slot.value, dow);
      var dayTxt = day.value.charAt(0).toUpperCase() + day.value.slice(1);
      var slotTxt = SLOTS[slot.value][0] + ' · ' + rg[0] + ' a ' + rg[1];
      $('#t-svc').textContent = svc.getAttribute('data-label');
      $('#t-day').textContent = (today ? 'Hoy, ' : '') + dayTxt;
      $('#t-slot').textContent = slotTxt;
      $('#t-price').textContent = gs(price);
      var name = $('#tn-name').value.trim();
      var msg = 'Hola La Forja, quiero pedir un turno.\n' +
        '• Servicio: ' + svc.getAttribute('data-label') + ' (' + gs(price) + ' según la web)\n' +
        '• Día: ' + (today ? 'hoy, ' : '') + day.value + '\n' +
        '• Franja: ' + SLOTS[slot.value][0].toLowerCase() + ', de ' + rg[0] + ' a ' + rg[1] + ' h\n' +
        (name ? '• Nombre: ' + name + '\n' : '') + '¿Qué horario tienen libre?';
      $('#t-send').href = WA + encodeURIComponent(msg);
      if (bump && !RM) { ticket.classList.remove('bump'); void ticket.offsetWidth; ticket.classList.add('bump'); setTimeout(function () { ticket.classList.remove('bump'); }, 260); }
    }
    form.addEventListener('change', function () { update(true); });
    $('#tn-name').addEventListener('input', function () { update(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); window.open($('#t-send').href, '_blank', 'noopener'); });
    $$('.row[data-svc]').forEach(function (a) {
      a.addEventListener('click', function () { var r = form.querySelector('input[name="svc"][value="' + a.getAttribute('data-svc') + '"]'); if (r) { r.checked = true; update(true); } });
    });
    update(false);
  }

  /* map */
  var map = $('#map');
  if (map) { $('.map-shield', map).addEventListener('click', function () { map.classList.add('is-live'); }); map.addEventListener('mouseleave', function () { map.classList.remove('is-live'); }); }

  /* reveal */
  var rv = $$('.rv');
  if (!RM && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
})();
