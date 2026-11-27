# PHYGITAL — Architecture Overview

## 1. Core Philosophy
**Learn through play. Discover through action. Grow in the real world.**
PHYGITAL uses a warm storybook PWA experience to spark real-world experiments, outdoor observation, intergenerational family storytelling, English literacy, and screen-free play.

## 2. Frontend Architecture (`src/`)
- **Framework**: React 18 + TypeScript (`strict: true`) + Vite + Tailwind CSS + Framer Motion.
- **3D Companion Engine**: React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`) rendering stylized articulated Leo & Maya characters (`src/components/characters/Companion3DStage.tsx`), paired with an automatic WebGL-detection + manual toggle 2D SVG Storybook fallback (`Companion2DFallback.tsx`).
- **State Management**: Zustand (`src/store/usePhygitalStore.ts`) with persistent local storage and dual-mode cloud sync when Supabase credentials are configured.
- **Validation & Safety**: Zod schemas (`src/utils/schemas.ts`), strict English-only directives (`src/utils/englishGuard.ts`), and server-side authoritative XP rules (`src/utils/rewards.ts`).

## 3. Native Mobile Integration Path (React Native / Expo)
- **Offline Sun-Battery**: Currently calculates timestamp deltas (`startedAt` vs `targetCompletedAt`) in PWA. Native mobile integration can attach Expo `AppState` / iOS Family Controls / Android UsageStats listeners while keeping the same `OfflineMissionSession` contract.
- **AR Habit Mirror**: Web MVP uses `getUserMedia` + animated AR creature overlays. Native builds can swap the viewport component for ARKit (`expo-arkit`) / ARCore depth overlays without modifying quest or reward logic.
