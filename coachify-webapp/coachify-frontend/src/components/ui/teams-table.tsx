import { useNavigate } from "react-router-dom";
import { Loader2, Users, Trash2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface Team {
  Id: number;
  Name: string;
  Athletes?: Array<{ Id: number }>;
}

interface TeamsTableProps {
  teams: Team[];
  deletingTeamId: number | null;
  onDeleteTeam: (teamId: number, name: string) => void;
}

export default function TeamsTable({
  teams,
  deletingTeamId,
  onDeleteTeam,
}: TeamsTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full max-w-1/3">Csapat neve</TableHead>
              <TableHead>Sportolók száma</TableHead>
              <TableHead>Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const athleteCount = team.Athletes?.length ?? 0;

              return (
                <TableRow
                  key={team.Id}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/teams/${team.Id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/teams/${team.Id}`);
                    }
                  }}
                >
                  <TableCell>
                    <div className="font-medium hover:text-primary transition-colors">{team.Name}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{athleteCount} sportoló</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteTeam(team.Id, team.Name)}
                        disabled={deletingTeamId === team.Id}
                      >
                        {deletingTeamId === team.Id ? (
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

