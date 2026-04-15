import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SortOption = "newest" | "price_asc" | "price_desc";

interface SortFilterBarProps {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  priceMin: string;
  priceMax: string;
  onPriceMinChange: (v: string) => void;
  onPriceMaxChange: (v: string) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  filterActive: boolean;
}

const SortFilterBar = ({
  sort, onSortChange,
  priceMin, priceMax, onPriceMinChange, onPriceMaxChange,
  onApplyFilter, onClearFilter, filterActive,
}: SortFilterBarProps) => {
  const [filterOpen, setFilterOpen] = useState(false);

  const pills: { key: SortOption; label: string }[] = [
    { key: "newest", label: "En Yeni" },
    { key: "price_asc", label: "Fiyat ↑" },
    { key: "price_desc", label: "Fiyat ↓" },
  ];

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => onSortChange(p.key)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: sort === p.key ? "#1E3A5F" : "white",
              color: sort === p.key ? "white" : "#64748B",
              border: sort === p.key ? "none" : "1px solid #E2EBFC",
              transition: "all 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: filterActive ? "#EFF4FF" : "white",
            color: filterActive ? "#1E3A5F" : "#64748B",
            border: filterActive ? "1px solid #1E3A5F" : "1px solid #E2EBFC",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Fiyat Filtresi
          {filterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {filterOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            placeholder="Min ₺"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-28 h-8 text-xs"
          />
          <Input
            type="number"
            placeholder="Max ₺"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-28 h-8 text-xs"
          />
          <button
            onClick={onApplyFilter}
            style={{
              padding: "4px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "#1E3A5F",
              border: "1px solid #1E3A5F",
              backgroundColor: "white",
            }}
          >
            Uygula
          </button>
          {filterActive && (
            <button
              onClick={onClearFilter}
              style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 2 }}
            >
              <X className="w-3 h-3" /> Filtreyi Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export type { SortOption };
export default SortFilterBar;
