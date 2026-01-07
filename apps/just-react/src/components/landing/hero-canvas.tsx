'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Check, ChevronRight, Copy } from 'lucide-react'

interface ShaderConfig {
	noiseScale: number
	speed: number
	complexity: number
	grain: number
	gridScale: number
	gridMix: number
	gridRotation: number
	gridThickness: number
	colorDeep: string
	colorAccent: string
	colorHighlight: string
}

const DEFAULT_CONFIG: ShaderConfig = {
	noiseScale: 2.0,
	speed: 0.15,
	complexity: 0.6,
	grain: 0.08,
	gridScale: 5.0,
	gridMix: 1.0,
	gridRotation: 5.0,
	gridThickness: 0.04,
	colorDeep: '#050314',
	colorAccent: '#4338ca',
	colorHighlight: '#a5b4fc',
}

/**
 * WebGL canvas component with animated fluid grid shader effect
 * Uses Three.js for rendering a custom GLSL shader
 */
export default function HeroCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const uniformsRef = useRef<Record<string, { value: unknown }> | null>(null)
	const initializedRef = useRef(false)
	const [scriptLoaded, setScriptLoaded] = useState(false)
	const [controlsOpen, setControlsOpen] = useState(false)
	const [copied, setCopied] = useState(false)
	const [config, setConfig] = useState<ShaderConfig>(DEFAULT_CONFIG)

	const updateUniform = useCallback(
		(key: keyof ShaderConfig, value: number | string) => {
			setConfig((prev) => ({ ...prev, [key]: value }))
			if (!uniformsRef.current) return

			const uniformKey = `u_${key}`
			const uniform = uniformsRef.current[uniformKey]
			if (uniform) {
				if (typeof value === 'string' && value.startsWith('#')) {
					// @ts-expect-error THREE is loaded via CDN
					uniform.value.set(value)
				} else {
					uniform.value = value
				}
			}
		},
		[],
	)

	const generateCode = useCallback(() => {
		return `'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export default function FluidGridCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const initializedRef = useRef(false)
	const [scriptLoaded, setScriptLoaded] = useState(false)

	useEffect(() => {
		// @ts-expect-error THREE is loaded via CDN
		if (!scriptLoaded || typeof THREE === 'undefined' || initializedRef.current)
			return
		if (!canvasRef.current) return

		initializedRef.current = true
		const canvas = canvasRef.current

		// @ts-expect-error THREE is loaded via CDN
		const THREE_LIB = THREE

		const renderer = new THREE_LIB.WebGLRenderer({ canvas, antialias: false })
		renderer.setSize(canvas.clientWidth, canvas.clientHeight)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

		const camera = new THREE_LIB.OrthographicCamera(-1, 1, 1, -1, 0, 1)
		const scene = new THREE_LIB.Scene()
		const geometry = new THREE_LIB.PlaneGeometry(2, 2)

		const uniforms = {
			u_time: { value: 0 },
			u_resolution: { value: new THREE_LIB.Vector2(canvas.clientWidth, canvas.clientHeight) },
			u_mouse: { value: new THREE_LIB.Vector2(0.5, 0.5) },
			u_noiseScale: { value: ${config.noiseScale} },
			u_speed: { value: ${config.speed} },
			u_complexity: { value: ${config.complexity} },
			u_grain: { value: ${config.grain} },
			u_gridScale: { value: ${config.gridScale} },
			u_gridMix: { value: ${config.gridMix} },
			u_gridRotation: { value: ${config.gridRotation} },
			u_gridThickness: { value: ${config.gridThickness} },
			u_colorDeep: { value: new THREE_LIB.Color('${config.colorDeep}') },
			u_colorAccent: { value: new THREE_LIB.Color('${config.colorAccent}') },
			u_colorHighlight: { value: new THREE_LIB.Color('${config.colorHighlight}') },
		}

		const vertexShader = \`
			varying vec2 v_uv;
			void main() {
				v_uv = uv;
				gl_Position = vec4(position, 1.0);
			}
		\`

		const fragmentShader = \`
			precision mediump float;

			uniform float u_time;
			uniform vec2 u_resolution;
			uniform vec2 u_mouse;
			uniform float u_noiseScale;
			uniform float u_speed;
			uniform float u_complexity;
			uniform float u_grain;
			uniform float u_gridScale;
			uniform float u_gridMix;
			uniform float u_gridRotation;
			uniform float u_gridThickness;
			uniform vec3 u_colorDeep;
			uniform vec3 u_colorAccent;
			uniform vec3 u_colorHighlight;

			varying vec2 v_uv;

			float random(vec2 st) {
				return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
			}

			mat2 rotate2D(float angle) {
				float c = cos(angle);
				float s = sin(angle);
				return mat2(c, -s, s, c);
			}

			float noise(in vec2 st) {
				vec2 i = floor(st);
				vec2 f = fract(st);
				float a = random(i);
				float b = random(i + vec2(1.0, 0.0));
				float c = random(i + vec2(0.0, 1.0));
				float d = random(i + vec2(1.0, 1.0));
				vec2 u = f * f * (3.0 - 2.0 * f);
				return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
			}

			float fbm(in vec2 st) {
				float value = 0.0;
				float amplitude = .5;
				mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
				for (int i = 0; i < 5; i++) {
					value += amplitude * noise(st);
					st = rot * st * 2.0 + vec2(u_time * 0.1);
					amplitude *= 0.5;
				}
				return value;
			}

			float grid(vec2 uv, float thickness) {
				vec2 f = fract(uv);
				vec2 d = min(f, 1.0 - f);
				float dist_to_line = min(d.x, d.y);
				return 1.0 - smoothstep(0.0, thickness, dist_to_line);
			}

			void main() {
				vec2 st = v_uv;
				float aspect = u_resolution.x / u_resolution.y;
				st.x *= aspect;
				vec2 center = vec2(aspect * 0.5, 0.5);

				vec2 mouse = u_mouse;
				mouse.x *= aspect;
				float dist = distance(st, mouse);
				float mouseInfluence = smoothstep(0.6, 0.0, dist);

				float t = u_time * u_speed;

				vec2 q = vec2(0.);
				q.x = fbm( st + 0.0 * t + mouseInfluence * 0.5 );
				q.y = fbm( st + vec2(1.0) );

				vec2 r = vec2(0.);
				r.x = fbm( st + 1.0 * q + vec2(1.7,9.2)+ 0.15*t );
				r.y = fbm( st + 1.0 * q + vec2(8.3,2.8)+ 0.126*t);

				float f = fbm(st + r * (1.0 + u_complexity));

				vec2 gridSt = st;
				gridSt += r * u_noiseScale * 0.1;
				gridSt = rotate2D(u_gridRotation) * (gridSt - center) + center;
				gridSt *= u_gridScale;

				float thickness1 = u_gridThickness * 0.5;
				float thickness2 = u_gridThickness * 0.25;

				float gridLayer1 = grid(gridSt, thickness1);
				float gridLayer2 = grid(gridSt * 0.5 + t * 0.05, thickness2) * 0.5;

				float finalGrid = max(gridLayer1, gridLayer2);

				vec3 color = mix(u_colorDeep, u_colorAccent, clamp((f*f)*4.0, 0.0, 1.0));
				color = mix(color, u_colorHighlight, clamp(length(q), 0.0, 1.0));
				color = mix(color, u_colorHighlight, smoothstep(0.9, 1.0, f*f*f + 0.6 * length(r*q) ));
				color = mix(color, u_colorHighlight, finalGrid * u_gridMix * (1.0 + mouseInfluence));
				color += u_colorAccent * mouseInfluence * 0.3;

				float vignette = 1.0 - smoothstep(0.5, 1.5, length(v_uv - 0.5) * 1.5);
				color *= vignette;

				float grain = random(v_uv * u_time) * u_grain;
				color += grain;

				gl_FragColor = vec4(color, 1.0);
			}
		\`

		const material = new THREE_LIB.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
		const mesh = new THREE_LIB.Mesh(geometry, material)
		scene.add(mesh)

		function onWindowResize() {
			if (!canvas) return
			renderer.setSize(canvas.clientWidth, canvas.clientHeight)
			uniforms.u_resolution.value.set(canvas.clientWidth, canvas.clientHeight)
		}
		window.addEventListener('resize', onWindowResize)

		function onMouseMove(event: MouseEvent) {
			if (!canvas) return
			const rect = canvas.getBoundingClientRect()
			const x = (event.clientX - rect.left) / rect.width
			const y = 1.0 - (event.clientY - rect.top) / rect.height
			uniforms.u_mouse.value.set(x, y)
		}
		window.addEventListener('mousemove', onMouseMove)

		let animationId: number
		function animate(time: number) {
			animationId = requestAnimationFrame(animate)
			uniforms.u_time.value = time * 0.001
			renderer.render(scene, camera)
		}
		animate(0)

		return () => {
			window.removeEventListener('resize', onWindowResize)
			window.removeEventListener('mousemove', onMouseMove)
			cancelAnimationFrame(animationId)
			renderer.dispose()
			geometry.dispose()
			material.dispose()
		}
	}, [scriptLoaded])

	return (
		<>
			<Script
				src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
				strategy="afterInteractive"
				onLoad={() => setScriptLoaded(true)}
			/>
			<canvas
				ref={canvasRef}
				className="pointer-events-none absolute inset-0 z-0 h-full w-full"
			/>
		</>
	)
}`
	}, [config])

	const copyCode = useCallback(async () => {
		await navigator.clipboard.writeText(generateCode())
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [generateCode])

	const copyConfig = useCallback(async () => {
		const configStr = `const CONFIG = {
	noiseScale: ${config.noiseScale},
	speed: ${config.speed},
	complexity: ${config.complexity},
	grain: ${config.grain},
	gridScale: ${config.gridScale},
	gridMix: ${config.gridMix},
	gridRotation: ${config.gridRotation},
	gridThickness: ${config.gridThickness},
	colorDeep: '${config.colorDeep}',
	colorAccent: '${config.colorAccent}',
	colorHighlight: '${config.colorHighlight}',
}`
		await navigator.clipboard.writeText(configStr)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [config])

	useEffect(() => {
		// @ts-expect-error THREE is loaded via CDN
		if (!scriptLoaded || typeof THREE === 'undefined' || initializedRef.current)
			return
		if (!canvasRef.current) return

		initializedRef.current = true
		const canvas = canvasRef.current

		// @ts-expect-error THREE is loaded via CDN
		const THREE_LIB = THREE

		const renderer = new THREE_LIB.WebGLRenderer({
			canvas,
			antialias: false,
		})
		renderer.setSize(canvas.clientWidth, canvas.clientHeight)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

		const camera = new THREE_LIB.OrthographicCamera(-1, 1, 1, -1, 0, 1)
		const scene = new THREE_LIB.Scene()
		const geometry = new THREE_LIB.PlaneGeometry(2, 2)

		const colorDeep = new THREE_LIB.Color(config.colorDeep)
		const colorAccent = new THREE_LIB.Color(config.colorAccent)
		const colorHighlight = new THREE_LIB.Color(config.colorHighlight)

		const uniforms = {
			u_time: { value: 0 },
			u_resolution: {
				value: new THREE_LIB.Vector2(canvas.clientWidth, canvas.clientHeight),
			},
			u_mouse: { value: new THREE_LIB.Vector2(0.5, 0.5) },
			u_noiseScale: { value: config.noiseScale },
			u_speed: { value: config.speed },
			u_complexity: { value: config.complexity },
			u_grain: { value: config.grain },
			u_gridScale: { value: config.gridScale },
			u_gridMix: { value: config.gridMix },
			u_gridRotation: { value: config.gridRotation },
			u_gridThickness: { value: config.gridThickness },
			u_colorDeep: { value: colorDeep },
			u_colorAccent: { value: colorAccent },
			u_colorHighlight: { value: colorHighlight },
		}

		uniformsRef.current = uniforms

		const vertexShader = `
			varying vec2 v_uv;
			void main() {
				v_uv = uv;
				gl_Position = vec4(position, 1.0);
			}
		`

		const fragmentShader = `
			precision mediump float;

			uniform float u_time;
			uniform vec2 u_resolution;
			uniform vec2 u_mouse;

			uniform float u_noiseScale;
			uniform float u_speed;
			uniform float u_complexity;
			uniform float u_grain;
			uniform float u_gridScale;
			uniform float u_gridMix;
			uniform float u_gridRotation;
			uniform float u_gridThickness;

			uniform vec3 u_colorDeep;
			uniform vec3 u_colorAccent;
			uniform vec3 u_colorHighlight;

			varying vec2 v_uv;

			float random(vec2 st) {
				return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
			}

			mat2 rotate2D(float angle) {
				float c = cos(angle);
				float s = sin(angle);
				return mat2(c, -s, s, c);
			}

			float noise(in vec2 st) {
				vec2 i = floor(st);
				vec2 f = fract(st);

				float a = random(i);
				float b = random(i + vec2(1.0, 0.0));
				float c = random(i + vec2(0.0, 1.0));
				float d = random(i + vec2(1.0, 1.0));

				vec2 u = f * f * (3.0 - 2.0 * f);

				return mix(a, b, u.x) +
					(c - a)* u.y * (1.0 - u.x) +
					(d - b) * u.x * u.y;
			}

			float fbm(in vec2 st) {
				float value = 0.0;
				float amplitude = .5;

				mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));

				for (int i = 0; i < 5; i++) {
					value += amplitude * noise(st);
					st = rot * st * 2.0 + vec2(u_time * 0.1);
					amplitude *= 0.5;
				}
				return value;
			}

			float grid(vec2 uv, float thickness) {
				vec2 f = fract(uv);
				vec2 d = min(f, 1.0 - f);
				float dist_to_line = min(d.x, d.y);
				return 1.0 - smoothstep(0.0, thickness, dist_to_line);
			}

			void main() {
				vec2 st = v_uv;
				float aspect = u_resolution.x / u_resolution.y;
				st.x *= aspect;
				vec2 center = vec2(aspect * 0.5, 0.5);

				vec2 mouse = u_mouse;
				mouse.x *= aspect;
				float dist = distance(st, mouse);
				float mouseInfluence = smoothstep(0.6, 0.0, dist);

				float t = u_time * u_speed;

				vec2 q = vec2(0.);
				q.x = fbm( st + 0.0 * t + mouseInfluence * 0.5 );
				q.y = fbm( st + vec2(1.0) );

				vec2 r = vec2(0.);
				r.x = fbm( st + 1.0 * q + vec2(1.7,9.2)+ 0.15*t );
				r.y = fbm( st + 1.0 * q + vec2(8.3,2.8)+ 0.126*t);

				float f = fbm(st + r * (1.0 + u_complexity));

				vec2 gridSt = st;
				gridSt += r * u_noiseScale * 0.1;
				gridSt = rotate2D(u_gridRotation) * (gridSt - center) + center;
				gridSt *= u_gridScale;

				float thickness1 = u_gridThickness * 0.5;
				float thickness2 = u_gridThickness * 0.25;

				float gridLayer1 = grid(gridSt, thickness1);
				float gridLayer2 = grid(gridSt * 0.5 + t * 0.05, thickness2) * 0.5;

				float finalGrid = max(gridLayer1, gridLayer2);

				vec3 color = mix(u_colorDeep, u_colorAccent, clamp((f*f)*4.0, 0.0, 1.0));
				color = mix(color, u_colorHighlight, clamp(length(q), 0.0, 1.0));
				color = mix(color, u_colorHighlight, smoothstep(0.9, 1.0, f*f*f + 0.6 * length(r*q) ));
				color = mix(color, u_colorHighlight, finalGrid * u_gridMix * (1.0 + mouseInfluence));
				color += u_colorAccent * mouseInfluence * 0.3;

				float vignette = 1.0 - smoothstep(0.5, 1.5, length(v_uv - 0.5) * 1.5);
				color *= vignette;

				float grain = random(v_uv * u_time) * u_grain;
				color += grain;

				gl_FragColor = vec4(color, 1.0);
			}
		`

		const material = new THREE_LIB.ShaderMaterial({
			uniforms,
			vertexShader,
			fragmentShader,
		})

		const mesh = new THREE_LIB.Mesh(geometry, material)
		scene.add(mesh)

		function onWindowResize() {
			if (!canvas) return
			renderer.setSize(canvas.clientWidth, canvas.clientHeight)
			uniforms.u_resolution.value.set(canvas.clientWidth, canvas.clientHeight)
		}
		window.addEventListener('resize', onWindowResize)

		function onMouseMove(event: MouseEvent) {
			if (!canvas) return
			const rect = canvas.getBoundingClientRect()
			const x = (event.clientX - rect.left) / rect.width
			const y = 1.0 - (event.clientY - rect.top) / rect.height
			uniforms.u_mouse.value.set(x, y)
		}
		window.addEventListener('mousemove', onMouseMove)

		function onTouchMove(event: TouchEvent) {
			if (!canvas || event.touches.length === 0) return
			const rect = canvas.getBoundingClientRect()
			const x = (event.touches[0]!.clientX - rect.left) / rect.width
			const y = 1.0 - (event.touches[0]!.clientY - rect.top) / rect.height
			uniforms.u_mouse.value.set(x, y)
		}
		window.addEventListener('touchmove', onTouchMove)

		let animationId: number
		function animate(time: number) {
			animationId = requestAnimationFrame(animate)
			uniforms.u_time.value = time * 0.001
			renderer.render(scene, camera)
		}
		animate(0)

		return () => {
			window.removeEventListener('resize', onWindowResize)
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('touchmove', onTouchMove)
			cancelAnimationFrame(animationId)
			renderer.dispose()
			geometry.dispose()
			material.dispose()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scriptLoaded])

	return (
		<>
			<Script
				src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
				strategy="afterInteractive"
				onLoad={() => setScriptLoaded(true)}
			/>
			<canvas
				ref={canvasRef}
				className="pointer-events-none absolute inset-0 z-0 h-full w-full"
			/>

			{/* Controls Toggle */}
			<button
				onClick={() => setControlsOpen(!controlsOpen)}
				className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
				style={{
					transform: controlsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
				}}
			>
				<ChevronRight className="size-5 text-white" />
			</button>

			{/* Controls Panel */}
			<div
				className={`absolute right-4 top-16 z-20 w-72 rounded-xl bg-black/80 p-4 backdrop-blur-md transition-all ${
					controlsOpen
						? 'pointer-events-auto translate-x-0 opacity-100'
						: 'pointer-events-none translate-x-4 opacity-0'
				}`}
			>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-white">Shader Controls</h3>
					<div className="flex gap-1">
						<button
							onClick={copyConfig}
							className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white transition-colors hover:bg-white/20"
						>
							{copied ? (
								<Check className="size-3" />
							) : (
								<>
									<Copy className="size-3" /> Config
								</>
							)}
						</button>
						<button
							onClick={copyCode}
							className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-2 py-1 text-xs text-white transition-colors hover:bg-indigo-500"
						>
							{copied ? (
								<Check className="size-3" />
							) : (
								<>
									<Copy className="size-3" /> Full
								</>
							)}
						</button>
					</div>
				</div>

				<div className="space-y-3">
					<div className="grid grid-cols-3 gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-[10px] text-white/60">Deep</span>
							<input
								type="color"
								value={config.colorDeep}
								onChange={(e) => updateUniform('colorDeep', e.target.value)}
								className="h-8 w-full cursor-pointer rounded border-0 bg-transparent"
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-[10px] text-white/60">Accent</span>
							<input
								type="color"
								value={config.colorAccent}
								onChange={(e) => updateUniform('colorAccent', e.target.value)}
								className="h-8 w-full cursor-pointer rounded border-0 bg-transparent"
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-[10px] text-white/60">Highlight</span>
							<input
								type="color"
								value={config.colorHighlight}
								onChange={(e) =>
									updateUniform('colorHighlight', e.target.value)
								}
								className="h-8 w-full cursor-pointer rounded border-0 bg-transparent"
							/>
						</label>
					</div>

					<SliderControl
						label="Grid Scale"
						value={config.gridScale}
						min={1}
						max={50}
						step={0.5}
						onChange={(v) => updateUniform('gridScale', v)}
					/>
					<SliderControl
						label="Grid Rotation"
						value={config.gridRotation}
						min={-3.14}
						max={3.14}
						step={0.01}
						onChange={(v) => updateUniform('gridRotation', v)}
					/>
					<SliderControl
						label="Grid Thickness"
						value={config.gridThickness}
						min={0.001}
						max={0.2}
						step={0.001}
						onChange={(v) => updateUniform('gridThickness', v)}
					/>
					<SliderControl
						label="Grid Mix"
						value={config.gridMix}
						min={0}
						max={2}
						step={0.01}
						onChange={(v) => updateUniform('gridMix', v)}
					/>
					<SliderControl
						label="Noise Scale"
						value={config.noiseScale}
						min={0}
						max={10}
						step={0.1}
						onChange={(v) => updateUniform('noiseScale', v)}
					/>
					<SliderControl
						label="Speed"
						value={config.speed}
						min={0}
						max={1}
						step={0.01}
						onChange={(v) => updateUniform('speed', v)}
					/>
					<SliderControl
						label="Complexity"
						value={config.complexity}
						min={0}
						max={2}
						step={0.01}
						onChange={(v) => updateUniform('complexity', v)}
					/>
					<SliderControl
						label="Grain"
						value={config.grain}
						min={0}
						max={0.3}
						step={0.01}
						onChange={(v) => updateUniform('grain', v)}
					/>
				</div>
			</div>
		</>
	)
}

function SliderControl({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	step: number
	onChange: (v: number) => void
}) {
	return (
		<label className="flex flex-col gap-1">
			<div className="flex items-center justify-between">
				<span className="text-[10px] text-white/60">{label}</span>
				<span className="font-mono text-[10px] text-white/40">
					{value.toFixed(2)}
				</span>
			</div>
			<input
				type="range"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(e) => onChange(parseFloat(e.target.value))}
				className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-indigo-500"
			/>
		</label>
	)
}
