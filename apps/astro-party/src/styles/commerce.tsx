import { cn } from '@coursebuilder/ui/utils/cn'

export const pricingClassNames = (className?: string) =>
	cn(className, {
		// card
		'[&_article]:x-[flex,flex-col,gap-5]': true,
		// title,
		'[&_[data-title]]:x-[pb-5,font-semibold,text-lg] [&_[data-name-badge]]:x-[pb-5,font-semibold,text-lg]':
			true,
		// byline (full access)
		'[&_[data-byline]]:x-[text-base,sr-only]': true,
		// price
		'[&_[data-price-container]>sup]:x-[mt-0,pr-0.5] [&_[data-price-container]]:x-[flex,items-center] [&_[data-price]>span]:x-[mt-0.5,text-xs,pl-1] [&_[data-price]]:x-[flex,text-4xl,font-semibold] [&_svg]:text-muted-foreground':
			true,
		// price loading
		'[&_[data-price-container="loading"]]:x-[h-10,flex,items-center,text-muted-foreground]':
			true,
		// discount
		'[&_[data-price-discounted]]:x-[pl-5,flex,items-center,gap-3] [&_[data-price-discounted]>[data-full-price]]:x-[text-xl,line-through,text-muted-foreground,font-normal] [&_[data-price-discounted]>[data-percent-off]]:x-[text-lg,font-medium]':
			true,
		// button
		'[&_[data-pricing-product-checkout-button]]:x-[px-8,flex,bg-primary,py-4,text-primary-foreground,rounded,font-semibold,w-full,items-center,justify-center]':
			true,
		// team switch
		'[&_[data-team-switch]>label]:x-[sr-only] [&_[data-team-switch]]:x-[flex,gap-2,items-center,justify-center,w-full] [&_button[role="button"]]:x-[text-base] [&_button[role="switch"]>span]:x-[block,h-[18px],w-[18px],translate-x-[2px],rounded-full,bg-muted-foreground,transition-all,will-change-transform] [&_button[role="switch"]]:x-[relative,h-6,w-[47px],rounded-full,border]':
			true,
		// team switch checked
		'[&_button[role="switch"]>span[data-state="checked"]]:x-[translate-x-[25px],bg-muted-foreground] [&_button[role="switch"][data-state="checked"]]:x-[bg-muted]':
			true,
		// seats quantity
		'[&_[data-quantity-input]>div]:x-[flex,items-center] [&_[data-quantity-input]_button:first-of-type]:x-[rounded-l-full] [&_[data-quantity-input]_button:last-of-type]:x-[rounded-r-full] [&_[data-quantity-input]_button]:x-[w-7,h-7,bg-muted,border,flex,items-baseline,justify-center,text-center] [&_[data-quantity-input]_input]:x-[px-3,h-7,tabular-nums,text-base,bg-muted,border-y] [&_[data-quantity-input]_label]:x-[pr-2,text-base]':
			true,
		// purchase container
		'[&_form>fieldset]:x-[flex,flex-col,gap-3,items-center,py-5,border-y,border-dashed]':
			true,
		// footer
		'[&_[data-pricing-footer]]:x-[flex,flex-col] [&_[data-pricing-footer]>[data-main]]:x-[flex,flex-col,gap-5]':
			true,
		// footer "includes" label
		'[&_[data-pricing-footer]>[data-header]_span]:x-[font-bold,capitalize]':
			true,
		// workshops
		'[&_[data-workshops]>strong]:x-[sr-only] [&_[data-workshops]_p]:x-[font-bold] [&_[data-workshops]_[data-state="draft"]]:x-[text-sm,text-muted-foreground,leading-tight] [&_[data-workshops]_[data-image]]:x-[relative,w-10,h-10] [&_[data-workshops]_li]:x-[flex,items-center,gap-2,flex-wrap]':
			true,
		// countdown
		'[&_[data-pricing-product-sale-countdown]]:x-[text-base,px-0,pb-0] [&_[data-pricing-product-sale-countdown]>div>p]:x-[pb-0] [&_[data-pricing-product-sale-countdown]>div]:x-[text-left,flex,items-center,gap-5,flex-wrap] [&_[data-pricing-product-sale-countdown]_[data-grid]]:x-[flex-grow,-ml-4,mx-0,text-center,max-w-none] [&_[data-pricing-product-sale-countdown]_[data-number]]:x-[text-lg,tabular-nums,font-semibold] [&_[data-pricing-product-sale-countdown]_[data-label]]:x-[text-xs,pt-0,text-muted-foreground]':
			true,
		// purchased
		'[&_[data-purchased]>svg]:x-[w-5,text-muted-foreground,opacity-100] [&_[data-purchased]]:x-[flex,items-center,gap-1,font-semibold]':
			true,
		// buy more seats
		'[&_[data-buy-more-seats]]:x-[mt-5,overflow-hidden] [&_[data-buy-more-seats]>button]:x-[px-4,py-2,bg-secondary,text-secondary-foreground,rounded]':
			true,
		// 30-day money-back guarantee
		'[&_[data-guarantee-image]]:x-[hidden] [&_[data-guarantee]]:x-[text-muted-foreground,text-sm,text-center,w-full]':
			true,
		'[&_[data-features]_ul]:x-[flex,flex-col,gap-3,pt-3] [&_[data-features]_li]:x-[inline-flex,items-center,gap-2]':
			true,
	})
