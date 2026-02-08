import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  emptyState?: string;
  onRowClick?: (item: any) => void;
  actions?: (item: any) => React.ReactNode;
}

export function ResponsiveTable({
  columns,
  data,
  isLoading,
  emptyState = 'No data available',
  onRowClick,
  actions,
}: ResponsiveTableProps) {
  // Desktop table view
  const DesktopTable = () => (
    <div className="hidden md:block overflow-x-auto border border-[#2B2B2B] rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-[#2B2B2B] bg-[#1a1a1a]/50 hover:bg-[#1a1a1a]/50">
            {columns.map((col) => (
              <TableHead key={col.key} className="text-[#9CA3AF] font-semibold text-sm">
                {col.label}
              </TableHead>
            ))}
            {actions && <TableHead className="text-[#9CA3AF] font-semibold text-sm">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-8 text-[#6B7280]"
              >
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow
                key={idx}
                onClick={() => onRowClick?.(item)}
                className={`border-[#2B2B2B] hover:bg-[#1a1a1a]/50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${idx}-${col.key}`}
                    className={`text-sm text-white py-4 ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(item[col.key], item)
                      : item[col.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-sm text-white py-4">
                    {actions(item)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile card view
  const MobileCardView = () => (
    <div className="md:hidden space-y-3">
      {data.length === 0 ? (
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardContent className="py-8 text-center text-[#6B7280]">
            {emptyState}
          </CardContent>
        </Card>
      ) : (
        data.map((item, idx) => (
          <Card
            key={idx}
            className={`border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e] hover:border-[#8451e1]/50 transition-all ${
              onRowClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="pt-4 space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-[#9CA3AF]">
                    {col.mobileLabel || col.label}
                  </span>
                  <span className="text-sm font-medium text-white text-right">
                    {col.render
                      ? col.render(item[col.key], item)
                      : item[col.key]}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="pt-2 border-t border-[#2B2B2B] mt-3">
                  {actions(item)}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DesktopTable />
      <MobileCardView />
    </>
  );
}