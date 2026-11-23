# Build A Shinobi! – Madara's ultimate: Perfect Susanoo (pixelfx: madara-ult-perfect-susanoo).
# A 20 s pixel cutscene (24 fps, frames 1-480, rendered at 480x270, upscaled nearest-neighbour to 1920x1080).
# One scene. The main action is 3D (a stormy rocky valley, Madara as a cut-out rig made from the user's turnaround,
# a wooden dragon built from a path, the user's blue Susanoo sprite as a cut-out rig with its sword arm and katana);
# the ten panels of the user's storyboard are ten 2.5D insert stages far away from the world, each split into layers
# (figure / foreground / background / effects) by colour and region, each with its own animation, filmed by its own
# orthographic camera. Timeline markers switch the cameras (INSERT_01..INSERT_10 and SHOT_xx).
# Run:  blender.exe -b --python cine_madara.py -- [--render] [--frames a-b] [--every n]
import bpy, math, os, sys, random
import numpy as np
from mathutils import Vector, Euler

ROOT = r"C:\Users\yanni\Downloads\BuildAShinobi_JutsuModels"
CINE = os.path.join(ROOT, r"pixelfx\assets\cine\madara-ult")
REF, SPR, LAY = os.path.join(CINE, "ref"), os.path.join(CINE, "sprites"), os.path.join(CINE, "layers")
OUT = os.path.join(ROOT, r"blender\cine_madara")
BLEND = os.path.join(ROOT, r"blender\MadaraUlt_PerfectSusanoo.blend")
W, H, FPS, F0, F1 = 480, 270, 24, 1, 480
INSERTS = {1: (13, 23), 2: (34, 50), 3: (79, 94), 4: (119, 140), 5: (154, 163), 6: (182, 201), 7: (230, 248), 8: (279, 298), 9: (307, 320), 10: (371, 404)}
rng = random.Random(7)
os.makedirs(LAY, exist_ok=True)
os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)


# ================================================================ small helpers
def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


def srgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def smooth(a, b, x):
    if b == a:
        return 1.0 if x >= b else 0.0
    u = min(1.0, max(0.0, (x - a) / (b - a)))
    return u * u * (3 - 2 * u)


def ease_out(u):
    u = min(1.0, max(0.0, u))
    return 1 - (1 - u) ** 3


def ease_in(u):
    u = min(1.0, max(0.0, u))
    return u ** 3


def link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def key(ob, f, loc=None, rot=None, scl=None):
    if loc is not None:
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
    if rot is not None:
        ob.rotation_euler = rot
        ob.keyframe_insert("rotation_euler", frame=f)
    if scl is not None:
        ob.scale = (scl, scl, scl) if isinstance(scl, (int, float)) else scl
        ob.keyframe_insert("scale", frame=f)


def key_val(sock, f, v):
    sock.default_value = v
    sock.keyframe_insert("default_value", frame=f)


def key_hide(ob, f, hidden):
    ob.hide_render = hidden
    ob.hide_viewport = hidden
    ob.keyframe_insert("hide_render", frame=f)
    ob.keyframe_insert("hide_viewport", frame=f)


def linear_all():
    for a in bpy.data.actions:
        for fc in getattr(a, "fcurves", []):
            for kp in fc.keyframe_points:
                if kp.interpolation != "CONSTANT":
                    kp.interpolation = "LINEAR"


# ================================================================ images (numpy, top-down rows, sRGB 0..1, RGBA)
def load_rgba(path, size=None):
    img = bpy.data.images.load(path, check_existing=True)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]
    if size:
        tw, th = size
        ys = ((np.arange(th) + 0.5) * h / th).astype(int)
        xs = ((np.arange(tw) + 0.5) * w / tw).astype(int)
        a = a[ys][:, xs]
    return a.copy()


def make_image(name, arr, save=True):
    h, w = arr.shape[:2]
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(name, w, h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1]).ravel().astype(np.float32))
    if save:
        p = os.path.join(LAY, name + ".png")
        img.filepath_raw = p
        img.file_format = "PNG"
        img.save()
    img.pack()
    return img


def hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-6
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return hue, np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0), mx


def poly_mask(pts, w=W, h=H):
    yy, xx = np.mgrid[0:h, 0:w]
    x, y = xx + 0.5, yy + 0.5
    ins = np.zeros((h, w), bool)
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        cond = ((y1 > y) != (y2 > y)) & (x < (x2 - x1) * (y - y1) / ((y2 - y1) if y2 != y1 else 1e-9) + x1)
        ins ^= cond
    return ins


def rect(x0, y0, x1, y1, w=W, h=H):
    m = np.zeros((h, w), bool)
    m[max(0, y0):y1, max(0, x0):x1] = True
    return m


def dilate(m, n=1):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m


def inpaint(a, hole, iters=400):
    """fill the hole pixels from their neighbours, outward in (rows stay plausible: horizontal first)."""
    a = a.copy()
    known = ~hole
    for _ in range(iters):
        if known.all():
            break
        acc = np.zeros(a.shape[:2] + (3,), np.float32)
        cnt = np.zeros(a.shape[:2], np.float32)
        for dy, dx, wgt in ((0, 1, 1.0), (0, -1, 1.0), (1, 0, 0.6), (-1, 0, 0.6)):
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(a[..., :3], dy, 0), dx, 1)
            acc += v * (k[..., None] * wgt)
            cnt += k * wgt
        new = (~known) & (cnt > 0)
        a[new, :3] = acc[new] / cnt[new][:, None]
        a[new, 3] = 1
        known = known | new
    return a


def layer(arr, mask):
    out = arr.copy()
    out[..., 3] = np.where(mask, arr[..., 3], 0)
    return out


