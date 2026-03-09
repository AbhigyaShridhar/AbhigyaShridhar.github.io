/* =====================================================
   dev.portfolio — script.js
   Real project data edition
   ===================================================== */

'use strict';

/* ─── SVG DIAGRAM ENGINE ────────────────────────────── */

const NODE_COLORS = {
  client:   { fill: '#1a1040', stroke: '#6366f1', text: '#a5b4fc' },
  gateway:  { fill: '#071d26', stroke: '#22d3ee', text: '#67e8f9' },
  service:  { fill: '#1a0d35', stroke: '#a855f7', text: '#d8b4fe' },
  db:       { fill: '#031a10', stroke: '#10b981', text: '#6ee7b7' },
  queue:    { fill: '#1f1200', stroke: '#f59e0b', text: '#fcd34d' },
  cache:    { fill: '#260a1e', stroke: '#ec4899', text: '#f9a8d4' },
  monitor:  { fill: '#0c1520', stroke: '#64748b', text: '#94a3b8' },
  ml:       { fill: '#1e0e00', stroke: '#f97316', text: '#fdba74' },
  decision: { fill: '#1a1200', stroke: '#eab308', text: '#fde047' },
  external: { fill: '#1f0808', stroke: '#ef4444', text: '#fca5a5' },
  state:    { fill: '#041a14', stroke: '#059669', text: '#34d399' },
};

const EDGE_COLORS = {
  default: '#475569',
  accent:  '#6366f1',
  cyan:    '#22d3ee',
  green:   '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  purple:  '#a855f7',
  monitor: '#64748b',
};

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function createSvgDiagram(container, nodes, edges) {
  container.innerHTML = '';

  // Auto-size every node so label text always fits.
  // Monospace approximations: title line ~6.6px/char @ size 11, body ~6.1px/char @ size 10.
  const CW_TITLE = 6.6, CW_BODY = 6.1, LINE_H = 14, PAD_X = 26, PAD_Y = 20;
  for (const n of nodes) {
    const lines = n.label.split('\n');
    let minW = 0;
    lines.forEach((line, i) => {
      minW = Math.max(minW, line.length * (i === 0 ? CW_TITLE : CW_BODY) + PAD_X);
    });
    const minH = lines.length * LINE_H + PAD_Y;
    n.w = Math.max(n.w || 170, Math.ceil(minW));
    n.h = Math.max(n.h || 60, Math.ceil(minH));
  }

  let maxX = 0, maxY = 0;
  for (const n of nodes) {
    maxX = Math.max(maxX, n.x + n.w + 20);
    maxY = Math.max(maxY, n.y + n.h + 20);
  }
  const svgW = Math.max(maxX + 40, 800);
  const svgH = Math.max(maxY + 40, 500);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;height:100%;overflow:hidden;cursor:grab;user-select:none;position:relative;';
  container.appendChild(wrap);

  const svg = svgEl('svg', {
    viewBox: `0 0 ${svgW} ${svgH}`,
    style: `width:${svgW}px;height:${svgH}px;display:block;transform-origin:0 0;`,
  });

  const defs = svgEl('defs');
  for (const [name, color] of Object.entries(EDGE_COLORS)) {
    const marker = svgEl('marker', {
      id: `arrow-${name}`, viewBox: '0 0 10 10',
      refX: '9', refY: '5', markerWidth: '6', markerHeight: '6',
      orient: 'auto-start-reverse',
    });
    marker.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 Z', fill: color }));
    defs.appendChild(marker);
  }
  svg.appendChild(defs);

  const g = svgEl('g');
  svg.appendChild(g);

  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  for (const edge of edges) {
    const from = nodeMap[edge.from];
    const to = nodeMap[edge.to];
    if (!from || !to) continue;

    const fw = from.w || 170, fh = from.h || 60;
    const tw = to.w || 170, th = to.h || 60;
    const fx = from.x + fw / 2, fy = from.y + fh / 2;
    const tx = to.x + tw / 2, ty = to.y + th / 2;
    const dx = tx - fx, dy = ty - fy;

    let x1, y1, x2, y2;
    if (edge.fromPort) {
      switch (edge.fromPort) {
        case 'right':  x1 = from.x + fw; y1 = from.y + fh / 2; break;
        case 'left':   x1 = from.x;      y1 = from.y + fh / 2; break;
        case 'bottom': x1 = from.x + fw / 2; y1 = from.y + fh; break;
        case 'top':    x1 = from.x + fw / 2; y1 = from.y;      break;
        default:       x1 = fx; y1 = fy;
      }
    } else if (Math.abs(dx) > Math.abs(dy)) {
      x1 = dx > 0 ? from.x + fw : from.x; y1 = from.y + fh / 2;
    } else {
      x1 = from.x + fw / 2; y1 = dy > 0 ? from.y + fh : from.y;
    }

    if (edge.toPort) {
      switch (edge.toPort) {
        case 'left':   x2 = to.x;       y2 = to.y + th / 2; break;
        case 'right':  x2 = to.x + tw;  y2 = to.y + th / 2; break;
        case 'top':    x2 = to.x + tw / 2; y2 = to.y;       break;
        case 'bottom': x2 = to.x + tw / 2; y2 = to.y + th;  break;
        default:       x2 = tx; y2 = ty;
      }
    } else if (Math.abs(dx) > Math.abs(dy)) {
      x2 = dx > 0 ? to.x : to.x + tw; y2 = to.y + th / 2;
    } else {
      x2 = to.x + tw / 2; y2 = dy > 0 ? to.y : to.y + th;
    }

    const cdx = Math.abs(x2 - x1) * 0.5;
    const cdy = Math.abs(y2 - y1) * 0.5;
    let cx1, cy1, cx2, cy2;
    if (Math.abs(dx) > Math.abs(dy)) {
      cx1 = x1 + (dx > 0 ? cdx : -cdx); cy1 = y1;
      cx2 = x2 - (dx > 0 ? cdx : -cdx); cy2 = y2;
    } else {
      cx1 = x1; cy1 = y1 + (dy > 0 ? cdy : -cdy);
      cx2 = x2; cy2 = y2 - (dy > 0 ? cdy : -cdy);
    }

    const colorName = edge.color || 'default';
    const color = EDGE_COLORS[colorName] || EDGE_COLORS.default;

    g.appendChild(svgEl('path', {
      d: `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`,
      fill: 'none', stroke: color,
      'stroke-width': edge.width || 1.5,
      'stroke-dasharray': edge.dashed ? '6,3' : 'none',
      'marker-end': `url(#arrow-${colorName})`,
      opacity: 0.8,
    }));

    if (edge.label) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 5;
      const lw = edge.label.length * 6.2 + 12;
      g.appendChild(svgEl('rect', {
        x: midX - lw / 2, y: midY - 10,
        width: lw, height: 16, rx: 3,
        fill: '#0d1117', opacity: 0.9,
      }));
      const lt = svgEl('text', {
        x: midX, y: midY + 3,
        fill: color, 'font-size': '9.5',
        'font-family': 'monospace', 'text-anchor': 'middle',
      });
      lt.textContent = edge.label;
      g.appendChild(lt);
    }
  }

  for (const n of nodes) {
    const w = n.w || 170, h = n.h || 60;
    const colors = NODE_COLORS[n.type] || NODE_COLORS.service;
    const ng = svgEl('g');

    ng.appendChild(svgEl('rect', {
      x: n.x, y: n.y, width: w, height: h,
      rx: 8, ry: 8,
      fill: colors.fill, stroke: colors.stroke, 'stroke-width': 1.5,
    }));
    ng.appendChild(svgEl('rect', {
      x: n.x + 1, y: n.y + 1, width: w - 2, height: 3,
      rx: 7, ry: 7, fill: colors.stroke, opacity: 0.7,
    }));

    const lines = n.label.split('\n');
    const lh = 14;
    const startY = n.y + h / 2 - (lines.length * lh) / 2 + lh - 1;
    lines.forEach((line, i) => {
      const t = svgEl('text', {
        x: n.x + w / 2, y: startY + i * lh,
        fill: i === 0 ? colors.text : '#94a3b8',
        'font-size': i === 0 ? '11' : '10',
        'font-family': 'monospace',
        'font-weight': i === 0 ? '600' : '400',
        'text-anchor': 'middle',
      });
      t.textContent = line;
      ng.appendChild(t);
    });
    g.appendChild(ng);
  }

  wrap.appendChild(svg);

  let isPanning = false, startX = 0, startY = 0, ox = 0, oy = 0, scale = 1;
  const applyT = () => { svg.style.transform = `translate(${ox}px,${oy}px) scale(${scale})`; };

  wrap.addEventListener('mousedown', e => {
    isPanning = true; startX = e.clientX - ox; startY = e.clientY - oy;
    wrap.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    ox = e.clientX - startX; oy = e.clientY - startY; applyT();
  });
  window.addEventListener('mouseup', () => { isPanning = false; wrap.style.cursor = 'grab'; });
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    scale = Math.max(0.25, Math.min(4, scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    applyT();
  }, { passive: false });
}

