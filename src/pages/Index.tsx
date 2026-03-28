import { useState, useMemo } from "react";
import { useAqiData } from "@/hooks/useAqiData";
import { useIntroSequence } from "@/hooks/useIntroSequence";
import { useLanguage } from "@/contexts/LanguageContext";
import { StationData } from "@/lib/aqi";
import { WardFeature } from "@/hooks/useDelhiWards";
import { useDelhiWards } from "@/hooks/useDelhiWards";
import { Navbar } from "@/components/dashboard/Navbar";
import { MapView } from "@/components/dashboard/MapView";
import { CityOverviewTab } from "@/components/dashboard/CityOverviewTab";
import { CompareTab } from "@/components/dashboard/CompareTab";
import { WardDetailPanel } from "@/components/dashboard/WardDetailPanel";
import { HeroSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { FullScreenMap } from "@/components/dashboard/FullScreenMap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, GitCompareArrows, Map, BookOpen, Trophy } from "lucide-react";
import { DictionaryTab } from "@/components/dashboard/DictionaryTab";
import { WardRankings } from "@/components/dashboard/WardRankings";
import { motion, AnimatePresence } from "framer-motion";
import { useAmbientMusic } from "@/hooks/useAmbientMusic";
import { MusicControl } from "@/components/dashboard/MusicControl";

const Index = () => {
  const { stations, loading, error, lastUpdated, cityAqi, refresh } = useAqiData();
  const { wardsGeoJSON } = useDelhiWards();
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardFeature["properties"] | null>(null);
  const [activeTab, setActiveTab] = useState("ward");
  const { stage, introDone, skip, advanceToNext, replay } = useIntroSequence();
  const { t } = useLanguage();
  const [showFullMap, setShowFullMap] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const music = useAmbientMusic();

  const defaultWard = useMemo(() => {
    if (!wardsGeoJSON) return null;
    return wardsGeoJSON.features.find(f => f.properties.ward_no === 1)?.properties || wardsGeoJSON.features[0]?.properties || null;
  }, [wardsGeoJSON]);

  const displayWard = selectedWard || defaultWard;
  const effectiveStation = selectedStation || stations[0] || null;

  // When intro finishes (advanceToNext from stage 3), show full-screen map
  const handleIntroComplete = () => {
    advanceToNext();
    setShowFullMap(true);
  };

  const handleEnterDashboard = (ward?: WardFeature["properties"]) => {
    if (ward) {
      setSelectedWard(ward);
      setActiveTab("ward");
    }
    setShowFullMap(false);
    setDashboardReady(true);
    music.changeMode("dashboard");
  };

  const handleBackToMap = () => {
    setShowFullMap(true);
    setDashboardReady(false);
  };

  const handleReplay = () => {
    replay();
    setShowFullMap(false);
    setDashboardReady(false);
    music.changeMode("intro");
  };

  // For skip: go straight to full map
  const handleSkip = () => {
    skip();
    setShowFullMap(true);
  };

  const showDashboard = introDone && !showFullMap;

  return (
    <>
      <MusicControl
        isPlaying={music.isPlaying}
        volume={music.volume}
        onToggle={music.toggle}
        onVolumeChange={music.changeVolume}
      />
      <AnimatePresence>
        {!introDone && (
          <IntroSequence stage={stage} onSkip={handleSkip} onDelhiClick={handleIntroComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col"
          >
            <Navbar lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} onLogoClick={handleReplay} />
            <div className="flex-1 relative">
              <FullScreenMap
                stations={stations}
                cityAqi={cityAqi}
                onEnterDashboard={handleEnterDashboard}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDashboard ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="flex min-h-screen flex-col bg-background"
        style={{ pointerEvents: showDashboard ? "auto" : "none" }}
      >
        <Navbar lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} onLogoClick={handleReplay} onBackToMap={handleBackToMap} />

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && stations.length === 0 ? (
          <HeroSkeleton />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="shrink-0 border-b border-border">
              <div className="h-36 xs:h-40 sm:h-56 md:h-64 lg:h-72 xl:h-80">
                <MapView
                  stations={stations}
                  selectedStation={effectiveStation}
                  onSelectStation={(s) => {
                    setSelectedStation(s);
                    setSelectedWard(null);
                  }}
                  onWardSelect={(w) => {
                    setSelectedWard(w);
                    setActiveTab("ward");
                  }}
                  activeWard={displayWard}
                />
              </div>
            </div>

            <div className="min-w-0 w-full flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 flex-1">
                <div className="mx-2 mt-2 sm:mx-3 sm:mt-3">
                  <TabsList className="grid w-full grid-cols-5 bg-secondary/50 sm:inline-flex sm:w-fit">
                    <TabsTrigger value="ward" className="gap-1 px-1 py-1.5 font-mono text-[9px] sm:px-4 sm:py-2 sm:text-xs">
                      <Map className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">{t("tab.ward")}</span><span className="sm:hidden">Ward</span>
                    </TabsTrigger>
                    <TabsTrigger value="city" className="gap-1 px-1 py-1.5 font-mono text-[9px] sm:px-4 sm:py-2 sm:text-xs">
                      <BarChart3 className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">{t("tab.city")}</span><span className="sm:hidden">City</span>
                    </TabsTrigger>
                    <TabsTrigger value="rankings" className="gap-1 px-1 py-1.5 font-mono text-[9px] sm:px-4 sm:py-2 sm:text-xs">
                      <Trophy className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">{t("tab.rankings")}</span><span className="sm:hidden">Rank</span>
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="gap-1 px-1 py-1.5 font-mono text-[9px] sm:px-4 sm:py-2 sm:text-xs">
                      <GitCompareArrows className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">{t("tab.compare")}</span><span className="sm:hidden">Cmp</span>
                    </TabsTrigger>
                    <TabsTrigger value="dictionary" className="gap-1 px-1 py-1.5 font-mono text-[9px] sm:px-4 sm:py-2 sm:text-xs">
                      <BookOpen className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">{t("tab.dictionary")}</span><span className="sm:hidden">Dict</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="ward" className="mt-0 min-w-0 flex-1">
                  {displayWard ? (
                    <div className="min-w-0">
                      <WardDetailPanel ward={displayWard} onClose={() => { setSelectedWard(null); setActiveTab("city"); }} />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
                      Loading wards...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="city" className="mt-0 min-w-0 flex-1">
                  <CityOverviewTab stations={stations} cityAqi={cityAqi} />
                </TabsContent>

                <TabsContent value="rankings" className="mt-0 min-w-0 flex-1">
                  <WardRankings stations={stations} />
                </TabsContent>

                <TabsContent value="compare" className="mt-0 min-w-0 flex-1">
                  <CompareTab stations={stations} />
                </TabsContent>

                <TabsContent value="dictionary" className="mt-0 min-w-0 flex-1">
                  <DictionaryTab stations={stations} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Index;
