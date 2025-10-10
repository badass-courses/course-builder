'use client'

import * as React from 'react'
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

import { Coupon } from '@coursebuilder/core/schemas'
import {
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui'

export const columns = () => {
	return [
		{
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => {
						return table.toggleAllRowsSelected(!!value)
						// or select only on current page
						// return table.toggleAllPageRowsSelected(!!value)
					}}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: 'id',
			header: 'ID',
			accessorFn: (data) => data.id,
		},
		{
			id: 'createdAt',
			header: ({ column }) => {
				return (
					<button
						className="flex items-center gap-0.5"
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					>
						Created
						<ArrowUpDown className="h-4 w-4" />
					</button>
				)
			},
			accessorFn: (data) => {
				return data.createdAt?.toUTCString()
			},
			cell: ({ row }) => {
				return <div>{row.getValue('createdAt')}</div>
			},
		},
		{
			id: 'percentageDiscount',
			header: 'Percent Off',
			accessorFn: (data) => data.percentageDiscount,
			cell: ({ row }) => {
				const value = row.getValue('percentageDiscount')
				return value ? <div>{Number(value) * 100}%</div> : <div>—</div>
			},
		},
		{
			id: 'amountDiscount',
			header: 'Amount Off',
			accessorFn: (data) => data.amountDiscount,
			cell: ({ row }) => {
				const value = row.getValue('amountDiscount')
				return value ? <div>${Number(value) / 100}</div> : <div>—</div>
			},
		},
		{
			id: 'expires',
			header: 'Expires',
			accessorFn: (data) => data.expires || undefined,
			cell: ({ row }) => {
				return (
					<div>
						{Boolean(row.getValue('expires'))
							? new Date(row.getValue('expires')).toISOString()
							: '✖️'}
					</div>
				)
			},
		},
		{
			id: 'maxUses',
			header: 'Max Uses',
			accessorFn: (data) => data.maxUses,
			cell: ({ row }) => {
				return (
					<div>
						{row.getValue('maxUses') === -1 ? '∞' : row.getValue('maxUses')}
					</div>
				)
			},
		},
		{
			id: 'usedCount',
			header: 'Used',
			accessorFn: (data) => data.usedCount,
			cell: ({ row }) => {
				return <div>{row.getValue('usedCount')}</div>
			},
		},
		{
			id: 'restrictedToProductId',
			header: 'Restricted To Product ID',
			accessorFn: (data) => data.restrictedToProductId,
		},
		{
			id: 'default',
			header: 'Default',
			accessorFn: (data) => data.default,
		},
		{
			id: 'merchantCouponId',
			header: 'Merchant Coupon ID',
			accessorFn: (data) => data.merchantCouponId || '',
		},
		{
			id: 'status',
			header: 'Status',
			accessorFn: (data) => data.status,
		},
		// {
		//   id: 'code',
		//   header: 'Code',
		//   accessorFn: (data) => data.code || '',
		// },
		// {
		//   id: 'bulkPurchaseId',
		//   header: 'Bulk Purchase ID',
		//   accessorFn: (data) => data.bulkPurchaseId || '',
		// },
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				const coupon = row.original
				const couponUrl = `${process.env.NEXT_PUBLIC_URL}?code=${coupon.id}`
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => navigator.clipboard.writeText(couponUrl)}
							>
								Copy URL
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => console.log('delete')}>
								Remove coupon
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			},
		},
	] as ColumnDef<Coupon>[]
}

const CouponDataTable: React.FC<{ coupons: Coupon[] }> = ({ coupons }) => {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = React.useState({})

	const table = useReactTable({
		data: coupons,
		columns: columns(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	})

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				<Input
					placeholder="Filter coupons by createdAt..."
					value={
						(table.getColumn('createdAt')?.getFilterValue() as string) ?? ''
					}
					onChange={(event) =>
						table.getColumn('createdAt')?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							Columns <ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								)
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} className="whitespace-nowrap">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell className="whitespace-nowrap" key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="text-muted-foreground flex flex-1 items-center text-sm">
					{table.getFilteredSelectedRowModel().rows.length > 0 && (
						<div className="flex items-center gap-2">
							<Button
								onClick={() => {
									const data = `${table
										.getFilteredSelectedRowModel()
										.rows.map(
											(row) =>
												`${process.env.NEXT_PUBLIC_URL}?code=${row.original.id}`,
										)
										.join('\n')}`
									toast.success('Copied to clipboard')
									return navigator.clipboard.writeText(data)
								}}
							>
								Copy selected coupon(s) URL
							</Button>
							<Button
								variant="secondary"
								className="mr-3"
								onClick={() => {
									console.log('delete')
									table.toggleAllRowsSelected(false)
									toast.success('Coupon(s) removed')
								}}
							>
								Remove selected coupon(s)
							</Button>
						</div>
					)}
					<div>
						{table.getFilteredSelectedRowModel().rows.length} of{' '}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}

export default CouponDataTable
