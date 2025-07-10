'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'

import { cn } from '../utils/cn'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
		inset?: boolean
	}
>(({ className, inset, children, ...props }, ref) => (
	<DropdownMenuPrimitive.SubTrigger
		ref={ref}
		className={cn(
			'focus:bg-accent radix-state-open:bg-accent outline-hidden flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm',
			inset && 'pl-8',
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRight className="ml-auto h-4 w-4" />
	</DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
	DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.SubContent
		ref={ref}
		className={cn(
			'bg-popover text-popover-foreground radix-state-open:animate-in radix-state-closed:animate-out radix-state-closed:fade-out-0 radix-state-open:fade-in-0 radix-state-closed:zoom-out-95 radix-state-open:zoom-in-95 radix-side-bottom:slide-in-from-top-2 radix-side-left:slide-in-from-right-2 radix-side-right:slide-in-from-left-2 radix-side-top:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-lg',
			className,
		)}
		{...props}
	/>
))
DropdownMenuSubContent.displayName =
	DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	//   <DropdownMenuPrimitive.Portal>
	<DropdownMenuPrimitive.Content
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			'bg-popover text-popover-foreground radix-state-open:animate-in radix-state-closed:animate-out radix-state-closed:fade-out-0 radix-state-open:fade-in-0 radix-state-closed:zoom-out-95 radix-state-open:zoom-in-95 radix-side-bottom:slide-in-from-top-2 radix-side-left:slide-in-from-right-2 radix-side-right:slide-in-from-left-2 radix-side-top:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-md',
			className,
		)}
		{...props}
	/>
	//   </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
		inset?: boolean
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Item
		ref={ref}
		className={cn(
			'focus:bg-accent focus:text-accent-foreground outline-hidden radix-disabled:pointer-events-none radix-disabled:opacity-50 relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm transition-colors',
			inset && 'pl-8',
			className,
		)}
		{...props}
	/>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
	<DropdownMenuPrimitive.CheckboxItem
		ref={ref}
		className={cn(
			'focus:bg-accent focus:text-accent-foreground outline-hidden radix-disabled:pointer-events-none radix-disabled:opacity-50 relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors',
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Check className="h-4 w-4" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
	DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
	<DropdownMenuPrimitive.RadioItem
		ref={ref}
		className={cn(
			'focus:bg-accent focus:text-accent-foreground outline-hidden radix-disabled:pointer-events-none radix-disabled:opacity-50 relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors',
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<Circle className="h-2 w-2 fill-current" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
		inset?: boolean
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Label
		ref={ref}
		className={cn(
			'px-2 py-1.5 text-sm font-semibold',
			inset && 'pl-8',
			className,
		)}
		{...props}
	/>
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Separator
		ref={ref}
		className={cn('bg-muted -mx-1 my-1 h-px', className)}
		{...props}
	/>
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
			{...props}
		/>
	)
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
}
