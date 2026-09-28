async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body;
}

const post = (path, json) => request(path, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(json ?? {}),
});

export const api = {
  dashboard: () => request('/dashboard'),
  route: () => request('/route'),
  reports: () => request('/reports'),
  startRoute: () => post('/route/start'),
  endRoute: () => post('/route/end'),
  submitReport: assessmentId => post('/reports', { assessmentId }),
  assess: ({ file, pointId, location }) => {
    const form = new FormData();
    form.append('image', file);
    if (pointId) form.append('pointId', pointId);
    if (location?.lat != null) {
      form.append('lat', location.lat);
      form.append('lng', location.lng);
      form.append('accuracy', location.accuracy);
    }
    return request('/assessments', { method: 'POST', body: form });
  },
};
