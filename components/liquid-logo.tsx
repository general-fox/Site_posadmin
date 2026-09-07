"use client";

import { useEffect, useRef } from "react";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";

const VERT = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Keeps the middle of the mark untouched and squeezes the sampling window
 * towards the sides, so a sliver of the logo smears out to the card edge.
 * Each sample is tinted along the visible spectrum, which turns the smear into
 * a prism instead of a grey blur.
 */
const FRAG = `
precision highp float;

varying vec2 uv;

uniform sampler2D tex;
uniform float progress;
uniform float time;
uniform float mid;
uniform float squeeze;
uniform float dispersion;
uniform float wave;

const int SAMPLES = 9;

vec3 spectral(float t) {
  return clamp(
    vec3(
      1.7 - abs(4.0 * t - 1.1),
      1.7 - abs(4.0 * t - 2.3),
      1.7 - abs(4.0 * t - 3.5)
    ),
    0.0,
    1.0
  );
}

void main() {
  float d = uv.x - 0.5;
  float a = abs(d);
  float band = smoothstep(mid, 0.5, a);
  float amount = band * progress;

  float squeezed = mid + (a - mid) * mix(1.0, squeeze, amount);
  float sourceX = 0.5 + sign(d) * squeezed;
  float sourceY =
    uv.y + sin(uv.x * 16.0 + time * 1.7) * wave * amount +
    sin(uv.y * 9.0 - time * 1.1) * wave * 0.35 * amount;

  vec3 colour = vec3(0.0);
  vec3 weight = vec3(0.0);
  float alpha = 0.0;
  float alphaWeight = 0.0;

  for (int i = 0; i < SAMPLES; i++) {
    float t = float(i) / float(SAMPLES - 1);
    vec3 tint = spectral(t);
    float offset = (t - 0.5) * dispersion * amount;
    vec2 point = clamp(vec2(sourceX + offset, sourceY), 0.0, 1.0);
    vec4 texel = texture2D(tex, point);

    colour += texel.rgb * texel.a * tint;
    weight += tint;

    float luma = (tint.r + tint.g + tint.b) / 3.0;
    alpha += texel.a * luma;
    alphaWeight += luma;
  }

  colour /= max(weight, vec3(0.0001));
  alpha /= max(alphaWeight, 0.0001);

  // The streak should dissolve as it runs out to the rim, not hit it solid.
  alpha *= 1.0 - 0.72 * band * progress;

  gl_FragColor = vec4(colour * (1.0 - 0.72 * band * progress), alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERT);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Logos ship with different amounts of empty margin baked in, so the visible
 * ink is measured once and everything downstream works from those bounds.
 */
function measureInk(image: HTMLImageElement) {
  const probeWidth = 512;
  const ratio = image.naturalHeight / image.naturalWidth;
  const probe = document.createElement("canvas");
  probe.width = probeWidth;
  probe.height = Math.max(1, Math.round(probeWidth * ratio));
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, width: 1, height: 1 };

  ctx.drawImage(image, 0, 0, probe.width, probe.height);
  const data = ctx.getImageData(0, 0, probe.width, probe.height).data;

  let left = probe.width;
  let right = -1;
  let top = probe.height;
  let bottom = -1;
  for (let y = 0; y < probe.height; y++) {
    for (let x = 0; x < probe.width; x++) {
      if (data[(y * probe.width + x) * 4 + 3] < 12) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) return { x: 0, y: 0, width: 1, height: 1 };

  return {
    x: left / probe.width,
    y: top / probe.height,
    width: (right - left + 1) / probe.width,
    height: (bottom - top + 1) / probe.height,
  };
}

type LiquidLogoProps = {
  src: string;
  alt: string;
  /** Largest share of the card width the mark may occupy. */
  markScale?: number;
  /** Largest share of the card height the mark may occupy. */
  markHeight?: number;
  /** Where the smear starts, as a share of the mark's own half-width. */
  midRatio?: number;
  /** How tightly the outer band collapses; lower means a longer smear. */
  squeeze?: number;
  dispersion?: number;
  wave?: number;
  /** Texture resolution multiplier over the displayed size. */
  supersample?: number;
  /** Draw the mark at this CSS pixel size, centered. Overrides scale/height. */
  markPx?: readonly [number, number];
  className?: string;
};

export function LiquidLogo({
  src,
  alt,
  markScale = 0.667,
  markHeight = 0.46,
  midRatio = 0.58,
  squeeze = 0.05,
  dispersion = 0.13,
  wave = 0.02,
  supersample = 3,
  markPx,
  className,
}: LiquidLogoProps) {
  const reduced = useHydratedReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hovered = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      progress: gl.getUniformLocation(program, "progress"),
      time: gl.getUniformLocation(program, "time"),
      mid: gl.getUniformLocation(program, "mid"),
      squeeze: gl.getUniformLocation(program, "squeeze"),
      dispersion: gl.getUniformLocation(program, "dispersion"),
      wave: gl.getUniformLocation(program, "wave"),
    };

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);

    const scratch = document.createElement("canvas");
    const ctx = scratch.getContext("2d");
    const image = new Image();
    let ink = { x: 0, y: 0, width: 1, height: 1 };
    let mid = 0.26;
    let ready = false;
    let disposed = false;

    let progress = 0;
    let time = 0;
    let frame = 0;
    let last = 0;

    const showFx = (on: boolean) => {
      canvas.style.opacity = on ? "1" : "0";
      const still = host.querySelector("img");
      if (still instanceof HTMLImageElement) still.style.opacity = on ? "0" : "1";
    };

    const uploadTexture = () => {
      if (!ready || !ctx) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);

      // The smear pulls a few source columns across a wide band, so the texture
      // is rasterised well above display resolution to keep it from breaking up.
      const tw = w * supersample;
      const th = h * supersample;
      scratch.width = tw;
      scratch.height = th;

      ctx.clearRect(0, 0, tw, th);

      const sourceWidth = image.naturalWidth * ink.width;
      const sourceHeight = image.naturalHeight * ink.height;
      let drawWidth: number;
      let drawHeight: number;
      if (markPx) {
        drawWidth = markPx[0] * dpr * supersample;
        drawHeight = markPx[1] * dpr * supersample;
      } else {
        const fit = Math.min(
          (tw * markScale) / sourceWidth,
          (th * markHeight) / sourceHeight,
        );
        drawWidth = sourceWidth * fit;
        drawHeight = sourceHeight * fit;
      }

      ctx.drawImage(
        image,
        image.naturalWidth * ink.x,
        image.naturalHeight * ink.y,
        sourceWidth,
        sourceHeight,
        (tw - drawWidth) / 2,
        (th - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );

      // The smear has to start inside the mark, otherwise it drags empty space.
      mid = (drawWidth / tw / 2) * midRatio;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
    };

    const draw = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.progress, easeOut(progress));
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.mid, mid);
      gl.uniform1f(uniforms.squeeze, squeeze);
      gl.uniform1f(uniforms.dispersion, dispersion);
      gl.uniform1f(uniforms.wave, wave);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      time += dt;

      const target = hovered.current ? 1 : 0;
      const speed = target > progress ? 1 / 0.75 : 1 / 0.4;
      if (progress < target) progress = Math.min(target, progress + dt * speed);
      if (progress > target) progress = Math.max(target, progress - dt * speed);

      draw();

      if (progress !== target || progress > 0) {
        showFx(true);
        frame = requestAnimationFrame(tick);
      } else {
        showFx(false);
        last = 0;
      }
    };

    const wake = () => {
      if (!ready || frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    // pointerover/out rather than enter/leave: some embedded browsers never
    // deliver the non-bubbling pair.
    const onOver = () => {
      hovered.current = true;
      wake();
    };
    const onOut = (event: PointerEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && host.contains(next)) return;
      hovered.current = false;
      wake();
    };

    host.addEventListener("pointerover", onOver);
    host.addEventListener("pointerout", onOut);

    const observer = new ResizeObserver(() => {
      uploadTexture();
      draw();
    });
    observer.observe(host);

    image.onload = () => {
      if (disposed) return;
      ink = measureInk(image);
      ready = true;
      uploadTexture();
      draw();
      if (hovered.current) wake();
    };
    image.src = src;

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerover", onOver);
      host.removeEventListener("pointerout", onOut);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [
    dispersion,
    markHeight,
    markPx,
    markScale,
    midRatio,
    reduced,
    squeeze,
    src,
    supersample,
    wave,
  ]);

  const stillStyle = markPx
    ? { width: markPx[0], height: markPx[1] }
    : {
        width: "auto",
        height: "auto",
        maxWidth: `${markScale * 100}%`,
        maxHeight: `${markHeight * 100}%`,
      };

  if (reduced) {
    return (
      <div ref={hostRef} className={className}>
        <img src={src} alt={alt} style={stillStyle} />
      </div>
    );
  }

  return (
    <div ref={hostRef} className={className}>
      <img
        className="liquid-logo-still"
        src={src}
        alt=""
        aria-hidden
        style={stillStyle}
      />
      <canvas
        ref={canvasRef}
        className="liquid-logo-fx"
        role="img"
        aria-label={alt}
      />
    </div>
  );
}
