import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useModals } from '../hooks/useModals';
import ErrorModal from '../components/ui/ErrorModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "../components/ui/toaster";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Plus, 
  ChevronDown, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Loader2,
  Calendar,
  Mail,
  Weight,
  Ruler,
  Check,
  ChevronsUpDown,
  UserCheck,
  UserX
} from "lucide-react";

interface Athlete {
  Id: number;
  FirstName: string;
  LastName: string;
  BirthDate?: string;
  Weight?: number;
  Height?: number;
  Email?: string;
  HasUserAccount: boolean;
}

interface Team {
  Id: number;
  Name: string;
  Athletes: Athlete[];
}

export default function MyTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [showAddPlayerDropdown, setShowAddPlayerDropdown] = useState<number | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [availableAthletes, setAvailableAthletes] = useState<Athlete[]>([]);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAthleteId, setDeletingAthleteId] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [loadingAvailableAthletes, setLoadingAvailableAthletes] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { toast } = useToast();
  const {
    confirmModal,
    errorModal,
    hideError,
    showConfirmation,
    hideConfirmation,
    showError,
  } = useModals();

  const showNotification = (message: string, type: 'success' | 'error') => {
    toast({
      description: message,
      variant: type === 'success' ? 'default' : 'destructive',
    });
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const [teamsRes, athletesRes] = await Promise.all([
        api.get('/teams/my-teams'),
        api.get('/athletes')
      ]);
      
      const teams = teamsRes.data;
      const allAthletes = athletesRes.data;
      
      // Create a map of athletes with their HasUserAccount status
      const athletesMap = new Map(allAthletes.map((athlete: Athlete) => [athlete.Id, athlete]));
      
      // Merge the HasUserAccount field into team athletes
      const teamsWithAthleteData = teams.map((team: any) => ({
        ...team,
        Athletes: team.Athletes.map((athlete: any) => {
          const fullAthleteData = athletesMap.get(athlete.Id);
          return {
            ...athlete,
            HasUserAccount: fullAthleteData ? fullAthleteData.HasUserAccount : false
          };
        })
      }));
      
      setTeams(teamsWithAthleteData);
    } catch {
      showError('Betöltési hiba', 'Nem sikerült betölteni a csapatokat. Próbáld újra!');
    }
  };

  const fetchAvailableAthletes = async (teamId: number) => {
    setLoadingAvailableAthletes(true);
    try {
      const res = await api.get(`/athletes/available-for-team/${teamId}`);
      setAvailableAthletes(res.data);
    } catch {
      showError('Hiba', 'Nem sikerült betölteni az elérhető sportolókat.');
      setAvailableAthletes([]);
    } finally {
      setLoadingAvailableAthletes(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedTeamId(prev => (prev === id ? null : id));
  };

  const handleAddPlayer = async (teamId: number) => {
    setShowAddPlayerDropdown(teamId);
    setSelectedAthleteId(null);
    setComboboxOpen(false);
    await fetchAvailableAthletes(teamId);
  };

  const handleAssignPlayer = async (teamId: number) => {
    if (!selectedAthleteId) {
      showError('Hiányzó kiválasztás', 'Kérlek válassz ki egy sportolót!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post(`/athletes/${selectedAthleteId}/assign-to-team/${teamId}`);
      const result = response.data; // { AthleteId, TeamId, HasUserAccount }
      
      // Find the selected athlete from available athletes
      const selectedAthlete = availableAthletes.find(a => a.Id === selectedAthleteId);
      
      if (selectedAthlete) {
        // Add the athlete to the team with updated HasUserAccount status
        setTeams(prev =>
          prev.map(team =>
            team.Id === teamId
              ? {
                  ...team,
                  Athletes: [
                    ...team.Athletes,
                    {
                      ...selectedAthlete,
                      HasUserAccount: result.HasUserAccount
                    }
                  ]
                }
              : team
          )
        );
        
        // Remove the athlete from available athletes list
        setAvailableAthletes(prev =>
          prev.filter(athlete => athlete.Id !== selectedAthleteId)
        );
      }
      
      setShowAddPlayerDropdown(null);
      setSelectedAthleteId(null);
      setComboboxOpen(false);
      showNotification('Sportoló hozzáadva a csapathoz', 'success');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data || 'Nem sikerült a sportoló hozzáadása. Próbáld újra!';
      showError('Hiba', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAddPlayer = () => {
    setShowAddPlayerDropdown(null);
    setSelectedAthleteId(null);
    setComboboxOpen(false);
  };

  const handleDeletePlayer = (athleteId: number, teamId: number, name: string) => {
    showConfirmation('Sportoló eltávolítása', `Biztos eltávolítod a csapatból: ${name}?`, async () => {
      setDeletingAthleteId(athleteId);
      try {
        await api.post(`/athletes/${athleteId}/remove-from-team/${teamId}`);
        
        // Update teams state locally instead of refetching
        setTeams(prev =>
          prev.map(team =>
            team.Id === teamId
              ? {
                  ...team,
                  Athletes: team.Athletes.filter(athlete => athlete.Id !== athleteId)
                }
              : team
          )
        );
        
        showNotification('Eltávolítva a csapatból', 'success');
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.response?.data || 'Nem sikerült eltávolítani. Próbáld újra!';
        showError('Hiba', message);
      } finally {
        setDeletingAthleteId(null);
      }
    });
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      showError('Hiányzó adat', 'Add meg a csapat nevét!');
      return;
    }
    setIsAddingTeam(true);
    try {
      await api.post('/teams', { Name: teamName });
      await fetchTeams();
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
    showConfirmation('Csapat törlése', `Biztos törlöd: \"${name}\"?`, async () => {
      setDeletingTeamId(teamId);
      try {
        await api.delete(`/teams/${teamId}`);
        await fetchTeams();
        if (expandedTeamId === teamId) setExpandedTeamId(null);
        showNotification('Csapat törölve', 'success');
      } catch {
        showError('Hiba', 'Nem sikerült törölni. Próbáld újra!');
      } finally {
        setDeletingTeamId(null);
      }
    });
  };

  const cancelAddTeam = () => {
    setShowAddTeamForm(false);
    setTeamName('');
  };

  return (
    <>
      <div className="min-h-screen bg-background lg:pl-64">
        <div className="px-8 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Csapataim
              </h1>
              <p className="text-muted-foreground">
                Csapatok és sportolók kezelése
              </p>
            </div>

            {/* Add Team Button */}
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setShowAddTeamForm(true)}
                size="lg"
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
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

            {/* Teams List */}
            <div className="space-y-4">
              {teams.map(team => (
                <Card key={team.Id} className="transition-all duration-200 hover:shadow-md">
                  {/* Team Header - Vertically Centered */}
                  <CardHeader className="py-6">
                    <div className="flex justify-between items-center min-h-[3rem]">
                      <button
                        onClick={() => toggleExpand(team.Id)}
                        className="flex items-center gap-3 text-left group flex-1"
                      >
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {team.Name}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                            expandedTeamId === team.Id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <Badge variant="secondary" className="gap-1 h-8 px-3">
                          <Users className="w-3 h-3" />
                          {team.Athletes.length} sportoló
                        </Badge>
                        <Button
                          onClick={() => handleDeleteTeam(team.Id, team.Name)}
                          disabled={deletingTeamId === team.Id}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        >
                          {deletingTeamId === team.Id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Animated Team Content */}
                  <AnimatePresence mode="wait">
                    {expandedTeamId === team.Id && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0">
                          {/* Add Player Button */}
                          <div className="flex justify-end mb-4">
                            <Button
                              onClick={() => handleAddPlayer(team.Id)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              Sportoló hozzáadása
                            </Button>
                          </div>

                          {/* Add Player Section */}
                          <AnimatePresence>
                            {showAddPlayerDropdown === team.Id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut"
                                }}
                              >
                                <Card className="mb-6 border-primary/20 bg-primary/5">
                              <CardHeader className="pb-3">
                                <h4 className="font-medium text-foreground">Sportoló hozzáadása a csapathoz</h4>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {loadingAvailableAthletes ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    <span className="text-muted-foreground">Sportolók betöltése...</span>
                                  </div>
                                ) : availableAthletes.length === 0 ? (
                                  <div className="py-8 text-center space-y-2">
                                    <p className="text-muted-foreground">Nincsenek elérhető sportolók.</p>
                                    <p className="text-sm text-muted-foreground">
                                      Adj hozzá új sportolókat a "Sportolók" oldalon, vagy mozgasd át sportolókat más csapatokból.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="athlete-select">
                                        Válassz sportolót ({availableAthletes.length} elérhető)
                                      </Label>
                                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between"
                                          >
                                            {selectedAthleteId
                                              ? (() => {
                                                  const selectedAthlete = availableAthletes.find(
                                                    (athlete) => athlete.Id === selectedAthleteId
                                                  );
                                                  return selectedAthlete 
                                                    ? `${selectedAthlete.FirstName} ${selectedAthlete.LastName}${selectedAthlete.Email ? ` (${selectedAthlete.Email})` : ''}`
                                                    : "-- Válassz sportolót --";
                                                })()
                                              : "-- Válassz sportolót --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                          <Command>
                                            <CommandInput placeholder="Keresés sportolók között..." className="h-9" />
                                            <CommandList>
                                              <CommandEmpty>Nincs találat.</CommandEmpty>
                                              <CommandGroup>
                                                {availableAthletes.map((athlete) => (
                                                  <CommandItem
                                                    key={athlete.Id}
                                                    value={`${athlete.FirstName} ${athlete.LastName} ${athlete.Email || ''}`}
                                                    onSelect={() => {
                                                      setSelectedAthleteId(
                                                        selectedAthleteId === athlete.Id ? null : athlete.Id
                                                      );
                                                      setComboboxOpen(false);
                                                    }}
                                                  >
                                                    <div className="flex flex-col">
                                                      <span className="font-medium">
                                                        {athlete.FirstName} {athlete.LastName}
                                                      </span>
                                                      {athlete.Email && (
                                                        <span className="text-sm text-muted-foreground">
                                                          {athlete.Email}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <Check
                                                      className={cn(
                                                        "ml-auto h-4 w-4",
                                                        selectedAthleteId === athlete.Id ? "opacity-100" : "opacity-0"
                                                      )}
                                                    />
                                                  </CommandItem>
                                                ))}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    {selectedAthleteId && (
                                      <Card className="border-muted">
                                        <CardContent className="p-4">
                                          {(() => {
                                            const selectedAthlete = availableAthletes.find(a => a.Id === selectedAthleteId);
                                            return selectedAthlete ? (
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <h5 className="font-medium text-foreground">
                                                    {selectedAthlete.FirstName} {selectedAthlete.LastName}
                                                  </h5>
                                                  <Badge variant={selectedAthlete.HasUserAccount ? "default" : "secondary"}>
                                                    {selectedAthlete.HasUserAccount ? (
                                                      <>
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                        App felhasználó
                                                      </>
                                                    ) : (
                                                      <>
                                                        <UserX className="w-3 h-3 mr-1" />
                                                        Nincs app
                                                      </>
                                                    )}
                                                  </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                  {selectedAthlete.Email && (
                                                    <div className="flex items-center gap-1">
                                                      <Mail className="w-3 h-3" />
                                                      {selectedAthlete.Email}
                                                    </div>
                                                  )}
                                                  {selectedAthlete.BirthDate && (
                                                    <div className="flex items-center gap-1">
                                                      <Calendar className="w-3 h-3" />
                                                      {new Date(selectedAthlete.BirthDate).toLocaleDateString()}
                                                    </div>
                                                  )}
                                                  {selectedAthlete.Weight && (
                                                    <div className="flex items-center gap-1">
                                                      <Weight className="w-3 h-3" />
                                                      {selectedAthlete.Weight} kg
                                                    </div>
                                                  )}
                                                  {selectedAthlete.Height && (
                                                    <div className="flex items-center gap-1">
                                                      <Ruler className="w-3 h-3" />
                                                      {selectedAthlete.Height} cm
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ) : null;
                                          })()}
                                        </CardContent>
                                      </Card>
                                    )}
                                  </>
                                )}
                              </CardContent>
                              <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" onClick={cancelAddPlayer}>
                                  Mégse
                                </Button>
                                <Button
                                  onClick={() => handleAssignPlayer(team.Id)}
                                  disabled={isSubmitting || !selectedAthleteId || availableAthletes.length === 0}
                                >
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Hozzáadás
                                </Button>
                              </CardFooter>
                            </Card>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Athletes List */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: 0.1
                            }}
                          >
                            {team.Athletes.length === 0 ? (
                              <div className="text-center py-8">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  Nincsenek sportolók ebben a csapatban.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                  {team.Athletes.map((athlete, index) => (
                                    <motion.div
                                      key={athlete.Id}
                                      layout
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      transition={{
                                        opacity: { duration: 0.3 },
                                        y: { duration: 0.3 },
                                        layout: { duration: 0.3 },
                                        delay: index * 0.05
                                      }}
                                    >
                                <Card
                                  key={athlete.Id}
                                  className="transition-all duration-200 hover:shadow-sm hover:border-primary/30"
                                >
                                  <CardContent className="flex justify-between items-center p-4 min-h-[4rem]">
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-foreground">
                                          {athlete.FirstName} {athlete.LastName}
                                        </h5>
                                        {athlete.HasUserAccount && (
                                          <Badge variant="default" className="text-xs">
                                            App felhasználó
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        {athlete.BirthDate && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(athlete.BirthDate).toLocaleDateString()}
                                          </div>
                                        )}
                                        {athlete.Email && (
                                          <div className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {athlete.Email}
                                          </div>
                                        )}
                                        {athlete.Weight && (
                                          <div className="flex items-center gap-1">
                                            <Weight className="w-3 h-3" />
                                            {athlete.Weight} kg
                                          </div>
                                        )}
                                        {athlete.Height && (
                                          <div className="flex items-center gap-1">
                                            <Ruler className="w-3 h-3" />
                                            {athlete.Height} cm
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        handleDeletePlayer(
                                          athlete.Id,
                                          team.Id,
                                          `${athlete.FirstName} ${athlete.LastName}`
                                        )
                                      }
                                      disabled={deletingAthleteId === athlete.Id}
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0 ml-4"
                                    >
                                      {deletingAthleteId === athlete.Id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <UserMinus className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </CardContent>
                                </Card>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </div>
                              )}
                            </motion.div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {teams.length === 0 && (
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
                    <Plus className="w-4 h-4 mr-2" />
                    Első csapat létrehozása
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Igen"
        cancelText="Mégse"
        onConfirm={() => {
          confirmModal.onConfirm();
          hideConfirmation();
        }}
        onCancel={hideConfirmation}
        isLoading={deletingAthleteId !== null || deletingTeamId !== null}
        type={confirmModal.type}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={hideError}
      />

      <Toaster />
    </>
  );
}