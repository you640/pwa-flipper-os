import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Kanban, Calculator, Radar, Users, Settings, Sparkles } from "lucide-react";
import { InstallPWA } from "./InstallPWA";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const { t } = useTranslation();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const items = [
    { title: t("sidebar.overview"), url: "/", icon: LayoutDashboard },
    { title: t("sidebar.portfolio"), url: "/portfolio", icon: Kanban },
    { title: t("sidebar.valuation"), url: "/valuation", icon: Calculator },
    { title: t("sidebar.market"), url: "/market", icon: Radar },
    { title: t("sidebar.crm"), url: "/crm", icon: Users },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                {t("sidebar.brand")}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("sidebar.commandOS")}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {t("sidebar.workspace")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        end
                        className="relative flex items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="!bg-sidebar-accent !text-sidebar-foreground font-medium"
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-primary shadow-glow" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 gap-2">
        <InstallPWA />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <NavLink
            to="/settings"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>{t("sidebar.settings")}</span>}
          </NavLink>
          {!collapsed && <span className="text-[10px] tracking-wider">v0.1.0</span>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
