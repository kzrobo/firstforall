"use client";
import type { Material } from "three";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { ORIGIN, clusterPoints, type Cluster } from "@/lib/hub/geo";
import { ConnectionPanel } from "./ConnectionPanel";
import type { ConnectionView, GlobeLabels } from "./types";

// WebGL code must never run on the server.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const HOME_VIEW = { lat: 38, lng: 55, altitude: 2.35 };
/** Phones see more of the sphere so Europe and Shymkent both fit on screen. */
const homeView = (width: number) => (width > 0 && width < 640 ? { lat: 40, lng: 36, altitude: 3.1 } : HOME_VIEW);
const ICE = "#93c5fa";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * MAVERICKS Connects globe. Dark navy oceans, quiet land outlines, ice-blue arcs from Shymkent to
 * every confirmed collaboration, logo markers (clustered when close). Drag/touch rotates, wheel/pinch
 * zooms within limits, markers open a panel; reduced motion disables auto-rotation and arc animation.
 */
export function ConnectsGlobe({ connections, labels }: { connections: ConnectionView[]; labels: GlobeLabels }) {
  const wrap = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const idleTimer = useRef<number | undefined>(undefined);
  const pointerInside = useRef(false);
  const selectedRef = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [land, setLand] = useState<object[]>([]);
  const [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState<Cluster | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [material, setMaterial] = useState<Material | undefined>(undefined);

  const clusters = useMemo(() => clusterPoints(connections), [connections]);
  const byId = useMemo(() => new Map(connections.map((c) => [c.id, c])), [connections]);

  useEffect(() => {
    setWebgl(hasWebGL());
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // three is already part of the globe's lazy chunk; importing it here keeps it out of the page bundle.
    import("three").then(({ MeshPhongMaterial }) => setMaterial(new MeshPhongMaterial({ color: "#071431", emissive: "#020a1d", shininess: 6 })));
    import("world-atlas/countries-110m.json").then((m) => {
      const topo = (m.default ?? m) as unknown as Topology<{ countries: GeometryCollection }>;
      setLand(feature(topo, topo.objects.countries).features);
    });
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  /** Auto-rotation resumes only when nothing is selected and the mouse is not over the globe. */
  const resumeLater = useCallback((ms: number) => {
    window.clearTimeout(idleTimer.current);
    if (reduced) return;
    idleTimer.current = window.setTimeout(() => {
      const g = globe.current;
      if (g && !pointerInside.current && !selectedRef.current) g.controls().autoRotate = true;
    }, ms);
  }, [reduced]);

  // three-globe can report ready synchronously, before React has attached the ref; configure once the ref exists.
  const [loaded, setLoaded] = useState(false);
  const onReady = useCallback(() => setLoaded(true), []);
  const configured = useRef(false);
  useEffect(() => {
    if (!loaded || configured.current) return;
    let raf = 0;
    const run = () => {
      const g = globe.current;
      if (!g) { raf = requestAnimationFrame(run); return; }
      configured.current = true;
      g.pointOfView(homeView(wrap.current?.clientWidth ?? 0), 0);
      const controls = g.controls();
      controls.enableDamping = true;
      controls.minDistance = 160; // globe radius is 100
      controls.maxDistance = 520;
      controls.autoRotate = !reduced && !pointerInside.current;
      controls.autoRotateSpeed = 0.35;
      // Pause auto-rotation while the visitor interacts; resume after a quiet moment.
      controls.addEventListener("start", () => { controls.autoRotate = false; window.clearTimeout(idleTimer.current); });
      controls.addEventListener("end", () => resumeLater(7000));
      setReady(true);
    };
    run();
    return () => cancelAnimationFrame(raf);
  }, [loaded, reduced, resumeLater]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);
  useEffect(() => { selectedRef.current = selected !== null; }, [selected]);

  // Markers hold still while the mouse is over the globe, so they never have to be chased.
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointerInside.current = true;
    window.clearTimeout(idleTimer.current);
    const g = globe.current;
    if (g) g.controls().autoRotate = false;
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointerInside.current = false;
    resumeLater(2500);
  };

  const select = useCallback((c: Cluster) => {
    const g = globe.current;
    if (g) {
      g.controls().autoRotate = false;
      g.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.7 }, reduced ? 0 : 900);
    }
    // On desktop the panel docks to the globe's top edge: keep that edge clear of the sticky site header.
    const el = wrap.current;
    if (el && window.matchMedia("(min-width: 1024px)").matches) {
      const top = el.getBoundingClientRect().top;
      if (top < 80) window.scrollBy({ top: top - 80, behavior: reduced ? "auto" : "smooth" });
    }
    setSelected(c);
  }, [reduced]);

  const reset = () => {
    setSelected(null);
    const g = globe.current;
    if (g) {
      g.pointOfView(homeView(wrap.current?.clientWidth ?? 0), reduced ? 0 : 900);
      g.controls().autoRotate = !reduced && !pointerInside.current;
    }
  };

  const arcs = useMemo(() => clusters.map((c) => ({ id: c.id, startLat: ORIGIN.lat, startLng: ORIGIN.lng, endLat: c.lat, endLng: c.lng })), [clusters]);
  const markers = useMemo(() => [{ kind: "origin" as const, id: "origin", lat: ORIGIN.lat, lng: ORIGIN.lng }, ...clusters.map((c) => ({ kind: "cluster" as const, ...c }))], [clusters]);

  const makeMarker = useCallback((d: object) => {
    const m = d as (typeof markers)[number];
    const el = document.createElement("div");
    el.style.pointerEvents = "auto";
    if (m.kind === "origin") {
      el.className = "ffa-marker ffa-origin";
      el.innerHTML = `<span class="ffa-dot"></span><span class="ffa-label">${escapeHtml(labels.origin)}</span>`;
      return el;
    }
    const first = m.points[0];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ffa-marker";
    const name = m.points.length > 1 ? `${m.points.length} ${labels.teams}: ${m.points.map((p) => p.teamName).join(", ")}` : `${first.teamName}, ${byId.get(first.id)?.countryName ?? first.countryCode}`;
    btn.setAttribute("aria-label", name);
    btn.innerHTML = m.points.length > 1
      ? `<span class="ffa-logo ffa-count">${m.points.length}</span>`
      : first.logoUrl
        ? `<img class="ffa-logo" src="${encodeURI(first.logoUrl)}" alt="" loading="lazy" />`
        : `<span class="ffa-logo ffa-initials">${escapeHtml(initials(first.teamName))}</span>`;
    const tip = document.createElement("span");
    tip.className = "ffa-tip";
    const view = byId.get(first.id);
    tip.textContent = m.points.length > 1 ? name : `${first.teamName} · ${view?.countryName ?? ""}${first.teamNumber ? ` · #${first.teamNumber}` : ""}`;
    btn.appendChild(tip);
    btn.addEventListener("mouseenter", () => setHover(m.id));
    btn.addEventListener("mouseleave", () => setHover(null));
    btn.addEventListener("click", (e) => { e.stopPropagation(); select(m); });
    el.appendChild(btn);
    return el;
  }, [byId, labels.origin, labels.teams, select]);

  return (
    <div className="relative">
      <div ref={wrap} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} className="relative h-[64svh] min-h-[420px] sm:h-[min(78svh,760px)] w-full touch-none overflow-hidden" aria-describedby="globe-hint">
        {webgl === false ? (
          <div role="note" className="flex h-full items-center justify-center px-6 text-center text-ink-muted">{labels.noWebgl}</div>
        ) : (
          <>
            {size.w > 0 && webgl && material && (
              <Globe
                ref={globe}
                width={size.w}
                height={size.h}
                backgroundColor="rgba(0,0,0,0)"
                globeMaterial={material}
                showAtmosphere
                atmosphereColor={ICE}
                atmosphereAltitude={0.11}
                polygonsData={land}
                polygonCapColor={() => "#10204a"}
                polygonSideColor={() => "rgba(0,0,0,0)"}
                polygonStrokeColor={() => "rgba(147,197,250,0.22)"}
                polygonAltitude={0.004}
                arcsData={arcs}
                arcColor={(a: object) => ((a as { id: string }).id === selected?.id || (a as { id: string }).id === hover ? ["rgba(147,197,250,0.35)", "rgba(245,248,255,1)"] : ["rgba(147,197,250,0.12)", "rgba(147,197,250,0.75)"])}
                arcStroke={0.45}
                arcAltitudeAutoScale={0.42}
                arcDashLength={reduced ? 1 : 0.45}
                arcDashGap={reduced ? 0 : 0.25}
                arcDashInitialGap={reduced ? 0 : () => Math.random()}
                arcDashAnimateTime={reduced ? 0 : 5200}
                htmlElementsData={markers}
                htmlElement={makeMarker}
                htmlAltitude={0.012}
                htmlTransitionDuration={0}
                onGlobeReady={onReady}
              />
            )}
            {!ready && <p role="status" className="absolute inset-0 flex items-center justify-center text-[14px] text-ink-faint">{labels.loading}</p>}
          </>
        )}
        {connections.length === 0 && webgl !== false && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto max-w-md px-6 text-center text-[14px] text-ink-muted">{labels.empty}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-5 text-[13px] text-ink-faint sm:px-0">
        <p id="globe-hint">{labels.hint}</p>
        <button type="button" onClick={reset} className="link-rule font-medium text-ink">{labels.reset}</button>
      </div>

      {selected && (
        <ConnectionPanel
          cluster={selected}
          views={selected.points.map((p) => byId.get(p.id)).filter((v): v is ConnectionView => Boolean(v))}
          labels={labels}
          onClose={() => setSelected(null)}
          onPick={(id) => {
            const p = byId.get(id);
            if (p) select({ id: `c-${p.id}`, lat: p.lat, lng: p.lng, points: [p] });
          }}
        />
      )}
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