def components(mask, min_area=20):
    """connected components (4-neighbour) of a boolean mask, as a list of masks."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    comps, cur = [], 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        cur += 1
        stack, pts = [(y0, x0)], []
        lab[y0, x0] = cur
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = cur
                    stack.append((yy, xx))
        if len(pts) >= min_area:
            m = np.zeros((h, w), bool)
            ys, xs = zip(*pts)
            m[list(ys), list(xs)] = True
            comps.append(m)
    return comps


def noise_img(name, w, h, col, alpha, scale=8, seed=1, thresh=0.5, col2=None):
    """a soft-edged blotchy pixel texture (fog, dust) of one or two colours."""
    r = np.random.RandomState(seed)
    gh, gw = max(2, h // scale + 2), max(2, w // scale + 2)
    g = r.rand(gh, gw)
    ys = np.linspace(0, gh - 1.001, h)
    xs = np.linspace(0, gw - 1.001, w)
    y0, x0 = ys.astype(int), xs.astype(int)
    fy, fx = (ys - y0)[:, None], (xs - x0)[None, :]
    v = (g[y0][:, x0] * (1 - fx) + g[y0][:, x0 + 1] * fx) * (1 - fy) + (g[y0 + 1][:, x0] * (1 - fx) + g[y0 + 1][:, x0 + 1] * fx) * fy
    v = v * (0.6 + 0.4 * r.rand(h, w) ** 4)
    a = np.zeros((h, w, 4), np.float32)
    c1 = srgb(col)
    c2 = srgb(col2) if col2 else c1
    on = v > thresh
    a[..., :3] = np.where((v > thresh + 0.12)[..., None], c2, c1)
    a[..., 3] = np.where(on, alpha, 0)
    return make_image(name, a)


# ================================================================ materials
def _clear(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return nt, nt.nodes, nt.links


def _render_method(mat):
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "DITHERED"
    if hasattr(mat, "blend_method"):
        try:
            mat.blend_method = "CLIP"
        except Exception:
            pass


def flat_mat(name, img, uv_wave=False, wrap=False, tint=None):
    """unlit pixel texture: Closest sampling, hard alpha, an opacity value and a UV offset to animate; optionally a
    sideways UV wave (for an S-curving body) and a tint (colour, amount) to animate."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _clear(mat)
    out = N.new("ShaderNodeOutputMaterial")
    tex = N.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    tex.extension = "REPEAT" if wrap else "CLIP"
    uv = N.new("ShaderNodeTexCoord")
    off = N.new("ShaderNodeVectorMath")
    off.operation = "ADD"
    off.inputs[1].default_value = (0, 0, 0)
    L.new(uv.outputs["UV"], off.inputs[0])
    vec = off.outputs[0]
    if uv_wave:
        sep = N.new("ShaderNodeSeparateXYZ")
        L.new(vec, sep.inputs[0])
        ph = N.new("ShaderNodeValue"); ph.name = "phase"
        amp = N.new("ShaderNodeValue"); amp.name = "amp"
        m1 = N.new("ShaderNodeMath"); m1.operation = "MULTIPLY"; m1.inputs[1].default_value = 9.0
        L.new(sep.outputs[0], m1.inputs[0])
        m2 = N.new("ShaderNodeMath"); m2.operation = "ADD"
        L.new(m1.outputs[0], m2.inputs[0]); L.new(ph.outputs[0], m2.inputs[1])
        m3 = N.new("ShaderNodeMath"); m3.operation = "SINE"
        L.new(m2.outputs[0], m3.inputs[0])
        m4 = N.new("ShaderNodeMath"); m4.operation = "MULTIPLY"
        L.new(m3.outputs[0], m4.inputs[0]); L.new(amp.outputs[0], m4.inputs[1])
        m5 = N.new("ShaderNodeMath"); m5.operation = "ADD"
        L.new(sep.outputs[1], m5.inputs[0]); L.new(m4.outputs[0], m5.inputs[1])
        comb = N.new("ShaderNodeCombineXYZ")
        L.new(sep.outputs[0], comb.inputs[0]); L.new(m5.outputs[0], comb.inputs[1])
        vec = comb.outputs[0]
    L.new(vec, tex.inputs[0])
    col = tex.outputs["Color"]
    if tint is not None:
        mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.name = "tint"
        mix.inputs[0].default_value = 0.0
        cins = [i for i in mix.inputs if i.type == "RGBA"]
        L.new(col, cins[0]); cins[1].default_value = lin(tint)
        col = [o for o in mix.outputs if o.type == "RGBA"][0]
    em = N.new("ShaderNodeEmission")
    L.new(col, em.inputs[0])
    tr = N.new("ShaderNodeBsdfTransparent")
    op = N.new("ShaderNodeValue"); op.name = "opacity"; op.outputs[0].default_value = 1.0
    ma = N.new("ShaderNodeMath"); ma.operation = "MULTIPLY"
    L.new(tex.outputs["Alpha"], ma.inputs[0]); L.new(op.outputs[0], ma.inputs[1])
    gt = N.new("ShaderNodeMath"); gt.operation = "GREATER_THAN"; gt.inputs[1].default_value = 0.5
    L.new(ma.outputs[0], gt.inputs[0])
    mix = N.new("ShaderNodeMixShader")
    L.new(gt.outputs[0], mix.inputs[0]); L.new(tr.outputs[0], mix.inputs[1]); L.new(em.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs[0])
    _render_method(mat)
    return mat


