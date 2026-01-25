import { useCallback, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import TopHeader from "../components/TopHeader";
import { useSidebarPadding } from "../hooks/useSidebarPadding";
import { PageBreadcrumb, useBreadcrumbItems } from "../components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Eye, AlertCircle, CheckCircle2, AlertTriangle, LayoutGrid, List, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeamAthleteKanban, type TeamAthleteKanbanCard, type TeamAthleteKanbanColumn } from "@/components/ui/team-athlete-kanban";
import { TeamWellnessChart } from "@/components/ui/team-wellness-chart";
import { fetchTeamWellnessIndexAverages, type TeamWellnessIndexAverage, fetchTeamWellnessIndexSeries, fetchTeamRosterWellness, type TeamRosterWellnessRow, type RosterWellnessStatus } from "../api/wellness";
import { WellnessIndexChart } from "@/components/ui/wellness-index-chart";
import { TimeRange } from "@/components/TimeRangeSelect";
import type { WellnessIndex } from "@/types/wellnessIndex";
import { AnimatePresence, motion } from "framer-motion";
import { TeamAthleteAvatarHoverCard } from "@/components/TeamAthleteAvatarHoverCard";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface TeamDetails {
  id: number;
  name: string;
}

interface AvailableAthlete {
  Id: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  HasUserAccount: boolean;
}

export default function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const sidebarPadding = useSidebarPadding();

  const [teamWellnessTimeRange, setTeamWellnessTimeRange] = useState<TimeRange>("30d");
  const [teamMembersView, setTeamMembersView] = useState<"list" | "icons">("icons");
  const [addAthleteOpen, setAddAthleteOpen] = useState(false);
  const [movingAthleteId, setMovingAthleteId] = useState<number | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const isValidTeamId = Number.isFinite(teamId) && teamId > 0;

  const teamQuery = useQuery<TeamDetails>({
    queryKey: ["team", teamId],
    enabled: isValidTeamId,
    retry: false,
    queryFn: async () => {
      const teamRes = await api.get(`/teams/${teamId}`);
      const data = teamRes.data;
      // Handle both camelCase and PascalCase from backend
      return {
        id: data.id ?? data.Id,
        name: data.name ?? data.Name,
      } satisfies TeamDetails;
    },
  });

  const team = teamQuery.data ?? null;
  const teamError = useMemo(() => {
    if (!isValidTeamId) return "A csapat nem található.";
    const err: any = teamQuery.error;
    if (!err) return null;
    if (err.response?.status === 404) return "A csapat nem található.";
    return err.message || "Nem sikerült betölteni a csapat adatait.";
  }, [isValidTeamId, teamQuery.error]);

  const rosterWellnessQuery = useQuery<TeamRosterWellnessRow[]>({
    queryKey: ["teamRosterWellness", teamId, 14, 7],
    enabled: isValidTeamId,
    retry: false,
    queryFn: async () => {
      try {
        const data = await fetchTeamRosterWellness(teamId, 14, 7);
        return data.athletes ?? [];
      } catch (err: any) {
        console.error("Failed to load roster wellness data:", err);
        return [];
      }
    },
    initialData: [],
  });

  const wellnessAveragesQuery = useQuery<TeamWellnessIndexAverage[]>({
    queryKey: ["teamWellnessAverages", teamId, 14],
    enabled: isValidTeamId,
    retry: false,
    queryFn: async () => {
      try {
        const data = await fetchTeamWellnessIndexAverages(teamId, 14);
        console.log("Wellness data received:", data);
        console.log("Athletes count:", data.athletes.length);
        console.log("Athletes with data:", data.athletes.filter((a) => a.averageWellnessIndex !== null).length);
        return data.athletes ?? [];
      } catch (err: any) {
        console.error("Failed to load wellness data:", err);
        return [];
      }
    },
    initialData: [],
  });

  const teamWellnessSeriesQuery = useQuery<WellnessIndex[]>({
    queryKey: ["teamWellnessSeries", teamId, teamWellnessTimeRange, true],
    enabled: isValidTeamId,
    retry: false,
    queryFn: async () => {
      try {
        // Map frontend TimeRange to backend range parameter
        // Backend supports: "7d", "14d", "30d", "180d", "365d"
        // Frontend supports: "7d", "30d", "90d"
        return await fetchTeamWellnessIndexSeries(teamId, teamWellnessTimeRange, true);
      } catch (err: any) {
        console.error("Failed to load team wellness series data:", err);
        return [];
      }
    },
    initialData: [],
  });

  const availableAthletesQuery = useQuery<AvailableAthlete[]>({
    queryKey: ["availableAthletesForTeam", teamId],
    enabled: isValidTeamId && addAthleteOpen,
    retry: false,
    queryFn: async () => {
      const res = await api.get<AvailableAthlete[]>(`/athletes/available-for-team/${teamId}`);
      return res.data ?? [];
    },
    initialData: [],
  });

  const rosterWellness = rosterWellnessQuery.data ?? [];
  const rosterWellnessLoading = rosterWellnessQuery.isFetching;

  const wellnessData = wellnessAveragesQuery.data ?? [];
  const wellnessLoading = wellnessAveragesQuery.isFetching;

  const teamWellnessSeries = teamWellnessSeriesQuery.data ?? [];
  const teamWellnessSeriesLoading = teamWellnessSeriesQuery.isFetching;

  const availableAthletes = availableAthletesQuery.data ?? [];
  const availableAthletesLoading = availableAthletesQuery.isFetching;
  const availableAthletesError = useMemo(() => {
    const err: any = availableAthletesQuery.error;
    if (!err) return null;
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Nem sikerült betölteni az elérhető sportolókat.";
    return String(message);
  }, [availableAthletesQuery.error]);

  const breadcrumbLabel = teamError ? "Hiba" : team?.name ?? "Csapat részletei";
  const breadcrumbItems = useBreadcrumbItems(breadcrumbLabel);

  // Helper function to get initials for avatar
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (lastName) {
      return lastName[0].toUpperCase();
    }
    return '?';
  };

  const sortedRosterWellness = useMemo(() => {
    const collator = new Intl.Collator("hu-HU", { sensitivity: "base", numeric: true });

    const normalize = (v?: string) => (v ?? "").trim();

    return rosterWellness
      .slice()
      .sort((a, b) => {
        const aKey = `${normalize(a.firstName)} ${normalize(a.lastName)}`.trim();
        const bKey = `${normalize(b.firstName)} ${normalize(b.lastName)}`.trim();
        const nameCmp = collator.compare(aKey, bKey);
        if (nameCmp !== 0) return nameCmp;

        return (a.athleteId ?? 0) - (b.athleteId ?? 0);
      });
  }, [rosterWellness]);

  // Helper function to get status badge variant and icon
  const getStatusBadge = (status: RosterWellnessStatus) => {
    switch (status) {
      case "OK":
        return {
          variant: "default" as const,
          icon: CheckCircle2,
          label: "Rendben",
          className: "bg-green-500 hover:bg-green-600",
          ringClass: "ring-green-500",
        };
      case "Watch":
        return {
          variant: "secondary" as const,
          icon: AlertTriangle,
          label: "Figyelendő",
          className: "bg-yellow-500 hover:bg-yellow-600",
          ringClass: "ring-yellow-500",
        };
      case "Critical":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          label: "Kritikus",
          className: "bg-red-500 hover:bg-red-600",
          ringClass: "ring-red-500",
        };
      case "NoData":
        return {
          variant: "outline" as const,
          icon: AlertCircle,
          label: "Nincs adat",
          className: "",
          ringClass: "ring-border",
        };
    }
  };

  const teamKanbanCards: TeamAthleteKanbanCard[] = useMemo(() => {
    return sortedRosterWellness
      .filter((a) => typeof a.athleteId === "number")
      .map((a) => {
        const fullName = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || `#${a.athleteId}`;
        return {
          athleteId: a.athleteId as number,
          fullName,
        };
      });
  }, [sortedRosterWellness]);

  const availableKanbanCards: TeamAthleteKanbanCard[] = useMemo(() => {
    return availableAthletes.map((a) => {
      const fullName = `${a.FirstName ?? ""} ${a.LastName ?? ""}`.trim() || a.Email || `#${a.Id}`;
      return {
        athleteId: a.Id,
        fullName,
      };
    });
  }, [availableAthletes]);

  const handleKanbanMove = useCallback(
    async (athleteId: number, from: TeamAthleteKanbanColumn, to: TeamAthleteKanbanColumn) => {
      if (!isValidTeamId) return;
      if (movingAthleteId !== null) return;
      if (from === to) return;

      setMovingAthleteId(athleteId);
      setMoveError(null);

      try {
        let successMessage: string | null = null;
        if (from === "available" && to === "team") {
          await api.post(`/athletes/${athleteId}/assign-to-team/${teamId}`);
          successMessage = "Sportoló hozzáadva a csapathoz.";
        } else if (from === "team" && to === "available") {
          await api.post(`/athletes/${athleteId}/remove-from-team/${teamId}`);
          successMessage = "Sportoló eltávolítva a csapatból.";
        }

        await Promise.all([rosterWellnessQuery.refetch(), availableAthletesQuery.refetch()]);
        if (successMessage) toast.success(successMessage);
      } catch (err: any) {
        console.error("Failed to move athlete:", err);
        const message =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Nem sikerült a sportoló mozgatása. Próbáld újra!";
        setMoveError(String(message));
      } finally {
        setMovingAthleteId(null);
      }
    },
    [isValidTeamId, movingAthleteId, teamId, rosterWellnessQuery, availableAthletesQuery]
  );

  if (teamQuery.isLoading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center transition-all duration-300 ease-in-out ${sidebarPadding}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className={`min-h-screen bg-background transition-all duration-300 ease-in-out ${sidebarPadding}`}>
        <TopHeader title="Csapat részletei" />
        <div className="p-8 max-w-3xl mx-auto">
          <PageBreadcrumb items={breadcrumbItems} />
          <p className="text-destructive">{teamError || "A csapat nem található."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ease-in-out ${sidebarPadding}`}>
      <TopHeader title={team.name} subtitle={`${rosterWellness.length} sportoló`} />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <PageBreadcrumb items={breadcrumbItems} />

          {/* Team Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{team.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {rosterWellness.length} sportoló
                </Badge>
              </div>
            </CardHeader>
          </Card>

{/* Athletes Table */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Sportolók</CardTitle>
                <CardDescription>Csapat tagjainak wellness állapota</CardDescription>
              </div>

              <div className="flex items-center gap-2 justify-start sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setAddAthleteOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Sportoló hozzáadása
                </Button>
                <div className="inline-flex rounded-md border bg-background p-1">
                <Button
                    type="button"
                    variant={teamMembersView === "icons" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => setTeamMembersView("icons")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Ikonok
                  </Button>
                  <Button
                    type="button"
                    variant={teamMembersView === "list" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => setTeamMembersView("list")}
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Dialog
              open={addAthleteOpen}
              onOpenChange={(open) => {
                setAddAthleteOpen(open);
                if (open) setMoveError(null);
              }}
            >
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Sportoló hozzáadása</DialogTitle>
                  <DialogDescription>Húzd át a sportolókat a listák között a hozzáadáshoz vagy eltávolításhoz.</DialogDescription>
                </DialogHeader>

                {availableAthletesError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {availableAthletesError}
                  </div>
                ) : null}

                {moveError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {moveError}
                  </div>
                ) : null}

                {(availableAthletesLoading || rosterWellnessLoading) && teamKanbanCards.length === 0 && availableKanbanCards.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <TeamAthleteKanban
                    team={teamKanbanCards}
                    available={availableKanbanCards}
                    onMove={handleKanbanMove}
                    movingAthleteId={movingAthleteId}
                    disabled={availableAthletesLoading || rosterWellnessLoading}
                  />
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Bezárás
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <CardContent>
              {rosterWellnessLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sortedRosterWellness.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nincsenek sportolók ebben a csapatban.</p>
                </div>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  {teamMembersView === "icons" ? (
                    <motion.div
                      key="icons"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="w-full">
                        <div className="w-full overflow-x-auto">
                          <div className="flex min-w-max items-center gap-3 py-3 pl-3 pr-3">
                            {sortedRosterWellness.map((athlete) => {
                              const statusBadge = getStatusBadge(athlete.status);

                              return (
                                <TeamAthleteAvatarHoverCard
                                  key={athlete.athleteId}
                                  athleteId={athlete.athleteId as number}
                                  firstName={athlete.firstName}
                                  lastName={athlete.lastName}
                                  hasUserAccount={athlete.hasUserAccount}
                                  statusBadge={statusBadge}
                                  averageWellnessIndex={athlete.averageWellnessIndex}
                                  lastWellnessDate={athlete.lastWellnessDate}
                                  lastWellnessIndex={athlete.lastWellnessIndex}
                                  complianceCount={athlete.complianceCount}
                                  complianceWindowDays={athlete.complianceWindowDays}
                                  to={`/athletes/${athlete.athleteId}`}
                                  linkState={{
                                    from: "/teams",
                                    teamId: team.id,
                                    teamName: team.name,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Név</TableHead>
                            <TableHead>WI átlag</TableHead>
                            <TableHead>Utolsó</TableHead>
                            <TableHead>Compliance</TableHead>
                            <TableHead>Státusz</TableHead>
                            <TableHead>Műveletek</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedRosterWellness.map((athlete) => {
                            const initials = getInitials(athlete.firstName, athlete.lastName);
                            const fullName = `${athlete.firstName} ${athlete.lastName}`.trim() || "Név később...";
                            const statusBadge = getStatusBadge(athlete.status);
                            const StatusIcon = statusBadge.icon;

                            return (
                              <TableRow key={athlete.athleteId}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{fullName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {athlete.averageWellnessIndex !== null ? (
                                    <span className="font-medium">{athlete.averageWellnessIndex.toFixed(1)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {athlete.lastWellnessDate && athlete.lastWellnessIndex !== null ? (
                                    <div className="flex flex-col">
                                      <span className="text-sm">{new Date(athlete.lastWellnessDate).toLocaleDateString("hu-HU")}</span>
                                      <span className="text-xs text-muted-foreground">{athlete.lastWellnessIndex.toFixed(1)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{athlete.complianceCount}</span>
                                    <span className="text-xs text-muted-foreground">/{athlete.complianceWindowDays} nap</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusBadge.variant} className={`gap-1 ${statusBadge.className}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {statusBadge.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <Link
                                      to={`/athletes/${athlete.athleteId}`}
                                      state={{
                                        from: "/teams",
                                        teamId: team.id,
                                        teamName: team.name,
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Wellness Index Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Wellness Index átlagok</CardTitle>
              <CardDescription>
                Sportolók wellness index átlaga az utolsó 14 wellness mérés alapján
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wellnessLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <TeamWellnessChart data={wellnessData} />
              )}
            </CardContent>
          </Card>

          {/* Team Wellness Index Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Csapat wellness index idősor</CardTitle>
              <CardDescription>
                Napi csapat átlag wellness index értékek időben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WellnessIndexChart
                data={teamWellnessSeries}
                timeRange={teamWellnessTimeRange}
                onTimeRangeChange={setTeamWellnessTimeRange}
                loading={teamWellnessSeriesLoading}
                emptyMessage="Nincs elérhető wellness index adat a kiválasztott időszakban."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

