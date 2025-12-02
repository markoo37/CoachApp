import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { getAthleteWellness, WellnessCheck } from "../api/wellness";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

interface AthleteDetails {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  weight?: number;
  height?: number;
  hasUserAccount: boolean;
}

export default function AthleteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const athleteId = Number(id);

  const [athlete, setAthlete] = useState<AthleteDetails | null>(null);
  const [wellness, setWellness] = useState<WellnessCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) sportoló alapadatok
        const athleteRes = await api.get(`/athletes/${athleteId}`);
        const a = athleteRes.data;

        setAthlete({
          id: a.id ?? a.Id,
          firstName: a.firstName ?? a.FirstName,
          lastName: a.lastName ?? a.LastName,
          email: a.email ?? a.Email,
          weight: a.weight ?? a.Weight,
          height: a.height ?? a.Height,
          hasUserAccount: a.hasUserAccount ?? a.HasUserAccount,
        });

        // 2) wellness history (utolsó X nap)
        const w = await getAthleteWellness(athleteId, days);
        setWellness(w);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Nem sikerült betölteni a sportoló adatait.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [athleteId, days]);

  const fullName =
    (athlete?.firstName || athlete?.lastName)
      ? `${athlete?.firstName ?? ""} ${athlete?.lastName ?? ""}`.trim()
      : "Ismeretlen név";

  const avg = (key: keyof WellnessCheck) => {
    if (!wellness.length) return "-";
    const sum = wellness.reduce((acc, w) => acc + (w[key] as number), 0);
    return (sum / wellness.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
        <Button asChild variant="outline" className="mb-4">
          <Link to="/athletes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a sportolókhoz
          </Link>
        </Button>
        <p className="text-destructive">{error || "A sportoló nem található."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button asChild variant="outline">
          <Link to="/athletes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a sportolókhoz
          </Link>
        </Button>

        {/* Alapadatok kártya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <CardDescription>{athlete.email || "Nincs e-mail megadva"}</CardDescription>
            </div>
            <Badge variant={athlete.hasUserAccount ? "default" : "secondary"}>
              {athlete.hasUserAccount ? "App felhasználó" : "Még nincs app fiókja"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Magasság</p>
              <p>{athlete.height ? `${athlete.height} cm` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Testsúly</p>
              <p>{athlete.weight ? `${athlete.weight} kg` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Wellness adatok</p>
              <p>{wellness.length} mérés az utolsó {days} napban</p>
            </div>
          </CardContent>
        </Card>

        {/* Összefoglaló statisztika */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Wellness összefoglaló</CardTitle>
              <CardDescription>Utolsó {days} nap átlaga</CardDescription>
            </div>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={7}>7 nap</option>
              <option value={14}>14 nap</option>
              <option value={30}>30 nap</option>
            </select>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryTile label="Fáradtság" value={avg("Fatigue")} />
            <SummaryTile label="Alvás" value={avg("SleepQuality")} />
            <SummaryTile label="Izomláz" value={avg("MuscleSoreness")} />
            <SummaryTile label="Stressz" value={avg("Stress")} />
            <SummaryTile label="Hangulat" value={avg("Mood")} />
          </CardContent>
        </Card>

        {/* Részletes lista */}
        <Card>
          <CardHeader>
            <CardTitle>Részletes wellness adatok</CardTitle>
            <CardDescription>Időrendben visszafelé</CardDescription>
          </CardHeader>
          <CardContent>
            {wellness.length === 0 ? (
              <p className="text-muted-foreground">
                Nincs elérhető wellness adat az utolsó {days} napban.
              </p>
            ) : (
              <div className="space-y-3">
                {wellness.map(w => (
                  <div
                    key={w.Id}
                    className="border rounded-lg px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(w.Date).toLocaleDateString("hu-HU", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </p>
                      {w.Comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Megjegyzés: {w.Comment}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                      <Badge variant="outline">Fár: {w.Fatigue}/10</Badge>
                      <Badge variant="outline">Alv: {w.SleepQuality}/10</Badge>
                      <Badge variant="outline">Izom: {w.MuscleSoreness}/10</Badge>
                      <Badge variant="outline">Stressz: {w.Stress}/10</Badge>
                      <Badge variant="outline">Hang: {w.Mood}/10</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg px-3 py-2">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
