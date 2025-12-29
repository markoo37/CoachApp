import { useMemo, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { WellnessCheck } from "@/api/wellness";
import { Gauge } from "@mui/x-charts/Gauge";

interface WellnessTableProps {
  wellness: WellnessCheck[];
  getWellnessBadgeColor: (paramName: string, value: number) => string;
  itemsPerPage?: number;
}

export function WellnessTable({ wellness, getWellnessBadgeColor, itemsPerPage = 10 }: WellnessTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when wellness data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [wellness.length]);

  const totalPages = Math.ceil(wellness.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWellness = useMemo(() => {
    return wellness.slice(startIndex, endIndex);
  }, [wellness, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (wellness.length === 0) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground text-center">
          Nincs elérhető wellness adat.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-auto pr-8">Dátum</TableHead>
              <TableHead className="text-center w-24 px-3">Fáradtság</TableHead>
              <TableHead className="text-center w-24 px-3">Alvás</TableHead>
              <TableHead className="text-center w-24 px-3">Izomláz</TableHead>
              <TableHead className="text-center w-24 px-3">Stressz</TableHead>
              <TableHead className="text-center w-24 px-3">Hangulat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWellness.map((w) => (
              <TableRow key={w.Id} className="hover:bg-muted/50">
                <TableCell className="pr-8">
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(w.Date).toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                    {w.Comment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {w.Comment}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center w-24 px-3">
                  <div className="flex justify-center">
                    <Gauge
                      width={60}
                      height={60}
                      value={w.Fatigue}
                      valueMin={0}
                      valueMax={10}
                      startAngle={-110}
                      endAngle={110}
                      text={({ value }) => `${value}`}
                      sx={{
                        [`& .MuiGauge-valueText`]: {
                          fill: '#000000 !important',
                          fontSize: '1rem',
                          fontWeight: '600',
                        },
                        [`.dark & .MuiGauge-valueText`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-valueText text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-valueText text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& svg text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & svg text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-root text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-root text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-referenceArc`]: {
                          fill: 'transparent',
                          stroke: 'none',
                        },
                        [`& .MuiGauge-valueArc`]: {
                          fill: getWellnessBadgeColor("Fatigue", w.Fatigue),
                          stroke: 'none',
                        },
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center w-24 px-3">
                  <div className="flex justify-center">
                    <Gauge
                      width={60}
                      height={60}
                      value={w.SleepQuality}
                      valueMin={0}
                      valueMax={10}
                      startAngle={-110}
                      endAngle={110}
                      text={({ value }) => `${value}`}
                      sx={{
                        [`& .MuiGauge-valueText`]: {
                          fill: '#000000 !important',
                          fontSize: '1rem',
                          fontWeight: '600',
                        },
                        [`.dark & .MuiGauge-valueText`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-valueText text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-valueText text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& svg text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & svg text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-root text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-root text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-referenceArc`]: {
                          fill: 'transparent',
                          stroke: 'rgba(255, 255, 255, 0.05)',
                          strokeWidth: '0.5px',
                        },
                        [`& .MuiGauge-valueArc`]: {
                          fill: getWellnessBadgeColor("SleepQuality", w.SleepQuality),
                          stroke: 'none',
                        },
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center w-24 px-3">
                  <div className="flex justify-center">
                    <Gauge
                      width={60}
                      height={60}
                      value={w.MuscleSoreness}
                      valueMin={0}
                      valueMax={10}
                      startAngle={-110}
                      endAngle={110}
                      text={({ value }) => `${value}`}
                      sx={{
                        [`& .MuiGauge-valueText`]: {
                          fill: '#000000 !important',
                          fontSize: '1rem',
                          fontWeight: '600',
                        },
                        [`.dark & .MuiGauge-valueText`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-valueText text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-valueText text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& svg text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & svg text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-root text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-root text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-referenceArc`]: {
                          fill: 'transparent',
                          stroke: 'none',
                        },
                        [`& .MuiGauge-valueArc`]: {
                          fill: getWellnessBadgeColor("MuscleSoreness", w.MuscleSoreness),
                          stroke: 'none',
                        },
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center w-24 px-3">
                  <div className="flex justify-center">
                    <Gauge
                      width={60}
                      height={60}
                      value={w.Stress}
                      valueMin={0}
                      valueMax={10}
                      startAngle={-110}
                      endAngle={110}
                      text={({ value }) => `${value}`}
                      sx={{
                        [`& .MuiGauge-valueText`]: {
                          fill: '#000000 !important',
                          fontSize: '1rem',
                          fontWeight: '600',
                        },
                        [`.dark & .MuiGauge-valueText`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-valueText text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-valueText text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& svg text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & svg text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-root text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-root text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-referenceArc`]: {
                          fill: 'transparent',
                          stroke: 'none',
                        },
                        [`& .MuiGauge-valueArc`]: {
                          fill: getWellnessBadgeColor("Stress", w.Stress),
                          stroke: 'none',
                        },
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center w-24 px-3">
                  <div className="flex justify-center">
                    <Gauge
                      width={60}
                      height={60}
                      value={w.Mood}
                      valueMin={0}
                      valueMax={10}
                      startAngle={-110}
                      endAngle={110}
                      text={({ value }) => `${value}`}
                      sx={{
                        [`& .MuiGauge-valueText`]: {
                          fill: '#000000 !important',
                          fontSize: '1rem',
                          fontWeight: '600',
                        },
                        [`.dark & .MuiGauge-valueText`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-valueText text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-valueText text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& svg text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & svg text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-root text`]: {
                          fill: '#000000 !important',
                        },
                        [`.dark & .MuiGauge-root text`]: {
                          fill: '#ffffff !important',
                        },
                        [`& .MuiGauge-referenceArc`]: {
                          fill: 'transparent',
                          stroke: 'none',
                        },
                        [`& .MuiGauge-valueArc`]: {
                          fill: getWellnessBadgeColor("Mood", w.Mood),
                          stroke: 'none',
                        },
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, wellness.length)} / {wellness.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

