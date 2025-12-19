import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useModals } from '../hooks/useModals';
import Notification from '../components/ui/Notification';
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
import { motion, AnimatePresence } from 'framer-motion';

// Shadcn/ui imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [plans, setPlans] = useState<TrainingPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [assignTo, setAssignTo] = useState<'Athlete' | 'Team'>('Athlete');
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [athleteComboboxOpen, setAthleteComboboxOpen] = useState(false);
  const [teamComboboxOpen, setTeamComboboxOpen] = useState(false);
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

  // options
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [teamsList, setTeamsList] = useState<TeamOption[]>([]);

  const {
    errorModal,
    notification,
    showNotification,
    hideNotification,
    showError,
    hideError,
  } = useModals();

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (showAddForm) fetchOptions();
  }, [showAddForm]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<TrainingPlanDto[]>('/trainingplans');
      setPlans(res.data);
    } catch (err) {
      showError('Betöltési hiba', 'Nem sikerült betölteni az edzésterveket.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [aRes, tRes] = await Promise.all([
        api.get<AthleteOption[]>('/athletes'),
        api.get<TeamOption[]>('/teams')
      ]);
      setAthletes(aRes.data);
      setTeamsList(tRes.data);
    } catch {
      // silently ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPlan = async () => {
    const { Name, Description, Date, StartTime, EndTime, AthleteId, TeamId } = formData;
    if (!Name || !Description || !Date || 
        (assignTo === 'Athlete' ? !AthleteId : !TeamId)) {
      showError('Hiányzó adat', 'Kérlek tölts ki minden szükséges mezőt.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        Name,
        Description,
        Date: Date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        StartTime: StartTime || null,
        EndTime: EndTime || null,
        AthleteId: assignTo === 'Athlete' ? Number(AthleteId) : null,
        TeamId: assignTo === 'Team' ? Number(TeamId) : null
      };
      
      await api.post('/trainingplans', payload);
      fetchPlans();
      setShowAddForm(false);
      setFormData({ Name: '', Description: '', Date: undefined, StartTime: '', EndTime: '', AthleteId: '', TeamId: '' });
      setDatePickerOpen(false);
      setAthleteComboboxOpen(false);
      setTeamComboboxOpen(false);
      showNotification('Edzésterv létrehozva!', 'success');
    } catch {
      showError('Hiba', 'Nem sikerült létrehozni az edzéstervet.');
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
          await fetchPlans();
          showNotification('Edzésterv törölve!', 'success');
        } catch {
          showError('Hiba', 'Nem sikerült törölni az edzéstervet.');
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
    setAthleteComboboxOpen(false);
    setTeamComboboxOpen(false);
  };

  const formatTimeDisplay = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '';
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    if (startTime) return `${startTime}-tól`;
    return `${endTime}-ig`;
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

            {/* Add Plan Form with Animation */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 overflow-hidden"
                >
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
                        Új edzésterv létrehozása
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                          <Label htmlFor="Date">Dátum *</Label>
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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
                        <div className="space-y-2">
                          <Label htmlFor="StartTime">Kezdési idő</Label>
                          <Input
                            id="StartTime"
                            name="StartTime"
                            type="time"
                            value={formData.StartTime}
                            onChange={handleInputChange}
                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="EndTime">Befejezési idő</Label>
                          <Input
                            id="EndTime"
                            name="EndTime"
                            type="time"
                            value={formData.EndTime}
                            onChange={handleInputChange}
                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
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
                          <Popover open={athleteComboboxOpen} onOpenChange={setAthleteComboboxOpen}>
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
                            <PopoverContent className="w-full p-0" align="start">
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
                          <Popover open={teamComboboxOpen} onOpenChange={setTeamComboboxOpen}>
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
                            <PopoverContent className="w-full p-0" align="start">
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
                      
                      {/* Actions */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={cancelAddPlan}>
                          Mégse
                        </Button>
                        <Button
                          onClick={handleSubmitPlan}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmitting ? 'Mentés...' : 'Létrehozás'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

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

      {/* Modals & Notifications */}
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

      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={hideError}
      />
      
      <Notification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </>
  );
}