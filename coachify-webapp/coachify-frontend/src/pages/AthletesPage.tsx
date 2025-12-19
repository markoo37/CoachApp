import React, { useEffect, useState } from 'react';
import api from '../api/api';
import TopHeader from '../components/TopHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Plus, Users, UserCheck, UserX, Mail, Trash2, Ruler, Weight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchWellnessIndex } from '../api/wellness';

interface Athlete {
  Id: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Weight?: number;
  Height?: number;
  HasUserAccount: boolean;
}

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
  return hasAccount ? 'Aktív sportoló' : 'Várakozó';
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

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingAthleteId, setDeletingAthleteId] = useState<number | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [wellnessData, setWellnessData] = useState<Record<number, number>>({});
  const [hoveredAthleteId, setHoveredAthleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/athletes');
      const athletesData = res.data;
      setAthletes(athletesData);
      
      // Fetch wellness index for each athlete
      const wellnessPromises = athletesData.map(async (athlete: Athlete) => {
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
    } catch (err: any) {
      setError('Nem sikerült betölteni a sportolókat. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAthlete = async () => {
    if (!addEmail.trim()) {
      setError('Kötelező megadni az email címet.');
      return;
    }
    if (athletes.some(a => a.Email?.toLowerCase() === addEmail.trim().toLowerCase())) {
      setError('Ez a sportoló már hozzá van adva.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/athletes/add-by-email', { email: addEmail.trim() });
      setAddEmail('');
      setShowAddForm(false);
      setSuccess('Sikeres hozzáadás! A sportoló meghívható az appba.');
      fetchAthletes();
    } catch (err: any) {
      setError(
        err?.response?.data?.message
          || err?.response?.data
          || 'Hiba történt a hozzáadás során!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAthlete = async () => {
    if (!athleteToDelete) return;
    setDeletingAthleteId(athleteToDelete.Id);
    try {
      await api.delete(`/athletes/remove-from-coach/${athleteToDelete.Id}`);
      fetchAthletes();
    } catch {
      setError('Nem sikerült törölni.');
    } finally {
      setDeletingAthleteId(null);
      setAthleteToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Összes sportolóm" subtitle={`${athletes.length} sportoló`} />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-end mb-8">
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="mr-2 h-5 w-5 stroke-[2.5]" />
              Új sportoló
            </Button>
          </div>

        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sportoló hozzáadása e-maillel</CardTitle>
              <CardDescription>
                A játékos később az appban töltheti ki a nevét és adatait.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input
                type="email"
                placeholder="sportolo@email.com"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Button onClick={handleAddAthlete} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2 stroke-[2.5]" />}
                Hozzáadás
              </Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setAddEmail(''); }}>
                Mégse
              </Button>
            </CardContent>
            {error && <div className="text-destructive px-6 pb-4">{error}</div>}
            {success && <div className="text-green-600 px-6 pb-4">{success}</div>}
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.map((a) => {
              const initials = getInitials(a.FirstName, a.LastName, a.Email);
              const fullName = (a.FirstName || a.LastName)
                ? `${a.FirstName ?? ''} ${a.LastName ?? ''}`.trim()
                : 'Név később...';
              const role = getRole(a.HasUserAccount);
              const wellnessAverage = wellnessData[a.Id] || 0;
              
              return (
                <Card 
                  key={a.Id} 
                  className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50"
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
                      </div>
                      
                      {/* Name and Role */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold mb-1 truncate">
                          {fullName}
                        </CardTitle>
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
                        <Link to={`/athletes/${a.Id}`}>
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
              );
            })}
          </div>
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
