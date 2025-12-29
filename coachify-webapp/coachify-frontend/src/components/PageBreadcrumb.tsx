import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SlashIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemData {
  label: string;
  to?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItemData[];
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <SlashIcon className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : item.to ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Hook to determine breadcrumb items based on location state
export function useBreadcrumbItems(currentPageLabel: string) {
  const location = useLocation();
  const state = location.state as { from?: string; fromLabel?: string; teamId?: number; teamName?: string } | null;

  const items: BreadcrumbItemData[] = [
    { label: "Főoldal", to: "/dashboard" },
  ];

  // If we have state information about where we came from
  if (state?.from === "/athletes") {
    items.push({ label: "Sportolók", to: "/athletes" });
  } else if (state?.from === "/my-teams" || state?.from === "/teams") {
    items.push({ label: "Csapataim", to: "/my-teams" });
    if (state?.teamId && state?.teamName) {
      items.push({ 
        label: state.teamName, 
        to: `/teams/${state.teamId}` 
      });
    }
  } else {
    // Try to infer from pathname
    const pathname = location.pathname;
    if (pathname.includes("/athletes/")) {
      items.push({ label: "Sportolók", to: "/athletes" });
    } else if (pathname.includes("/teams/")) {
      items.push({ label: "Csapataim", to: "/my-teams" });
    }
  }

  // Add current page
  items.push({ label: currentPageLabel });

  return items;
}

