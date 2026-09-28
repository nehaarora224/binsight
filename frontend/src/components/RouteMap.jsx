import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STOP_STYLE, stopState } from '../data.js';

export default function RouteMap({ route, points }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  // The map is created once; route/point changes are drawn by the effect below.
  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: false }).setView(route.center, route.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    const group = layer.current;
    group.clearLayers();

    // Route line: a leg between two completed points is solid green, every other leg dashed navy.
    const done = [], remaining = [];
    points.slice(1).forEach((p, i) => {
      const a = points[i];
      (a.status === 'done' && p.status === 'done' ? done : remaining).push([[a.lat, a.lng], [p.lat, p.lng]]);
    });
    if (remaining.length) L.polyline(remaining, { color: '#2C4A6E', weight: 3.5, dashArray: '8 6', lineJoin: 'round', interactive: false }).addTo(group);
    if (done.length) L.polyline(done, { color: '#1E6B3A', weight: 4, lineJoin: 'round', interactive: false }).addTo(group);

    points.forEach(p => {
      const state = stopState(p);
      const size = state === 'high' ? 34 : 28;
      const n = String(p.seq).padStart(2, '0');
      L.marker([p.lat, p.lng], {
        keyboard: false,
        title: `Collection Point ${n}`,
        icon: L.divIcon({
          className: '',
          iconSize: [size, size],
          html: `<div class="marker" style="background:${STOP_STYLE[state].marker}">${n}</div>`,
        }),
      }).addTo(group);
    });
  }, [points]);

  return <div ref={el} className="map" />;
}
