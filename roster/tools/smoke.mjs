// Render each listed effect fully (fps 12) and report errors, empty frames and how often drawn pixels touch the frame edge.
const LIB = "file:///C:/Users/yanni/Downloads/BuildAShinobi_JutsuModels/pixelfx/tools/lib/fxlib.mjs";
const { loadEffect, renderAct } = await import(LIB);
for (const id of process.argv.slice(2)) {
  try {
    const fx = await loadEffect("jutsu/" + id), r = renderAct(fx, { fps: 12, bg: "none", hold: 0.2, seconds: fx.meta.duration + 0.5 });
    let empty = 0, edge = 0;
    for (const f of r.frames) {
      let any = false, e = false;
      for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (f.color[(y * r.w + x) * 4 + 3] > 8) { any = true; if (x <= 1 || x >= r.w - 2 || y <= 1) e = true; }
      if (!any) empty++; if (e) edge++;
    }
    console.log(id.padEnd(34), "frames", r.frames.length, "empty", empty, "edge", edge, fx.meta.size.join("x"));
  } catch (err) { console.log(id.padEnd(34), "ERROR", String(err).slice(0, 160)); }
}
