 

export function LineChart({ data, height = 48, color = "#52525b" }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="relative w-full overflow-hidden" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </svg>
        </div>
    );
}

export function BarChart({ data, labels, height = 48, color = "#52525b" }) {
    if (!data || !labels || !Array.isArray(data)) return null;
    const rawMax = data.length > 0 ? Math.max(...data) : 1;
    const max = rawMax <= 0 ? 1 : rawMax;
    return (
        <div className="w-full h-full flex items-end justify-between gap-2" style={{ height }}>
            {data.map((val, i) => {
                const h = (Number(val) || 0) / max * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                            className="w-full rounded-t-sm opacity-80"
                            style={{ backgroundColor: color, height: `${h}%` }}
                        />
                        <div className="text-xs text-neutral-500 truncate w-full text-center">{labels[i]}</div>
                    </div>
                );
            })}
        </div>
    );
}
