import type { SVGProps } from "react";

/**
 * The GGI Tech lockup: the Iso Cube mark followed by the custom monoline
 * wordmark.
 *
 * Rendered inline rather than as an `<img>` so it stays crisp at any size,
 * costs no extra request, and can inherit the surrounding text colour. The
 * "GGI" glyphs are drawn in `currentColor` while "TECH" stays brand blue,
 * which is what lets a single component sit correctly on both the dark
 * navigation and any lighter surface.
 *
 * The path data comes from the parametric monoline alphabet behind the
 * approved identity, so the letterforms are plain vector outlines and have
 * no font dependency. Matching files for print and third-party use live in
 * `public/brand/`.
 */
export default function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="-14 -14 928.08 128"
      width={928.08}
      height={128}
      focusable="false"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Iso Cube mark */}
      <path d="M 50 50 L 50 6 L 88.11 72 Z" fill="#22C55E" />
      <g fill="none" stroke="#3B82F6" strokeWidth={6} strokeLinejoin="round">
        <path d="M 50 6 L 88.11 28 L 88.11 72 L 50 94 L 11.89 72 L 11.89 28 Z" />
        <path d="M 50 50 L 50 6 M 50 50 L 88.11 72 M 50 50 L 11.89 72" />
      </g>

      {/* Wordmark — "GGI" inherits the text colour, "TECH" is brand blue */}
      <g
        transform="translate(134 0) scale(1.12 1)"
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g stroke="currentColor">
          <path d="M 72 11.89 A 44 44 0 1 0 94 50 L 50 50" />
          <path transform="translate(114 0)" d="M 72 11.89 A 44 44 0 1 0 94 50 L 50 50" />
          <path transform="translate(228 0)" d="M 8 6 L 8 94" />
        </g>
        <g stroke="#3B82F6">
          <path transform="translate(306 0)" d="M 6 6 L 78 6 M 42 6 L 42 94" />
          <path transform="translate(404 0)" d="M 66 6 L 6 6 L 6 94 L 66 94 M 6 50 L 56 50" />
          <path transform="translate(490 0)" d="M 75 17.83 A 42 42 0 1 0 75 82.17" />
          <path transform="translate(600 0)" d="M 6 6 L 6 94 M 78 6 L 78 94 M 6 50 L 78 50" />
        </g>
      </g>
    </svg>
  );
}
