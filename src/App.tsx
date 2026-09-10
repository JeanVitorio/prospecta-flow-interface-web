import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppStoreProvider } from "@/store/AppStore";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { SearchProvider } from "@/context/SearchContext";
import Dashboard from "./pages/Dashboard";
import Bots from "./pages/Bots";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SalesFunnel from "./pages/SalesFunnel";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound.tsx";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

function Protected({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  return <Dashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <NotificationsProvider>
        <AuthProvider>
          <AppStoreProvider>
            <SearchProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<Protected><AppLayout /></Protected>}>
                      <Route path="/" element={<HomeRoute />} />
                      <Route path="/bots" element={<Bots />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/sales" element={<SalesFunnel />} />
                      <Route path="/leads" element={<Leads />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </SearchProvider>
          </AppStoreProvider>
        </AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
