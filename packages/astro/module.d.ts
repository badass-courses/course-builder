declare module 'coursebuilder:config' {
	const config: import('./src/config').FullCoursebuilderConfig
	export default config
}

declare module '@coursebuilder/astro' {
	const index: import('./index').Integration

	type FullCoursebuilderConfig = import('./src/config').FullCoursebuilderConfig
	const defineConfig: (config: FullCoursebuilderConfig) => FullCoursebuilderConfig
	export default index
	export { defineConfig }
}
