import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AdventureZonesPage } from './pages/adventure-zones/AdventureZonesPage';
import { HabitMirrorPage } from './pages/habit-mirror/HabitMirrorPage';
import { HomePage } from './pages/home/HomePage';
import { OfflineMissionsPage } from './pages/offline-missions/OfflineMissionsPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { ParentDashboardPage } from './pages/parent-dashboard/ParentDashboardPage';
import { ReverseTutoringPage } from './pages/reverse-tutoring/ReverseTutoringPage';
import { RewardsPage } from './pages/rewards/RewardsPage';
import { ScannerPage } from './pages/scanner/ScannerPage';
import { SoundScavengerPage } from './pages/sound-scavenger/SoundScavengerPage';
import { VoiceCapsulesPage } from './pages/voice-capsules/VoiceCapsulesPage';
import { usePhygitalStore } from './store/usePhygitalStore';

function RequireSetup({ children }: { children: JSX.Element }) {
  const onboardingCompleted = usePhygitalStore((s) => s.onboardingCompleted);
  const childCount = usePhygitalStore((s) => s.children.length);
  if (!onboardingCompleted || childCount === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          element={
            <RequireSetup>
              <AppShell />
            </RequireSetup>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/zones" element={<AdventureZonesPage />} />
          <Route path="/zones/:zoneId" element={<AdventureZonesPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/reverse-tutoring" element={<ReverseTutoringPage />} />
          <Route path="/voice-capsules" element={<VoiceCapsulesPage />} />
          <Route path="/sound-scavenger" element={<SoundScavengerPage />} />
          <Route path="/offline-missions" element={<OfflineMissionsPage />} />
          <Route path="/habit-mirror" element={<HabitMirrorPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/parent" element={<ParentDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
