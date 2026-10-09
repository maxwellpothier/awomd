import { ImageResponse } from "next/og";
import {
  color,
  display,
  fonts,
  logo,
  logoAspect,
  paperCore,
  publicImage,
  serif,
  tornEdge,
} from "@/images/kit";

/**
 * Link previews: the card iMessage, Slack, Instagram DMs and the rest draw
 * under a link to the site. 1200 × 630, the size they all crop to.
 *
 * The same desk as the homepage and the story images: navy, the logo, a torn
 * sheet with the words on it, and a few covers fanned out beside it.
 */
export const previewSize = { width: 1200, height: 630 };

const sheetWidth = 600;

/** Where each cover lies, right of the sheet, the first on top. */
const coverSpots = [
  { size: 300, left: 820, top: 150, rotate: 7 },
  { size: 280, left: 700, top: 250, rotate: -5 },
  { size: 260, left: 900, top: 330, rotate: 13 },
];

export async function previewImage({
  dateline,
  title,
  line,
  covers,
}: {
  /** Small, over the title: "Issue 002 · October 4, 2026". */
  dateline?: string;
  title: string;
  /** A sentence under the title. */
  line?: string;
  /** Up to three cover paths under /public. */
  covers: string[];
}) {
  const [logoSrc, coverSrcs] = await Promise.all([
    logo,
    Promise.all(covers.slice(0, 3).map(publicImage)),
  ]);
  const titleSize = title.length > 30 ? 52 : 62;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: color.navy,
        }}
      >
        {/* Back to front, so the first cover lies on top. */}
        {coverSpots
          .map((spot, i) => ({ spot, src: coverSrcs[i] }))
          .reverse()
          .map(({ spot, src }) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={spot.left}
                src={src}
                width={spot.size}
                height={spot.size}
                alt=""
                style={{
                  position: "absolute",
                  left: spot.left,
                  top: spot.top,
                  objectFit: "cover",
                  transform: `rotate(${spot.rotate}deg)`,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                }}
              />
            ) : null,
          )}

        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            width={210}
            height={210 * logoAspect}
            alt=""
            style={{ position: "absolute", left: 70, top: 46 }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 70,
            top: 190,
            display: "flex",
            flexDirection: "column",
            width: sheetWidth,
            transform: "rotate(-1.5deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: paperCore,
              padding: "36px 40px 18px",
            }}
          >
            {dateline ? (
              <div style={{ ...serif, display: "flex", fontSize: 24, color: color.inkMuted }}>
                {dateline}
              </div>
            ) : null}
            <div
              style={{
                ...display,
                display: "flex",
                marginTop: dateline ? 10 : 0,
                fontSize: titleSize,
                lineHeight: 1.05,
                color: color.ink,
              }}
            >
              {title}
            </div>
            {line ? (
              <div
                style={{
                  ...serif,
                  display: "flex",
                  marginTop: 16,
                  fontSize: 25,
                  lineHeight: 1.45,
                  color: color.inkMuted,
                }}
              >
                {line}
              </div>
            ) : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tornEdge({ width: sheetWidth, height: 34, seed: 1987 })}
            width={sheetWidth}
            height={34}
            alt=""
            style={{ marginTop: -2 }}
          />
        </div>
      </div>
    ),
    { ...previewSize, fonts: await fonts() },
  );
}
