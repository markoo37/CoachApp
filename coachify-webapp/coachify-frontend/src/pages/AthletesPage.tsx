import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, UserCheck, UserX, Mail, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Athlete {
  Id: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  HasUserAccount: boolean;
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingAthleteId, setDeletingAthleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/athletes');
      setAthletes(res.data);
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

  const handleDeleteAthlete = async (athleteId: number) => {
    if (!window.confirm('Biztosan törlöd a sportolót a saját listádból?')) return;
    setDeletingAthleteId(athleteId);
    try {
      await api.delete(`/athletes/remove-from-coach/${athleteId}`);
      fetchAthletes();
    } catch {
      setError('Nem sikerült törölni.');
    } finally {
      setDeletingAthleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Összes sportolóm</h1>
            <p className="text-muted-foreground">{athletes.length} sportoló</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
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
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {athletes.map((a) => (
              <Card key={a.Id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {(a.FirstName || a.LastName)
                          ? `${a.FirstName ?? ''} ${a.LastName ?? ''}`.trim()
                          : <span className="italic text-muted-foreground">Név később...</span>}
                      </CardTitle>
                      <CardDescription>
                        {a.Email}
                      </CardDescription>
                    </div>
                    <Badge variant={a.HasUserAccount ? "default" : "secondary"}>
                      {a.HasUserAccount ? (
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
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Link to={`/athletes/${a.Id}`}>
                      <Users className="w-4 h-4 mr-2" />
                      Részletek
                    </Link>
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    onClick={() => handleDeleteAthlete(a.Id)}
                    disabled={deletingAthleteId === a.Id}
                  >
                    {deletingAthleteId === a.Id
                      ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      : <Trash2 className="w-4 h-4 mr-2" />
                    }
                    Törlés
                  </Button>
                </CardContent>

              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