def emit_mat(name, col, alpha=1.0):
    """a flat glowing colour (energy, flashes); alpha < 1 dithers."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _clear(mat)
    out = N.new("ShaderNodeOutputMaterial")
    em = N.new("ShaderNodeEmission"); em.inputs[0].default_value = lin(col)
    tr = N.new("ShaderNodeBsdfTransparent")
    op = N.new("ShaderNodeValue"); op.name = "opacity"; op.outputs[0].default_value = alpha
    mix = N.new("ShaderNodeMixShader")
    L.new(op.outputs[0], mix.inputs[0]); L.new(tr.outputs[0], mix.inputs[1]); L.new(em.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs[0])
    _render_method(mat)
    return mat


def toon_mat(name, stops, wood=False, noise=0.0):
    """toon: Diffuse -> Shader to RGB -> constant ramp -> Emission; wood: concentric rings (Wave texture) darken it."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _clear(mat)
    out = N.new("ShaderNodeOutputMaterial")
    dif = N.new("ShaderNodeBsdfDiffuse")
    s2r = N.new("ShaderNodeShaderToRGB")
    L.new(dif.outputs[0], s2r.inputs[0])
    bw = N.new("ShaderNodeRGBToBW")
    L.new(s2r.outputs[0], bw.inputs[0])
    val = bw.outputs[0]
    if wood or noise:
        tex = N.new("ShaderNodeTexWave") if wood else N.new("ShaderNodeTexNoise")
        if wood:
            tex.wave_type = "RINGS"; tex.inputs["Scale"].default_value = 2.2; tex.inputs["Distortion"].default_value = 2.5
        else:
            tex.inputs["Scale"].default_value = 3.0
        mul = N.new("ShaderNodeMath"); mul.operation = "MULTIPLY_ADD"
        L.new(tex.outputs["Fac"], mul.inputs[0]); mul.inputs[1].default_value = -(0.35 if wood else noise); L.new(val, mul.inputs[2])
        val = mul.outputs[0]
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    while len(els) < len(stops):
        els.new(0.5)
    for e, (p, c) in zip(els, stops):
        e.position = p
        e.color = lin(c)
    L.new(val, ramp.inputs[0])
    em = N.new("ShaderNodeEmission")
    L.new(ramp.outputs[0], em.inputs[0])
    L.new(em.outputs[0], out.inputs[0])
    return mat


def node(mat, name):
    return mat.node_tree.nodes[name]


