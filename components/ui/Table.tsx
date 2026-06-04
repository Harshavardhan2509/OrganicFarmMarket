'use client'

import React from 'react'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[]
  children: React.ReactNode
}

export default function Table({
  headers,
  children,
  className = '',
  ...props
}: TableProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm shadow-slate-100/50">
      <div className="w-full overflow-x-auto">
        <table className={`w-full border-collapse text-left text-sm text-slate-500 ${className}`} {...props}>
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} scope="col" className="px-6 py-4 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-900 font-medium">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}
