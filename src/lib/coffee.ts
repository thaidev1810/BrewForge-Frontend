import { COFFEE_FS, COFFEE_VS } from './coffeeShader'

/** Four-stop coffee palettes: [dark, roast, crema, cream]. Every one of them stays in the coffee family. */
export const COFFEE_PAL: Record<string, string[]> = {
  espresso: ['#120B07', '#4A2A17', '#C68B59', '#FAF3EB'],
  caramel: ['#1E1005', '#8A4512', '#E08B38', '#FDE8CC'],
  crema: ['#1A0C06', '#693717', '#D49455', '#FFF3E3'],
  roast: ['#0F0A09', '#3B211A', '#A25942', '#F1DFD8'],
  forge: ['#160805', '#7A2214', '#D94D26', '#FED7AA'],
  amber: ['#1A0F03', '#8C4D08', '#E69926', '#FEF3C7'],
  mocha: ['#140B09', '#3E2118', '#8F5B3E', '#F3E3D3'],
  cupping: ['#180F0A', '#523321', '#B57C52', '#F7ECE1'],
  terracotta: ['#1A0C08', '#6E2E1B', '#BA5836', '#FBECE6'],
}

const toFloats = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)

export const coffeePalette = (name: string) =>
  new Float32Array((COFFEE_PAL[name] ?? COFFEE_PAL.espresso).flatMap(toFloats))

/** Scene seeds — keep in step with the `mod(seed, 5)` switch in the shader. */
export const COFFEE_SCENE = { latte: 0, beans: 1, espresso: 2, cream: 3, iced: 4 } as const

export interface CoffeeRenderer {
  draw(time: number, seed: number, a: Float32Array, b: Float32Array, mix: number, zoom: number): void
  dispose(): void
}

function getContext(canvas: HTMLCanvasElement, keepBuffer: boolean): WebGLRenderingContext | null {
  try {
    return canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: keepBuffer, powerPreference: 'low-power' })
  } catch {
    return null
  }
}

export function createCoffeeRenderer(canvas: HTMLCanvasElement, keepBuffer = false): CoffeeRenderer | null {
  const ctx = getContext(canvas, keepBuffer)
  if (!ctx) return null
  const compile = (type: number, source: string) => {
    const shader = ctx.createShader(type)
    if (!shader) return null
    ctx.shaderSource(shader, source)
    ctx.compileShader(shader)
    return ctx.getShaderParameter(shader, ctx.COMPILE_STATUS) ? shader : null
  }
  const vs = compile(ctx.VERTEX_SHADER, COFFEE_VS)
  const fs = compile(ctx.FRAGMENT_SHADER, COFFEE_FS)
  const program = ctx.createProgram()
  if (!vs || !fs || !program) return null
  ctx.attachShader(program, vs)
  ctx.attachShader(program, fs)
  ctx.linkProgram(program)
  if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) return null
  ctx.useProgram(program)
  const buffer = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW)
  const loc = ctx.getAttribLocation(program, 'p')
  ctx.enableVertexAttribArray(loc)
  ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0)
  const u = (name: string) => ctx.getUniformLocation(program, name)
  const U = { res: u('uRes'), time: u('uTime'), seed: u('uSeed'), mix: u('uMix'), zoom: u('uZoom'), pa: u('uPA'), pb: u('uPB') }
  return {
    draw(time, seed, a, b, mix, zoom) {
      ctx.viewport(0, 0, canvas.width, canvas.height)
      ctx.uniform2f(U.res, canvas.width, canvas.height)
      ctx.uniform1f(U.time, time)
      ctx.uniform1f(U.seed, seed)
      ctx.uniform1f(U.mix, mix)
      ctx.uniform1f(U.zoom, zoom)
      ctx.uniform3fv(U.pa, a)
      ctx.uniform3fv(U.pb, b)
      ctx.drawArrays(ctx.TRIANGLES, 0, 3)
    },
    dispose() {
      // Free the GPU objects but keep the context alive: React StrictMode re-runs effects on the same canvas.
      ctx.deleteProgram(program)
      ctx.deleteBuffer(buffer)
    },
  }
}