# ================================================================ geometry
def card(name, w, h, mat, pivot=(0.5, 0.0), coll=None, upright=True):
    """a w x h plane with its origin at pivot (fractions of the image, from the bottom left); upright: standing in XZ."""
    mesh = bpy.data.meshes.new(name)
    px, py = pivot
    xs = (-px * w, (1 - px) * w)
    ys = (-py * h, (1 - py) * h)
    if upright:
        verts = [(xs[0], 0, ys[0]), (xs[1], 0, ys[0]), (xs[1], 0, ys[1]), (xs[0], 0, ys[1])]
    else:
        verts = [(xs[0], ys[0], 0), (xs[1], ys[0], 0), (xs[1], ys[1], 0), (xs[0], ys[1], 0)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    uvl = mesh.uv_layers.new()
    for i, uv in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        uvl.data[i].uv = uv
    ob = bpy.data.objects.new(name, mesh)
    ob.data.materials.append(mat)
    return link(ob, coll)


def cam(name, loc, rot, ortho=None, lens=35, coll=None):
    cd = bpy.data.cameras.new(name)
    if ortho:
        cd.type = "ORTHO"
        cd.ortho_scale = ortho
    else:
        cd.lens = lens
    cd.clip_start, cd.clip_end = 0.05, 3000
    ob = bpy.data.objects.new(name, cd)
    ob.location, ob.rotation_euler = loc, rot
    return link(ob, coll)


def look_at(ob, target, roll=0.0):
    d = Vector(target) - ob.location
    q = d.to_track_quat("-Z", "Y")
    e = q.to_euler()
    ob.rotation_euler = e
    if roll:
        ob.rotation_euler.rotate_axis("Z", roll)


# ================================================================ the scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = F0, F1
    sc.render.filter_size = 0.0
    try:
        sc.eevee.taa_render_samples = 1
    except Exception:
        pass
    sc.view_settings.view_transform = "Standard"
    sc.render.image_settings.file_format = "PNG"
    sc.render.film_transparent = False
    world = bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = lin("#4a5068")
    return sc


# ---------------------------------------------------------------- 1. the 3D world: a stormy rocky valley
def build_world():
    C = collection("WORLD")
    # terrain: a big displaced grid, low and rocky near, rising into ridges at the back
    n = 120
    S = 900.0
    verts, faces = [], []
    r = np.random.RandomState(3)
    g = r.rand(16, 16)
    for j in range(n + 1):
        for i in range(n + 1):
            x, y = (i / n - 0.5) * S, (j / n - 0.25) * S
            gx, gy = i / n * 14.99, j / n * 14.99
            x0, y0 = int(gx), int(gy)
            fx, fy = gx - x0, gy - y0
            v = (g[y0, x0] * (1 - fx) + g[y0, x0 + 1] * fx) * (1 - fy) + (g[y0 + 1, x0] * (1 - fx) + g[y0 + 1, x0 + 1] * fx) * fy
            ridge = max(0.0, (y - 120) / 400) ** 1.4 * 140
            z = (v - 0.5) * 10 + ridge * (0.6 + 0.8 * v)
            if abs(x) < 160 and -80 < y < 120:
                z *= 0.04 + 0.96 * max(0.0, (abs(x) - 120) / 40, (y - 80) / 40)
            verts.append((x, y, z))
    for j in range(n):
        for i in range(n):
            a = j * (n + 1) + i
            faces.append((a, a + 1, a + n + 2, a + n + 1))
    me = bpy.data.meshes.new("terrain")
    me.from_pydata(verts, [], faces)
    for p in me.polygons:
        p.use_smooth = False
    ter = bpy.data.objects.new("Terrain", me)
    ter.data.materials.append(toon_mat("M_terrain", [(0.0, "#14151e"), (0.3, "#2c2f40"), (0.55, "#4e5372"), (0.8, "#8288a8")], noise=0.25))
    link(ter, C)
    # far mountains: a ring of jagged cones, paler with distance
    mm = toon_mat("M_mountain", [(0.0, "#2a2c3e"), (0.4, "#44485e"), (0.7, "#6a7090")])
    for k in range(9):
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=rng.uniform(80, 140), depth=rng.uniform(110, 190), location=(rng.uniform(-420, 420), rng.uniform(380, 520), 30))
        m = bpy.context.active_object
        m.rotation_euler = (0, 0, rng.uniform(0, 3))
        m.data.materials.append(mm)
        for c in m.users_collection:
            c.objects.unlink(m)
        C.objects.link(m)
    # the sky: a huge curved backdrop of storm clouds behind everything
    sky = noise_img("sky_clouds", 480, 160, "#5a6078", 1.0, scale=10, seed=5, thresh=-1, col2="#7a809c")
    skyc = card("Sky", 2600, 900, flat_mat("M_sky", sky), pivot=(0.5, 0.3), coll=C)
    skyc.location = (0, 1100, -100)
    # cloud bands drifting
    for k in range(4):
        im = noise_img("cloud_%d" % k, 240, 60, ["#6a7090", "#8a90aa", "#4a4e66", "#9aa0bc"][k], 1.0, scale=6, seed=10 + k, thresh=0.52)
        cc = card("Cloud%d" % k, 2400, 300, flat_mat("M_cloud%d" % k, im), pivot=(0.5, 0.5), coll=C)
        cc.location = (rng.uniform(-200, 200), 900 - k * 40, 220 + k * 70)
        key(cc, F0, loc=cc.location.copy())
        key(cc, F1, loc=cc.location + Vector((80 + 40 * k, 0, 0)))
    # the sun (cold, from the upper left) for the toon steps
    sd = bpy.data.lights.new("Sun", "SUN")
    sd.energy = 4.0
    sun = bpy.data.objects.new("Sun", sd)
    sun.rotation_euler = Euler((math.radians(50), math.radians(-30), math.radians(35)))
    link(sun, C)
    return C


