"use client";

import React from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export const Skeleton = ({ width, height, borderRadius, className, style }: SkeletonProps) => {
    return (
        <div
            className={`skeleton-base ${className || ""}`}
            style={{
                width: width || "100%",
                height: height || "1rem",
                borderRadius: borderRadius || "4px",
                ...style,
            }}
        >
            <style jsx>{`
        .skeleton-base {
          background: rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .skeleton-base::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.05),
            transparent
          );
          animation: skeleton-shimmer 1.5s infinite;
        }

        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
        </div>
    );
};

export const SkeletonCircle = ({ size, className, style }: { size?: number | string; className?: string; style?: React.CSSProperties }) => (
    <Skeleton width={size || 40} height={size || 40} borderRadius="50%" className={className} style={style} />
);
