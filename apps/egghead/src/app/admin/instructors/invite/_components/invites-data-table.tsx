'use client'

import * as React from 'react'
import Link from 'next/link'
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ChevronDown, Plus, Search } from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
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
			id: 'id',
			header: 'ID',
			accessorFn: (data) => data.id,
		},
		{
			id: 'inviteState',
			header: 'State',
			accessorFn: (data) => data.inviteState,
			cell: ({ row }) => {
				return <div>{row.getValue('inviteState')}</div>
			},
		},
		{
			id: 'inviteEmail',
			header: 'Invited Email',
			accessorFn: (data) => data.inviteEmail,
			cell: ({ row }) => {
				return <div>{row.getValue('inviteEmail')}</div>
			},
		},
		{
			id: 'acceptedEmail',
			header: 'Accepted Email',
			accessorFn: (data) => data.acceptedEmail,
			cell: ({ row }) => {
				return <div>{row.getValue('acceptedEmail')}</div>
			},
		},
		{
			id: 'createdAt',
			header: 'Created At',
			accessorFn: (data) => data.createdAt,
			cell: ({ row }) => {
				const date = row.getValue('createdAt')
				return date ? (
					<div>{format(new Date(date), 'MMM d, yyyy h:mm a')}</div>
				) : null
			},
		},
		{
			id: 'expiresAt',
			header: 'Expires At',
			accessorFn: (data) => data.expiresAt,
			cell: ({ row }) => {
				const date = row.getValue('expiresAt')
				return date ? (
					<div>{format(new Date(date), 'MMM d, yyyy h:mm a')}</div>
				) : null
			},
		},
		{
			id: 'confirmedAt',
			header: 'Confirmed At',
			accessorFn: (data) => data.confirmedAt,
			cell: ({ row }) => {
				const date = row.getValue('confirmedAt')
				return date ? (
					<div>{format(new Date(date), 'MMM d, yyyy h:mm a')}</div>
				) : null
			},
		},
		{
			id: 'completedAt',
			header: 'Completed At',
			accessorFn: (data) => data.completedAt,
			cell: ({ row }) => {
				const date = row.getValue('completedAt')
				return date ? (
					<div>{format(new Date(date), 'MMM d, yyyy h:mm a')}</div>
				) : null
			},
		},
	] as ColumnDef<InviteRow>[]
}

type InviteRow = {
	id: string
	inviteState: 'INITIATED' | 'VERIFIED' | 'CANCELED' | 'EXPIRED' | 'COMPLETED'
	inviteEmail: string
	acceptedEmail: string | null
	userId: string | null
	createdAt: Date | null
	expiresAt: Date | null
	canceledAt: Date | null
	confirmedAt: Date | null
	completedAt: Date | null
}

const InstructorDataTable: React.FC<{ invites: InviteRow[] }> = ({
	invites,
}) => {
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	})
	const [globalFilter, setGlobalFilter] = React.useState<any>([])

	const table = useReactTable<InviteRow>({
		data: invites,
		columns: columns(),
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: 'arrIncludes',
		onGlobalFilterChange: setGlobalFilter,
		state: {
			pagination,
			globalFilter,
		},
	})

	return (
		<div className="w-full max-w-screen-lg">
			<h2 className="pb-4 text-lg font-bold">Current Invites</h2>
			<div className="flex flex-col items-center justify-between gap-2 pb-4 sm:flex-row">
				<div className="relative w-full">
					<Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search invites..."
						value={globalFilter}
						onChange={(e) => table.setGlobalFilter(String(e.target.value))}
						className="w-full max-w-sm pl-8"
					/>
				</div>
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
			<div className="flex flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row">
				<span className="flex items-center gap-1 text-xs opacity-50">
					<div>Page</div>
					<strong>
						{table.getState().pagination.pageIndex + 1} of{' '}
						{table.getPageCount().toLocaleString()}
					</strong>
				</span>
				<div className="flex flex-col items-center justify-end gap-2 sm:flex-row">
					{(table.getCanPreviousPage() || table.getCanNextPage()) && (
						<div className="flex gap-2">
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
					)}
					<select
						value={table.getState().pagination.pageSize}
						onChange={(e) => {
							table.setPageSize(Number(e.target.value))
						}}
						className="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-6 items-center justify-center whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
					>
						{[10, 25, 50, 100].map((pageSize) => (
							<option
								key={pageSize}
								value={pageSize}
								className="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
							>
								Show {pageSize}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	)
}

export default InstructorDataTable