# ---------------------------------------------------------------- 2. characters as cut-out rigs
def turnaround_views():
    """the user's turnaround: four views, white keyed out, brought down to the drawing's own pixel grid."""
    a = load_rgba(os.path.join(REF, "turnaround.png"))
    h, w = a.shape[:2]
    white = (a[..., 3] < 0.5) | (a[..., :3].min(axis=2) > 0.88)  # transparent (or white) around the figures
    cols = (~white).any(axis=0)
    # split at the white gaps between the four figures
    spans, x = [], 0
    while x < w:
        if cols[x]:
            x1 = x
            while x1 < w and (cols[x1:x1 + 12].any()):
                x1 += 1
            spans.append((x, x1))
            x = x1
        x += 1
    spans = [s for s in spans if s[1] - s[0] > 60][:4]
    views = []
    for (x0, x1) in spans:
        sub = a[:, x0:x1]
        rows = (~white[:, x0:x1]).any(axis=1)
        ys = np.nonzero(rows)[0]
        sub = sub[ys[0]:ys[-1] + 1]
        sh, sw = sub.shape[:2]
        th = 150  # the drawing's own grid: about 150 cells tall
        tw = max(8, int(round(sw * th / sh)))
        yi = ((np.arange(th) + 0.5) * sh / th).astype(int)
        xi = ((np.arange(tw) + 0.5) * sw / tw).astype(int)
        v = sub[yi][:, xi].copy()
        keyw = (v[..., 3] < 0.5) | (v[..., :3].min(axis=2) > 0.88)
        v[..., 3] = np.where(keyw, 0, 1)
        views.append(v)
    return views  # front, back, side (facing left), back-side


def madara_rig(views, C):
    """Madara: a side card (facing right: the turnaround's profile mirrored) and a front card, each cut into parts on
    an armature: hair (the mane), head, shoulder plates, hip plates, gunbai; the rest is the body."""
    front, side = views[0], views[2][:, ::-1].copy()
    rig = {}
    for nm, v in (("front", front), ("side", side)):
        th, tw = v.shape[:2]
        scale = 2.2 / th  # 2.2 m tall chibi
        arm = bpy.data.armatures.new("ARM_madara_" + nm)
        ao = link(bpy.data.objects.new("RIG_madara_" + nm, arm), C)
        rig[nm] = {"rig": ao, "parts": {}, "w": tw * scale, "h": th * scale}
        # parts by region of the card (fractions of height from the top): mane above the brow, head, shoulders,
        # hip plates, gunbai (front: behind the left shoulder; side: on the back)
        regions = {
            "hair": rect(0, 0, tw, int(th * 0.30), tw, th),
            "head": rect(int(tw * 0.25), int(th * 0.22), int(tw * 0.75), int(th * 0.40), tw, th),
            "shoulders": rect(0, int(th * 0.40), tw, int(th * 0.52), tw, th),
            "hips": rect(0, int(th * 0.62), tw, int(th * 0.78), tw, th),
        }
        if nm == "front":
            regions["gunbai"] = rect(int(tw * 0.0), int(th * 0.42), int(tw * 0.22), int(th * 0.70), tw, th)
        else:
            regions["gunbai"] = rect(int(tw * 0.0), int(th * 0.38), int(tw * 0.30), int(th * 0.72), tw, th)
        taken = np.zeros((th, tw), bool)
        order = ["gunbai", "hair", "head", "shoulders", "hips"]
        for pn in order:
            m = regions[pn] & ~taken & (v[..., 3] > 0)
            taken |= m
            img = make_image("madara_%s_%s" % (nm, pn), layer(v, m))
            ob = card("madara_%s_%s" % (nm, pn), tw * scale, th * scale, flat_mat("M_madara_%s_%s" % (nm, pn), img, tint="#a070ff"), pivot=(0.5, 0.0), coll=C)
            ob.parent = ao
            rig[nm]["parts"][pn] = ob
        img = make_image("madara_%s_body" % nm, layer(v, ~taken & (v[..., 3] > 0)))
        ob = card("madara_%s_body" % nm, tw * scale, th * scale, flat_mat("M_madara_%s_body" % nm, img, tint="#a070ff"), pivot=(0.5, 0.0), coll=C)
        ob.parent = ao
        rig[nm]["parts"]["body"] = ob
        # z order inside the rig: gunbai behind (side) / body / hips / shoulders / head / hair in front
        zs = {"gunbai": 0.02 if nm == "side" else -0.02, "body": 0, "hips": -0.01, "shoulders": -0.012, "head": -0.014, "hair": -0.016}
        for pn, ob in rig[nm]["parts"].items():
            ob.location = (0, zs.get(pn, 0), 0)
    return rig


def sprite_card(name, path, height, pivot, C, tint=None):
    a = load_rgba(path)
    img = make_image(name, a)
    h, w = a.shape[:2]
    return card(name, height * w / h, height, flat_mat("M_" + name, img, tint=tint), pivot=pivot, coll=C), w, h


