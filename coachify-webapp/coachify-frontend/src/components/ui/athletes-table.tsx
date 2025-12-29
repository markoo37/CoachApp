import { Link } from 'react-router-dom';
import { Loader2, Users, UserCheck, Trash2, Ruler, Weight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface Athlete {
  Id: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Weight?: number;
  Height?: number;
  HasUserAccount: boolean;
}

interface AthletesTableProps {
  athletes: Athlete[];
  wellnessData: Record<number, number>;
  deletingAthleteId: number | null;
  onDeleteClick: (athlete: Athlete) => void;
  getDetailsUrl?: (athleteId: number) => string;
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
  return hasAccount ? 'App felhasználó' : 'Még nincs app';
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

export default function AthletesTable({
  athletes,
  wellnessData,
  deletingAthleteId,
  onDeleteClick,
  getDetailsUrl = (id) => `/athletes/${id}`,
}: AthletesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full max-w-1/4">Név</TableHead>
              <TableHead>Státusz</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Magasság</TableHead>
              <TableHead>Testsúly</TableHead>
              <TableHead>Wellness Index</TableHead>
              <TableHead>Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.map((a) => {
              const initials = getInitials(a.FirstName, a.LastName, a.Email);
              const fullName = (a.FirstName || a.LastName)
                ? `${a.FirstName ?? ''} ${a.LastName ?? ''}`.trim()
                : 'Név később...';
              const role = getRole(a.HasUserAccount);
              const wellnessAverage = wellnessData[a.Id] || 0;
              
              return (
                <TableRow key={a.Id} className={!a.HasUserAccount ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{fullName}</span>
                          {a.HasUserAccount && (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                          {!a.HasUserAccount && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{a.Email || 'Nincs email'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={a.HasUserAccount ? 'default' : 'secondary'}>
                      {role}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{a.Email || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{a.Height ? `${a.Height} cm` : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span>{a.Weight ? `${a.Weight} kg` : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${wellnessAverage}%`,
                            background: getWellnessBarColor(wellnessAverage)
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8">{wellnessAverage}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link 
                          to={getDetailsUrl(a.Id)}
                          state={{ from: "/athletes" }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Részletek
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteClick(a)}
                        disabled={deletingAthleteId === a.Id}
                      >
                        {deletingAthleteId === a.Id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

