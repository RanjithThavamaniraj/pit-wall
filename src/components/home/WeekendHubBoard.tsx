import Link from "next/link";

export type HubBriefingLine = {
  key: string;
  value: string;
  actionHref?: string;
  actionLabel?: string;
};

export type HubBoardRow = {
  id: string;
  channel: string;
  tag: string;
  tagLive?: boolean;
  title: string;
  line: string;
  href: string;
  cta: string;
  meta: string;
};

type Props = {
  briefing: HubBriefingLine[];
  rows: HubBoardRow[];
};

function BriefingSheet({ lines }: { lines: HubBriefingLine[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="hub-briefing">
      {lines.map((line) => (
        <div key={line.key} className="hub-briefing-line">
          <span className="hub-briefing-key">{line.key}</span>
          <span className="hub-briefing-dots" aria-hidden="true">
            {"·".repeat(40)}
          </span>
          <span className="hub-briefing-val">{line.value}</span>
          {line.actionHref && line.actionLabel ? (
            <Link href={line.actionHref} className="hub-briefing-action">
              {line.actionLabel}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function WeekendHubBoard({ briefing, rows }: Props) {
  return (
    <div className="hub-stack">
      <BriefingSheet lines={briefing} />
      <div className="hub-board">
        {rows.map((row) => (
          <Link key={row.id} href={row.href} className="hub-board-row group">
            <span className="hub-board-channel">{row.channel}</span>
            <span
              className={`hub-board-tag${row.tagLive ? " hub-board-tag--live" : ""}`}
            >
              {row.tag}
            </span>
            <div className="hub-board-body">
              <p className="hub-board-title">{row.title}</p>
              <p className="hub-board-line">{row.line}</p>
            </div>
            <div className="hub-board-trail">
              <span className="hub-board-cta">{row.cta} →</span>
              <p className="hub-board-meta">{row.meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
