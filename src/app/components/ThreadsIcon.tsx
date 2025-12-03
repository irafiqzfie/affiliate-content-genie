"use client";

import React from "react";

interface ThreadsIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function ThreadsIcon({ size = 20, ...props }: ThreadsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="0" y="0" width="24" height="24" rx="6" fill="black" />
      <path
        fill="white"
        d="M12.186 3.998c-1.864 0-3.572.61-4.952 1.64-1.326 1.037-2.335 2.522-2.916 4.294l2.79.89c.456-1.391 1.232-2.496 2.22-3.207.99-.686 2.15-1.073 3.408-1.073 2.636 0 4.767 2.131 4.767 4.767 0 .702-.157 1.373-.44 1.977-.3.64-.753 1.2-1.314 1.626-.558.424-1.22.711-1.93.83v2.934c1.296-.171 2.465-.676 3.415-1.429 1.007-.797 1.805-1.857 2.317-3.078.52-1.247.79-2.63.79-4.086 0-3.9-3.17-7.07-7.07-7.07zM10.928 15.34v2.844c0 .7.566 1.266 1.266 1.266.7 0 1.266-.566 1.266-1.266V15.34h-2.532z"
      />
    </svg>
  );
}
