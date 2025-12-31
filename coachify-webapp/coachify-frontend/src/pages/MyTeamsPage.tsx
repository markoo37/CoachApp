import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Loader2 } from "lucide-react";
import TopHeader from "../components/TopHeader";
import ErrorModal from "../components/ui/ErrorModal";
import TeamsTable from "../components/ui/teams-table";
import { TeamsTableSkeleton } from "../components/TeamsTableSkeleton";
import { useModals } from "../hooks/useModals";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useMyTeamsQuery,
  useCreateTeamMutation,
  useDeleteTeamMutation,
} from "../queries/teams.queries";

type PendingDelete = { teamId: number; name: string } | null;

export default function MyTeamsPage() {
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const { toast } = useToast();
  const { errorModal, hideError, showError } = useModals();

  const teamsQuery = useMyTeamsQuery();
  const createTeam = useCreateTeamMutation();
  const deleteTeam = useDeleteTeamMutation();

  const teams = teamsQuery.data ?? [];
  const isInitialLoading = teamsQuery.isLoading;     // skeletonhez jobb
  const isRefreshing = teamsQuery.isFetching && !teamsQuery.isLoading;

  

  const deletingTeamId = pendingDelete?.teamId ?? null;

  const notify = (message: string, type: "success" | "error") =>
    toast({ description: message, variant: type === "success" ? "default" : "destructive" });

  useEffect(() => {
    if (teamsQuery.error) {
      showError("Betöltési hiba", "Nem sikerült betölteni a csapatokat. Próbáld újra!");
    }
  }, [teamsQuery.error, showError]);

  const cancelAddTeam = () => {
    setShowAddTeamForm(false);
    setTeamName("");
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      showError("Hiányzó adat", "Add meg a csapat nevét!");
      return;
    }
    try {
      await createTeam.mutateAsync(teamName.trim());
      cancelAddTeam();
      notify("Csapat létrehozva", "success");
    } catch {
      showError("Hiba", "Nem sikerült létrehozni. Próbáld újra!");
    }
  };

  const requestDeleteTeam = (teamId: number, name: string) => {
    setPendingDelete({ teamId, name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTeam.mutateAsync(pendingDelete.teamId);
      notify("Csapat törölve", "success");
    } catch {
      showError("Hiba", "Nem sikerült törölni. Próbáld újra!");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background lg:pl-64">
        <TopHeader title="Csapataim" subtitle="Csapatok és sportolók kezelése" />

        <div className="px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-6">
              <Button onClick={() => setShowAddTeamForm(true)} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Új csapat
              </Button>
            </div>

            <Dialog open={showAddTeamForm} onOpenChange={setShowAddTeamForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Új csapat létrehozása</DialogTitle>
                  <DialogDescription>Add meg az új csapat nevét az alábbi mezőben.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="team-name" className="text-right">Csapat neve</Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Csapat neve"
                      className="col-span-3"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={cancelAddTeam}>Mégse</Button>
                  <Button onClick={handleAddTeam} disabled={createTeam.isPending}>
                    {createTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Létrehozás
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {isInitialLoading && <TeamsTableSkeleton />}

            {!isInitialLoading && teams.length > 0 && (
              <TeamsTable
                teams={teams}
                deletingTeamId={deleteTeam.isPending ? deletingTeamId : null}
                onDeleteTeam={requestDeleteTeam}
              />
            )}

            {!isInitialLoading && teams.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Még nincsenek csapataid</h3>
                  <p className="text-muted-foreground mb-6">Hozd létre az első csapatodat és kezdj el dolgozni!</p>
                  <Button onClick={() => setShowAddTeamForm(true)} size="lg">
                    <Plus className="w-5 h-5 mr-2 stroke-[2.5]" />
                    Első csapat létrehozása
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Csapat törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztos törlöd: "{pendingDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteTeam.isPending}>
              Igen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={hideError}
      />
    </>
  );
}
