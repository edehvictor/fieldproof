import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type IndexStatus = "verified" | "review" | "rejected";

interface IndexRow {
  city: string;
  signal: string;
  value: string;
  confidence: number;
  status: IndexStatus | string;
}

interface TrendRow {
  day: string;
  lagos: number;
  accra: number;
  nairobi: number;
}

interface FieldProofState {
  index: IndexRow[];
  trend: TrendRow[];
}

interface ChartEvent extends Event {
  detail?: FieldProofState;
}

const fallbackState: FieldProofState = {
  index: [],
  trend: [
    { day: "D-30", lagos: 2.7, accra: 2.4, nairobi: 1.9 },
    { day: "D-24", lagos: 2.9, accra: 2.5, nairobi: 2.0 },
    { day: "D-18", lagos: 3.1, accra: 2.7, nairobi: 1.8 },
    { day: "D-12", lagos: 3.0, accra: 2.8, nairobi: 1.9 },
    { day: "D-06", lagos: 3.5, accra: 2.9, nairobi: 2.0 },
    { day: "NOW", lagos: 3.8, accra: 2.9, nairobi: 2.1 },
  ],
};

const colors = {
  gold: "#ffc400",
  green: "#9cff4a",
  blue: "#87b7ff",
  ink: "#f5f7ef",
  muted: "#9aa59c",
  panel: "#070807",
  line: "rgba(255, 196, 0, 0.14)",
};

const statusColors: Record<string, string> = {
  verified: colors.green,
  review: colors.gold,
  rejected: "#ff6f6f",
};

const baseCities = [
  { city: "Lagos", x: 28, y: 38, fee: "3.8%", confidence: 91, hot: true },
  { city: "Accra", x: 52, y: 31, fee: "2.9%", confidence: 87, hot: false },
  { city: "Nairobi", x: 78, y: 29, fee: "2.1%", confidence: 90, hot: false },
  { city: "Abuja", x: 38, y: 72, fee: "3.4%", confidence: 84, hot: false },
];

const routeBlue = [
  { x: 24, y: 56 },
  { x: 56, y: 34 },
  { x: 74, y: 64 },
];

const routeGold = [
  { x: 26, y: 28 },
  { x: 46, y: 44 },
  { x: 58, y: 52 },
];

function cityFeeFromIndex(index: IndexRow[], city: string, fallback: string) {
  const row = index.find(
    (item) =>
      item.city.toLowerCase() === city.toLowerCase() &&
      item.value.includes("%") &&
      (item.signal.toLowerCase().includes("fee") || item.signal.toLowerCase().includes("spread")),
  );

  return row?.value.match(/\d+(\.\d+)?%/)?.[0] || fallback;
}

function CityMapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const city = payload[0].payload;
  return (
    <div className="recharts-tooltip">
      <strong>{city.city}</strong>
      <p>Cash-out fee: {city.fee}</p>
      <p>Confidence: {city.confidence}%</p>
    </div>
  );
}

function CityMarker(props: any) {
  const { cx, cy, payload } = props;
  const width = payload.city === "Nairobi" ? 130 : 112;
  const height = 66;
  const x = cx - width / 2;
  const y = cy - height / 2;
  const fill = payload.hot ? "rgba(255, 109, 94, 0.24)" : "#171a16";
  const stroke = payload.hot ? "rgba(255, 109, 94, 0.55)" : "rgba(255, 196, 0, 0.32)";

  return (
    <g
      className="city-map-node"
      role="button"
      tabIndex={0}
      onClick={() => window.dispatchEvent(new CustomEvent("fieldproof:city", { detail: payload.city }))}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          window.dispatchEvent(new CustomEvent("fieldproof:city", { detail: payload.city }));
        }
      }}
    >
      <rect x={x} y={y} width={width} height={height} rx={8} fill={fill} stroke={stroke} />
      <text x={x + 16} y={y + 26} fill={colors.muted} fontSize={15} fontFamily="Bricolage Grotesque, sans-serif">
        {payload.city}
      </text>
      <text x={x + 16} y={y + 52} fill={colors.gold} fontSize={25} fontWeight={900} fontFamily="DM Mono, monospace">
        {payload.fee}
      </text>
    </g>
  );
}

function RealityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="recharts-tooltip">
      <strong>{label}</strong>
      {payload.map((item: any) => (
        <p key={item.dataKey}>
          {item.name}: {Number(item.value).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

function StatusTooltip({ active, payload }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  return (
    <div className="recharts-tooltip">
      <strong>{item.name}</strong>
      <p>{item.value} proof signals</p>
    </div>
  );
}

function FieldProofCharts() {
  const [chartState, setChartState] = useState<FieldProofState>(fallbackState);

  useEffect(() => {
    let mounted = true;

    fetch("/api/state")
      .then((response) => response.json())
      .then((state: FieldProofState) => {
        if (mounted) {
          setChartState(state);
        }
      })
      .catch(() => {
        if (mounted) {
          setChartState(fallbackState);
        }
      });

    const handleState = (event: ChartEvent) => {
      if (event.detail) {
        setChartState(event.detail);
      }
    };

    window.addEventListener("fieldproof:state", handleState as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("fieldproof:state", handleState as EventListener);
    };
  }, []);

  const statusData = useMemo(() => {
    const counts = chartState.index.reduce<Record<string, number>>((acc, row) => {
      const status = row.status || "review";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: statusColors[name] || colors.blue,
    }));
  }, [chartState.index]);

  if (!chartState.trend.length) {
    return <div className="recharts-empty">Waiting for FieldProof index data</div>;
  }

  return (
    <div className="recharts-shell">
      <section className="recharts-card" aria-label="Cash-out fee movement chart">
        <h4>Cash-out fee movement</h4>
        <ResponsiveContainer width="100%" height={198}>
          <AreaChart data={chartState.trend} margin={{ top: 10, right: 14, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="lagosFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.gold} stopOpacity={0.28} />
                <stop offset="100%" stopColor={colors.gold} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="accraFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.green} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colors.green} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 0.2", "dataMax + 0.2"]}
            />
            <Tooltip content={<RealityTooltip />} />
            <Legend
              iconType="square"
              wrapperStyle={{ color: colors.muted, fontSize: 11, fontFamily: "DM Mono, monospace" }}
            />
            <Area
              type="monotone"
              dataKey="lagos"
              name="Lagos"
              stroke={colors.gold}
              strokeWidth={3}
              fill="url(#lagosFill)"
              dot={{ r: 3, fill: colors.gold }}
            />
            <Area
              type="monotone"
              dataKey="accra"
              name="Accra"
              stroke={colors.green}
              strokeWidth={3}
              fill="url(#accraFill)"
              dot={{ r: 3, fill: colors.green }}
            />
            <Area
              type="monotone"
              dataKey="nairobi"
              name="Nairobi"
              stroke={colors.blue}
              strokeWidth={3}
              fill="transparent"
              dot={{ r: 3, fill: colors.blue }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="recharts-card" aria-label="Proof verification status pie chart">
        <h4>Proof health</h4>
        <ResponsiveContainer width="100%" height={198}>
          <PieChart>
            <Pie
              data={statusData.length ? statusData : [{ name: "pending", value: 1, color: colors.gold }]}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              stroke={colors.panel}
              strokeWidth={3}
            >
              {(statusData.length ? statusData : [{ name: "pending", color: colors.gold }]).map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ color: colors.muted, fontSize: 11, fontFamily: "DM Mono, monospace" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function CityRealityMap() {
  const [chartState, setChartState] = useState<FieldProofState>(fallbackState);

  useEffect(() => {
    let mounted = true;

    fetch("/api/state")
      .then((response) => response.json())
      .then((state: FieldProofState) => {
        if (mounted) {
          setChartState(state);
        }
      })
      .catch(() => {
        if (mounted) {
          setChartState(fallbackState);
        }
      });

    const handleState = (event: ChartEvent) => {
      if (event.detail) {
        setChartState(event.detail);
      }
    };

    window.addEventListener("fieldproof:state", handleState as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("fieldproof:state", handleState as EventListener);
    };
  }, []);

  const cities = useMemo(
    () =>
      baseCities.map((city) => ({
        ...city,
        fee: cityFeeFromIndex(chartState.index, city.city, city.fee),
      })),
    [chartState.index],
  );

  return (
    <div className="city-map-shell">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 34, bottom: 24, left: 34 }}>
          <CartesianGrid stroke="rgba(255, 196, 0, 0.08)" />
          <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
          <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
          <Tooltip content={<CityMapTooltip />} cursor={false} />
          <Scatter data={routeBlue} line={{ stroke: "rgba(28, 102, 216, 0.65)", strokeWidth: 2 }} fill="transparent" />
          <Scatter data={routeGold} line={{ stroke: "rgba(255, 196, 0, 0.65)", strokeWidth: 2 }} fill="transparent" />
          <Scatter data={cities} shape={<CityMarker />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

const trendMount = document.querySelector("#rechartsPanel");
if (trendMount) {
  createRoot(trendMount).render(<FieldProofCharts />);
}

const cityMapMount = document.querySelector("#rechartsCityMap");
if (cityMapMount) {
  createRoot(cityMapMount).render(<CityRealityMap />);
}
