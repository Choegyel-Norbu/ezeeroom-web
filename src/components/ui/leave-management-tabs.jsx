import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Users, Settings, Clock } from "lucide-react";

function LeaveManagementTabs({
  activeTab,
  setActiveTab,
  canViewBasicLeaves,
  canViewPolicies,
  isStaffOrFrontdesk,
  enhancedLeaves,
  roles,
}) {
  const isManager = roles?.includes("MANAGER");
  const showBasicLeavesTab = canViewBasicLeaves && !isManager;

  const tabs = [
    showBasicLeavesTab && {
      id: "requests",
      label: isStaffOrFrontdesk ? "My Leave Requests" : "Leave Requests",
      icon: Calendar,
    },
    !isStaffOrFrontdesk && enhancedLeaves.length > 0 && {
      id: "enhanced",
      label: "Employee Leave Requests",
      icon: Clock,
    },
    !isStaffOrFrontdesk && {
      id: "staff",
      label: "Employee Leave Overview",
      icon: Users,
    },
    canViewPolicies && {
      id: "policies",
      label: "Hotel Leave Policies",
      icon: Settings,
    },
  ].filter(Boolean);

  return (
    <div className="mb-2">
      <ScrollArea>
        <div className="flex rounded-md border border-neutral-200 overflow-hidden h-9 w-fit">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 text-[12px] font-medium whitespace-nowrap transition-colors ${
                  i > 0 ? "border-l border-neutral-200" : ""
                } ${
                  isActive
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export { LeaveManagementTabs };
