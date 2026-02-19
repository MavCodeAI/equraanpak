import React, { Suspense, lazy } from "react";
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

// Lazy load secondary pages for faster initial load
const SurahPage = lazy(() => import("./pages/SurahPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PageReadingPage = lazy(() => import("./pages/PageReadingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 30, // 30 min cache
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SettingsProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
              <BottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </SettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
