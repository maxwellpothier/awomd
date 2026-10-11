import { ImageResponse } from "next/og";
import { issueDateLabel, type IssueMeta } from "@/content/issues";
import { kindLabel } from "@/content/blocks";
import type { IssueRecord } from "@/content/records";
import {
  color,
  display,
  fonts,
  logo,
  logoAspect,
  paperCore,
  Pills,
  publicImage,
  serif,
  tornEdge,
} from "@/images/kit";

/**
 * Story images: 1080 × 1920, the size Instagram stories are, one for the
 * issue and one for each record in it. Navy like the masthead, the logo up
 * top, and the issue or record on a torn sheet of paper, askew, the way the
 * homepage lays issues on the desk.
 *
 * Instagram draws its own bar over the top 250 or so pixels and the reply
 * field over the bottom 250, so everything that matters sits between.
 */
export const storySize = { width: 1080, height: 1920 };

/** The sheet, and the cover on it. */
const sheetWidth = 720;
const sheetPadding = 46;
const coverSize = sheetWidth - sheetPadding * 2;

export async function storyImage(meta: IssueMeta, record?: IssueRecord) {
  const [logoSrc, body] = await Promise.all([
    logo,
    record ? RecordSheet({ meta, record }) : IssueSheet({ meta }),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: color.navy,
          paddingTop: 220,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logoSrc ? <img src={logoSrc} width={250} height={250 * logoAspect} alt="" /> : null}
        {body}
        <div
          style={{
            ...serif,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 270,
            display: "flex",
            justifyContent: "center",
            fontSize: 36,
            color: color.cream,
          }}
        >
          Every Sunday at awomd.com
        </div>
      </div>
    ),
    { ...storySize, fonts: await fonts() },
  );
}

/** A sheet of paper with a torn bottom edge, tilted a little. */
function Sheet({
  seed,
  tilt,
  marginTop,
  children,
}: {
  seed: number;
  tilt: number;
  marginTop: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: sheetWidth,
        marginTop,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: paperCore,
          padding: `${sheetPadding}px ${sheetPadding}px 10px`,
        }}
      >
        {children}
      </div>
      {/* Tucked a pixel under the paper above, so no seam shows at the tilt. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tornEdge({ width: sheetWidth, height: 44, seed })}
        width={sheetWidth}
        height={44}
        alt=""
        style={{ marginTop: -2 }}
      />
    </div>
  );
}

/** "Issue 002 · October 4, 2026", small and muted over a title. */
function Dateline({ meta, size }: { meta: IssueMeta; size: number }) {
  return (
    <div style={{ ...serif, display: "flex", fontSize: size, color: color.inkMuted }}>
      Issue {meta.number} · {issueDateLabel(meta.date)}
    </div>
  );
}

/** One album or track: its cover filling the sheet, then what it is. */
async function RecordSheet({ meta, record }: { meta: IssueMeta; record: IssueRecord }) {
  const cover = await publicImage(record.cover);
  const kind = record.kind === "album" ? undefined : record.kind === "track" ? "Song" : kindLabel(record.kind);
  const label = [kind, record.year].filter(Boolean).join(" · ");
  const titleSize = record.title.length > 34 ? 52 : record.title.length > 20 ? 60 : 68;

  return (
    <Sheet seed={meta.number.length + Number(meta.number) * 31 + record.id.length} tilt={-1.5} marginTop={48}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} width={coverSize} height={coverSize} alt="" style={{ objectFit: "cover" }} />
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", marginTop: cover ? 34 : 0 }}>
        {label ? (
          <div style={{ ...serif, display: "flex", fontSize: 28, color: color.inkMuted }}>{label}</div>
        ) : null}
        <div
          style={{
            ...display,
            display: "flex",
            marginTop: label ? 8 : 0,
            fontSize: titleSize,
            lineHeight: 1.05,
            color: color.ink,
          }}
        >
          {record.title}
        </div>
        <div style={{ ...serif, display: "flex", marginTop: 10, fontSize: 36, color: color.inkMuted }}>
          {record.artist}
        </div>
        {record.pills?.length ? (
          <div style={{ display: "flex", marginTop: 22 }}>
            <Pills pills={record.pills} size={24} />
          </div>
        ) : null}
        <div
          style={{
            ...serif,
            display: "flex",
            marginTop: 30,
            paddingTop: 20,
            borderTop: `2px solid ${color.creamDeep}`,
            fontSize: 26,
            fontStyle: "italic",
            color: color.inkMuted,
          }}
        >
          From issue {meta.number}, {meta.title}
        </div>
      </div>
    </Sheet>
  );
}

/** Where each of the issue's three covers lies, tucked under the sheet. */
const coverSpots = [
  { size: 360, left: 400, top: 0, rotate: 8 },
  { size: 330, left: 150, top: 40, rotate: -4 },
  { size: 300, left: -40, top: 90, rotate: -12 },
];

/** The whole issue: its covers tucked under a sheet with its title and preview. */
async function IssueSheet({ meta }: { meta: IssueMeta }) {
  const covers = await Promise.all((meta.covers ?? []).slice(0, 3).map(publicImage));
  const titleSize = meta.title.length > 26 ? 84 : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative", marginTop: 60 }}>
      {/* Drawn back to front: the last cover in the list is the furthest left
          and lowest, and the first sits on top of the others. */}
      {coverSpots
        .map((spot, i) => ({ spot, src: covers[i] }))
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
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
              }}
            />
          ) : null,
        )}
      <Sheet seed={1987} tilt={-1.5} marginTop={covers.some(Boolean) ? 300 : 0}>
        <Dateline meta={meta} size={30} />
        <div
          style={{
            ...display,
            display: "flex",
            marginTop: 16,
            fontSize: titleSize,
            lineHeight: 1.04,
            color: color.ink,
          }}
        >
          {meta.title}
        </div>
        <div
          style={{
            ...serif,
            display: "flex",
            marginTop: 26,
            marginBottom: 30,
            fontSize: 34,
            lineHeight: 1.5,
            color: color.inkMuted,
          }}
        >
          {meta.preview}
        </div>
      </Sheet>
    </div>
  );
}
