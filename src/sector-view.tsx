type SectorViewProps = {
  sector: number;
  stand: string;
  rows: readonly string[];
  numbers: readonly number[];
  available: readonly string[];
  selected: readonly string[];
  limit: number;
  onSelect: (seat: string) => void;
};

export function SectorView({ sector, stand, rows, numbers, available, selected, limit, onSelect }: SectorViewProps) {
  const angle = stand.startsWith('Hazotte') ? -1 : stand.startsWith('Jacquet') ? 1 : 1.7;

  return <div className="sector-view" role="group" aria-label={`Vue illustrative du secteur ${sector}`}>
    <svg className="sector-scene" viewBox="0 0 900 526" aria-hidden="true">
      <defs>
        <linearGradient id="sector-grass" x2="0" y2="1">
          <stop stopColor="#235032" />
          <stop offset="1" stopColor="#426743" />
        </linearGradient>
        <linearGradient id="sector-concrete" x2="0" y2="1">
          <stop stopColor="#d1cbc6" />
          <stop offset="1" stopColor="#a19a98" />
        </linearGradient>
      </defs>
      <rect width="900" height="526" fill="#262224" />
      <path d="M0 24H900V43H0Z" fill="#a82e27" />
      <path d="M0 43H900V155H0Z" fill="url(#sector-grass)" />
      <path d="M90 54H810L861 139H39ZM450 54V139M51 119H214L239 72H79M849 119H686L661 72H821"
        fill="none" stroke="#f3eee5" strokeOpacity=".7" strokeWidth="2" />
      <ellipse cx="450" cy="97" rx="56" ry="20" fill="none" stroke="#f3eee5" strokeOpacity=".7" />
      <path d="M0 157H900V177H0Z" fill="#a4332d" />
      <path d="M18 184H882L900 526H0Z" fill="url(#sector-concrete)" />
      {rows.map((row, index) => {
        const y = 236 + index * 73;
        const inset = 80 - index * 15;
        return <g key={row}>
          <path d={`M${inset + 10} ${y - 12}H${890 - inset}L${900 - inset} ${y + 40}H${inset}Z`} fill="#beb7b2" />
          <path d={`M${inset} ${y + 40}H${900 - inset}V${y + 49}H${inset}Z`} fill="#786f6f" />
          <text x={inset + 22} y={y + 23} fill="#392e30" fontSize="19" fontWeight="700">{row}</text>
        </g>;
      })}
    </svg>
    {rows.flatMap((row, rowIndex) => numbers.map((number, column) => {
      const seat = row + number;
      const free = available.includes(seat);
      const chosen = selected.includes(seat);
      const x = 50 + (column - 4) * (6.1 + rowIndex * .55) + (rowIndex - 1.5) * angle;
      const y = (251 + rowIndex * 73) / 526 * 100;
      return <button type="button" key={seat} className="sector-chair" disabled={!free || (!chosen && selected.length >= limit)}
        aria-label={`Rang ${row}, place ${number}${free ? '' : ', indisponible dans cet aperçu'}`}
        aria-pressed={chosen} style={{ left: x + '%', top: y + '%' }} onClick={() => onSelect(seat)}>
        {number}
      </button>;
    }))}
  </div>;
}
