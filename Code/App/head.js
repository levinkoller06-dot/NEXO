// Natural male head surface. Coordinates: x right, y down, z toward viewer.
// The reference is translated into anatomy and proportions; no image is embedded.
function createHeadPoints() {
  let seed = 1847;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const g = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));

  // A wider forehead/cheek line, straighter jaw and squared, forward chin give the
  // head a broader, more angular, masculine silhouette (short-hair fade, defined jaw
  // reference).
  const contour = [
    [-1.42, .18], [-1.35, .40], [-1.18, .58], [-.96, .70], [-.70, .76],
    [-.42, .775], [-.12, .76], [.16, .73], [.38, .685], [.55, .635],
    [.70, .565], [.82, .475], [.92, .40], [1.02, .32], [1.12, .26], [1.24, .225]
  ];
  function widthAt(y) {
    if (y <= contour[0][0] || y >= contour[contour.length - 1][0]) return .04;
    for (let i = 1; i < contour.length; i++) {
      const [ay, aw] = contour[i - 1], [by, bw] = contour[i];
      if (y <= by) {
        const t = (y - ay) / (by - ay);
        return aw + (bw - aw) * t;
      }
    }
    return .04;
  }

  // Forward projection along the midline: shallow at the crown, rising through the
  // brow and nose, then staying forward through a squared, un-receded chin instead
  // of tapering back — this is what turns the side profile from sloped to upright.
  const depthProfile = [
    [-1.42, .32], [-1.05, .39], [-.75, .405], [-.42, .42],
    [-.10, .425], [.20, .41], [.55, .40], [.77, .40],
    [.95, .43], [1.10, .375], [1.24, .27]
  ];
  function baseDepth(y) {
    if (y <= depthProfile[0][0]) return depthProfile[0][1];
    if (y >= depthProfile[depthProfile.length - 1][0]) return depthProfile[depthProfile.length - 1][1];
    for (let i = 1; i < depthProfile.length; i++) {
      const [ay, ad] = depthProfile[i - 1], [by, bd] = depthProfile[i];
      if (y <= by) {
        const t = (y - ay) / (by - ay);
        return ad + (bd - ad) * t;
      }
    }
    return depthProfile[depthProfile.length - 1][1];
  }

  function depth(x, y) {
    const half = Math.max(.04, widthAt(y));
    const edge = Math.min(.999, Math.abs(x / half));
    let z = baseDepth(y) * Math.sqrt(Math.max(0, 1 - edge * edge));

    // Skull, brow ridge and eye sockets. A flat, upright forehead with a distinct
    // brow shelf reads as natural rather than sloped.
    z += .035 * g(x, y, 0, -1.05, .5, .4);
    for (const side of [-1, 1]) {
      z += .125 * g(x, y, side * .32, -.42, .28, .07); // brows (sharper shelf)
      z -= .155 * g(x, y, side * .315, -.275, .19, .105); // eye sockets
      z += .055 * g(x, y, side * .315, -.20, .19, .06); // lower lids
      z += .135 * g(x, y, side * .42, .05, .26, .18); // cheekbones
      z -= .085 * g(x, y, side * .43, .31, .24, .22); // cheek hollows
      z += .105 * g(x, y, side * .50, .70, .20, .21); // jaw corners (more angular)
      z += .10 * g(x, y, side * .09, .10, .075, .09); // nose wings
      z -= .075 * g(x, y, side * .075, .17, .042, .028); // nostrils
    }

    // Straight bridge, moderate tip and a defined philtrum.
    z += .085 * g(x, y, 0, -.18, .075, .30);
    z += .155 * g(x, y, 0, .105, .115, .13);
    z += .07 * g(x, y, 0, .29, .12, .07);
    z += .04 * g(x, y, 0, .41, .20, .08);

    const mouthY = .54 + .035 * (x / .30) ** 2;
    z += .060 * g(x, y, 0, mouthY - .035, .27, .035);
    z += .072 * g(x, y, 0, mouthY + .055, .26, .040);
    z -= .085 * g(x, y, 0, mouthY + .006, .29, .018);
    z += .165 * g(x, y, 0, 1.00, .36, .23); // squared, forward chin
    z -= .02 * g(x, y, 0, .78, .26, .05); // under-lip hollow
    return z;
  }

  const points = [];
  // Dense front surface. A little more density around the features keeps the face readable.
  for (let i = 0; i < 38500; i++) {
    const y = -1.41 + random() * 2.63;
    const x = (random() * 2 - 1) * widthAt(y);
    const z = depth(x, y);
    const e = .003;
    let nx = -(depth(x + e, y) - depth(x - e, y)) / (2 * e);
    let ny = -(depth(x, y + e) - depth(x, y - e)) / (2 * e);
    let nz = 1;
    const length = Math.hypot(nx, ny, nz);
    nx /= length; ny /= length; nz /= length;
    const eye = Math.abs(Math.abs(x) - .315) < .16 && Math.abs(y + .275) < .038;
    if (eye) continue;
    const hairline = y < -1.08 && random() < .38;
    const lip = y > .40 && y < .72 && Math.abs(x) < .30;
    points.push({x, y, z, nx, ny, nz, a: hairline ? .34 + random() * .28 : .52 + random() * .48, lip, eye: false});
  }

  // Rear skull volume makes the side profile read as a head instead of a flat mask.
  for (let i = 0; i < 10500; i++) {
    const y = -1.38 + random() * 2.58;
    const angle = Math.PI / 2 + random() * Math.PI;
    const x = Math.sin(angle) * widthAt(y);
    const z = Math.cos(angle) * .59;
    points.push({x, y, z, nx: Math.sin(angle), ny: 0, nz: Math.cos(angle), a: .40 + random() * .28, eye: false});
  }

  // Almond-shaped eyes sit beneath the brow, with a small inner highlight.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 760; i++) {
      const u = random() * 2 - 1;
      const v = random() * 2 - 1;
      const x = side * .315 + u * .155;
      const y = -.275 + v * .038 * Math.sqrt(Math.max(0, 1 - u * u));
      const z = depth(x, -.275) + .040;
      points.push({x, y, z, nx: 0, ny: 0, nz: 1, a: .54 + random() * .32, eye: true});
    }

    // Ear: a C-shaped outer helix open toward the face, an inner antihelix fold, a
    // shallow concha bowl and a soft rounded lobe — reads as an ear, not a ring.
    const earCx = side * .805, earCy = -.01, earRx = .125, earRy = .215;
    for (let i = 0; i < 360; i++) {
      const a = -.30 * Math.PI + random() * 1.5 * Math.PI;
      const rr = .84 + random() * .16;
      const ex = Math.cos(a) * earRx * rr, ey = Math.sin(a) * earRy * rr;
      const curl = Math.max(0, Math.cos(a * .5));
      const z = .03 + .05 * (1 - rr) + .05 * curl + random() * .02;
      points.push({x: earCx + ex, y: earCy + ey, z, nx: side * (.3 + ex * 1.2), ny: ey, nz: .8, a: .34 + random() * .3, eye: false});
    }
    for (let i = 0; i < 190; i++) {
      const a = -.05 * Math.PI + random() * 1.05 * Math.PI;
      const rr = .46 + random() * .16;
      const x = earCx + Math.cos(a) * earRx * rr, y = earCy + .015 + Math.sin(a) * earRy * rr;
      const z = .05 + random() * .02;
      points.push({x, y, z, nx: side * .3, ny: 0, nz: .9, a: .30 + random() * .26, eye: false});
    }
    for (let i = 0; i < 150; i++) {
      const a = random() * Math.PI * 2, rr = random() * .32;
      const x = earCx + Math.cos(a) * earRx * rr, y = earCy - .03 + Math.sin(a) * earRy * rr;
      const z = -.01 + random() * .015;
      points.push({x, y, z, nx: side * .2, ny: 0, nz: .95, a: .22 + random() * .2, eye: false});
    }
    for (let i = 0; i < 120; i++) {
      const a = random() * Math.PI * 2, rr = Math.sqrt(random());
      const x = earCx + Math.cos(a) * earRx * .55 * rr, y = earCy + earRy * .92 + Math.sin(a) * earRy * .4 * rr;
      const z = .045 + random() * .045;
      points.push({x, y, z, nx: side * .4, ny: .3, nz: .87, a: .32 + random() * .28, eye: false});
    }
  }

  // Teeth: a small bright row sized to the mouth opening, hidden behind closed lips
  // and only revealed once the speak animation parts them.
  for (let i = 0; i < 260; i++) {
    const x = (random() * 2 - 1) * .22;
    const my = .54 + .035 * (x / .30) ** 2;
    const upper = i % 2 === 0;
    const y = my + (upper ? -.014 : .014);
    const z = depth(x, my) + .05;
    points.push({x, y, z, nx: 0, ny: 0, nz: 1, a: .85 + random() * .15, eye: false, teeth: true, lowerTeeth: !upper});
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
