/**
 * Components are classes that can be used for component values in component nodes.
 * These classes need to be registered so they can be properly "hydrated" from
 * marshaled form (usually JSON) back into class instances.
 *
 * @module
 */

const registry: Record<string, any> = {}

export function component(target: any) {
	registry[componentName(target)] = target
}

export function componentName(target: any): string {
	if (target.prototype === undefined) {
		target = target.constructor
	}
	return `treehouse.${target.name}`
}

export function getComponent(com: any): any {
	if (typeof com === 'string') {
		return registry[com]
	}
	return registry[componentName(com)]
}

export function inflateToComponent(com: any, obj: any): any {
	const o = new (getComponent(com))()
	if (o['fromJSON'] instanceof Function) {
		o.fromJSON(obj)
	} else {
		Object.defineProperties(o, Object.getOwnPropertyDescriptors(obj))
	}
	return o
}

export function duplicate(obj: any): any {
	if (obj === undefined) {
		return undefined
	}
	const com = getComponent(obj)
	if (!com) {
		return structuredClone(obj)
	}
	const src = JSON.parse(JSON.stringify(obj) || '')
	const dst = new obj.constructor()
	if (dst['fromJSON'] instanceof Function) {
		dst.fromJSON(src)
	} else {
		Object.defineProperties(dst, Object.getOwnPropertyDescriptors(src))
	}
	return dst
}
