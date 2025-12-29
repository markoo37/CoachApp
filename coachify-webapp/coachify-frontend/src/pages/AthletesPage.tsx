import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import TopHeader from '../components/TopHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Plus, Users, UserCheck, Trash2, Ruler, Weight, Grid3x3, List, Clock, Search } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Link } from 'react-router-dom';
import { fetchWellnessIndex } from '../api/wellness';
import AthletesTable, { Athlete } from '@/components/ui/athletes-table';

// Helper function to get initials for avatar
const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (lastName) {
    return lastName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
};

// Helper function to get role based on account status
const getRole = (hasAccount: boolean): string => {
  return hasAccount ? 'App felhasználó' : 'Még nincs app';
};

// Helper function to calculate average of last 7 wellness index values
const calculateWellnessAverage = (wellnessIndexes: { index: number }[]): number => {
  if (!wellnessIndexes || wellnessIndexes.length === 0) return 0;
  
  // Get last 7 values
  const last7 = wellnessIndexes.slice(-7);
  const sum = last7.reduce((acc, item) => acc + item.index, 0);
  const average = Math.round(sum / last7.length);
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, average));
};

// Helper function to get color for wellness index bar
const getWellnessBarColor = (value: number): string => {
  // 0-33: red zone, 33-66: yellow zone, 66-100: green zone
  if (value >= 66) {
    return `linear-gradient(to right, #22c55e, #16a34a)`; // Green for high values
  } else if (value >= 33) {
    return `linear-gradient(to right, #eab308, #facc15)`; // Yellow for medium values
  } else {
    return `linear-gradient(to right, #ef4444, #dc2626)`; // Red for low values
  }
};

type ViewMode = 'grid' | 'list';

