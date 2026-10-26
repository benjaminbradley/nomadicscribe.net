// Map of destinations: Leaflet + OpenStreetMap tiles. Replaces the original Google Maps v2 code.
// Data comes from an XML file of <marker> elements (see mapdata.xml).
(function () {
	var ICONS = {
		friend: 'PlainPeople.gif',
		community: 'GingerbreadHouse.gif',
		camping: 'Tent.gif',
		motel: 'ParkPlace.gif'
	};
	var HOME_CENTER = [40, -95], HOME_ZOOM = 4;
	var TRACE_WAIT_MS = 2000;

	var map, routeLine, routeShown = false, tracing = false, traceLeg;
	var routePoints = [];

	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	// wiki pages are static files now: old index.php?title=X URLs map to ../wiki/X.html
	function wikiHref(u) {
		var m = /[?&]title=([^&]*)/.exec(u);
		if (!m) return u;
		var t = decodeURIComponent(m[1]).replace(/[^A-Za-z0-9._~-]/g, '_');
		return '../wiki/' + t + '.html';
	}

	function point(el) {
		var a = function (n) { return el.getAttribute(n); };
		return {
			lat: parseFloat(a('lat')), lng: parseFloat(a('lng')),
			name: a('name'), url: a('url'), wikiurl: a('wikiurl'),
			address1: a('address1'), address2: a('address2'),
			city: a('city'), state: a('state'), type: a('type'),
			startdate: a('startdate'), enddate: a('enddate'), hidden: a('hidden')
		};
	}

	function description(p) {
		var d = '<b>' + (p.url ? '<a href="' + esc(p.url) + '">' + esc(p.name) + '</a>' : esc(p.name)) + '</b>';
		if (p.wikiurl) d += ' (<a href="' + esc(wikiHref(p.wikiurl)) + '">wiki</a>)';
		if (p.startdate && p.enddate) d += '<br/><nobr>' + esc(p.startdate) + ' to ' + esc(p.enddate) + '</nobr>';
		if (p.address1) d += '<br/><nobr>' + esc(p.address1) + '</nobr>';
		if (p.address2) d += '<br/><nobr>' + esc(p.address2) + '</nobr>';
		if (p.city || p.state) d += '<br/><nobr>' + esc(p.city) + ', ' + esc(p.state) + '</nobr>';
		return d;
	}

	function icon(type) {
		if (!ICONS[type]) return new L.Icon.Default({ imagePath: '../vendor/leaflet/images/' });
		return L.icon({ iconUrl: ICONS[type], iconSize: [32, 32], iconAnchor: [16, 30], popupAnchor: [0, -28] });
	}

	function setDescription(text) {
		var el = document.getElementById('map_description');
		if (el) el.textContent = text;
	}

	function resetMap() {
		tracing = false;
		if (traceLeg) { map.removeLayer(traceLeg); traceLeg = null; }
		map.setView(HOME_CENTER, HOME_ZOOM);
		setDescription('');
	}

	function showRoute() {
		if (routeShown) return;
		routeLine.addTo(map);
		document.getElementById('routeToggleButton').value = 'Hide route';
		routeShown = true;
	}
	function hideRoute() {
		if (!routeShown) return;
		map.removeLayer(routeLine);
		document.getElementById('routeToggleButton').value = 'Show route';
		routeShown = false;
	}
	function toggleRoute() { routeShown ? hideRoute() : showRoute(); }

	function traceRoute(n) {
		if (typeof n === 'undefined') {
			tracing = true;
			map.setView(HOME_CENTER, HOME_ZOOM + 1);
			setTimeout(function () { traceRoute(0); }, 1000);
			return;
		}
		if (!tracing) return;
		if (n >= routePoints.length) { resetMap(); return; }
		var p = routePoints[n];
		if (n > 0) {
			if (traceLeg) map.removeLayer(traceLeg);
			var q = routePoints[n - 1];
			traceLeg = L.polyline([[q.lat, q.lng], [p.lat, p.lng]], { color: '#ff0000', weight: 4, opacity: 0.5 }).addTo(map);
		}
		map.setView([p.lat, p.lng], HOME_ZOOM + 1);
		setTimeout(function () {
			if (!tracing) return;
			setDescription(p.name + (p.startdate && p.enddate ? ' (' + p.startdate + ' to ' + p.enddate + ')' : ''));
			setTimeout(function () { traceRoute(n + 1); }, TRACE_WAIT_MS);
		}, 1000);
	}

	function itinerary(points) {
		var el = document.getElementById('itinerary');
		if (!el) return;
		var h = '<table cellpadding="0" cellspacing="4" border="0"><tr><th>Dates</th><th>Location</th><th>Destination</th></tr>';
		points.forEach(function (p) {
			var dates = p.startdate && p.enddate ? esc(p.startdate) + ' to ' + esc(p.enddate) + ': ' : '';
			h += '<tr><td>' + dates + '</td><td>' + esc(p.city) + ', ' + esc(p.state) + '</td><td>' + esc(p.name) + '</td></tr>';
		});
		el.innerHTML = h + '</table>';
	}

	function load(xml) {
		var els = xml.documentElement.getElementsByTagName('marker'), all = [];
		for (var i = 0; i < els.length; i++) {
			var p = point(els[i]);
			if (p.hidden === 'true' || !p.lat || !p.lng) continue;
			all.push(p);
			L.marker([p.lat, p.lng], { icon: icon(p.type) }).addTo(map).bindPopup(description(p));
		}
		routePoints = all.filter(function (p) { return p.startdate; })
			.sort(function (a, b) { return a.startdate < b.startdate ? -1 : a.startdate > b.startdate ? 1 : 0; });
		routeLine = L.polyline(routePoints.map(function (p) { return [p.lat, p.lng]; }), { color: '#0000ff', weight: 4, opacity: 0.25 });
		itinerary(routePoints);
	}

	window.setupMap = function (datafile) {
		map = L.map('map', { scrollWheelZoom: false }).setView(HOME_CENTER, HOME_ZOOM);
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
		fetch(datafile || 'mapdata.xml')
			.then(function (r) { return r.text(); })
			.then(function (t) { load(new DOMParser().parseFromString(t, 'text/xml')); })
			.catch(function () { setDescription('Could not load map data.'); });
	};
	window.toggleRoute = toggleRoute;
	window.traceRoute = function () { traceRoute(); };
	window.resetMap = resetMap;
})();