def susanoo_rig(C):
    """the Perfect Susanoo from the user's sprite: front card (for the reveal, split into helmet / chest / shoulders
    by region), side card as body + arm (on the shoulder) + katana (in the hand), and a chakra blade."""
    S = {}
    HT = 46.0
    # front, three reveal layers
    a = load_rgba(os.path.join(SPR, "susanooMadara_front.png"))
    h, w = a.shape[:2]
    S["front_parts"] = []
    for nm, m in (("helmet", rect(0, 0, w, int(h * 0.30), w, h)), ("chest", rect(int(w * 0.25), int(h * 0.30), int(w * 0.75), h, w, h)),
                  ("shoulders", rect(0, int(h * 0.30), w, h, w, h) & ~rect(int(w * 0.25), int(h * 0.30), int(w * 0.75), h, w, h))):
        img = make_image("susanoo_front_" + nm, layer(a, m & (a[..., 3] > 0)))
        ob = card("susanoo_front_" + nm, HT * w / h, HT, flat_mat("M_susanoo_front_" + nm, img, tint="#ffffff"), pivot=(0.5, 0), coll=C)
        S["front_parts"].append(ob)
    # the aura behind it: a slightly bigger, flat glow of its silhouette
    aura = a.copy()
    aura[..., :3] = srgb("#4a9cff")
    aura[..., 3] = np.where(dilate(a[..., 3] > 0, 2), 1, 0)
    img = make_image("susanoo_front_aura", aura)
    S["front_aura"] = card("susanoo_front_aura", HT * w / h * 1.02, HT * 1.02, flat_mat("M_susanoo_front_aura", img), pivot=(0.5, 0), coll=C)
    # side: body, arm, katana (pivots from the rig in src/fx/jutsu/_models.js: arm on (40,56), hand (34,104),
    # katana tip (2,146) in its 61x172 sprite)
    sw, sh = 61, 172
    k = HT / sh
    body, _, _ = sprite_card("susanoo_side_body", os.path.join(SPR, "susanooMadara_right_body.png"), HT, (0.5, 0), C, tint="#ffffff")
    armo, _, _ = sprite_card("susanoo_side_arm", os.path.join(SPR, "susanooMadara_right_arm.png"), HT, (40 / sw, 1 - 56 / sh), C, tint="#ffffff")
    kat, _, _ = sprite_card("susanoo_side_katana", os.path.join(SPR, "susanooMadara_right_katana.png"), HT, (34 / sw, 1 - 104 / sh), C, tint="#ffffff")
    armo.parent = body
    armo.location = ((40 - sw / 2) * k, -0.05, (sh - 56) * k)
    kat.parent = armo
    kat.location = ((34 - 40) * k, -0.02, (56 - 104) * k)
    # the chakra blade: a long glowing band out along the katana, lengthening with the cut
    blade = card("chakra_blade", 1.0, 1.4, emit_mat("M_chakra_blade", "#6ad8ff"), pivot=(0.0, 0.5), coll=C)
    core = card("chakra_blade_core", 1.0, 0.5, emit_mat("M_chakra_core", "#e8fbff"), pivot=(0.0, 0.5), coll=C)
    core.parent = blade
    core.location = (0, -0.01, 0)
    blade.parent = kat
    # along the katana: from the hand toward the tip (2,146): direction in the card
    ang = math.atan2(-(146 - 104), (2 - 34))
    blade.rotation_euler = (0, -ang, 0)
    S.update(body=body, arm=armo, katana=kat, blade=blade, k=k, katana_dir=ang)
    return S


