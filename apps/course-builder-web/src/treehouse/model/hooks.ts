/**
 * Hooks are single method interfaces implemented by component values. There are
 * some system hook interfaces defined here as well as utilities for working with
 * system and app hooks.
 *
 * @module
 */
import { type Node } from './mod'

// triggered on parent set or import (if has parent), or addcomponent
export interface AttachListener {
	onAttach(node: Node): void
}

// called on accessing children
export interface ChildProvider {
	objectChildren(node: Node, children: Node[]): Node[]
}

export function hasHook(node: Node, hook: string): boolean {
	return node.value && node.value[hook] instanceof Function
}

export function triggerHook(node: Node, hook: string, ...args: any[]): any {
	if (hasHook(node, hook)) {
		return node.value[hook].apply(node.value, args)
	}
}

export function objectHas(obj: Node | null, hook: string): boolean {
	if (!obj) return false
	for (const com of obj.components) {
		if (hasHook(com, hook)) return true
	}
	return false
}

export function objectCall(
	obj: Node | null,
	hook: string,
	...args: any[]
): any {
	if (!obj) return
	for (const com of obj.components) {
		if (hasHook(com, hook)) {
			return com.value[hook].apply(com.value, args)
		}
	}
}

export function componentsWith(
	obj: Node | null,
	hook: string,
	...args: any[]
): any[] {
	const ret: any[] = []
	if (!obj) return ret
	for (const com of obj.components) {
		if (hasHook(com, hook)) {
			ret.push(com.value)
		}
	}
	return ret
}

// shorthand for nodes that have child provider hook.
// use this to determine if some commands should be
// prevented since visible children will not be impacted.
export function objectManaged(obj: Node): boolean {
	return objectHas(obj, 'objectChildren')
}
