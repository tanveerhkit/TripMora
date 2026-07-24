/**
 * SpecularButton — React Bits' WebGL specular-highlight button (ogl).
 * A moving rim of light sweeps the button edge and steers toward the cursor.
 *
 * Adapted for TripMora: typed, and hardened so it degrades gracefully — if
 * WebGL is unavailable (SSR, jsdom tests, blocked contexts) or the user prefers
 * reduced motion, the shine is skipped and the plain button still renders.
 */
import { useRef, useEffect, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react'
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl'
import './SpecularButton.css'

const PAD = 20

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`

type Size = 'sm' | 'md' | 'lg'

interface Props {
  children?: ReactNode
  size?: Size
  radius?: number
  tint?: string
  tintOpacity?: number
  blur?: number
  textColor?: string
  lineColor?: string
  baseColor?: string
  intensity?: number
  shineSize?: number
  shineFade?: number
  thickness?: number
  speed?: number
  followMouse?: boolean
  proximity?: number
  autoAnimate?: boolean
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

interface Runtime {
  radius: number
  lineColor: string
  baseColor: string
  intensity: number
  shineSize: number
  shineFade: number
  thickness: number
  speed: number
  followMouse: boolean
  proximity: number
  autoAnimate: boolean
}

export function SpecularButton({
  children = 'Get Started',
  size = 'lg',
  radius = 18,
  tint = '#ffffff',
  tintOpacity = 0,
  blur = 0,
  textColor = '#f5f5f5',
  lineColor = '#ffffff',
  baseColor = '#525252',
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const fxRef = useRef<HTMLSpanElement>(null)
  const propsRef = useRef<Runtime>({} as Runtime)

  propsRef.current = {
    radius,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate,
  }

  useEffect(() => {
    const btn = btnRef.current
    const fx = fxRef.current
    if (!btn || !fx) return
    // Respect reduced motion: skip the WebGL sweep, keep the plain button.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    // Bail cleanly where WebGL isn't available (jsdom, unsupported browsers)
    // without poking getContext — keeps the plain button and the console quiet.
    if (
      typeof WebGL2RenderingContext === 'undefined' &&
      typeof WebGLRenderingContext === 'undefined'
    )
      return

    let raf = 0
    let ro: ResizeObserver | null = null
    let onPointerMove: ((e: PointerEvent) => void) | null = null
    let canvas: HTMLCanvasElement | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gl: any = null

    try {
      const dpr = window.devicePixelRatio || 1
      const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr })
      gl = renderer.gl
      if (!gl) return
      canvas = gl.canvas as HTMLCanvasElement
      gl.clearColor(0, 0, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

      const geometry = new Triangle(gl)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((geometry.attributes as any).uv) delete (geometry.attributes as any).uv

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uCenter: { value: [0, 0] },
          uHalfSize: { value: [1, 1] },
          uRadius: { value: 0 },
          uAngle: { value: 2.4 },
          uPx: { value: dpr },
          uLineColor: { value: [1, 1, 1] },
          uBaseColor: { value: [0.32, 0.32, 0.32] },
          uIntensity: { value: 1 },
          uShineSize: { value: 0.17 },
          uShineFade: { value: 0.7 },
          uThickness: { value: 1 },
          uBaseWidth: { value: dpr },
        },
      })

      const mesh = new Mesh(gl, { geometry, program })
      fx.appendChild(canvas)

      const sizeRef = { w: 1, h: 1 }
      const resize = () => {
        const rect = btn.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        sizeRef.w = w
        sizeRef.h = h
        renderer.setSize(w + PAD * 2, h + PAD * 2)
        program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr]
        program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr]
      }
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(resize)
        ro.observe(btn)
      }
      resize()

      let pointerAngle: number | null = null
      let proximityT = 0
      onPointerMove = (e: PointerEvent) => {
        const rect = btn.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right)
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom)
        const dist = Math.hypot(dx, dy)
        if (dist === 0) {
          const nx = (e.clientX - cx) / (rect.width / 2)
          const ny = (cy - e.clientY) / (rect.height / 2)
          pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15
        } else {
          pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx)
        }
        const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1))
        proximityT = t * t * (3 - 2 * t)
      }
      window.addEventListener('pointermove', onPointerMove)

      let angle = 2.4
      let idleAngle = 2.4
      let bright = 0
      let last = performance.now()

      const lineC = new Color()
      const baseC = new Color()

      const update = (now: number) => {
        raf = requestAnimationFrame(update)
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        const pr = propsRef.current

        idleAngle += pr.speed * dt
        const steer =
          pr.followMouse && pointerAngle != null && (!pr.autoAnimate || proximityT > 0)
        const targetAngle = steer ? (pointerAngle as number) : idleAngle
        const diff = ((targetAngle - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        angle += diff * (1 - Math.exp(-dt * 7))

        const brightTarget = pr.autoAnimate ? 1 : proximityT
        bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8))

        lineC.set(pr.lineColor)
        baseC.set(pr.baseColor)
        program.uniforms.uAngle.value = angle
        program.uniforms.uRadius.value =
          Math.min(pr.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr
        program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b]
        program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b]
        program.uniforms.uIntensity.value = pr.intensity * bright
        program.uniforms.uShineSize.value = (pr.shineSize * Math.PI) / 180
        program.uniforms.uShineFade.value = (pr.shineFade * Math.PI) / 180
        program.uniforms.uThickness.value = pr.thickness * dpr
        renderer.render({ scene: mesh })
      }
      raf = requestAnimationFrame(update)
    } catch {
      // WebGL unavailable — leave the plain button in place.
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove)
      return
    }

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove)
      if (canvas && canvas.parentNode === fx) fx.removeChild(canvas)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`specular-button specular-button--${size}${className ? ` ${className}` : ''}`}
      style={
        {
          '--sb-radius': `${radius}px`,
          '--sb-tint': tint,
          '--sb-tint-opacity': tintOpacity,
          '--sb-blur': `${blur}px`,
          '--sb-text-color': textColor,
        } as CSSProperties
      }
      {...rest}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  )
}

export default SpecularButton
