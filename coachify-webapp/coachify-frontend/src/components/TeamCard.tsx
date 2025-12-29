import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import {
  Users,
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
  UserX,
} from 'lucide-react';

export interface Athlete {
  Id: number;
  FirstName: string;
  LastName: string;
  BirthDate?: string;
  Weight?: number;
  Height?: number;
  Email?: string;
  HasUserAccount: boolean;
}

export interface Team {
  Id: number;
  Name: string;
  Athletes: Athlete[];
}

type TeamCardProps = {
  team: Team;
  expanded: boolean;
  onToggle: (teamId: number) => void;
  deletingTeamId: number | null;
  onDeleteTeam: (teamId: number, name: string) => void;
  onAddPlayer: (teamId: number) => void;
  isAddPlayerOpen: boolean;
  availableAthletes: Athlete[];
  selectedAthleteId: number | null;
  onSelectAthlete: (athleteId: number | null) => void;
  comboboxOpen: boolean;
  setComboboxOpen: (open: boolean) => void;
  loadingAvailableAthletes: boolean;
  onAssignPlayer: (teamId: number) => void;
  onCancelAddPlayer: () => void;
  isSubmitting: boolean;
  deletingAthleteId: number | null;
  onDeletePlayer: (athleteId: number, teamId: number, name: string) => void;
};

export default function TeamCard({
  team,
  expanded,
  onToggle,
  deletingTeamId,
  onDeleteTeam,
  onAddPlayer,
  isAddPlayerOpen,
  availableAthletes,
  selectedAthleteId,
  onSelectAthlete,
  comboboxOpen,
  setComboboxOpen,
  loadingAvailableAthletes,
  onAssignPlayer,
  onCancelAddPlayer,
  isSubmitting,
  deletingAthleteId,
  onDeletePlayer,
}: TeamCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="py-6">
        <div className="flex justify-between items-center min-h-[3rem]">
          <button
            onClick={() => onToggle(team.Id)}
            className="flex items-center gap-3 text-left group flex-1"
          >
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {team.Name}
            </h3>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div className="flex items-center gap-4 flex-shrink-0">
            <Badge variant="secondary" className="gap-1 h-8 px-3">
              <Users className="w-3 h-3" />
              {team.Athletes.length} sportoló
            </Badge>
            <Button
              onClick={() => onDeleteTeam(team.Id, team.Name)}
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

      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => onAddPlayer(team.Id)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                  Sportoló hozzáadása
                </Button>
              </div>

              <AnimatePresence>
                {isAddPlayerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Card className="mb-6 border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <h4 className="font-medium text-foreground">
                          Sportoló hozzáadása a csapathoz
                        </h4>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {loadingAvailableAthletes ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">
                              Sportolók betöltése...
                            </span>
                          </div>
                        ) : availableAthletes.length === 0 ? (
                          <div className="py-8 text-center space-y-2">
                            <p className="text-muted-foreground">
                              Nincsenek elérhető sportolók.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Adj hozzá új sportolókat a "Sportolók" oldalon, vagy mozgasd át sportolókat más csapatokból.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label htmlFor="athlete-select" className="text-sm font-medium text-foreground">
                                Válassz sportolót ({availableAthletes.length} elérhető)
                              </label>
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
                                            athlete => athlete.Id === selectedAthleteId
                                          );
                                          return selectedAthlete
                                            ? `${selectedAthlete.FirstName} ${selectedAthlete.LastName}${
                                                selectedAthlete.Email ? ` (${selectedAthlete.Email})` : ''
                                              }`
                                            : '-- Válassz sportolót --';
                                        })()
                                      : '-- Válassz sportolót --'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput
                                      placeholder="Keresés sportolók között..."
                                      className="h-9"
                                    />
                                    <CommandList>
                                      <CommandEmpty>Nincs találat.</CommandEmpty>
                                      <CommandGroup>
                                        {availableAthletes.map(athlete => (
                                          <CommandItem
                                            key={athlete.Id}
                                            value={`${athlete.FirstName} ${athlete.LastName} ${athlete.Email || ''}`}
                                            onSelect={() => {
                                              onSelectAthlete(selectedAthleteId === athlete.Id ? null : athlete.Id);
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
                                                'ml-auto h-4 w-4',
                                                selectedAthleteId === athlete.Id ? 'opacity-100' : 'opacity-0'
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
                                    const selectedAthlete = availableAthletes.find(
                                      athlete => athlete.Id === selectedAthleteId
                                    );
                                    return selectedAthlete ? (
                                      <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                          <h5 className="font-medium text-foreground">
                                            {selectedAthlete.FirstName} {selectedAthlete.LastName}
                                          </h5>
                                          <Badge variant={selectedAthlete.HasUserAccount ? 'default' : 'secondary'}>
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
                        <Button variant="outline" onClick={onCancelAddPlayer}>
                          Mégse
                        </Button>
                        <Button
                          onClick={() => onAssignPlayer(team.Id)}
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

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {team.Athletes.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nincsenek sportolók ebben a csapatban.</p>
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
                            delay: index * 0.05,
                          }}
                        >
                          <Card className="transition-all duration-200 hover:shadow-sm hover:border-primary/30">
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
                                  onDeletePlayer(athlete.Id, team.Id, `${athlete.FirstName} ${athlete.LastName}`)
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
  );
}

