import React from "react";

export const Skeleton = ({ className = "h-4 w-full", ...props }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" {...props} />
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
