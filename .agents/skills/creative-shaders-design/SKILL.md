---
name: creative-shaders-design
description: Creative coding, WebGL/GLSL shader engineering, procedural noise (Simplex/Perlin/FBM, Domain Warping), Bayer matrix dithering, fluid mechanics, and high-performance reactive UI canvas backgrounds. Use when designing, reverse-engineering, creating, or optimizing generative backgrounds, shader animations, liquid ribbons, topography, or artistic visuals.
---

# Creative Shaders & Generative UI Design

Specialized guide for building production-grade, 60 FPS WebGL shader effects, generative art, and fluid UI backgrounds without CPU overhead.

## When to Use This Skill
- Designing or implementing interactive/animated canvas backgrounds in web and desktop apps.
- Building procedural fluid, topography, liquid silk, caustics, or wave simulations.
- Replicating and reverse-engineering WebGL/Canvas visual effects from modern web experiences (e.g. Awwwards, Stripe, Vercel, Nedohackers).
- Applying Ordered Dithering (Bayer Matrix), Halftone, ASCII, or retro post-processing filters.
- Eliminating frame drops and CPU spikes by moving animation logic to GPU fragment shaders.

---

## 1. Core Architecture Principles

### Zero-CPU Overhead via Fullscreen Quad
Instead of calculating particle positions or DOM elements in JavaScript, render a single fullscreen quad (2 triangles) and compute all visual complexity on the GPU per-pixel in the fragment shader.

```text
WebGL Canvas (100% viewport)
  ├── Vertex Shader: Passes 2 triangles covering [-1, -1] to [1, 1]
  └── Fragment Shader: Computes procedural noise, warping, lighting, dithering per pixel
```

### Essential Uniforms
Always bind and feed these standard uniforms:
- `uniform vec2 resolution;` — Display dimensions in physical pixels (`width * dpr`, `height * dpr`).
- `uniform float time;` — Elapsed time in seconds (`performance.now() / 1000.0`).
- `uniform vec2 mousePos;` — Normalized or screen-space pointer coordinates with damped inertia (`lerp`).

---

## 2. Procedural Noise Foundations (GLSL)

### Simplex Noise 2D (Fast & Smooth)
```glsl
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
```

### Fractal Brownian Motion (FBM) with Rotation
Rotational matrices prevent directional bias artifacts between octave layers:
```glsl
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
  for (int i = 0; i < 4; ++i) {
    v += a * snoise(p);
    p = rot * p * 2.1 + shift;
    a *= 0.5;
  }
  return v;
}
```

### Domain Warping (Liquid Silk & Organic Ribbons)
Passing noise output into coordinates of subsequent noise calls creates fluid, smoke, and liquid caustics:
```glsl
// Dual-layer domain warp
vec2 q = vec2(fbm(uv + vec2(0.0, t * 0.4)),
              fbm(uv + vec2(5.2, 1.3 - t * 0.3)));

vec2 r = vec2(fbm(uv + 3.5 * q + vec2(1.7, 9.2) + t * 0.5),
              fbm(uv + 3.5 * q + vec2(8.3, 2.8) - t * 0.4));

float pattern = fbm(uv + 3.0 * r);
```

---

## 3. Ordered Dithering (Bayer 8×8 Matrix)

When a retro, lo-fi, or pixelated topographic look is desired:
```glsl
float getBayerValue(int index) {
  // Bayer 8x8 threshold matrix (values 0..63 divided by 64.0)
  if (index == 0) return 0.0/64.0;   if (index == 1) return 48.0/64.0;
  if (index == 2) return 12.0/64.0;  if (index == 3) return 60.0/64.0;
  // ... standard 8x8 table
  return 21.0/64.0;
}

vec3 dither(vec2 coord, vec3 color, float pixelSize, float colorNum) {
  vec2 scaledCoord = floor(coord / pixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = getBayerValue(y * 8 + x) - 0.25;
  float stepVal = 1.0 / (colorNum - 1.0);
  color += threshold * stepVal;
  color = clamp(color - 0.15, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}
```

---

## 4. UI Best Practices for Shader Backgrounds

1. **Subtle & Non-Intrusive**:
   - Backgrounds must never distract from text or interactive controls.
   - Restrict brightness to deep charcoal, smoky graphite, and muted silver/titanium unless explicitly asked for neon.
   - Use radial vignettes (`smoothstep(1.2, 0.2, length(p))`) to naturally darken edges.

2. **Pointer Inertia (Lerp Smoothing)**:
   - Never feed raw mouse coordinates directly into uniforms; interpolate with damping (`current += (target - current) * 0.05`) for fluid, physical sensation.

3. **Performance Safeguards**:
   - Cap `devicePixelRatio` to `1.5` or `2.0` on high-DPI displays to prevent fill-rate bottlenecks.
   - Use `ResizeObserver` with `cancelAnimationFrame` and full WebGL resource cleanup on unmount.
