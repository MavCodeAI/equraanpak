import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { UserProvider } from "@/contexts/UserContext";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import SurahPage from "./pages/SurahPage";
import BookmarksPage from "./pages/BookmarksPage";
import SchedulePage from "./pages/SchedulePage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import PageReadingPage from "./pages/PageReadingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SettingsProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/surah/:id" element={<SurahPage />} />
                <Route path="/page-reading" element={<PageReadingPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </SettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
