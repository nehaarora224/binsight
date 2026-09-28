async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body;
}

// Phone photos can exceed the hosting platform's upload limit (4.5 MB on Vercel),
// so images are scaled to at most 1600 px and re-encoded as JPEG before upload.
const MAX_SIDE = 1600;
async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
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
  assess: async ({ file, pointId, location }) => {
    const form = new FormData();
    form.append('image', await shrinkImage(file));
    if (pointId) form.append('pointId', pointId);
    if (location?.lat != null) {
      form.append('lat', location.lat);
      form.append('lng', location.lng);
      form.append('accuracy', location.accuracy);
    }
    return request('/assessments', { method: 'POST', body: form });
  },
};
