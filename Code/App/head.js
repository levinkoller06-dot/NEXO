// Natural male head surface. Coordinates: x right, y down, z toward viewer.
// The reference is translated into anatomy and proportions; no image is embedded.
function createHeadPoints() {
  let seed = 1847;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const g = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));

  // A narrower forehead, straighter jaw line and squared, forward chin give the head
  // a more angular, masculine silhouette (short-hair fade, defined jaw reference).
  const contour = [
    [-1.42, .16], [-1.35, .36], [-1.18, .52], [-.96, .62], [-.70, .665],
    [-.42, .675], [-.12, .665], [.16, .64], [.38, .60], [.55, .555],
    [.70, .49], [.82, .41], [.92, .34], [1.02, .27], [1.12, .22], [1.24, .19]
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
    [-1.42, .30], [-1.05, .365], [-.75, .38], [-.42, .395],
    [-.10, .40], [.20, .385], [.55, .375], [.77, .375],
    [.95, .405], [1.10, .35], [1.24, .25]
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

    // Skull, brow ridge and eye sockets. A narrower, less forward-sloped forehead
    // with a distinct brow shelf reads as upright rather than sloped.
    z += .035 * g(x, y, 0, -1.05, .5, .4);
    for (const side of [-1, 1]) {
      z += .125 * g(x, y, side * .30, -.42, .26, .07); // brows (sharper shelf)
      z -= .155 * g(x, y, side * .29, -.275, .19, .105); // eye sockets
      z += .055 * g(x, y, side * .29, -.20, .19, .06); // lower lids
      z += .135 * g(x, y, side * .39, .05, .24, .18); // cheekbones
      z -= .085 * g(x, y, side * .40, .31, .22, .22); // cheek hollows
      z += .105 * g(x, y, side * .47, .70, .18, .21); // jaw corners (more angular)
      z += .10 * g(x, y, side * .09, .10, .075, .09); // nose wings
      z -= .075 * g(x, y, side * .075, .17, .042, .028); // nostrils
    }

    // Straight bridge, moderate tip and a defined philtrum.
    z += .085 * g(x, y, 0, -.18, .075, .30);
    z += .155 * g(x, y, 0, .105, .115, .13);
    z += .07 * g(x, y, 0, .29, .12, .07);
    z += .04 * g(x, y, 0, .41, .20, .08);

    const mouthY = .54 + .035 * (x / .28) ** 2;
    z += .060 * g(x, y, 0, mouthY - .035, .25, .035);
    z += .072 * g(x, y, 0, mouthY + .055, .24, .040);
    z -= .085 * g(x, y, 0, mouthY + .006, .27, .018);
    z += .165 * g(x, y, 0, 1.00, .34, .23); // squared, forward chin
    z -= .02 * g(x, y, 0, .78, .24, .05); // under-lip hollow
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
    const eye = Math.abs(Math.abs(x) - .29) < .16 && Math.abs(y + .275) < .038;
    if (eye) continue;
    const hairline = y < -1.08 && random() < .38;
    points.push({x, y, z, nx, ny, nz, a: hairline ? .34 + random() * .28 : .52 + random() * .48, lip: y > .47 && y < .65, eye: false});
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
      const x = side * .29 + u * .155;
      const y = -.275 + v * .038 * Math.sqrt(Math.max(0, 1 - u * u));
      const z = depth(x, -.275) + .040;
      points.push({x, y, z, nx: 0, ny: 0, nz: 1, a: .54 + random() * .32, eye: true});
    }
    // Smaller, flatter ear rims keep the focus on the face.
    for (let i = 0; i < 720; i++) {
      const angle = random() * Math.PI * 2;
      const radius = .82 + random() * .18;
      const x = side * (.70 + Math.cos(angle) * .065 * radius);
      const y = -.02 + Math.sin(angle) * .19 * radius;
      const z = .015 + random() * .065;
      points.push({x, y, z, nx: side * .46, ny: 0, nz: .88, a: .30 + random() * .35, eye: false});
    }
  }
  return points;
}
