import { useMemo, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export type TeamAthleteKanbanColumn = "team" | "available";

export type TeamAthleteKanbanCard = {
  athleteId: number;
  fullName: string;
  subtitle?: string;
};

type DragPayload = {
  athleteId: number;
  from: TeamAthleteKanbanColumn;
};

type TeamAthleteKanbanProps = {
  team: TeamAthleteKanbanCard[];
  available: TeamAthleteKanbanCard[];
  onMove: (athleteId: number, from: TeamAthleteKanbanColumn, to: TeamAthleteKanbanColumn) => Promise<void> | void;
  movingAthleteId?: number | null;
  disabled?: boolean;
};

function serialize(payload: DragPayload) {
  return JSON.stringify(payload);
}

function deserialize(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;
    if (typeof parsed.athleteId !== "number") return null;
    if (parsed.from !== "team" && parsed.from !== "available") return null;
    return { athleteId: parsed.athleteId, from: parsed.from };
  } catch {
    return null;
  }
}

function Column({
  title,
  column,
  cards,
  totalCount,
  disabled,
  dragging,
  onDraggingChange,
  movingAthleteId,
  onMove,
}: {
  title: string;
  column: TeamAthleteKanbanColumn;
  cards: TeamAthleteKanbanCard[];
  totalCount: number;
  disabled: boolean;
  dragging: DragPayload | null;
  onDraggingChange: (dragging: DragPayload | null) => void;
  movingAthleteId?: number | null;
  onMove: TeamAthleteKanbanProps["onMove"];
}) {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => setActive(false);

  const handleDrop = async (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setActive(false);
    const payload = deserialize(e.dataTransfer.getData("text/plain"));
    if (!payload) return;
    if (payload.from === column) return;
    try {
      await onMove(payload.athleteId, payload.from, column);
    } finally {
      onDraggingChange(null);
    }
  };

  const isDropTarget = !!dragging && dragging.from !== column;
  const isAddTarget = !!dragging && dragging.from === "available" && column === "team";
  const isRemoveTarget = !!dragging && dragging.from === "team" && column === "available";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">
          {cards.length}
          {totalCount !== cards.length ? ` / ${totalCount}` : ""}
        </div>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative min-h-[320px] flex-1 rounded-lg border p-2 transition-colors",
          active ? "bg-muted/50" : "bg-background",
          isDropTarget && isAddTarget ? "bg-green-500/10" : "",
          isDropTarget && isRemoveTarget ? "bg-red-500/10" : "",
          disabled ? "opacity-70" : "",
        ].join(" ")}
      >
        {isDropTarget ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={[
                "flex flex-col items-center justify-center gap-3 rounded-lg border bg-background/70 px-6 py-6 backdrop-blur-sm",
                isAddTarget ? "border-green-500/30" : "",
                isRemoveTarget ? "border-red-500/30" : "",
                active ? "scale-[1.02]" : "",
              ].join(" ")}
            >
              {isRemoveTarget ? (
                <Trash2 className="h-14 w-14 text-red-600" />
              ) : isAddTarget ? (
                <Plus className="h-14 w-14 text-green-600" />
              ) : null}
              <div className="text-sm font-medium text-muted-foreground">
                {isRemoveTarget ? "Eltávolítás" : isAddTarget ? "Hozzáadás" : ""}
              </div>
            </div>
          </div>
        ) : null}

        {cards.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nincs elem
          </div>
        ) : (
          <div className={["space-y-2 transition-opacity", isDropTarget ? "opacity-25" : ""].join(" ")}>
            {cards.map((c) => (
              <Card
                key={`${column}-${c.athleteId}`}
                card={c}
                column={column}
                disabled={disabled}
                isMoving={movingAthleteId === c.athleteId}
                onDraggingChange={onDraggingChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  card,
  column,
  disabled,
  isMoving,
  onDraggingChange,
}: {
  card: TeamAthleteKanbanCard;
  column: TeamAthleteKanbanColumn;
  disabled: boolean;
  isMoving: boolean;
  onDraggingChange?: (dragging: DragPayload | null) => void;
}) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (disabled || isMoving) {
      e.preventDefault();
      return;
    }
    onDraggingChange?.({ athleteId: card.athleteId, from: column });
    e.dataTransfer.setData(
      "text/plain",
      serialize({
        athleteId: card.athleteId,
        from: column,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    onDraggingChange?.(null);
  };

  return (
    <motion.div layout>
      <div
        draggable={!disabled && !isMoving}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={[
          "flex items-center justify-between gap-3 rounded-md border bg-card p-3 shadow-sm",
          disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
          isMoving ? "opacity-60" : "",
        ].join(" ")}
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{card.fullName}</div>
          {card.subtitle ? <div className="truncate text-xs text-muted-foreground">{card.subtitle}</div> : null}
        </div>
        {isMoving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" /> : null}
      </div>
    </motion.div>
  );
}

export function TeamAthleteKanban({
  team,
  available,
  onMove,
  movingAthleteId = null,
  disabled = false,
}: TeamAthleteKanbanProps) {
  const isBusy = disabled || movingAthleteId !== null;
  const [dragging, setDragging] = useState<DragPayload | null>(null);

  const [query, setQuery] = useState("");
  const normalizedQuery = useMemo(() => query.trim().toLocaleLowerCase(), [query]);

  const teamCards = useMemo(() => team, [team]);
  const availableCards = useMemo(() => available, [available]);

  const filteredTeamCards = useMemo(() => {
    if (!normalizedQuery) return teamCards;
    return teamCards.filter((c) => c.fullName.toLocaleLowerCase().includes(normalizedQuery));
  }, [teamCards, normalizedQuery]);

  const filteredAvailableCards = useMemo(() => {
    if (!normalizedQuery) return availableCards;
    return availableCards.filter((c) => c.fullName.toLocaleLowerCase().includes(normalizedQuery));
  }, [availableCards, normalizedQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés sportolók között"
            aria-label="Keresés sportolók között"
            className="pl-9 pr-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Keresés törlése"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Column
          title="Csapattagok"
          column="team"
          cards={filteredTeamCards}
          totalCount={teamCards.length}
          disabled={isBusy}
          dragging={dragging}
          onDraggingChange={setDragging}
          movingAthleteId={movingAthleteId}
          onMove={onMove}
        />
        <Column
          title="Elérhető sportolók"
          column="available"
          cards={filteredAvailableCards}
          totalCount={availableCards.length}
          disabled={isBusy}
          dragging={dragging}
          onDraggingChange={setDragging}
          movingAthleteId={movingAthleteId}
          onMove={onMove}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Tipp: húzd át a sportolót a másik oszlopba a hozzáadáshoz / eltávolításhoz.
      </div>
    </div>
  );
}


