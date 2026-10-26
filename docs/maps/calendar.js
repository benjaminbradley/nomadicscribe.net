// Travel calendar, rendered in the browser from mapdata.xml.
// Port of the original calendar.php: the grid has no year (Jan 1 is a Sunday), as before.
(function () {
	var COUNTING_START = Date.UTC(2006, 1, 1);
	var DAY_MS = 86400000;
	var MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var MONTH_NAME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	function wikiHref(u) {
		var m = /[?&]title=([^&]*)/.exec(u);
		if (!m) return u;
		return '../wiki/' + decodeURIComponent(m[1]).replace(/[^A-Za-z0-9._~-]/g, '_') + '.html';
	}
	function utc(s) { return Date.UTC(+s.substr(0, 4), +s.substr(5, 2) - 1, +s.substr(8, 2)); }
	function short(s) { return MONTH_SHORT[+s.substr(5, 2) - 1] + ' ' + (+s.substr(8, 2)); }

	function render(xml) {
		var markers = Array.prototype.slice.call(xml.documentElement.getElementsByTagName('marker'));
		markers = markers.filter(function (m) { return m.getAttribute('hidden') !== 'true'; });
		markers.sort(function (a, b) {
			var x = a.getAttribute('startdate') || '', y = b.getAttribute('startdate') || '';
			return x < y ? -1 : x > y ? 1 : 0;
		});

		// The trip is over, so "today" is the last date in the data (the original used the current date).
		var today = 0;
		markers.forEach(function (m) {
			var e = m.getAttribute('enddate') || '';
			if (e.length === 10) today = Math.max(today, utc(e));
		});

		var types = {}, dayclass = [], monthstuff = [];
		for (var i = 0; i < 12; i++) { dayclass[i] = {}; monthstuff[i] = ''; }

		markers.forEach(function (m) {
			var start = m.getAttribute('startdate') || '', end = m.getAttribute('enddate') || '';
			var type = m.getAttribute('type') || '', name = m.getAttribute('name') || '', state = m.getAttribute('state') || '';
			var wikiurl = m.getAttribute('wikiurl') || '';
			var fname = wikiurl ? '<a href="' + esc(wikiHref(wikiurl)) + '">' + esc(name) + '</a>' : esc(name);
			if (type && !(type in types)) types[type] = 0;
			if (start.length === 10 && end.length === 10) {
				var sm = +start.substr(5, 2), sd = +start.substr(8, 2), em = +end.substr(5, 2), ed = +end.substr(8, 2);
				var d = sd, mo = sm;
				while (mo < em || (mo === em && d <= ed)) {
					dayclass[mo - 1][d] = 'day_' + type;
					d++;
					if (d > MONTHS[mo - 1]) { mo++; d = 1; }
				}
				monthstuff[sm - 1] += '<span class="day_' + esc(type) + '">' + short(start) + ' to ' + short(end) + ': ' + fname + ' (' + esc(state) + ')</span><br>';
				var endEff = Math.min(utc(end), today);
				if (utc(start) > COUNTING_START && utc(start) < today) {
					types[type] += Math.floor((endEff - utc(start)) / DAY_MS);
				}
			} else if (start.length === 10 && name) {
				monthstuff[+start.substr(5, 2) - 1] += '<span class="day_' + esc(type) + '">' + esc(name) + ' (' + esc(state) + ')</span><br>';
			}
		});

		var totalDays = (today - COUNTING_START) / DAY_MS - (types.other || 0);

		var key = '<table cellpadding="1" cellspacing="0" border="1"><tr><th align="center">type</th><th align="center">days on trip</th><th align="center">percent</th></tr>';
		var out = 0;
		Object.keys(types).forEach(function (t) {
			if (t === 'other') return;
			out += types[t];
			key += '<tr><td class="key_' + esc(t) + '">' + esc(t) + '</td><td>' + types[t] + '</td><td align="right">' + (types[t] / totalDays * 100).toFixed(2) + '%</td></tr>';
		});
		key += '<tr><td align="right">total:</td><td>' + out + '</td></tr>';
		key += '<tr><td align="right">other (planning, break):</td><td>' + (types.other || 0) + '</td></tr></table>';

		var cal = '<table class="calendar_table" cellpadding="1" cellspacing="0" border="1">\n', day = 0;
		for (var mi = 0; mi < 12; mi++) {
			var rows = 5;
			if ((MONTHS[mi] >= 30 && day % 7 === 6) || (MONTHS[mi] === 31 && day % 7 === 5)) rows++;
			cal += '<tr><td class="month_title">' + MONTH_NAME[mi] + '</td>';
			['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(function (w) { cal += '<td class="weekday_label">' + w + '</td>'; });
			cal += '<td class="after_month_title">' + MONTH_NAME[mi] + '</td></tr>\n';
			cal += '<tr><td rowspan="' + rows + '" valign="top">' + monthstuff[mi] + '</td>';
			for (var pre = 0; pre < day % 7; pre++) cal += '<td class="day_empty"></td>';
			for (var dom = 1; dom <= MONTHS[mi]; dom++) {
				cal += '<td class="' + (dayclass[mi][dom] || 'day') + '">' + dom + '</td>';
				if (day % 7 === 6) cal += '</tr>\n<tr>';
				day++;
			}
			if (day % 7 > 0) for (var post = day % 7; post < 7; post++) cal += '<td class="day_empty"></td>';
			cal += '</tr>\n';
		}
		cal += '</table>';

		document.getElementById('calendar').innerHTML = 'Key:' + key + '<br/>' + cal;
	}

	fetch('mapdata.xml')
		.then(function (r) { return r.text(); })
		.then(function (t) { render(new DOMParser().parseFromString(t, 'text/xml')); })
		.catch(function () { document.getElementById('calendar').textContent = 'Could not load calendar data.'; });
})();
