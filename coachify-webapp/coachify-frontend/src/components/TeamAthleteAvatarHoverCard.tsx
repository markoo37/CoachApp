import * as React from "react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

type IconLike = React.ComponentType<{ className?: string }>;

export type AthleteStatusBadge = {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: IconLike;
  label: string;
  className?: string;
  ringClass?: string;
};

export type TeamAthleteAvatarHoverCardProps = {
  athleteId: number;
  firstName?: string | null;
  lastName?: string | null;
  hasUserAccount: boolean;

  statusBadge: AthleteStatusBadge;
  averageWellnessIndex: number | null;
  lastWellnessDate?: string | null;
  lastWellnessIndex: number | null;
  complianceCount: number;
  complianceWindowDays: number;

  to: string;
  linkState?: unknown;

  openDelay?: number;
  closeDelay?: number;
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();

  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f[0].toUpperCase();
  if (l) return l[0].toUpperCase();
  return "?";
}

export function TeamAthleteAvatarHoverCard({
  firstName,
  lastName,
  hasUserAccount,
  statusBadge,
  averageWellnessIndex,
  lastWellnessDate,
  lastWellnessIndex,
  complianceCount,
  complianceWindowDays,
  to,
  linkState,
  openDelay = 120,
  closeDelay = 80,
}: TeamAthleteAvatarHoverCardProps) {
  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Név később...";

  const StatusIcon = statusBadge.icon;

  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <Link
          to={to}
          state={linkState}
          aria-label={fullName}
          className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:z-10"
        >
          <Avatar
            className={`h-12 w-12 ring-2 ring-offset-2 ring-offset-background transition-transform duration-200 ease-out will-change-transform group-hover:scale-105 group-focus-visible:scale-105 ${statusBadge.ringClass ?? ""}`}
          >
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </HoverCardTrigger>

      <HoverCardContent
        align="start"
        sideOffset={14}
        className="w-80"
      >
        <div className="flex justify-between gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{fullName}</div>
                <div className="text-xs text-muted-foreground">{hasUserAccount ? "Van fiók" : "Nincs fiók"}</div>
              </div>
              <Badge variant={statusBadge.variant} className={`shrink-0 gap-1 ${statusBadge.className ?? ""}`}>
                <StatusIcon className="h-3 w-3" />
                {statusBadge.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="text-muted-foreground">WI átlag</div>
              <div className="text-right font-medium">
                {averageWellnessIndex !== null ? averageWellnessIndex.toFixed(1) : "-"}
              </div>

              <div className="text-muted-foreground">Utolsó</div>
              <div className="text-right font-medium">
                {lastWellnessDate && lastWellnessIndex !== null
                  ? `${new Date(lastWellnessDate).toLocaleDateString("hu-HU")} (${lastWellnessIndex.toFixed(1)})`
                  : "-"}
              </div>

              <div className="text-muted-foreground">Compliance</div>
              <div className="text-right font-medium">
                {complianceCount}/{complianceWindowDays} nap
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}


