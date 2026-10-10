import { useEffect, useRef } from 'react';

/**
 * Nedohackers-style Dithered Wave & Terminal/Console Shader:
 * - 60 FPS WebGL fragment shader with fullscreen quad
 * - Procedural 3D sine/cosine rotating topographic wave ribbons
 * - Slashed/cut wavefronts (dynamic slicing & domain warping)
 * - 8x8 Bayer Matrix ordered dithering (retro hacker screen-door texture)
 * - Reactive camera tilt & fluid mouse inertia
 * - Deep radial vignette
 */

export type LauncherTab = 'play' | 'instances' | 'mods' | 'accounts' | 'console';

interface DitherWaveCanvasProps {
  currentTab?: LauncherTab;
}

const VERT_SHADER_SRC = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG_SHADER_SRC = `
precision highp float;
varying vec2 vUv;

uniform vec2 resolution;
uniform float time;
uniform vec2 mousePos;
uniform float tabOffset;

// 8x8 Bayer dithering matrix
float getBayer8x8(vec2 coord) {
  int x = int(mod(coord.x, 8.0));
  int y = int(mod(coord.y, 8.0));
  int idx = y * 8 + x;
  
  // Standard normalized 8x8 Bayer matrix values
  if (idx == 0) return 0.0 / 64.0;
  if (idx == 1) return 32.0 / 64.0;
  if (idx == 2) return 8.0 / 64.0;
  if (idx == 3) return 40.0 / 64.0;
  if (idx == 4) return 2.0 / 64.0;
  if (idx == 5) return 34.0 / 64.0;
  if (idx == 6) return 10.0 / 64.0;
  if (idx == 7) return 42.0 / 64.0;
  if (idx == 8) return 48.0 / 64.0;
  if (idx == 9) return 16.0 / 64.0;
  if (idx == 10) return 56.0 / 64.0;
  if (idx == 11) return 24.0 / 64.0;
  if (idx == 12) return 50.0 / 64.0;
  if (idx == 13) return 18.0 / 64.0;
  if (idx == 14) return 58.0 / 64.0;
  if (idx == 15) return 26.0 / 64.0;
  if (idx == 16) return 12.0 / 64.0;
  if (idx == 17) return 44.0 / 64.0;
  if (idx == 18) return 4.0 / 64.0;
  if (idx == 19) return 36.0 / 64.0;
  if (idx == 20) return 14.0 / 64.0;
  if (idx == 21) return 46.0 / 64.0;
  if (idx == 22) return 6.0 / 64.0;
  if (idx == 23) return 38.0 / 64.0;
  if (idx == 24) return 60.0 / 64.0;
  if (idx == 25) return 28.0 / 64.0;
  if (idx == 26) return 52.0 / 64.0;
  if (idx == 27) return 20.0 / 64.0;
  if (idx == 28) return 62.0 / 64.0;
  if (idx == 29) return 30.0 / 64.0;
  if (idx == 30) return 54.0 / 64.0;
  if (idx == 31) return 22.0 / 64.0;
  if (idx == 32) return 3.0 / 64.0;
  if (idx == 33) return 35.0 / 64.0;
  if (idx == 34) return 11.0 / 64.0;
  if (idx == 35) return 43.0 / 64.0;
  if (idx == 36) return 1.0 / 64.0;
  if (idx == 37) return 33.0 / 64.0;
  if (idx == 38) return 9.0 / 64.0;
  if (idx == 39) return 41.0 / 64.0;
  if (idx == 40) return 51.0 / 64.0;
  if (idx == 41) return 19.0 / 64.0;
  if (idx == 42) return 59.0 / 64.0;
  if (idx == 43) return 27.0 / 64.0;
  if (idx == 44) return 49.0 / 64.0;
  if (idx == 45) return 17.0 / 64.0;
  if (idx == 46) return 57.0 / 64.0;
  if (idx == 47) return 25.0 / 64.0;
  if (idx == 48) return 15.0 / 64.0;
  if (idx == 49) return 47.0 / 64.0;
  if (idx == 50) return 7.0 / 64.0;
  if (idx == 51) return 39.0 / 64.0;
  if (idx == 52) return 13.0 / 64.0;
  if (idx == 53) return 45.0 / 64.0;
  if (idx == 54) return 5.0 / 64.0;
  if (idx == 55) return 37.0 / 64.0;
  if (idx == 56) return 63.0 / 64.0;
  if (idx == 57) return 31.0 / 64.0;
  if (idx == 58) return 55.0 / 64.0;
  if (idx == 59) return 23.0 / 64.0;
  if (idx == 60) return 61.0 / 64.0;
  if (idx == 61) return 29.0 / 64.0;
  if (idx == 62) return 53.0 / 64.0;
  return 21.0 / 64.0;
}

// 2D Rotation
mat2 rotate2D(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
  
  // Parallax and camera rotation
  // Static framed coordinates - zero translation, zero zoom, zero drift
  vec2 p = uv;
  
  // Very gentle responsive micro-perspective tilt around center
  p += mousePos * 0.015;

  // Diagonal orientation angle
  float baseAngle = 0.38;
  p = rotate2D(baseAngle) * p;

  // Living continuous organic time
  float t = time * 0.48;

  // Tab offset smoothly modulates the curve tension and curvature flow
  float morphA = sin(tabOffset * 0.9);
  float morphB = cos(tabOffset * 0.9);

  // In-place non-linear curvature distortion
  // Lines bend and arc dynamically with different intensities
  float warp1 = sin(p.y * 2.8 + t * 0.45) * (0.18 + 0.08 * morphA);
  float warp2 = cos(p.x * 2.2 - t * 0.35 + morphB * 0.6) * (0.15 + 0.06 * morphB);
  
  vec2 q = vec2(p.x + warp1, p.y + warp2);

  // Complex living surface heightmap (FBM-style layered sine fields)
  // Layer 1: Wide rolling landscape swell
  float h1 = sin(q.x * 2.4 + t * 0.5) * cos(q.y * 1.9 - t * 0.35);
  // Layer 2: Diagonal crossing ridge
  float h2 = sin((q.x * 1.8 - q.y * 2.2) * 1.6 + h1 * 1.6 + t * 0.55) * 0.42;
  // Layer 3: Curving contour harmonics (reactive to tab)
  float h3 = sin(q.x * 4.2 + q.y * 3.1 + h2 * 2.0 - t * 0.7) * (0.22 + 0.08 * morphA);
  // Layer 4: Micro organic ripples
  float h4 = sin(q.x * 7.0 - q.y * 5.5 + t * 0.9) * 0.08;

  float elevation = h1 + h2 + h3 + h4;

  // Multi-tier contour line system with varied line weights (not uniform/monolithic):
  // 1. Primary fine contour lines (graceful thin topography)
  float baseCoord = q.y * 12.0 + elevation * 3.4 + t * 0.15;
  float f1 = fract(baseCoord);
  float line1 = 1.0 - smoothstep(0.0, 0.09, abs(f1 - 0.5) * 2.0);

  // 2. Secondary accent index contours (every 3rd line is slightly more pronounced)
  float f2 = fract(baseCoord / 3.0);
  float lineMajor = (1.0 - smoothstep(0.0, 0.12, abs(f2 - 0.5) * 2.0)) * 0.65;

  // 3. Delicate micro-interstitial curves that float between the folds
  float f3 = fract(baseCoord * 2.0 + elevation * 1.2);
  float lineMicro = (1.0 - smoothstep(0.0, 0.06, abs(f3 - 0.5) * 2.0)) * 0.28;

  // Combined living contours
  float contour = clamp(line1 * 0.7 + lineMajor + lineMicro, 0.0, 1.0);

  // Surface luminance with cyber light reflection
  float lum = 0.10 + 0.48 * contour + 0.18 * (elevation * 0.45 + 0.5);

  // Soft flowing light sheen across the ridge
  float ridgeLight = smoothstep(0.4, -0.4, abs(h2));
  lum += ridgeLight * 0.08;

  // Gentle, smooth ordered 8x8 Bayer Dithering
  vec2 screenPixel = floor(gl_FragCoord.xy / 2.0);
  float bayer = getBayer8x8(screenPixel);
  
  // Soft dither transition
  float dithered = smoothstep(bayer - 0.16, bayer + 0.16, lum);

  // Soothing, eye-friendly color palette: Deep Obsidian & Soft Slate/Cyan Mist
  vec3 darkBg = vec3(0.032, 0.036, 0.048);
  vec3 wireColor = vec3(0.46, 0.56, 0.72) * (0.6 + 0.4 * lineMajor + 0.3 * contour);
  
  // Blend with soft ambient glow
  vec3 finalColor = mix(darkBg, wireColor, dithered * 0.35);

  // Deep radial vignette with comfortable dark center falloff
  float vignette = smoothstep(1.3, 0.35, length(uv));
  finalColor = mix(vec3(0.018, 0.022, 0.028), finalColor, vignette);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function DitherWaveCanvas({ currentTab = 'play' }: DitherWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentTabRef = useRef<LauncherTab>(currentTab);

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });

    if (!gl) return;

    // Compile Shader helper
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERT_SHADER_SRC);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad buffer [-1, -1] to [1, 1]
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'resolution');
    const uTime = gl.getUniformLocation(program, 'time');
    const uMousePos = gl.getUniformLocation(program, 'mousePos');
    const uTabOffset = gl.getUniformLocation(program, 'tabOffset');

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    let tabOffsetVal = 0;
    let targetTabOffset = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;

      // Fixed 1.0 DPR for optimal 60+ FPS dither shader without GPU fillrate stutter
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      gl?.viewport(0, 0, canvas.width, canvas.height);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    resize();

    const startTime = performance.now();

    function render() {
      if (!gl || !program) return;

      const elapsed = (performance.now() - startTime) / 1000;

      // Tab target angle shift
      const tab = currentTabRef.current;
      if (tab === 'play') targetTabOffset = 0;
      else if (tab === 'instances') targetTabOffset = 1.0;
      else if (tab === 'mods') targetTabOffset = 2.0;
      else if (tab === 'accounts') targetTabOffset = 3.0;
      else if (tab === 'console') targetTabOffset = 4.0;

      tabOffsetVal += (targetTabOffset - tabOffsetVal) * 0.05;

      // Mouse inertia
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      gl.uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMousePos, mouseX, mouseY);
      gl.uniform1f(uTabOffset, tabOffsetVal);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
