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
import { ChevronDown, Plus, Search } from 'lucide-react'

import {
	Button,
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
			id: 'name',
			header: 'Name',
			accessorFn: (data) => data.name,
			cell: ({ row }) => {
				return <div>{row.getValue('name')}</div>
			},
		},
		{
			id: 'email',
			header: 'Email',
			accessorFn: (data) => data.email,
			cell: ({ row }) => {
				return <div>{row.getValue('email')}</div>
			},
		},
		{
			id: 'profile',
			header: 'Profile',
			accessorFn: (data) => data.id,
			cell: ({ row }) => {
				return (
					<Link href={`/profile/${row.getValue('id')}`}>
						<Button variant="outline" size="sm">
							Go to Profile
						</Button>
					</Link>
				)
			},
		},
	] as ColumnDef<UserRow>[]
}

type UserRow = {
	id: string
	name: string | null
	email: string
	image: string | null
}

const InstructorDataTable: React.FC<{ users: UserRow[] }> = ({ users }) => {
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	})
	const [globalFilter, setGlobalFilter] = React.useState<any>([])

	const table = useReactTable<UserRow>({
		data: users,
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
		<div className="w-full">
			<div className="flex flex-col items-center justify-between gap-2 pb-4 sm:flex-row">
				<div className="relative w-full">
					<Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search instructors..."
						value={globalFilter}
						onChange={(e) => table.setGlobalFilter(String(e.target.value))}
						className="w-full max-w-sm pl-8"
					/>
				</div>
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
