import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/api';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Shadcn/ui imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Users, 
  ChevronDown, 
  Trash2,
  FileText,
  CalendarDays,
  Check,
  ChevronsUpDown
} from 'lucide-react';

// DTO interfaces matching backend
interface TrainingPlanDto {
  Id: number;
  Name: string;
  Description: string;
  Date: string; // DateOnly from backend
  StartTime?: string; // TimeOnly? from backend
  EndTime?: string; // TimeOnly? from backend
  AthleteId?: number;
  AthleteName?: string;
  TeamId?: number;
  TeamName?: string;
}

interface AthleteOption { Id: number; FirstName: string; LastName: string; }
interface TeamOption { Id: number; Name: string; }

interface FormDataState {
  Name: string;
  Description: string;
  Date: Date | undefined;
  StartTime: string;
  EndTime: string;
  AthleteId: string;
  TeamId: string;
}

export default function TrainingPlansPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [assignTo, setAssignTo] = useState<'Athlete' | 'Team'>('Athlete');
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [startTimePickerOpen, setStartTimePickerOpen] = useState(false);
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false);
  const [athleteComboboxOpen, setAthleteComboboxOpen] = useState(false);
  const [teamComboboxOpen, setTeamComboboxOpen] = useState(false);

  // Close other popovers when one opens
  const handleDatePickerChange = (open: boolean) => {
    setDatePickerOpen(open);
    if (open) {
      setStartTimePickerOpen(false);
      setEndTimePickerOpen(false);
      setAthleteComboboxOpen(false);
      setTeamComboboxOpen(false);
    }
  };

  const handleStartTimePickerChange = (open: boolean) => {
    setStartTimePickerOpen(open);
    if (open) {
      setDatePickerOpen(false);
      setEndTimePickerOpen(false);
      setAthleteComboboxOpen(false);
      setTeamComboboxOpen(false);
    }
  };

  const handleEndTimePickerChange = (open: boolean) => {
    setEndTimePickerOpen(open);
    if (open) {
      setDatePickerOpen(false);
      setStartTimePickerOpen(false);
      setAthleteComboboxOpen(false);
      setTeamComboboxOpen(false);
    }
  };

  const handleAthleteComboboxChange = (open: boolean) => {
    setAthleteComboboxOpen(open);
    if (open) {
      setDatePickerOpen(false);
      setStartTimePickerOpen(false);
      setEndTimePickerOpen(false);
      setTeamComboboxOpen(false);
    }
  };

  const handleTeamComboboxChange = (open: boolean) => {
    setTeamComboboxOpen(open);
    if (open) {
      setDatePickerOpen(false);
      setStartTimePickerOpen(false);
      setEndTimePickerOpen(false);
      setAthleteComboboxOpen(false);
    }
  };
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // form state
  const [formData, setFormData] = useState<FormDataState>({
    Name: '',
    Description: '',
    Date: undefined,
    StartTime: '',
    EndTime: '',
    AthleteId: '',
    TeamId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: plans = [],
    isLoading,
    isError: isPlansError,
    error: plansError,
  } = useQuery<TrainingPlanDto[], Error>({
    queryKey: ['trainingplans'],
    queryFn: async () => {
      const res = await api.get<TrainingPlanDto[]>('/trainingplans');
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!plansError) return;
    console.error(plansError);
    if (isPlansError) {
      toast.error('Nem sikerült betölteni az edzésterveket.');
    }
  }, [isPlansError, plansError]);

  const {
    data: optionsData = { athletes: [], teamsList: [] },
    error: optionsError,
  } = useQuery<{ athletes: AthleteOption[]; teamsList: TeamOption[] }, Error>({
    queryKey: ['trainingplans', 'options'],
    queryFn: async () => {
      const [aRes, tRes] = await Promise.all([
        api.get<AthleteOption[]>('/athletes'),
        api.get<TeamOption[]>('/teams'),
      ]);
      return { athletes: aRes.data, teamsList: tRes.data };
    },
    enabled: showAddForm,
    placeholderData: { athletes: [], teamsList: [] },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!optionsError) return;
    // previously silently ignored; keep UI silent
    console.error(optionsError);
  }, [optionsError]);

  const athletes = optionsData.athletes;
  const teamsList = optionsData.teamsList;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPlan = async () => {
    const { Name, Description, Date: planDate, StartTime, EndTime, AthleteId, TeamId } = formData;
    if (!Name || !Description || !planDate || 
        (assignTo === 'Athlete' ? !AthleteId : !TeamId)) {
      toast.error('Kérlek tölts ki minden szükséges mezőt.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        Name,
        Description,
        // IMPORTANT: Do NOT use toISOString() here (UTC) or the date can shift by timezone.
        // Backend expects a DateOnly-like "YYYY-MM-DD".
        Date: format(planDate, 'yyyy-MM-dd'),
        StartTime: StartTime || null,
        EndTime: EndTime || null,
        AthleteId: assignTo === 'Athlete' ? Number(AthleteId) : null,
        TeamId: assignTo === 'Team' ? Number(TeamId) : null
      };
      
      await api.post('/trainingplans', payload);
      await queryClient.invalidateQueries({ queryKey: ['trainingplans'] });
      setShowAddForm(false);
      setFormData({ Name: '', Description: '', Date: undefined, StartTime: '', EndTime: '', AthleteId: '', TeamId: '' });
      setDatePickerOpen(false);
      setStartTimePickerOpen(false);
      setEndTimePickerOpen(false);
      setAthleteComboboxOpen(false);
      setTeamComboboxOpen(false);
      toast.success('Edzésterv létrehozva!');
    } catch (err: unknown) {
      console.error(err);

      const backendMessage = (() => {
        if (!axios.isAxiosError(err)) return null;
        const data = err.response?.data;
        if (!data) return null;

        // Backend may send plain text
        if (typeof data === 'string') return data;

        // Or structured payloads (e.g. ASP.NET ProblemDetails / custom DTO)
        if (typeof data === 'object') {
          const anyData = data as any;

          if (typeof anyData.message === 'string' && anyData.message.trim()) return anyData.message;
          if (typeof anyData.detail === 'string' && anyData.detail.trim()) return anyData.detail;

          // Validation errors: { errors: { Field: ["msg1","msg2"] } }
          const errors = anyData.errors;
          if (errors && typeof errors === 'object') {
            const messages = Object.values(errors)
              .flat()
              .filter((v) => typeof v === 'string' && v.trim()) as string[];
            if (messages.length) return messages.join('\n');
          }

          if (typeof anyData.title === 'string' && anyData.title.trim()) return anyData.title;
        }

        return null;
      })();

      toast.error(backendMessage ?? 'Nem sikerült létrehozni az edzéstervet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = (planId: number, planName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Edzésterv törlése',
      message: `Biztos törlöd ezt az edzéstervet: "${planName}"?`,
      onConfirm: async () => {
        setDeletingPlanId(planId);
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await api.delete(`/trainingplans/${planId}`);
          await queryClient.invalidateQueries({ queryKey: ['trainingplans'] });
          toast.success('Edzésterv törölve!');
        } catch {
          toast.error('Nem sikerült törölni az edzéstervet.');
        } finally {
          setDeletingPlanId(null);
        }
      },
    });
  };

  const cancelAddPlan = () => {
    setShowAddForm(false);
    setFormData({ Name: '', Description: '', Date: undefined, StartTime: '', EndTime: '', AthleteId: '', TeamId: '' });
    setDatePickerOpen(false);
    setStartTimePickerOpen(false);
    setEndTimePickerOpen(false);
    setAthleteComboboxOpen(false);
    setTeamComboboxOpen(false);
  };

  const formatTimeDisplay = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '';
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    if (startTime) return `${startTime}-tól`;
    return `${endTime}-ig`;
  };

  // Generate time options (every 15 minutes)
  const generateTimeOptions = () => {
    const times: string[] = [];
    // Only allow selecting times between 06:00 and 22:00 (inclusive)
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 22 && minute > 0) break; // keep last option at exactly 22:00
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    // Return time in 24-hour format (HH:MM)
    return time;
  };

  return (
    <>
      <div className="min-h-screen bg-background lg:pl-64">
        <TopHeader title="Edzéstervek" subtitle="Edzéstervek kezelése és hozzárendelése" />
        
        <div className="px-8 py-16">
          <div className="max-w-4xl mx-auto">

            {/* Add Plan Button */}
            <div className="flex justify-end mb-8">
              <Button 
                onClick={() => setShowAddForm(true)}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
                Új edzésterv
              </Button>
            </div>

            {/* Add Plan Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
                    Új edzésterv létrehozása
                  </DialogTitle>
                  <DialogDescription>
                    Töltsd ki az edzésterv adatait és rendeld hozzá sportolóhoz vagy csapathoz.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="Name">Név *</Label>
                        <Input
                          id="Name"
                          name="Name"
                          value={formData.Name}
                          onChange={handleInputChange}
                          placeholder="Edzésterv neve"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="Description">Leírás *</Label>
                        <Textarea
                          id="Description"
                          name="Description"
                          value={formData.Description}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Edzésterv részletes leírása"
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="Date">Dátum *</Label>
                          <Popover open={datePickerOpen} onOpenChange={handleDatePickerChange}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                id="Date"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !formData.Date && "text-muted-foreground"
                                )}
                              >
                                {formData.Date ? (
                                  format(formData.Date, "yyyy. MMMM d.", { locale: hu })
                                ) : (
                                  "Válassz dátumot"
                                )}
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-auto overflow-hidden p-0 z-[9999] pointer-events-auto" 
                              align="start"
                              noPortal={true}
                              onInteractOutside={(e) => {
                                // Prevent closing when clicking inside the dialog
                                e.preventDefault();
                              }}
                            >
                              <CalendarComponent
                                mode="single"
                                selected={formData.Date}
                                captionLayout="dropdown"
                                onSelect={(date) => {
                                  setFormData(prev => ({ ...prev, Date: date }));
                                  setDatePickerOpen(false);
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                locale={hu}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="StartTime">Kezdési idő</Label>
                            <Popover open={startTimePickerOpen} onOpenChange={handleStartTimePickerChange}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="StartTime"
                                  className={cn(
                                    "w-full justify-between font-normal",
                                    !formData.StartTime && "text-muted-foreground"
                                  )}
                                >
                                  {formData.StartTime ? (
                                    formatTimeForDisplay(formData.StartTime)
                                  ) : (
                                    "Válassz kezdési időt"
                                  )}
                                  <Clock className="h-4 w-4 ml-2" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-48 p-0 z-[9999] pointer-events-auto" 
                                align="start"
                                noPortal={true}
                                onInteractOutside={(e) => {
                                  e.preventDefault();
                                }}
                              >
                                <div className="p-2">
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {timeOptions.map((time) => (
                                      <Button
                                        key={time}
                                        variant="ghost"
                                        className={cn(
                                          "w-full justify-start font-normal text-sm",
                                          formData.StartTime === time && "bg-primary text-primary-foreground"
                                        )}
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, StartTime: time }));
                                        }}
                                      >
                                        <span className="flex-1 text-left">{formatTimeForDisplay(time)}</span>
                                        {formData.StartTime === time && (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </Button>
                                    ))}
                                  </div>
                                  <div className="flex justify-end gap-2 p-2 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, StartTime: '' }));
                                        setStartTimePickerOpen(false);
                                      }}
                                    >
                                      Törlés
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => setStartTimePickerOpen(false)}
                                    >
                                      Kész
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="EndTime">Befejezési idő</Label>
                            <Popover open={endTimePickerOpen} onOpenChange={handleEndTimePickerChange}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="EndTime"
                                  className={cn(
                                    "w-full justify-between font-normal",
                                    !formData.EndTime && "text-muted-foreground"
                                  )}
                                >
                                  {formData.EndTime ? (
                                    formatTimeForDisplay(formData.EndTime)
                                  ) : (
                                    "Válassz befejezési időt"
                                  )}
                                  <Clock className="h-4 w-4 ml-2" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-48 p-0 z-[9999] pointer-events-auto" 
                                align="start"
                                noPortal={true}
                                onInteractOutside={(e) => {
                                  e.preventDefault();
                                }}
                              >
                                <div className="p-2">
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {timeOptions.map((time) => (
                                      <Button
                                        key={time}
                                        variant="ghost"
                                        className={cn(
                                          "w-full justify-start font-normal text-sm",
                                          formData.EndTime === time && "bg-primary text-primary-foreground"
                                        )}
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, EndTime: time }));
                                        }}
                                      >
                                        <span className="flex-1 text-left">{formatTimeForDisplay(time)}</span>
                                        {formData.EndTime === time && (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </Button>
                                    ))}
                                  </div>
                                  <div className="flex justify-end gap-2 p-2 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, EndTime: '' }));
                                        setEndTimePickerOpen(false);
                                      }}
                                    >
                                      Törlés
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => setEndTimePickerOpen(false)}
                                    >
                                      Kész
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                      
                      {/* Assign Type */}
                      <div className="space-y-3">
                        <Label>Hozzárendelés *</Label>
                        <RadioGroup 
                          value={assignTo} 
                          onValueChange={(value: 'Athlete' | 'Team') => setAssignTo(value)}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Athlete" id="athlete" />
                            <Label htmlFor="athlete" className="flex items-center cursor-pointer">
                              <User className="w-4 h-4 mr-1" />
                              Sportoló
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Team" id="team" />
                            <Label htmlFor="team" className="flex items-center cursor-pointer">
                              <Users className="w-4 h-4 mr-1" />
                              Csapat
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {/* Select Athletes or Teams */}
                      {assignTo === 'Athlete' ? (
                        <div className="space-y-2">
                          <Label>Sportoló *</Label>
                          <Popover open={athleteComboboxOpen} onOpenChange={handleAthleteComboboxChange}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={athleteComboboxOpen}
                                className="w-full justify-between"
                              >
                                {formData.AthleteId
                                  ? (() => {
                                      const selectedAthlete = athletes.find(
                                        (athlete) => athlete.Id.toString() === formData.AthleteId
                                      );
                                      return selectedAthlete 
                                        ? `${selectedAthlete.FirstName} ${selectedAthlete.LastName}`
                                        : "Válassz sportolót";
                                    })()
                                  : "Válassz sportolót"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-full p-0 z-[9999] pointer-events-auto" 
                              align="start"
                              noPortal={true}
                              onInteractOutside={(e) => {
                                e.preventDefault();
                              }}
                            >
                              <Command>
                                <CommandInput placeholder="Keresés sportolók között..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>Nincs találat.</CommandEmpty>
                                  <CommandGroup>
                                    {athletes.map((athlete) => (
                                      <CommandItem
                                        key={athlete.Id}
                                        value={`${athlete.FirstName} ${athlete.LastName}`}
                                        onSelect={() => {
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            AthleteId: formData.AthleteId === athlete.Id.toString() ? '' : athlete.Id.toString()
                                          }));
                                          setAthleteComboboxOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {athlete.FirstName} {athlete.LastName}
                                          </span>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            formData.AthleteId === athlete.Id.toString() ? "opacity-100" : "opacity-0"
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
                      ) : (
                        <div className="space-y-2">
                          <Label>Csapat *</Label>
                          <Popover open={teamComboboxOpen} onOpenChange={handleTeamComboboxChange}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={teamComboboxOpen}
                                className="w-full justify-between"
                              >
                                {formData.TeamId
                                  ? (() => {
                                      const selectedTeam = teamsList.find(
                                        (team) => team.Id.toString() === formData.TeamId
                                      );
                                      return selectedTeam ? selectedTeam.Name : "Válassz csapatot";
                                    })()
                                  : "Válassz csapatot"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-full p-0 z-[9999] pointer-events-auto" 
                              align="start"
                              noPortal={true}
                              onInteractOutside={(e) => {
                                e.preventDefault();
                              }}
                            >
                              <Command>
                                <CommandInput placeholder="Keresés csapatok között..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>Nincs találat.</CommandEmpty>
                                  <CommandGroup>
                                    {teamsList.map((team) => (
                                      <CommandItem
                                        key={team.Id}
                                        value={team.Name}
                                        onSelect={() => {
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            TeamId: formData.TeamId === team.Id.toString() ? '' : team.Id.toString()
                                          }));
                                          setTeamComboboxOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {team.Name}
                                          </span>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            formData.TeamId === team.Id.toString() ? "opacity-100" : "opacity-0"
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
                      )}
                      
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={cancelAddPlan} disabled={isSubmitting}>
                    Mégse
                  </Button>
                  <Button
                    onClick={handleSubmitPlan}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Mentés...' : 'Létrehozás'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Plans List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Edzéstervek betöltése...</p>
                </div>
              </div>
            ) : plans.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Még nincsenek edzéstervek</h3>
                    <p className="text-muted-foreground mb-4">
                      Kezdj az első edzésterv létrehozásával.
                    </p>
                    <Button onClick={() => setShowAddForm(true)} size="lg">
                      <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
                      Első edzésterv létrehozása
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {plans.map(plan => (
                  <Card 
                    key={plan.Id} 
                    className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                              <FileText className="w-5 h-5 mr-2 text-primary" />
                              {plan.Name}
                            </h3>
                            <p className="text-muted-foreground">{plan.Description}</p>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {new Date(plan.Date).toLocaleDateString('hu-HU')}
                            </div>
                            {formatTimeDisplay(plan.StartTime, plan.EndTime) && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatTimeDisplay(plan.StartTime, plan.EndTime)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {plan.AthleteName && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                <User className="w-3 h-3 mr-1" />
                                {plan.AthleteName}
                              </Badge>
                            )}
                            {plan.TeamName && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                <Users className="w-3 h-3 mr-1" />
                                {plan.TeamName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.Id, plan.Name)}
                            disabled={deletingPlanId === plan.Id}
                          >
                            {deletingPlanId === plan.Id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Törlés...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Törlés
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}