export default function AthletesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [deletingAthleteId, setDeletingAthleteId] = useState<number | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [wellnessData, setWellnessData] = useState<Record<number, number>>({});
  const [hoveredAthleteId, setHoveredAthleteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [celebratingAthleteIds, setCelebratingAthleteIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const previousAthletesRef = useRef<Athlete[]>([]);
  
  const ITEMS_PER_PAGE = 9;

  // Fetch athletes using React Query
  const { data: athletes = [], isLoading: loading } = useQuery<Athlete[]>({
    queryKey: ['athletes'],
    queryFn: async () => {
      const res = await api.get('/athletes');
      return res.data;
    },
    refetchInterval: 2000, // Refetch every 2 seconds to detect registration changes instantly
  });

  // Detect registration changes and trigger animation
  useEffect(() => {
    if (previousAthletesRef.current.length === 0) {
      previousAthletesRef.current = athletes;
      return;
    }

    // Check for athletes who just registered (HasUserAccount changed from false to true)
    const newlyRegistered = athletes.filter(athlete => {
      const previous = previousAthletesRef.current.find(a => a.Id === athlete.Id);
      return previous && !previous.HasUserAccount && athlete.HasUserAccount;
    });

    if (newlyRegistered.length > 0) {
      // Immediately refetch to ensure latest data
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      
      newlyRegistered.forEach(athlete => {
        setCelebratingAthleteIds(prev => new Set(prev).add(athlete.Id));
        // Remove animation after 2.5 seconds
        setTimeout(() => {
          setCelebratingAthleteIds(prev => {
            const next = new Set(prev);
            next.delete(athlete.Id);
            return next;
          });
        }, 2500);
      });
    }

    previousAthletesRef.current = athletes;
  }, [athletes]);

  // Fetch wellness data when athletes change
  useEffect(() => {
    if (athletes.length === 0) {
      setWellnessData({});
      return;
    }

    const fetchWellnessData = async () => {
      const wellnessPromises = athletes.map(async (athlete: Athlete) => {
        try {
          const wellnessIndexes = await fetchWellnessIndex(athlete.Id);
          const average = calculateWellnessAverage(wellnessIndexes);
          return { athleteId: athlete.Id, average };
        } catch (err) {
          // If wellness data is not available, return 0
          return { athleteId: athlete.Id, average: 0 };
        }
      });
      
      const wellnessResults = await Promise.all(wellnessPromises);
      const wellnessMap: Record<number, number> = {};
      wellnessResults.forEach(({ athleteId, average }) => {
        wellnessMap[athleteId] = average;
      });
      setWellnessData(wellnessMap);
    };

    fetchWellnessData();
  }, [athletes]);

  // Add athlete mutation
  const addAthleteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/athletes/add-by-email', { email: email.trim() });
      return res.data;
    },
    onSuccess: (data) => {
      // If backend returns the new athlete, add it to cache
      if (data && data.Id) {
        const currentAthletes = queryClient.getQueryData<Athlete[]>(['athletes']) || [];
        queryClient.setQueryData<Athlete[]>(['athletes'], [data, ...currentAthletes]);
      } else {
        // Otherwise invalidate to refetch
        queryClient.invalidateQueries({ queryKey: ['athletes'] });
      }
      setAddEmail('');
      setShowAddForm(false);
      toast.success('Sikeres hozzáadás! A sportoló meghívható az appba.');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.response?.data || 'Hiba történt a hozzáadás során!'
      );
    },
  });

  const handleAddAthlete = async () => {
    if (!addEmail.trim()) {
      toast.error('Kötelező megadni az email címet.');
      return;
    }
    if (athletes.some(a => a.Email?.toLowerCase() === addEmail.trim().toLowerCase())) {
      toast.error('Ez a sportoló már hozzá van adva.');
      return;
    }
    addAthleteMutation.mutate(addEmail);
  };

  // Delete athlete mutation
  const deleteAthleteMutation = useMutation({
    mutationFn: async (athleteId: number) => {
      await api.delete(`/athletes/remove-from-coach/${athleteId}`);
    },
    onSuccess: (_, athleteId) => {
      // Remove athlete from cache
      const currentAthletes = queryClient.getQueryData<Athlete[]>(['athletes']) || [];
      queryClient.setQueryData<Athlete[]>(
        ['athletes'],
        currentAthletes.filter(a => a.Id !== athleteId)
      );
      toast.success('Sportoló sikeresen törölve.');
      setDeletingAthleteId(null);
      setAthleteToDelete(null);
    },
    onError: () => {
      toast.error('Nem sikerült törölni.');
      setDeletingAthleteId(null);
    },
  });

  const handleDeleteAthlete = async () => {
    if (!athleteToDelete) return;
    setDeletingAthleteId(athleteToDelete.Id);
    deleteAthleteMutation.mutate(athleteToDelete.Id);
  };

  // Filter athletes based on search query
  const filteredAthletes = athletes.filter((athlete) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const firstName = (athlete.FirstName || '').toLowerCase();
    const lastName = (athlete.LastName || '').toLowerCase();
    const email = (athlete.Email || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    
    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      fullName.includes(query) ||
      email.includes(query)
    );
  });

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAthletes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Összes sportolóm" subtitle={`${filteredAthletes.length} sportoló${searchQuery ? ` (${athletes.length} összesen)` : ''}`} />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Keresés név vagy email alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
              Új sportoló
            </Button>
          </div>

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sportoló hozzáadása e-maillel</DialogTitle>
              <DialogDescription>
                A játékos később az appban töltheti ki a nevét és adatait.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                type="email"
                placeholder="sportolo@email.com"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                disabled={addAthleteMutation.isPending}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addAthleteMutation.isPending) {
                    handleAddAthlete();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setAddEmail(''); }} disabled={addAthleteMutation.isPending}>
                Mégse
              </Button>
              <Button onClick={handleAddAthlete} disabled={addAthleteMutation.isPending}>
                {addAthleteMutation.isPending ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2 stroke-[2.5]" />}
                Hozzáadás
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {paginatedAthletes.map((a) => {
              const initials = getInitials(a.FirstName, a.LastName, a.Email);
              const fullName = (a.FirstName || a.LastName)
                ? `${a.FirstName ?? ''} ${a.LastName ?? ''}`.trim()
                : 'Név később...';
              const role = getRole(a.HasUserAccount);
              const wellnessAverage = wellnessData[a.Id] || 0;
              const isCelebrating = celebratingAthleteIds.has(a.Id);
              
              return (
                <div key={a.Id} className="relative">
                  {isCelebrating && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0">
                      <div
                        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom"
                        style={{
                          background: `radial-gradient(circle, #22c55e, transparent 10%)`,
                          animationDuration: '1.5s'
                        }}
                      ></div>
                      <div
                        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top"
                        style={{
                          background: `radial-gradient(circle, #22c55e, transparent 10%)`,
                          animationDuration: '1.5s'
                        }}
                      ></div>
                    </div>
                  )}
                  <Card 
                    className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50 ${
                      !a.HasUserAccount ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    } ${isCelebrating ? 'border-2 border-green-500' : ''}`}
                    onMouseEnter={() => setHoveredAthleteId(a.Id)}
                    onMouseLeave={() => setHoveredAthleteId(null)}
                  >
                  <CardContent className="p-6">
                    {/* Profile Picture and Name Section */}
                    <div className="flex items-start gap-4 mb-6">
                      {/* Profile Picture Placeholder */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                          {initials}
                        </div>
                        {a.HasUserAccount && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <UserCheck className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {!a.HasUserAccount && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Name and Role */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-semibold truncate">
                            {fullName}
                          </CardTitle>
                        </div>
                        <div className="relative h-5 overflow-hidden">
                          <CardDescription 
                            className={`text-sm text-muted-foreground absolute inset-0 transition-all duration-300 ease-in-out ${
                              hoveredAthleteId === a.Id 
                                ? 'opacity-0 -translate-y-full' 
                                : 'opacity-100 translate-y-0'
                            }`}
                          >
                            {role}
                          </CardDescription>
                          <CardDescription 
                            className={`text-sm text-muted-foreground absolute inset-0 transition-all duration-300 ease-in-out ${
                              hoveredAthleteId === a.Id 
                                ? 'opacity-100 translate-y-0' 
                                : 'opacity-0 translate-y-full'
                            }`}
                          >
                            {a.Email || 'Nincs email'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>

                    {/* Height and Weight Section */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase">Magasság</div>
                          <div className="text-lg font-semibold text-foreground">
                            {a.Height ? `${a.Height} cm` : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Weight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase">Testsúly</div>
                          <div className="text-lg font-semibold text-foreground">
                            {a.Weight ? `${a.Weight} kg` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wellness Index Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Wellness Index</span>
                        <span className="text-sm font-semibold text-foreground">{wellnessAverage}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${wellnessAverage}%`,
                            background: getWellnessBarColor(wellnessAverage)
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link 
                          to={`/athletes/${a.Id}`}
                          state={{ from: "/athletes" }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Részletek
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setAthleteToDelete(a)}
                        disabled={deletingAthleteId === a.Id}
                        className="flex-1"
                      >
                        {deletingAthleteId === a.Id
                          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          : <Trash2 className="w-4 h-4 mr-2" />
                        }
                        Törlés
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
              );
            })}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <AthletesTable
                  athletes={filteredAthletes}
                  wellnessData={wellnessData}
                  deletingAthleteId={deletingAthleteId}
                  onDeleteClick={setAthleteToDelete}
                />
              </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pagination - always show for grid view */}
            {viewMode === 'grid' && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!athleteToDelete} onOpenChange={(open) => !open && setAthleteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sportoló törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törlöd a sportolót a saját listádból?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAthlete}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
