import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { useModals } from '../hooks/useModals';
import ErrorModal from '../components/ui/ErrorModal';
import TopHeader from '../components/TopHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Users, Plus, Loader2 } from "lucide-react";
import TeamsTable, { Team } from "../components/ui/teams-table";
import { TeamsTableSkeleton } from "../components/TeamsTableSkeleton";

export default function MyTeamsPage() {
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const { toast } = useToast();
  const {
    errorModal,
    hideError,
    showError,
  } = useModals();

  const showNotification = (message: string, type: 'success' | 'error') => {
    toast({
      description: message,
      variant: type === 'success' ? 'default' : 'destructive',
    });
  };

  const teamsQuery = useQuery<Team[]>({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const res = await api.get<Team[]>('/teams/my-teams');
      // Normalize Athletes to always be an array (table shows only counts here)
      return res.data.map(t => ({ ...t, Athletes: t.Athletes ?? [] }));
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });

  const teams = teamsQuery.data ?? [];
  const loading = teamsQuery.isFetching;

  useEffect(() => {
    if (teamsQuery.error) {
      showError('Betöltési hiba', 'Nem sikerült betölteni a csapatokat. Próbáld újra!');
    }
  }, [teamsQuery.error, showError]);

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      showError('Hiányzó adat', 'Add meg a csapat nevét!');
      return;
    }
    setIsAddingTeam(true);
    try {
      await api.post('/teams', { Name: teamName });
      await teamsQuery.refetch();
      setShowAddTeamForm(false);
      setTeamName('');
      showNotification('Csapat létrehozva', 'success');
    } catch {
      showError('Hiba', 'Nem sikerült létrehozni. Próbáld újra!');
    } finally {
      setIsAddingTeam(false);
    }
  };

  const handleDeleteTeam = (teamId: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Csapat törlése',
      message: `Biztos törlöd: "${name}"?`,
      onConfirm: async () => {
        setDeletingTeamId(teamId);
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await api.delete(`/teams/${teamId}`);
          await teamsQuery.refetch();
          showNotification('Csapat törölve', 'success');
        } catch {
          showError('Hiba', 'Nem sikerült törölni. Próbáld újra!');
        } finally {
          setDeletingTeamId(null);
        }
      },
    });
  };

  const cancelAddTeam = () => {
    setShowAddTeamForm(false);
    setTeamName('');
  };

  return (
    <>
      <div className="min-h-screen bg-background lg:pl-64">
        <TopHeader title="Csapataim" subtitle="Csapatok és sportolók kezelése" />
        
        <div className="px-8 py-16">
          <div className="max-w-7xl mx-auto">

            {/* Add Team Button */}
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setShowAddTeamForm(true)}
                size="lg"
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Új csapat
              </Button>
            </div>

            {/* Add Team Dialog */}
            <Dialog open={showAddTeamForm} onOpenChange={setShowAddTeamForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Új csapat létrehozása</DialogTitle>
                  <DialogDescription>
                    Add meg az új csapat nevét az alábbi mezőben.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="team-name" className="text-right">
                      Csapat neve
                    </Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="Csapat neve"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={cancelAddTeam}>
                    Mégse
                  </Button>
                  <Button onClick={handleAddTeam} disabled={isAddingTeam}>
                    {isAddingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Létrehozás
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Loading Skeleton */}
            {loading && <TeamsTableSkeleton />}

            {/* Teams Table */}
            {!loading && teams.length > 0 && (
              <TeamsTable
                teams={teams}
                deletingTeamId={deletingTeamId}
                onDeleteTeam={handleDeleteTeam}
              />
            )}

            {/* Empty State */}
            {!loading && teams.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Még nincsenek csapataid
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Hozd létre az első csapatodat és kezdj el dolgozni!
                  </p>
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

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Igen</AlertDialogAction>
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