/* ─── DIAGRAM BUILDERS ───────────────────────────────── */

function buildSpinnyDbDiagram(container) {
  const nodes = [
    { id: 'app',     type: 'client',   label: 'Django Application\nHTTP requests · GraphQL · REST',          x: 290, y: 20,  w: 255, h: 55 },
    { id: 'ctx',     type: 'service',  label: 'Request Context Middleware\nthread-local · per-request state injection', x: 160, y: 110, w: 330, h: 55 },
    { id: 'env',     type: 'monitor',  label: 'Env-Based Replica Config\nDB_REPLICAS → DATABASES{}',   x: 545, y: 110, w: 265, h: 55 },
    { id: 'router',  type: 'gateway',  label: 'Read / Write Router\nDATABASE_ROUTERS · HTTP method + app label',  x: 160, y: 200, w: 330, h: 55 },
    { id: 'read',    type: 'service',  label: 'Read Path\nGET + gqlread header → replicas',          x: 20,  y: 305, w: 190, h: 55 },
    { id: 'rel',     type: 'decision', label: 'Relation Guard\nallow_relation() hook',                x: 240, y: 305, w: 185, h: 55 },
    { id: 'write',   type: 'service',  label: 'Write Path\nPOST · PUT · DELETE → primary',           x: 455, y: 305, w: 195, h: 55 },
    { id: 'appiso',  type: 'decision', label: 'App Isolation\npayments label check',                  x: 20,  y: 410, w: 175, h: 55 },
    { id: 'lb',      type: 'gateway',  label: 'Replica Load Balancer\nrandom selection across pool',  x: 215, y: 410, w: 215, h: 55 },
    { id: 'primary', type: 'db',       label: 'Primary MySQL\nwrites · non-GET reads',                x: 460, y: 410, w: 185, h: 55 },
    { id: 'paymdb',  type: 'db',       label: 'Payments MySQL\nDedicated isolated DB',                x: 10,  y: 520, w: 185, h: 55 },
    { id: 'r0',      type: 'db',       label: 'Read Replica 0\nMySQL',                                x: 205, y: 520, w: 145, h: 55 },
    { id: 'r1',      type: 'db',       label: 'Read Replica 1\nMySQL',                                x: 365, y: 520, w: 145, h: 55 },
    { id: 'rN',      type: 'db',       label: 'Read Replica N\nenv-driven · zero code change',        x: 525, y: 520, w: 175, h: 55 },
    { id: 'bug',     type: 'monitor',  label: 'Django #35974 Workaround\nRelatedManager bypasses router\nallow_relation() — patch upstream', x: 695, y: 280, w: 230, h: 70 },
  ];
  const edges = [
    { from: 'app',    to: 'ctx',     color: 'accent',  label: 'every request' },
    { from: 'ctx',    to: 'router',  color: 'accent',  label: 'request context set' },
    { from: 'env',    to: 'router',  color: 'monitor', dashed: true, label: 'replica list' },
    { from: 'router', to: 'read',   color: 'cyan',    label: 'reads' },
    { from: 'router', to: 'rel',    color: 'amber',   label: 'FK / M2M' },
    { from: 'router', to: 'write',  color: 'green',   label: 'writes' },
    { from: 'read',   to: 'appiso', color: 'cyan' },
    { from: 'read',   to: 'lb',     color: 'cyan' },
    { from: 'appiso', to: 'paymdb', color: 'green',   label: 'payments app' },
    { from: 'lb',     to: 'r0',     color: 'cyan' },
    { from: 'lb',     to: 'r1',     color: 'cyan',    dashed: true },
    { from: 'lb',     to: 'rN',     color: 'cyan',    dashed: true },
    { from: 'write',  to: 'primary',color: 'green',   label: 'always primary' },
    { from: 'read',   to: 'primary',color: 'amber',   label: 'mutation context' },
    { from: 'rel',    to: 'bug',    color: 'amber',   dashed: true, label: 'patched' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildPaymentGatewayDiagram(container) {
  const nodes = [
    { id: 'client',  type: 'client',   label: 'Client App\nPayment · Refund request',                     x: 20,  y: 20,  w: 195, h: 55 },
    { id: 'wh_src',  type: 'client',   label: 'Payment Provider\nWebhook POST',                           x: 820, y: 20,  w: 185, h: 55 },
    { id: 'api',     type: 'service',  label: 'API Validation Layer\nDRF · client config · refundability', x: 20,  y: 110, w: 265, h: 55 },
    { id: 'wh_auth', type: 'service',  label: 'Webhook Verification\nsignature check · duplicate guard',   x: 680, y: 110, w: 255, h: 55 },
    { id: 'asym',   type: 'service',  label: 'Asymmetric Auth Layer\npublic key verification · signature check', x: 680, y: 185, w: 255, h: 55 },
    { id: 'sm',      type: 'gateway',  label: 'State Machine Engine\nformal FSM · atomic multi-model updates\n2 models per transition', x: 220, y: 195, w: 370, h: 65 },
    { id: 'waiting', type: 'state',    label: 'Waiting\ncreate contract · init order',    x: 20,  y: 330, w: 165, h: 55 },
    { id: 'pending', type: 'state',    label: 'Pending\nwebhook received · log',          x: 205, y: 330, w: 165, h: 55 },
    { id: 'success', type: 'state',    label: 'Success\nfetch payment method · notify',   x: 390, y: 330, w: 175, h: 55 },
    { id: 'failed',  type: 'state',    label: 'Failed\nnotify · update records',          x: 585, y: 330, w: 155, h: 55 },
    { id: 'expired', type: 'state',    label: 'Expired\nupdate link · notify',            x: 760, y: 330, w: 155, h: 55 },
    { id: 'refund',  type: 'state',    label: 'Refund\ncreate breakdown · initiate\nallocate · log response', x: 390, y: 450, w: 195, h: 70 },
    { id: 'provabs', type: 'service',  label: 'Provider Abstraction Layer\ndynamic importlib · per-provider class', x: 20, y: 460, w: 270, h: 55 },
    { id: 'entrypts',type: 'service',  label: 'Payment Entry Points\nQR generation · UPI deep link\nhosted payment page', x: 460, y: 570, w: 185, h: 70 },
    { id: 'gw_a',    type: 'external', label: 'Order-based Gateway\norders · payment links · refund',  x: 20,  y: 570, w: 195, h: 55 },
    { id: 'gw_b',    type: 'external', label: 'Bank Gateway\nQR · collect flow · encrypted refund',   x: 230, y: 570, w: 195, h: 55 },
    { id: 'db',      type: 'db',       label: 'Payments MySQL\nAtomic state write · 2 models', x: 660, y: 460, w: 215, h: 55 },
    { id: 'kafka',   type: 'queue',    label: 'Kafka\nAsync refund retry event',          x: 660, y: 570, w: 175, h: 55 },
    { id: 'nifi',    type: 'monitor',  label: 'NiFi Consumer\nRefund status poll · retry', x: 860, y: 570, w: 185, h: 55 },
  ];
  const edges = [
    { from: 'client',  to: 'api',     color: 'accent' },
    { from: 'wh_src',  to: 'wh_auth', color: 'cyan' },
    { from: 'api',     to: 'sm',      color: 'accent',  label: 'trigger transition' },
    { from: 'wh_auth', to: 'asym',   color: 'cyan',    label: 'verify signature' },
    { from: 'wh_auth', to: 'sm',     color: 'green',   label: 'standard → state change' },
    { from: 'asym',    to: 'sm',     color: 'cyan',    label: 'verified → state change' },
    { from: 'sm',      to: 'waiting', color: 'green',   label: 'init' },
    { from: 'waiting', to: 'pending', color: 'accent',  label: 'webhook' },
    { from: 'pending', to: 'success', color: 'green',   label: 'captured' },
    { from: 'pending', to: 'failed',  color: 'red',     label: 'failed' },
    { from: 'pending', to: 'expired', color: 'amber',   label: 'expired' },
    { from: 'success', to: 'refund',  color: 'purple',  label: 'refund request' },
    { from: 'sm',      to: 'provabs', color: 'cyan',    label: 'create order / refund' },
    { from: 'provabs', to: 'gw_a',     color: 'red' },
    { from: 'provabs', to: 'gw_b',     color: 'amber' },
    { from: 'provabs', to: 'entrypts', color: 'purple', label: 'generate' },
    { from: 'sm',      to: 'db',      color: 'green',   label: 'atomic state write' },
    { from: 'refund',  to: 'kafka',   color: 'amber',   dashed: true, label: 'timeout' },
    { from: 'kafka',   to: 'nifi',    color: 'amber',   label: 'consume' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildCeleryConsumerDiagram(container) {
  const nodes = [
    { id: 'q1',      type: 'queue',   label: 'AWS SQS Queue 1',                                         x: 20,  y: 20,  w: 155, h: 50 },
    { id: 'q2',      type: 'queue',   label: 'AWS SQS Queue 2',                                         x: 190, y: 20,  w: 155, h: 50 },
    { id: 'qN',      type: 'queue',   label: 'AWS SQS Queue N',                                         x: 360, y: 20,  w: 155, h: 50 },
    { id: 'cli',     type: 'client',  label: 'CLI Worker\n--queues · --concurrency · --region',          x: 560, y: 20,  w: 245, h: 55 },
    { id: 'outer',   type: 'service', label: 'Outer Thread Pool\n1 thread per queue · parallel polling', x: 100, y: 115, w: 305, h: 55 },
    { id: 'django',  type: 'db',      label: 'Django Setup (optional)\ndynamic settings · ORM available', x: 540, y: 115, w: 260, h: 55 },
    { id: 'decoder', type: 'service', label: 'Message Decoder\nBase64 → JSON · task name + args repr',  x: 100, y: 210, w: 305, h: 55 },
    { id: 'parser',  type: 'ml',      label: 'Safe Arg Parser\nAST literal_eval · datetime preprocessing\nrestricted eval fallback (no builtins)', x: 100, y: 310, w: 290, h: 70 },
    { id: 'sentry',  type: 'monitor', label: 'Error Observability\nSentry · task + queue context\npoison pill prevention', x: 450, y: 315, w: 235, h: 65 },
    { id: 'inner',   type: 'service', label: 'Inner Thread Pool\nper-queue concurrency · as_completed()', x: 100, y: 435, w: 305, h: 55 },
    { id: 'loader',  type: 'service', label: 'Dynamic Task Loader\nimportlib · module.function(args)',    x: 100, y: 535, w: 265, h: 55 },
    { id: 'ack',     type: 'monitor', label: 'Bulk ACK\ndelete_message_batch on success',                x: 430, y: 535, w: 210, h: 55 },
    { id: 'requeue', type: 'external',label: 'Re-enqueue on Failure\ndelete + resend for retry',         x: 430, y: 440, w: 215, h: 50 },
  ];
  const edges = [
    { from: 'q1',     to: 'outer',   color: 'amber' },
    { from: 'q2',     to: 'outer',   color: 'amber' },
    { from: 'qN',     to: 'outer',   color: 'amber' },
    { from: 'cli',    to: 'outer',   color: 'accent',  label: 'spawns queue threads' },
    { from: 'cli',    to: 'django',  color: 'purple',  dashed: true, label: '--settings flag' },
    { from: 'outer',  to: 'decoder', color: 'accent',  label: 'messages[]' },
    { from: 'decoder',to: 'parser',  color: 'amber',   label: 'args repr string' },
    { from: 'parser', to: 'sentry',  color: 'red',     dashed: true, label: 'parse failure' },
    { from: 'parser', to: 'inner',   color: 'green',   label: 'parsed executables' },
    { from: 'inner',  to: 'loader',  color: 'green',   label: 'submit per task' },
    { from: 'inner',  to: 'requeue', color: 'red',     label: 'exception' },
    { from: 'loader', to: 'ack',     color: 'green',   label: 'success → batch ACK' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildAuditDiagram(container) {
  const nodes = [
    { id: 'reg',     type: 'gateway',  label: 'Model Registry\ndeclarative opt-in · field config · snapshot flags', x: 20,  y: 20,  w: 285, h: 55 },
    { id: 'ctx_mid', type: 'service',  label: 'Request Middleware\ncontextvars (async-safe)\nview class source attribution',  x: 360, y: 20,  w: 265, h: 70 },
    { id: 'load',    type: 'service',  label: 'ORM Load\nModel.objects.get / filter()',                   x: 20,  y: 150, w: 215, h: 50 },
    { id: 'pi',      type: 'monitor',  label: 'post_init Signal\nCapture Initial Snapshot\nstored on instance in-memory', x: 285, y: 145, w: 265, h: 65 },
    { id: 'save',    type: 'service',  label: 'instance.save()\nupdate_fields[] supported',               x: 20,  y: 275, w: 215, h: 50 },
    { id: 'ps',      type: 'monitor',  label: 'pre_save Signal\nCopy Snapshot → Old Values\nfallback: DB fetch if no snapshot', x: 285, y: 265, w: 265, h: 70 },
    { id: 'pos',     type: 'monitor',  label: 'post_save Signal\nField Diff (old vs new)\nrespect update_fields intersection\nbulk_create AuditLog entries', x: 285, y: 395, w: 265, h: 80 },
    { id: 'bulk',    type: 'service',  label: 'Bulk Update Path\nqueryset.update()\nbypasses Django signals', x: 20,  y: 410, w: 230, h: 65 },
    { id: 'sig',     type: 'decision', label: 'Custom Signal\npost_bulk_update\nold_values sanitized for Celery', x: 20,  y: 540, w: 235, h: 65 },
    { id: 'celery',  type: 'queue',    label: 'Celery Async Task\nnon-blocking · JSON-safe payload',        x: 310, y: 545, w: 215, h: 55 },
    { id: 'alog',    type: 'db',       label: 'Audit Log (MySQL)\nobject · field · old → new value\nsource · timestamp',  x: 600, y: 370, w: 240, h: 70 },
    { id: 'idx',     type: 'monitor',  label: 'Composite DB Indexes\n(object_id, content_type)\n(content_type, field_name)\n(changed_at)',  x: 600, y: 175, w: 230, h: 80 },
  ];
  const edges = [
    { from: 'reg',   to: 'pi',      color: 'accent',  label: 'audited fields config' },
    { from: 'ctx_mid',to: 'alog',   color: 'purple',  dashed: true, label: 'source attribution' },
    { from: 'load',  to: 'pi',      color: 'cyan' },
    { from: 'pi',    to: 'ps',      color: 'amber',   label: 'initial snapshot' },
    { from: 'save',  to: 'ps',      color: 'accent' },
    { from: 'ps',    to: 'pos',     color: 'accent',  label: 'old values captured' },
    { from: 'pos',   to: 'alog',    color: 'green',   label: 'bulk_create' },
    { from: 'bulk',  to: 'sig',     color: 'amber' },
    { from: 'sig',   to: 'celery',  color: 'amber',   label: '.delay()' },
    { from: 'celery',to: 'alog',    color: 'green',   label: 'async write' },
    { from: 'alog',  to: 'idx',     color: 'green',   label: 'indexed' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildEmployeeAccessDiagram(container) {
  const nodes = [
    { id: 'plat',    type: 'gateway',  label: 'Platform Registry\nSSO · Dev Tools · Productivity\nBI · VPN · Communication', x: 20,  y: 20,  w: 265, h: 70 },
    { id: 'hr',      type: 'db',       label: 'HR Master\nemployee_code · department\nbusiness_unit · employment_status', x: 420, y: 20,  w: 255, h: 70 },
    { id: 'admin',   type: 'client',   label: 'Admin\nWeb UI · API trigger',                              x: 730, y: 20,  w: 180, h: 55 },
    { id: 'task',    type: 'queue',    label: 'Celery Background Task\nmonitored · per-platform',         x: 650, y: 140, w: 255, h: 60 },
    { id: 'driver',  type: 'service',  label: 'Vendor Driver Layer\nimportlib · Driver.getVendorData()\n{email: [status...]} interface', x: 300, y: 155, w: 275, h: 70 },
    { id: 'sso',     type: 'external', label: 'Identity Provider\nSSO ID · status · username',            x: 20,  y: 290, w: 185, h: 60 },
    { id: 'devtools',type: 'external', label: 'Dev & Project Tools\nlast_login · access status',          x: 220, y: 290, w: 175, h: 60 },
    { id: 'prodplat',type: 'external', label: 'Productivity & Data Platforms\nemail · role · access',     x: 410, y: 290, w: 210, h: 60 },
    { id: 'sync',    type: 'service',  label: 'Sync Engine\ncurList vs vendorData diff\nUpdate · Create · Deactivate\nnotify POC on complete', x: 650, y: 270, w: 245, h: 85 },
    { id: 'empdb',   type: 'db',       label: 'Employee DB\nplatform · user FK (HR)\ntype · SSO ID · active · deleted', x: 650, y: 415, w: 245, h: 70 },
    { id: 'audit',   type: 'service',  label: 'Role Audit Engine\ncross-check identity vs expected roles', x: 20,  y: 430, w: 245, h: 55 },
    { id: 'anomaly', type: 'decision', label: 'Anomaly Detector\nMissing (M) · To-be-Removed (TR)',       x: 20,  y: 545, w: 235, h: 55 },
    { id: 'action',  type: 'service',  label: 'Remediation Actions\nTO BE ADDED / TO BE DELETED\nauto or manual · tracked',  x: 295, y: 545, w: 255, h: 65 },
    { id: 'stats',   type: 'monitor',  label: 'Reporting & Statistics\nrole · category · department\ndashboard metrics',    x: 620, y: 540, w: 225, h: 65 },
  ];
  const edges = [
    { from: 'admin',    to: 'task',     color: 'amber',   label: 'trigger sync' },
    { from: 'task',     to: 'driver',   color: 'amber',   label: 'per-platform' },
    { from: 'plat',     to: 'driver',   color: 'purple',  label: 'vendor key' },
    { from: 'driver',   to: 'sso',      color: 'red' },
    { from: 'driver',   to: 'devtools', color: 'red' },
    { from: 'driver',   to: 'prodplat', color: 'red' },
    { from: 'driver',   to: 'sync',     color: 'green',   label: 'vendor data map' },
    { from: 'hr',       to: 'sync',     color: 'cyan',    label: 'HR source of truth' },
    { from: 'sync',     to: 'empdb',    color: 'green',   label: 'update/create/deactivate' },
    { from: 'admin',    to: 'audit',    color: 'purple',  label: 'trigger audit' },
    { from: 'empdb',    to: 'audit',    color: 'purple',  dashed: true },
    { from: 'audit',    to: 'anomaly',  color: 'red',     label: 'detect' },
    { from: 'anomaly',  to: 'action',   color: 'red',     label: 'create action' },
    { from: 'audit',    to: 'stats',    color: 'green',   label: 'aggregate' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildCodecoverageCliDiagram(container) {
  const nodes = [
    { id: 'cli',    type: 'client',   label: 'codecoverage-cli\nPyPI · pip install · MIT',               x: 280, y: 20,  w: 255, h: 55 },
    { id: 'gen',    type: 'service',  label: 'generate\nall · dir · file · function',                    x: 20,  y: 115, w: 180, h: 55 },
    { id: 'diff',   type: 'service',  label: 'diff-test\nworking · last-commit · since hash',             x: 215, y: 115, w: 195, h: 55 },
    { id: 'doc',    type: 'service',  label: 'document\nFLOWS.md · SUMMARY.md',                          x: 425, y: 115, w: 175, h: 55 },
    { id: 'serve',  type: 'service',  label: 'serve\nSwagger UI · OpenAPI',                               x: 615, y: 115, w: 155, h: 55 },
    { id: 'git',    type: 'monitor',  label: 'Git Integration\ngit diff → changed function names',        x: 700, y: 210, w: 205, h: 55 },
    { id: 'ast',    type: 'ml',       label: 'AST Static Analyser\nno runtime imports · pure analysis\nsignatures · docstrings · type hints', x: 175, y: 215, w: 270, h: 70 },
    { id: 'style',  type: 'monitor',  label: 'Style Learner\nexisting test patterns\nnaming · fixtures · imports', x: 500, y: 215, w: 225, h: 70 },
    { id: 'lg',     type: 'gateway',  label: 'LangGraph Orchestrator\ngenerate → validate → retry\none LLM call per function', x: 245, y: 355, w: 295, h: 65 },
    { id: 'claude', type: 'external', label: 'Anthropic Claude\nclaude-sonnet-4-6',                       x: 55,  y: 490, w: 185, h: 55 },
    { id: 'openai', type: 'external', label: 'OpenAI GPT-4o',                                             x: 255, y: 490, w: 150, h: 55 },
    { id: 'cursor', type: 'external', label: 'Cursor IDE',                                                x: 420, y: 490, w: 130, h: 55 },
    { id: 'tests',  type: 'db',       label: 'Generated Tests\nstyle-matched · AST-validated Python',      x: 75,  y: 600, w: 265, h: 60 },
    { id: 'docs',   type: 'db',       label: 'Generated Docs\nFLOWS.md · SUMMARY.md',                    x: 590, y: 360, w: 200, h: 55 },
  ];
  const edges = [
    { from: 'cli',   to: 'gen',    color: 'accent' },
    { from: 'cli',   to: 'diff',   color: 'accent' },
    { from: 'cli',   to: 'doc',    color: 'accent' },
    { from: 'cli',   to: 'serve',  color: 'accent' },
    { from: 'diff',  to: 'git',    color: 'monitor', label: 'git diff' },
    { from: 'git',   to: 'ast',    color: 'monitor', label: 'changed funcs' },
    { from: 'gen',   to: 'ast',    color: 'amber',   label: 'parse codebase' },
    { from: 'diff',  to: 'ast',    color: 'amber',   label: 'parse changed' },
    { from: 'ast',   to: 'style',  color: 'purple',  label: 'find test files' },
    { from: 'ast',   to: 'lg',     color: 'green',   label: 'function context' },
    { from: 'style', to: 'lg',     color: 'green',   label: 'style context' },
    { from: 'lg',    to: 'claude', color: 'red',     label: 'generate' },
    { from: 'lg',    to: 'openai', color: 'cyan',    label: 'generate' },
    { from: 'lg',    to: 'cursor', color: 'purple',  label: 'generate' },
    { from: 'claude',to: 'tests',  color: 'green' },
    { from: 'openai',to: 'tests',  color: 'green' },
    { from: 'cursor',to: 'tests',  color: 'green' },
    { from: 'doc',   to: 'docs',   color: 'cyan' },
  ];
  createSvgDiagram(container, nodes, edges);
}

function buildStateMachineDiagram(container) {
  const nodes = [
    { id: 'pkg',      type: 'client',   label: 'state-machine-framework\nPyPI · framework-agnostic · MIT',        x: 270, y: 20,  w: 280, h: 55 },
    { id: 'state',    type: 'service',  label: 'State (abstract base)\norder: int · handle() abstract method',   x: 20,  y: 120, w: 245, h: 55 },
    { id: 'sm',       type: 'gateway',  label: 'StateMachine Core\nregister(Model, state_field)\nperform_transition() · lifecycle driver', x: 300, y: 115, w: 290, h: 70 },
    { id: 'pre',      type: 'ml',       label: '@pre_transition\nbefore DB write\nraise to abort transition',     x: 20,  y: 260, w: 210, h: 65 },
    { id: 'val',      type: 'ml',       label: '@validator\nread-only constraint\nsafe to retry · idempotent',    x: 250, y: 260, w: 210, h: 65 },
    { id: 'post',     type: 'ml',       label: '@post_transition\nafter DB write\nAPI calls · Kafka · notify',    x: 480, y: 260, w: 210, h: 65 },
    { id: 'life',     type: 'monitor',  label: 'Transition Lifecycle\n① pre hooks\n② validators\n③ Atomic DB write\n④ post hooks', x: 20,  y: 400, w: 210, h: 100 },
    { id: 'orm',      type: 'service',  label: 'ORM Adapter (abstract)\ncreate · get · filter · update\ntransaction management\nDB-agnostic — swappable', x: 255, y: 400, w: 245, h: 80 },
    { id: 'workflow', type: 'service',  label: 'WorkflowContext\nchain state machines in sequence\ncross-model pipeline execution', x: 525, y: 405, w: 245, h: 70 },
    { id: 'django',   type: 'db',       label: 'Django ORM Adapter\nproduction at Spinny\nthousands of transitions / day', x: 255, y: 555, w: 245, h: 65 },
    { id: 'payment',  type: 'state',    label: 'Payment Gateway (usage)\nWaiting → Pending → Success\n→ Failed · Expired → Refund', x: 525, y: 550, w: 245, h: 70 },
  ];
  const edges = [
    { from: 'pkg',     to: 'state',   color: 'accent' },
    { from: 'pkg',     to: 'sm',      color: 'accent' },
    { from: 'sm',      to: 'state',   color: 'cyan',    label: 'composes states' },
    { from: 'sm',      to: 'pre',     color: 'amber',   label: 'runs pre hooks' },
    { from: 'sm',      to: 'val',     color: 'amber',   label: 'runs validators' },
    { from: 'sm',      to: 'post',    color: 'green',   label: 'runs post hooks' },
    { from: 'sm',      to: 'orm',     color: 'green',   label: 'DB operations' },
    { from: 'sm',      to: 'workflow',color: 'purple',  label: 'chained' },
    { from: 'pre',     to: 'life',    color: 'amber',   dashed: true },
    { from: 'val',     to: 'life',    color: 'amber',   dashed: true },
    { from: 'post',    to: 'life',    color: 'green',   dashed: true },
    { from: 'orm',     to: 'django',  color: 'green',   label: 'Django impl' },
    { from: 'django',  to: 'payment', color: 'cyan',    label: 'powers' },
  ];
  createSvgDiagram(container, nodes, edges);
}

/* ─── PROJECT DATA ───────────────────────────────────── */

const PROJECTS = {

  'spinny-db-routing': {
    title: 'Microservice database Isolation & Replica Routing',
    category: 'corporate',
    badge: 'Corporate', badgeClass: 'badge-corporate', badgeIcon: 'fa-building',
    role: 'Backend Engineer', period: '2023 – 2024',
    tech: ['Python', 'Django', 'MySQL', 'Microservices', 'Read Replicas', 'DATABASE_ROUTERS', 'GraphQL'],
    problem: [
      'The payments service shared a database with the central monolith — any instability or heavy load in unrelated services directly impacted payment reliability; fault isolation was non-existent',
      'All DB reads — including read-only GraphQL queries and GET requests — were routed to the primary MySQL instance, making it the single bottleneck as traffic scaled',
      'GraphQL requests are always HTTP POST regardless of whether they are reads or writes, making standard HTTP-method-based read routing impossible without additional context',
      'Django\'s <code>RelatedManager</code> had a framework-level bug (ticket #35974): it rejected model instances loaded from read replicas even when <code>allow_relation()</code> explicitly permitted cross-database FK operations',
    ],
    solution: [
      'Isolated the payments database into a dedicated microservice with its own MySQL instance — fully separated from the monolith to eliminate cross-service interference and enable independent scaling',
      'Built a custom <code>DATABASE_ROUTERS</code> class intercepting all ORM operations: writes always hit the primary; reads are load-balanced across replicas unless the operation is within a mutation context',
      'Extended the GraphQL layer to support replica reads via a custom <code>gqlread</code> request header — allowing read-only queries to be explicitly routed to replicas, working around the GraphQL-always-POST constraint',
      '<code>allow_relation()</code> returns <code>True</code> for any primary+replica object combination, implementing a targeted workaround for the Django ticket #35974 FK bug without modifying framework internals',
      'Replicas configured via environment variable — adding a replica requires zero code changes',
    ],
    challenges: [
      'GraphQL\'s HTTP POST-only nature made it impossible to route by method alone — required designing a custom header protocol and integrating it into both the router and the GraphQL execution layer',
      'Django\'s <code>RelatedManager.add()</code> uses strict DB equality rather than consulting <code>router.allow_relation()</code> — required studying the Django internals and implementing a precise workaround at the router level',
      'Propagating per-request HTTP context (method + custom header) down to the ORM layer without polluting application code required thread-local middleware with careful request lifecycle scoping',
    ],
    impact: [
      'Payments database fully isolated from the monolith — failures in unrelated services no longer affect payment processing; independent scaling is now possible',
      '~60% reduction in primary DB read load; horizontal read scaling via replicas added through environment config',
      'GraphQL read queries now route to replicas without any changes to query code or resolvers',
      'Cross-database FK operations unblocked via a targeted workaround for Django ticket #35974',
    ],
    metrics: ['Payments DB fully isolated from monolith', '~60% reduction in primary DB read load', 'N read replicas via env var — zero code changes', 'Django #35974 workaround — no framework modification needed'],
    links: [{ label: 'Django Ticket #35974', url: 'https://code.djangoproject.com/ticket/35974', icon: 'fa-bug' }],
    diagram: buildSpinnyDbDiagram,
  },

  'payment-gateway': {
    title: 'Payment Gateway — Multi-Provider State Machine',
    category: 'corporate',
    badge: 'Corporate', badgeClass: 'badge-corporate', badgeIcon: 'fa-building',
    role: 'Backend Engineer', period: '2023 – 2025',
    tech: ['Python', 'Django', 'State Machine', 'Multi-provider', 'Kafka', 'UPI', 'DRF', 'AES Encryption'],
    problem: [
      'Different business units and client teams each required separate payment integrations — there was no generic onboarding flow, causing duplicated effort and inconsistent behaviour across teams',
      'Payment collections required simultaneous integration with multiple providers — each with a completely different API contract, webhook format, and authentication scheme',
      'Each payment lifecycle (creation → pending → success/failure/expiry → refund) was handled ad-hoc per provider, with no formal state transitions, no atomic DB updates, and no lifecycle hooks',
      'No unified approach to generating payment entry points — QR codes, deep links, and hosted payment pages were each implemented independently without a shared abstraction',
    ],
    solution: [
      'Designed a generic client onboarding flow — new business units and accounts configure their payment setup through a unified interface; no per-team custom integration required, reducing onboarding time by 90%',
      'Implemented a formal <code>PaymentGateway(StateMachine)</code> with 7 states across 4 ordered transition layers, all transitions atomic across two models per step',
      'Dynamic provider loading via <code>importlib</code>: <code>GatewayOperationsHandler</code> resolves the correct provider class at runtime — adding a new provider requires one <code>Provider</code> class, zero changes to state machine core',
      'Unified payment entry point abstraction: QR code generation, UPI deep linking, and hosted payment page flows all route through a single provider-agnostic interface',
      'Asymmetric key exchange layer for provider webhook authentication — each provider\'s payload verified against a registered public key before being admitted to the state machine',
      'Webhook handlers normalize provider-specific event formats — including encrypted payloads — into a common status map that drives <code>Pending → terminal</code> transitions',
      'Refund state dispatches a Kafka event on provider timeout — caught by Apache NiFi for async retry without blocking the API response',
    ],
    challenges: [
      'Multiple terminal states (<code>SuccessState</code>, <code>FailedState</code>, <code>ExpiredState</code>) at the same order level required careful state machine design to allow branching without ambiguity',
      'QR codes and deep links have provider-specific generation APIs with different expiry and status-check flows — needed a unified abstraction that hid these differences from business logic',
      'Webhook payload authentication differed per provider — some use HMAC signatures, others use asymmetric encryption — requiring a pluggable verification layer in front of the state machine',
      'Refund provider timeouts had to be handled asynchronously without blocking the payment API — solved via Kafka event + NiFi retry pipeline',
      'Keeping two models consistent across transition failures required atomic ORM operations wrapping the full hook chain',
    ],
    impact: [
      '31% drop in payment dropout rate, 12% uplift in online payments, 1% transaction fee saving — processing over 1B INR/month',
      '90% reduction in onboarding time for new business unit accounts via the generic client configuration flow',
      'Multiple payment providers unified under a single consistent lifecycle — QR, deep link, and hosted page flows all share the same state machine',
      'Atomic DB updates on every transition eliminate partial-state corruption; Kafka+NiFi retry ensures eventual consistency on refund timeouts',
    ],
    metrics: ['90% faster business unit onboarding', 'QR · Deep link · Hosted page — unified abstraction', 'Atomic DB updates across 2 models per transition', '7 states · 4 transition orders · pluggable provider layer'],
    diagram: buildPaymentGatewayDiagram,
  },

  'celery-consumer': {
    title: 'Custom SQS Celery Consumer',
    category: 'corporate',
    badge: 'Corporate', badgeClass: 'badge-corporate', badgeIcon: 'fa-building',
    role: 'Backend Engineer', period: '2022 – 2023',
    tech: ['Python 3.7', 'AWS SQS', 'Celery', 'boto3', 'ThreadPoolExecutor', 'ast', 'Sentry', 'Click', 'Django'],
    problem: [
      'Celery\'s built-in SQS transport had no configurable per-queue concurrency and no bulk message consumption — each message was fetched and processed one at a time',
      'Celery serializes task arguments using Python <code>repr()</code>, which includes <code>datetime</code> objects, sets, and timezone types that standard JSON deserializers silently reject',
      'Multiple queues required separate consumer processes with no unified control surface or shared concurrency budget',
    ],
    solution: [
      '<code>BulkSQSConsumer</code> polls SQS with configurable long-polling and <code>MaxNumberOfMessages=10</code>, reducing API calls by 50%',
      'Custom <code>_safe_parse_args()</code>: Base64 → JSON → <code>headers.argsrepr</code> extraction → regex preprocessing for <code>datetime</code> objects → <code>ast.literal_eval()</code>, with a restricted <code>eval()</code> fallback (no <code>__builtins__</code>)',
      'Inner <code>ThreadPoolExecutor</code> per queue for configurable concurrent task execution; success batches ACK receipts, failure triggers <code>re_enqueue_message()</code> for SQS retry',
      'Task resolution via <code>importlib</code>: any Django callable can be queued without registration — fully dynamic',
      'Multi-queue CLI via Click: <code>--queue-name</code> accepts comma-separated queues; outer thread pool spawns one consumer per queue in parallel',
    ],
    challenges: [
      'Celery\'s <code>argsrepr</code> format includes non-JSON types (<code>datetime</code>, <code>set</code>, timezone objects) — needed safe deserialization without using unrestricted <code>eval()</code>',
      'Designed a restricted <code>eval()</code> fallback with a safe context dict (<code>{datetime, UTC, True, False, None}</code>) as a last resort, completely blocking <code>__builtins__</code>',
      'Alerting: Parse failures trigger Sentry capture with <code>task_name</code> + <code>queue_name</code> scope tags, and the message is immediately deleted to prevent infinite retry loops',
    ],
    impact: [
      '50% reduction in SQS API calls via long-polling and bulk consumption',
      'Per-queue concurrency configurable at runtime — no code changes needed for tuning',
      'Eliminated a class of silent task drops caused by <code>datetime</code> deserialization failures in the original Celery transport',
      'Full observability via Sentry with structured scope tags per task and queue',
    ],
    metrics: ['Up to 10 concurrent tasks per queue', 'N queues polled in parallel — outer thread pool', 'Safe datetime deserialization via AST + regex preprocessing', 'Re-queue on failure · bulk ACK on success'],
    diagram: buildCeleryConsumerDiagram,
  },

  'audit-framework': {
    title: 'Payments Audit Framework',
    category: 'corporate',
    badge: 'Corporate', badgeClass: 'badge-corporate', badgeIcon: 'fa-building',
    role: 'Backend Engineer', period: '2024 – 2025',
    tech: ['Python', 'Django', 'Django Signals', 'Celery', 'contextvars', 'GenericForeignKey', 'ContentTypes', 'MySQL'],
    problem: [
      'Payment models (<code>Receivables</code>, <code>GatewayPaymentOrder</code>) needed field-level change auditing for financial compliance — existing approach required manual logging in every view, leading to inconsistent coverage',
      'Django\'s <code>queryset.update()</code> bypasses the signal system entirely — bulk updates were completely invisible to any signal-based audit approach',
      'No consistent capture of which view or async task triggered a change; <code>threading.local</code> is unsafe in async and concurrent Django contexts',
    ],
    solution: [
      'Declarative registry: <code>registry.register(Model, fields=[...])</code> — one line per model, zero audit code required in views or serializers',
      'Signal chain for <code>.save()</code>: <code>post_init</code> captures initial values → <code>pre_save</code> snapshots old values → <code>post_save</code> diffs fields and bulk-creates <code>AuditLog</code> entries',
      '<code>AuditSourceMiddleware</code> uses <code>contextvars.ContextVar</code> (async-safe) to store the originating view class per request; cleared after response',
      'Custom <code>post_bulk_update</code> signal for <code>queryset.update()</code> paths — dispatches a Celery task asynchronously so bulk audits never block the API',
      '<code>AuditLog</code> uses Django\'s <code>GenericForeignKey</code> (ContentType framework) to audit any registered model with composite indexes for fast lookup',
    ],
    challenges: [
      'Django\'s <code>update_fields</code> kwarg: had to intersect audited fields with <code>update_fields</code> to avoid logging phantom changes for in-memory modifications never persisted to DB',
      'Post-save initial value refresh: <code>_audit_initial_values</code> must be reset after each save so subsequent saves on the same instance compare against the correct baseline, not the original load state',
      '<code>queryset.update()</code> doesn\'t trigger Django signals — required a custom signal, pre-fetching old values before the update, and sanitizing all data for Celery JSON serialization',
    ],
    impact: [
      'Zero audit code in views or serializers — 100% automatic via model registration',
      'Both <code>.save()</code> and <code>queryset.update()</code> paths fully covered, including field-narrowed <code>update_fields</code> saves',
      'Async Celery task for bulk audits means zero impact on payment API latency',
      '<code>contextvars</code> ensures correct source attribution across async views, Celery tasks, and concurrent requests',
    ],
    metrics: ['Zero audit code in views — 100% automatic via signals', 'Both instance .save() and queryset .update() covered', 'Async Celery task for bulk audit (non-blocking)', 'contextvars audit source — async-safe attribution'],
    diagram: buildAuditDiagram,
  },

  'employee-access': {
    title: 'Employee Product Access Management',
    category: 'corporate',
    badge: 'Corporate', badgeClass: 'badge-corporate', badgeIcon: 'fa-building',
    role: 'Backend Engineer', period: '2022 – 2023',
    tech: ['Python', 'Django', 'Celery', 'SSO', 'REST APIs', 'OAuth', 'LDAP', 'NewRelic'],
    problem: [
      'Employee access spanned 9+ internal and third-party platforms — each maintaining its own user list with no connection to HR data',
      'No automatic sync on onboarding or offboarding; employees could retain access post-departure or lack required access with no automated detection',
      'Manual reconciliation was error-prone, slow, and provided no audit trail for compliance',
    ],
    solution: [
      'Centralized data model: <code>Platform</code>, <code>Employee</code> (per-platform user record with status, SSO ID, role, type: COMMON/EXTERNAL/WHITELIST/UNREMOVABLE), <code>User</code> (HR master with employment status, department, manager)',
      'Vendor-agnostic driver pattern: <code>importlib.import_module(f"vendors.src.{vendor}.driver").Driver().getVendorData()</code> — any platform is one <code>Driver</code> class away from integration, regardless of whether it uses REST, LDAP, OAuth, or a vendor SDK',
      '<code>update_vendor_list</code> Celery task syncs each platform: compares API response against DB, creates/updates/deactivates employees, emails the platform POC on completion',
      'Role Audit pipeline cross-checks employee identities against expected role assignments, surfaces <code>Missing</code> and <code>To-be-Removed</code> anomalies per user+role, and creates remediation actions',
    ],
    challenges: [
      'Each of 9+ platforms has a completely different API shape — needed a clean abstraction normalizing them all to a common <code>{email: [status, ...]}</code> dict without leaking platform specifics into core sync logic',
      'Identity resolution was inconsistent across platforms — some matched by email, others by SSO ID — requiring platform-specific resolution logic encapsulated inside the driver',
      'Automated remediation needed safeguards: <code>WHITELIST</code> and <code>UNREMOVABLE</code> employee types must never be auto-deactivated even if absent from a platform\'s API response',
    ],
    impact: [
      'Single source of truth for employee access across all 9+ platforms, replacing manual reconciliation entirely',
      'Automated sync catches access drift before incidents; anomaly detection surfaces privilege violations proactively',
      'Post-onboarding automation cleared 10k+ tasks that had been backlogged for over a year',
      'Adding a new platform integration requires only implementing one <code>Driver.getVendorData()</code> method',
    ],
    metrics: ['9+ platform integrations via unified driver pattern', 'SSO · Dev Tools · Productivity · BI · VPN · Communication', 'Anomaly detection: Missing + To-be-Removed access', 'Role audit pipeline with auto/manual remediation + statistics'],
    diagram: buildEmployeeAccessDiagram,
  },

  'codecoverage-cli': {
    title: 'codecoverage-cli',
    category: 'opensource',
    badge: 'Open Source', badgeClass: 'badge-opensource', badgeIcon: 'fa-github',
    role: 'Author & Maintainer', period: '2024 – Present',
    tech: ['Python', 'AST', 'LangGraph', 'Anthropic Claude', 'OpenAI GPT-4o', 'Click', 'FastAPI', 'Swagger'],
    problem: `Writing unit tests is time-consuming and frequently skipped under deadline pressure. Existing AI test generation tools either require runtime code execution (importing the module, which fails on complex dependencies), rely on simple regex/pattern matching without understanding code structure, or generate tests that look foreign to the existing test suite — wrong naming conventions, wrong fixture style, wrong assertion patterns.`,
    idea: `Build a CLI tool that uses pure Python AST analysis (zero runtime imports) to understand code structure, learns testing style from existing test files in the repo, and uses an LLM (one call per function) with style context to generate tests that integrate naturally. The diff-test command makes it perfect for PR workflows.`,
    solution: `Commands:
• init: sets up .codecoverage config, selects LLM provider (anthropic/openai/cursor)
• generate all|dir|file|function: discovers all functions via AST traversal
• diff-test working|last-commit|since <hash>: generates tests only for git-changed functions
• document: generates FLOWS.md (control flow documentation) and SUMMARY.md
• serve: runs Swagger UI for API exploration

Architecture:
• AST analysis: walks Python AST tree, extracts function signatures, docstrings, type hints, class context — pure static analysis, no runtime imports needed
• Style learner: samples existing test files, extracts naming patterns (test_funcname_, TestClass), import conventions, fixture usage — style is passed as context to the LLM
• LangGraph orchestration: validation node checks that generated code parses as valid Python AST; retry node re-prompts on failure
• One LLM call per function with full signature + docstring + style context as prompt
• Providers: Anthropic (claude-sonnet-4-6), OpenAI (gpt-4o), Cursor

Key design decisions:
• No runtime imports → safe on any codebase with complex imports or side effects
• Style-matching → generated tests look like they were written by the team
• Per-function granularity → generate for one function without touching others
• diff-test → CI/PR integration: only test what changed`,
    impact: `Reduces test-writing time by automating the boilerplate while preserving codebase style. The diff-test command integrates naturally into PR workflows. Published on PyPI as codecoverage-cli v0.1.0, open source on GitHub.`,
    metrics: ['Published on PyPI — pip install codecoverage-cli', 'Pure AST analysis — no runtime imports', 'diff-test for PR/CI workflow integration', 'Supports Anthropic claude-sonnet-4-6 · OpenAI gpt-4o · Cursor'],
    links: [
      { label: 'PyPI', url: 'https://pypi.org/project/codecoverage-cli/', icon: 'fa-box' },
      { label: 'GitHub', url: 'https://github.com/AbhigyaShridhar/codecoverage-cli', icon: 'fa-github' },
    ],
    codeSnippet: `# Install
pip install codecoverage-cli

# Initialize with Anthropic provider
codecoverage init --provider anthropic

# Generate tests for all changed code (perfect for PRs)
codecoverage diff-test working

# Generate for a specific function
codecoverage generate function path/to/module.py::my_function

# Generate tests for entire directory
codecoverage generate dir src/payments/

# Generate docs (FLOWS.md + SUMMARY.md)
codecoverage document

# Since a specific commit
codecoverage diff-test since abc1234`,
    diagram: buildCodecoverageCliDiagram,
  },

  'state-machine-framework': {
    title: 'state-machine-framework',
    category: 'opensource',
    badge: 'Open Source', badgeClass: 'badge-opensource', badgeIcon: 'fa-github',
    role: 'Author & Maintainer', period: '2023 – Present',
    tech: ['Python', 'ORM Agnostic', 'Decorator Pattern', 'Abstract Adapter', 'Django', 'Workflow Chaining'],
    problem: `State machine implementations in Python are either tightly coupled to specific ORMs, lack atomic DB updates on state transitions, or have too complex integration for fast moving projects. This forces teams to re-implement state machine logic per project, or use library internals that weren't designed for production — missing pre/post hooks, validators, and ORM portability.`,
    idea: `Build a minimal, framework-agnostic state machine library where the ORM is an abstract adapter (swappable without touching core logic), transitions are atomic by design, and lifecycle hooks (pre/post/validators) are first-class concepts exposed as decorators.`,
    solution: `Core components:

State base class: order: int defines valid transition directions. Abstract handle() method implemented by each concrete state.

StateMachine: register(Model, state_field='status', identifier_field='id') binds to an ORM model. perform_transition(start_state) drives the full lifecycle. _execute_transition() is atomic: runs pre hooks → validators → ORM state update → post hooks in order.

Decorators:
• @pre_transition — methods that run before DB state update; raise to abort the entire transition
• @post_transition — methods that run after DB state update (side effects: external API calls, notifications, Kafka events)
• @validator — read-only constraint checks; can only raise, never modify state; safe to retry

ORM Adapter (abstract): create · get · filter · update · delete + transaction management (begin/commit/rollback). A production-adapted internal fork targeting the company codebase is actively used in the payments service — shipping thousands of atomic state transitions daily.

WorkflowContext: chains multiple StateMachine instances in sequence for multi-model pipelines.`,
    impact: `Powers thousands of payment lifecycle transitions daily in production — with atomic guarantees across two models per transition. An internal fork adapted to the company codebase is maintained separately from the public package. Published as a standalone PyPI package; ORM adapter pattern makes testing trivial with mock ORMs.`,
    metrics: ['Published on PyPI — pip install state-machine-framework', 'Internal fork in active production use', 'Framework-agnostic ORM adapter pattern', 'Atomic transitions · full pre/post/validator hook system'],
    links: [
      { label: 'PyPI', url: 'https://pypi.org/project/state-machine-framework/', icon: 'fa-box' },
      { label: 'GitHub', url: 'https://github.com/AbhigyaShridhar/python-state-machines', icon: 'fa-github' },
    ],
    codeSnippet: `from state_machine import StateMachine, State
from state_machine.decorators import pre_transition, post_transition, validator

class WaitingState(State):
    order = 1

    @pre_transition
    def create_contract(self, instance, context):
        # Runs before state update — raise here to abort entire transition
        instance.contract_id = create_contract_for_order(instance.id)

    @post_transition
    def notify_gateway(self, instance, context):
        # Runs after state update — side effects safe here
        gateway_ops_handler.create_order(instance)

class PendingState(State):
    order = 2

    @validator
    def validate_payment_reference(self, instance, context):
        # Read-only — can only raise, never modify
        if not instance.payment_reference:
            raise ValidationError("Payment reference missing")

    @post_transition
    def log_webhook(self, instance, context):
        log_webhook_response(instance, context.webhook_data)

# Register models — both updated atomically on each transition
PaymentGateway.register(Order, state_field='status', identifier_field='id')
PaymentGateway.register(Receivable, state_field='status', identifier_field='id')

machine = PaymentGateway(provider='razorpay')
machine.perform_transition(start_state=WaitingState)`,
    diagram: buildStateMachineDiagram,
  },

  'keep-an-eye': {
    title: 'Keep an Eye — Parental Content Monitor',
    category: 'hackathon',
    badge: 'Hackathon · Linode', badgeClass: 'badge-hackathon', badgeIcon: 'fa-trophy',
    period: 'Hacking Heist 2.0',
    tech: ['JavaScript', 'Chrome Extension API', 'Python', 'FastAPI', 'CockroachDB', 'SQLAlchemy', 'Twilio', 'Linode'],
    problem: 'Parents have limited visibility into the web content their children encounter. Existing parental controls work at the domain level and cannot detect profanity or explicit text within otherwise acceptable pages.',
    solution: 'A Chrome extension that uses a DOM tree parser to extract paragraph text from every page the child visits. The text is sent to a FastAPI backend hosted on Linode for profanity and sensitive-content detection. When triggering content is found, parents receive an SMS alert via Twilio. Parent accounts are secured with OTP-based phone verification.',
    impact: 'Won "Best Use of Linode Cloud" at Hacking Heist 2.0. Real-time content monitoring without client-side false-positive issues, with an audit trail of alerts stored in CockroachDB.',
    metrics: ['Won "Best Use of Linode Cloud"', 'Real-time SMS alerts via Twilio', 'OTP-authenticated parent accounts', 'Hacking Heist 2.0'],
    links: [
      { label: 'Devfolio', url: 'https://devfolio.co/projects/keep-an-eye-da3a', icon: 'fa-trophy' },
      { label: 'GitHub', url: 'https://github.com/AbhigyaShridhar/KeepAnEye/tree/dev', icon: 'fa-github' },
    ],
    diagram: null,
  },

  'block-city': {
    title: 'Block City — Basketball Community Platform',
    category: 'hackathon',
    badge: 'Hackathon · MLH Global', badgeClass: 'badge-hackathon', badgeIcon: 'fa-trophy',
    period: 'Slam Dunk Hacks',
    tech: ['Django', 'Django REST Framework', 'Python', 'JavaScript', 'HTML/CSS', 'Figma'],
    problem: 'Post-pandemic, casual basketball players had no easy way to find pickup games, connect with local teams, or discover available courts nearby.',
    solution: 'Block City lets team captains register their squad, search for opponents by location, check court availability, and schedule games — all in one place. Built with a Django REST Framework backend (6 models for teams and matches) and a frontend converted directly from Figma designs into HTML/CSS/JS during the 48-hour hackathon.',
    impact: 'Won "My First Gold Medal" award at Slam Dunk Hacks (MLH). Successfully integrated a separate frontend and backend server with a working live prototype within the hackathon window.',
    metrics: ['Won "My First Gold Medal" at Slam Dunk Hacks', 'Full working prototype in 48 hours', 'Figma → production in one sprint', 'Location-based opponent matching'],
    links: [
      { label: 'Devpost', url: 'https://devpost.com/software/block-city', icon: 'fa-trophy' },
      { label: 'GitHub', url: 'https://github.com/AbhigyaShridhar/BlockCity/', icon: 'fa-github' },
    ],
    diagram: null,
  },

  'crops-plus': {
    title: 'Crops+ — Crop Suitability Prediction',
    category: 'hackathon',
    badge: 'Hackathon · MLH Global', badgeClass: 'badge-hackathon', badgeIcon: 'fa-trophy',
    period: '2020',
    tech: ['Python', 'Spatial SQL', 'PostGIS', 'Geo-tagging'],
    problem: 'Small-scale farmers in India frequently grow crops ill-suited to their local soil and climate, leading to poor yields. Existing advisory tools require manual soil tests and lack spatial granularity.',
    solution: 'An algorithm that takes geo-tagged field coordinates and queries a composite dataset of soil composition, rainfall, temperature, and historical yield data. Weighted spatial analysis ranks the most suitable crops for that location. The hackathon prototype was subsequently expanded into a full academic study incorporating district-level geo-tagging and spatial queries.',
    impact: 'Won a global MLH hackathon. The work was extended into a peer-reviewed academic study on geo-tagged crop suitability modelling.',
    metrics: ['Global MLH Hackathon Winner', 'Expanded into academic study', 'District-level spatial resolution', 'Geo-tagged field data'],
    links: [
      { label: 'Devpost', url: 'https://devpost.com/software/crops', icon: 'fa-trophy' },
      { label: 'GitHub', url: 'https://github.com/AbhigyaShridhar/soil-backend', icon: 'fa-github' },
      { label: 'Project Site', url: 'https://shridharabhigya.wixsite.com/cropsplus', icon: 'fa-seedling' },
    ],
    diagram: null,
  },
};

/* ─── SPA PROJECT DETAIL PAGE ────────────────────────── */

function renderBullets(content) {
  if (!content) return '';
  if (Array.isArray(content)) {
    return `<ul class="detail-bullets">${content.map(b => `<li>${b}</li>`).join('')}</ul>`;
  }
  return `<div class="detail-prose">${content.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</div>`;
}

function openProjectPage(projectId) {
  const p = PROJECTS[projectId];
  if (!p) return;

  const page = document.getElementById('projectDetailPage');
  const body = document.getElementById('detailBody');
  const navBadges = document.getElementById('detailNavBadges');

  navBadges.innerHTML = `
    <span class="proj-badge ${p.badgeClass}"><i class="fa-solid ${p.badgeIcon}"></i> ${p.badge}</span>
    ${p.company ? `<span class="proj-badge badge-company">${p.company}</span>` : ''}
  `;

  const metrics = (p.metrics || []).map(m =>
    `<li><i class="fa-solid fa-circle-check"></i>${m}</li>`
  ).join('');

  const tech = (p.tech || []).map(t => `<li>${t}</li>`).join('');

  const links = (p.links || []).map(l => {
    const prefix = l.icon === 'fa-github' ? 'fa-brands' : 'fa-solid';
    return `<a href="${l.url}" target="_blank" rel="noreferrer" class="btn btn-outline"><i class="${prefix} ${l.icon}"></i> ${l.label}</a>`;
  }).join('');

  const diagId = `detail-diag-${projectId}`;

  body.innerHTML = `
    <div class="detail-header">
      <h1 class="detail-title">${p.title}</h1>
      <div class="detail-meta">
        ${p.role   ? `<span><i class="fa-solid fa-user-tie"></i> ${p.role}</span>`   : ''}
        ${p.period ? `<span><i class="fa-solid fa-calendar"></i> ${p.period}</span>` : ''}
        ${p.company ? `<span><i class="fa-solid fa-building"></i> ${p.company}</span>` : ''}
      </div>
    </div>

    ${p.diagram ? `
    <div class="detail-diagram-section">
      <p class="detail-diagram-hint"><i class="fa-solid fa-arrows-up-down-left-right"></i> Drag to pan &nbsp;·&nbsp; Scroll to zoom</p>
      <div class="detail-diagram" id="${diagId}"></div>
    </div>` : ''}

    <div class="detail-content-grid">
      <div class="detail-main">
        ${p.problem ? `
        <section class="detail-section">
          <h2 class="detail-sh"><i class="fa-solid fa-triangle-exclamation"></i> Problem Statement</h2>
          ${renderBullets(p.problem)}
        </section>` : ''}

        ${p.solution ? `
        <section class="detail-section">
          <h2 class="detail-sh"><i class="fa-solid fa-wrench"></i> Solutioning</h2>
          ${renderBullets(p.solution)}
        </section>` : ''}

        ${p.challenges ? `
        <section class="detail-section">
          <h2 class="detail-sh"><i class="fa-solid fa-bolt"></i> Challenges</h2>
          ${renderBullets(p.challenges)}
        </section>` : ''}

        ${p.impact ? `
        <section class="detail-section">
          <h2 class="detail-sh"><i class="fa-solid fa-arrow-trend-up"></i> Impact</h2>
          ${renderBullets(p.impact)}
        </section>` : ''}
      </div>

      <aside class="detail-sidebar">
        ${metrics ? `
        <section class="detail-section">
          <h3 class="detail-sh detail-sh-sm"><i class="fa-solid fa-chart-bar"></i> Key Results</h3>
          <ul class="detail-metrics">${metrics}</ul>
        </section>` : ''}

        <section class="detail-section">
          <h3 class="detail-sh detail-sh-sm"><i class="fa-solid fa-microchip"></i> Tech Stack</h3>
          <ul class="tech-list tech-list-lg">${tech}</ul>
        </section>

        ${links ? `
        <section class="detail-section">
          <h3 class="detail-sh detail-sh-sm"><i class="fa-solid fa-link"></i> Links</h3>
          <div class="detail-links">${links}</div>
        </section>` : ''}
      </aside>
    </div>
  `;

  page.setAttribute('aria-hidden', 'false');
  page.classList.add('open');
  page.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  if (p.diagram) {
    const diagEl = document.getElementById(diagId);
    if (diagEl) setTimeout(() => p.diagram(diagEl), 60);
  }

  history.pushState({ projectId }, p.title, `#project/${projectId}`);
}

function closeProjectPage() {
  const page = document.getElementById('projectDetailPage');
  page.classList.remove('open');
  page.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.querySelectorAll('.project-card').forEach(c => c.classList.remove('active'));
}

/* ─── CATEGORY FILTER ────────────────────────────────── */

function initCategoryFilter() {
  const tabs = document.querySelectorAll('.tab-btn[data-filter]');
  const cards = document.querySelectorAll('.project-card[data-category]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const filter = tab.getAttribute('data-filter');
      cards.forEach(card => {
        card.classList.toggle('hidden', filter !== 'all' && card.getAttribute('data-category') !== filter);
      });
    });
  });
}

/* ─── PROJECT NAV (SPA) ──────────────────────────────── */

function initProjectNav() {
  // Delegate all project-open triggers
  document.addEventListener('click', e => {
    // Any element with data-open-project
    const opener = e.target.closest('[data-open-project]');
    if (opener) {
      openProjectPage(opener.getAttribute('data-open-project'));
      return;
    }
    // Project card body click
    const card = e.target.closest('.project-card[data-project-id]');
    if (card && !e.target.closest('a')) {
      openProjectPage(card.getAttribute('data-project-id'));
      return;
    }
    // Featured card click (not on a button/link)
    const featured = e.target.closest('.featured-card[data-project-id]');
    if (featured && !e.target.closest('a') && !e.target.closest('button')) {
      openProjectPage(featured.getAttribute('data-project-id'));
    }
  });

  // Back button inside detail page
  document.getElementById('detailBack').addEventListener('click', () => {
    closeProjectPage();
    history.back();
  });

  // Browser back button
  window.addEventListener('popstate', e => {
    if (e.state && e.state.projectId) {
      openProjectPage(e.state.projectId);
    } else {
      closeProjectPage();
    }
  });

  // Handle direct URL with hash on load
  const hash = location.hash;
  if (hash.startsWith('#project/')) {
    const pid = hash.slice('#project/'.length);
    if (PROJECTS[pid]) openProjectPage(pid);
  }

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('projectDetailPage').classList.contains('open')) {
      closeProjectPage();
      history.back();
    }
  });
}

/* ─── NAV ────────────────────────────────────────────── */

function initNav() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks && navLinks.classList.remove('open'));
  });

  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-links a[href^="#"]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAs.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => obs.observe(s));
}

/* ─── THEME ──────────────────────────────────────────── */

function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    btn.querySelector('i').className = 'fa-solid fa-sun';
  }
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
    btn.querySelector('i').className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}

/* ─── SCROLL ANIMATIONS ──────────────────────────────── */

function initScrollAnimations() {
  const els = document.querySelectorAll('.project-card, .timeline-item, .cert-card, .blog-card, .featured-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach(el => { el.classList.add('fade-in'); obs.observe(el); });
}

/* ─── YEAR ───────────────────────────────────────────── */

function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─── BOOT ───────────────────────────────────────────── */

function initCertLightbox() {
  const lb = document.getElementById('certLightbox');
  const lbBody = document.getElementById('certLightboxBody');
  const lbLabel = document.getElementById('certLightboxLabel');
  const lbClose = document.getElementById('certLightboxClose');
  if (!lb) return;

  function openLightbox(label, contentHtml) {
    lbLabel.textContent = label;
    lbBody.innerHTML = contentHtml;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbBody.innerHTML = '';
  }

  lbClose.addEventListener('click', closeLightbox);
  lb.querySelector('.cert-lightbox-backdrop').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
  });

  document.addEventListener('click', e => {
    const row = e.target.closest('.cert-has-thumb, .cert-has-pdf');
    if (!row) return;
    // Don't trigger if clicking verify link directly
    if (e.target.closest('.cert-verify')) return;

    const label = row.dataset.certLabel || '';
    if (row.classList.contains('cert-has-thumb')) {
      const src = row.dataset.certImg;
      openLightbox(label, `<img src="${src}" alt="${label}" />`);
    } else if (row.classList.contains('cert-has-pdf')) {
      const src = row.dataset.certPdf;
      openLightbox(label, `<iframe src="${src}" title="${label}"></iframe>`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initCategoryFilter();
  initProjectNav();
  initCertLightbox();
  initScrollAnimations();
  initYear();
});