def wood_dragon(C):
    """the wooden dragon: a thick path-built body with spikes, rings of grain, a head on the end with a jaw."""
    cu = bpy.data.curves.new("dragon_path", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER")
    pts = [(-30, 40, -30), (-26, 36, 0), (-18, 30, 22), (-6, 26, 34), (8, 22, 30), (18, 16, 18)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p, r in zip(sp.bezier_points, pts, (6.4, 6.0, 5.4, 4.8, 4.0, 3.2)):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
        bp.radius = r
    cu.bevel_depth = 1.0
    cu.bevel_resolution = 2
    cu.resolution_u = 16
    cu.use_fill_caps = True
    ob = link(bpy.data.objects.new("WoodDragon", cu), C)
    wm = toon_mat("M_wood", [(0.0, "#5a3e26"), (0.28, "#8a6440"), (0.55, "#c09868"), (0.8, "#e0c494")], wood=True)
    cu.materials.append(wm)
    # spikes along its back
    for i in range(14):
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.6, depth=6.0)
        s = bpy.context.active_object
        s.data.materials.append(wm)
        for c in s.users_collection:
            c.objects.unlink(s)
        C.objects.link(s)
        con = s.constraints.new("FOLLOW_PATH")
        con.target = ob
        con.use_fixed_location = True
        con.use_curve_follow = True
        con.offset_factor = 0.15 + i * 0.058
        s.rotation_euler = (0, math.radians(-60), 0)
        s.location = (0, 0, 4.4)
        s["path_u"] = con.offset_factor
    # the head: a long snout and a jaw that drops
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=2.6, radius2=0.8, depth=8)
    head = bpy.context.active_object
    head.name = "DragonHead"
    head.data.materials.append(wm)
    bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=1.6, radius2=0.5, depth=6)
    jaw = bpy.context.active_object
    jaw.name = "DragonJaw"
    jaw.data.materials.append(wm)
    for o in (head, jaw):
        for c in o.users_collection:
            c.objects.unlink(o)
        C.objects.link(o)
    hc = head.constraints.new("FOLLOW_PATH")
    hc.target = ob
    hc.use_fixed_location = True
    hc.use_curve_follow = True
    hc.forward_axis = "FORWARD_Z"
    hc.up_axis = "UP_Y"
    hc.offset_factor = 1.0
    jaw.parent = head
    jaw.location = (0, -1.6, -0.4)
    head.scale = (2.0, 2.0, 2.0)
    return ob, head, jaw


def silhouette_img(name, w=18, h=40):
    """the enemy: a dark cloaked figure, a few pixels wide."""
    a = np.zeros((h, w, 4), np.float32)
    a[..., :3] = srgb("#0e0c14")
    yy, xx = np.mgrid[0:h, 0:w]
    head = (xx - w / 2) ** 2 + (yy - 5) ** 2 < 12
    body = (yy > 8) & (np.abs(xx - w / 2) < 3 + (yy - 8) * 0.12)
    legs = (yy > 30) & ((np.abs(xx - w / 2 + 2) < 1.6) | (np.abs(xx - w / 2 - 2) < 1.6))
    a[..., 3] = (head | (body & (yy <= 31)) | legs).astype(np.float32)
    return make_image(name, a)


# ================================================================ main build
def build():
    sc = reset()
    CW = build_world()
    CC = collection("CHARACTERS")
    views = turnaround_views()
    MAD = madara_rig(views, CC)
    SUS = susanoo_rig(CC)
    DRAG, DHEAD, DJAW = wood_dragon(CC)
    en = card("Enemy", 0.9, 2.0, flat_mat("M_enemy", silhouette_img("enemy")), pivot=(0.5, 0), coll=CC)
    CV = collection("VFX")
    CI = collection("INSERTS")
    import cine_madara_shots as shots  # the animation and the inserts live in the companion module
    shots.animate(sc, MAD, SUS, (DRAG, DHEAD, DJAW), en, CW, CC, CV, CI)
    linear_all()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    return sc


def render(frames=None, every=1):
    sc = bpy.context.scene
    lo, hi = frames or (F0, F1)
    for f in range(lo, hi + 1, every):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, "frames", "%04d.png" % f)
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    build()
    if "--render" in argv:
        fr = None
        if "--frames" in argv:
            a, b = argv[argv.index("--frames") + 1].split("-")
            fr = (int(a), int(b))
        ev = int(argv[argv.index("--every") + 1]) if "--every" in argv else 1
        render(fr, ev)
