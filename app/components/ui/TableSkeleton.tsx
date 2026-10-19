import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * Reusable TableSkeleton Component powered by react-loading-skeleton (DRY Principle)
 * Renders smooth animated skeleton rows matching table geometry
 */
export default function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <tbody className="divide-y divide-zinc-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="hover:bg-zinc-50/50">
          {/* User Column (Avatar + 2 text lines) */}
          <td className="py-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Skeleton circle width={36} height={36} />
              <div className="flex-1 space-y-1">
                <Skeleton width={110} height={14} borderRadius={6} />
                <Skeleton width={140} height={11} borderRadius={4} />
              </div>
            </div>
          </td>

          {/* Role Badge */}
          <td className="py-4 px-4">
            <Skeleton width={75} height={22} borderRadius={9999} />
          </td>

          {/* Status Badge */}
          <td className="py-4 px-4">
            <Skeleton width={60} height={22} borderRadius={9999} />
          </td>

          {/* Created At */}
          <td className="py-4 px-4">
            <Skeleton width={80} height={14} borderRadius={6} />
          </td>

          {/* Action Buttons */}
          <td className="py-4 px-4 sm:px-6 text-right">
            <div className="flex items-center justify-end gap-2">
              <Skeleton width={68} height={34} borderRadius={10} />
              <Skeleton width={68} height={34} borderRadius={10} />
              <Skeleton width={76} height={34} borderRadius={10} />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
