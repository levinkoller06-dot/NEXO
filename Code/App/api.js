// Same-origin API session. The key to the AI provider never enters this page.
window.NexoApi = (() => {
  let token = null, bootstrap = null;
  async function raw(route, options = {}) {
    const res = await fetch(route, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'X-Nexo-Token': token } : {}), ...options.headers } });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || 'Serverfehler ' + res.status), { status: res.status, stopped: data.stopped });
    return data;
  }
  function ready() {
    if (!bootstrap) bootstrap = raw('/api/session').then(data => { token = data.token; }).catch(err => { bootstrap = null; throw err; });
    return bootstrap;
  }
  return {
    ready,
    async get(route, options) { await ready(); return raw(route, options); },
    async post(route, body, options = {}) { await ready(); return raw(route, { ...options, method: 'POST', body: JSON.stringify(body) }); },
    async postBlob(route, body, options = {}) {
      await ready();
      const res = await fetch(route, { ...options, method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Nexo-Token': token } : {}), ...options.headers }, body: JSON.stringify(body) });
      if (!res.ok) {
        let data = {}; try { data = await res.json(); } catch {}
        throw Object.assign(new Error(data.error || 'Serverfehler ' + res.status), { status: res.status, stopped: data.stopped });
      }
      return res.blob();
    }
  };
})();
