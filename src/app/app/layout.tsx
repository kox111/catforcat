import TopBar from "@/components/TopBar";
import PageTransition from "@/components/PageTransition";
import CommandPaletteProvider from "@/components/CommandPaletteProvider";
import BreakReminder from "@/components/BreakReminder";
import ViewScaleProvider, { ViewScaleContainer } from "@/components/ViewScaleProvider";
import ZoomFAB from "@/components/ZoomFAB";
import Onboarding from "@/components/Onboarding";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewScaleProvider>
      <ViewScaleContainer>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <TopBar />
          <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </ViewScaleContainer>
      {/* Fixed-position overlays live OUTSIDE the scaled container
          so position:fixed works correctly */}
      <ZoomFAB />
      <CommandPaletteProvider />
      <BreakReminder />
      <Onboarding />
    </ViewScaleProvider>
  );
}
