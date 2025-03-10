import integration from './src/integration'

export type Integration = typeof integration
export default integration
export { defineConfig } from './src/config'

export type { CoursebuilderConfig, FullCoursebuilderConfig } from './src/config'
