// DNS Shield — Painel (frontend sem build; vanilla JS).
// Fala com a API NestJS. A base da API pode ser injetada via window.DNS_SHIELD_API
// (ver config.js), caindo para localhost:3000 no desenvolvimento.

const API_BASE =
  (typeof window !== 'undefined' && window.DNS_SHIELD_API) ||
  'http://localhost:3000/api';

const $ = (id) => document.getElementById(id);

const PROFILE_CLASS = {
  'workstation-pc': 'pc',
  'endpoint-apple': 'pc',
  'iot-camera': 'iot',
  'iot-generic': 'iot',
  printer: 'printer',
  'gateway/router': 'gw',
};

function pill(classification) {
  const cls = PROFILE_CLASS[classification] || 'unknown';
  return `<span class="pill ${cls}">${classification || 'desconhecido'}</span>`;
}

async function api(path, tenant) {
  const headers = {};
  if (tenant) headers['X-Tenant-Id'] = tenant;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

async function loadHealth() {
  try {
    const h = await api('/health');
    $('gw-status').textContent = 'Online';
    $('gw-status').className = 'big ok';
    $('gw-detail').textContent = `${h.service} respondendo`;
    $('api-indicator').textContent = `API: ${API_BASE}`;
  } catch (e) {
    $('gw-status').textContent = 'Offline';
    $('gw-status').className = 'big danger';
    $('gw-detail').textContent = 'backend inacessível';
    $('api-indicator').textContent = `API: ${API_BASE} (erro)`;
  }
}

async function loadTopology(tenant) {
  const body = $('devices-body');
  try {
    const history = await api('/topology', tenant);
    const latest = Array.isArray(history) && history.length ? history[0] : null;
    if (!latest) {
      body.innerHTML =
        '<tr><td colspan="6" class="muted center">Nenhuma varredura encontrada.</td></tr>';
      return;
    }
    const devices = latest.devices || [];
    $('device-count').textContent = devices.length;
    $('scan-time').textContent = latest.cidr
      ? `rede ${latest.cidr}`
      : 'varredura concluída';

    const iot = devices.filter((d) =>
      String(d.classification || '').startsWith('iot'),
    );
    $('iot-count').textContent = iot.length;

    const profiles = new Set(devices.map((d) => d.classification));
    $('profile-badge').textContent = `${profiles.size} perfis`;

    body.innerHTML = devices
      .map(
        (d) => `
      <tr>
        <td>${d.hostname || '—'}</td>
        <td>${d.ip}</td>
        <td>${d.mac || '—'}</td>
        <td>${d.vendor_hint || '—'}</td>
        <td>${pill(d.classification)}</td>
        <td>${(d.open_ports || []).join(', ') || '—'}</td>
      </tr>`,
      )
      .join('');
  } catch (e) {
    body.innerHTML = `<tr><td colspan="6" class="muted center">Erro ao carregar: ${e.message}</td></tr>`;
    $('device-count').textContent = '0';
    $('iot-count').textContent = '0';
  }
}

async function loadReport(tenant) {
  const area = $('report-area');
  try {
    const r = await api('/reports/latest', tenant);
    if (!r) {
      area.innerHTML =
        '<span class="muted">Sem relatório disponível ainda.</span>';
      return;
    }
    area.innerHTML = `
      <div class="report-grid">
        <div class="metric"><div class="label">Consultas</div><div class="value">${r.totalQueries ?? '—'}</div></div>
        <div class="metric"><div class="label">Bloqueadas</div><div class="value danger">${r.blockedQueries ?? '—'}</div></div>
        <div class="metric"><div class="label">Taxa de bloqueio</div><div class="value">${r.blockRatePct ?? '—'}%</div></div>
      </div>`;
  } catch (e) {
    area.innerHTML = `<span class="muted">Relatório indisponível (${e.message}).</span>`;
  }
}

async function loadGatewayPlan(tenant) {
  // O IP sugerido vem no retorno do ingest; aqui recomputamos a partir
  // da última topologia para exibir algo útil sem estado extra.
  try {
    const history = await api('/topology', tenant);
    const latest = Array.isArray(history) && history.length ? history[0] : null;
    if (latest && latest.gateway) {
      // Mostra o próximo IP livre simples (gateway .1 -> sugere .2+).
      const base = latest.gateway.split('.').slice(0, 3).join('.');
      const used = new Set((latest.devices || []).map((d) => d.ip));
      let suggestion = '—';
      for (let h = 2; h < 254; h++) {
        const cand = `${base}.${h}`;
        if (!used.has(cand)) { suggestion = cand; break; }
      }
      $('gateway-ip').textContent = suggestion;
    }
  } catch { /* silencioso */ }
}

async function refreshAll() {
  const tenant = $('tenant').value.trim() || 'clinica-demo';
  await loadHealth();
  await Promise.all([
    loadTopology(tenant),
    loadReport(tenant),
    loadGatewayPlan(tenant),
  ]);
}

$('refresh').addEventListener('click', refreshAll);
$('tenant').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') refreshAll();
});

refreshAll();
// Auto-refresh a cada 15s para dar sensação de "ao vivo" na demo.
setInterval(refreshAll, 15000);
