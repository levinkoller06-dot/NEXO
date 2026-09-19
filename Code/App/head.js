// Head surface sampled from a real 3D scan/sculpt instead of hand-built formulas.
// Geometry credit: "Male Head" by Alexander Antipov (CC BY) — see Code/App/README.md.
// Coordinates here: x right, y down, z toward viewer. The source mesh (loaded from
// head-mesh-data.js as HEAD_MESH) was cropped at the neck and remapped into this
// convention once, offline; nothing here reads the original .obj at runtime.
function createHeadPoints() {
  let seed = 1847;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;

  const verts = HEAD_MESH.vertices;
  const headTris = HEAD_MESH.headTris;
  const eyeTris = HEAD_MESH.eyeTris;

  function buildSampler(tris) {
    const n = tris.length / 3;
    const cum = new Float64Array(n);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const a = tris[i * 3], b = tris[i * 3 + 1], c = tris[i * 3 + 2];
      const ax = verts[a * 3], ay = verts[a * 3 + 1], az = verts[a * 3 + 2];
      const bx = verts[b * 3], by = verts[b * 3 + 1], bz = verts[b * 3 + 2];
      const cx = verts[c * 3], cy = verts[c * 3 + 1], cz = verts[c * 3 + 2];
      const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
      const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      total += 0.5 * Math.hypot(nx, ny, nz);
      cum[i] = total;
    }
    return { cum, total, n };
  }

  function pickIndex(sampler, r) {
    const target = r * sampler.total;
    let lo = 0, hi = sampler.n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sampler.cum[mid] < target) lo = mid + 1; else hi = mid; }
    return lo;
  }

  // Flat per-triangle normals suit the particle rendering (each point is its own
  // dot) and avoid needing the source mesh's per-vertex normals at all.
  function sampleTriangle(tris, idx) {
    const a = tris[idx * 3], b = tris[idx * 3 + 1], c = tris[idx * 3 + 2];
    const ax = verts[a * 3], ay = verts[a * 3 + 1], az = verts[a * 3 + 2];
    const bx = verts[b * 3], by = verts[b * 3 + 1], bz = verts[b * 3 + 2];
    const cx = verts[c * 3], cy = verts[c * 3 + 1], cz = verts[c * 3 + 2];
    const r1 = random(), r2 = random();
    const sq = Math.sqrt(r1);
    const u = 1 - sq, v = sq * (1 - r2), w = sq * r2;
    const x = u * ax + v * bx + w * cx, y = u * ay + v * by + w * cy, z = u * az + v * bz + w * cz;
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    // The OBJ-to-app axis remap (see head-mesh-data.js) mirrors the coordinate
    // system, which flips the handedness the source mesh's winding order
    // assumed — negate so normals point outward again instead of inward.
    let nx = -(e1y * e2z - e1z * e2y), ny = -(e1z * e2x - e1x * e2z), nz = -(e1x * e2y - e1y * e2x);
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    return { x, y, z, nx, ny, nz };
  }

  const points = [];
  const headSampler = buildSampler(headTris);
  const HEAD_POINTS = 48500;
  for (let i = 0; i < HEAD_POINTS; i++) {
    const idx = pickIndex(headSampler, random());
    const p = sampleTriangle(headTris, idx);
    const hairline = p.y < -.95 && random() < .38;
    const lip = p.y > .55 && p.y < .95 && Math.abs(p.x) < .34;
    points.push({ x: p.x, y: p.y, z: p.z, nx: p.nx, ny: p.ny, nz: p.nz, a: hairline ? .34 + random() * .28 : .52 + random() * .48, lip, eye: false });
  }

  // The source mesh models a full eyeball, but our renderer has no eyelid
  // geometry to occlude it, so only keep an almond-shaped band around each eye's
  // own center — the part that would show through an open eyelid.
  const EYE_CX = .374, EYE_CY = -.025, EYE_RX = .165;
  const eyeSampler = buildSampler(eyeTris);
  const EYE_POINTS = 900;
  for (let i = 0; i < EYE_POINTS; i++) {
    let p, lx, ly, valid, tries = 0;
    do {
      const idx = pickIndex(eyeSampler, random());
      p = sampleTriangle(eyeTris, idx);
      const cx = p.x < 0 ? -EYE_CX : EYE_CX;
      lx = (p.x - cx) / EYE_RX;
      ly = (p.y - EYE_CY) / EYE_RX;
      valid = Math.abs(lx) < 1 && Math.abs(ly) <= .30 * Math.sqrt(Math.max(0, 1 - lx * lx));
      tries++;
    } while (!valid && tries < 40);
    points.push({ x: p.x, y: p.y, z: p.z, nx: 0, ny: 0, nz: 1, a: .54 + random() * .32, eye: true });
  }

  // The source mesh's mouth crease faces away from the camera at a few points
  // (likely a modeled mouth-cavity opening), which our renderer culls as
  // back-facing and would otherwise show as a hole. Patch it with forward-facing
  // skin points so the closed mouth always reads as a solid surface.
  for (let i = 0; i < 1600; i++) {
    const x = (random() * 2 - 1) * .34;
    const y = .50 + random() * .50;
    const taper = Math.sqrt(Math.max(0, 1 - (x / .36) ** 2));
    const z = (1.08 + .05 * Math.cos((y - .75) / .30 * Math.PI)) * taper;
    const lip = y > .55 && y < .95 && Math.abs(x) < .34;
    points.push({ x, y, z, nx: 0, ny: 0, nz: 1, a: .45 + random() * .4, lip, eye: false });
  }

  // Teeth: a small bright row sized to the mouth, hidden behind closed lips and
  // only revealed once the speak animation parts them.
  for (let i = 0; i < 260; i++) {
    const x = (random() * 2 - 1) * .26;
    const upper = i % 2 === 0;
    const y = .75 + (upper ? -.045 : .045);
    const z = 1.0;
    points.push({ x, y, z, nx: 0, ny: 0, nz: 1, a: .85 + random() * .15, eye: false, teeth: true, lowerTeeth: !upper });
  }

  // A per-point outward direction/magnitude used only for the mode-switch
  // explode-and-reform transition; it has no effect on the resting head shape.
  for (const p of points) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(random() * 2 - 1);
    const mag = .5 + random() * 1.1;
    p.ex = Math.sin(phi) * Math.cos(theta) * mag;
    p.ey = Math.sin(phi) * Math.sin(theta) * mag;
    p.ez = Math.cos(phi) * mag;
  }

  return points;
}
