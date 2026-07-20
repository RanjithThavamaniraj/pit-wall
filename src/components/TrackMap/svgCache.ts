export type ParsedCircuitSvg = {
  viewBox: string;
  trackPathD: string;
  /** Present only when the SVG includes a pit-lane path. */
  pitPathD: string | null;
};

const svgParseCache = new Map<string, Promise<ParsedCircuitSvg>>();
const pathLengthCache = new Map<string, number>();

function extractPathD(el: Element): string | null {
  const d = el.getAttribute("d");
  return d && d.trim() ? d.trim() : null;
}

function parseSvgDocument(svgText: string): ParsedCircuitSvg {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) {
    throw new Error("Invalid circuit SVG: missing <svg>");
  }

  const viewBox =
    svg.getAttribute("viewBox")?.trim() ||
    `0 0 ${svg.getAttribute("width") ?? 1000} ${svg.getAttribute("height") ?? 1000}`;

  const pitEl =
    svg.querySelector('path[data-role="pit"]') ??
    svg.querySelector("path#pit") ??
    svg.querySelector('path[id*="pit" i]');

  const pitPathD = pitEl ? extractPathD(pitEl) : null;

  const trackEl =
    svg.querySelector('path[data-role="track"]') ??
    svg.querySelector("path#track") ??
    [...svg.querySelectorAll("path")].find((path) => path !== pitEl) ??
    null;

  const trackPathD = trackEl ? extractPathD(trackEl) : null;
  if (!trackPathD) {
    throw new Error("Invalid circuit SVG: missing track path");
  }

  return { viewBox, trackPathD, pitPathD };
}

/**
 * Fetch + parse a circuit SVG once per URL. Cached for the session.
 */
export function loadCircuitSvg(url: string): Promise<ParsedCircuitSvg> {
  const cached = svgParseCache.get(url);
  if (cached) return cached;

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load circuit SVG: ${response.status}`);
      }
      return response.text();
    })
    .then(parseSvgDocument)
    .catch((error) => {
      svgParseCache.delete(url);
      throw error;
    });

  svgParseCache.set(url, promise);
  return promise;
}

/**
 * Memoize getTotalLength() results keyed by SVG URL.
 * Call only after the path element is in the DOM.
 */
export function getCachedPathLength(
  url: string,
  path: SVGPathElement
): number {
  const cached = pathLengthCache.get(url);
  if (cached !== undefined) return cached;

  const length = path.getTotalLength();
  pathLengthCache.set(url, length);
  return length;
}

export function clearCircuitSvgCaches(): void {
  svgParseCache.clear();
  pathLengthCache.clear();
}
