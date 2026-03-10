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
  const [showFullMap, setShowFullMap] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);

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
  };

  const handleReplay = () => {
    replay();
    setShowFullMap(false);
    setDashboardReady(false);
  };

  // For skip: go straight to full map
  const handleSkip = () => {
    skip();
    setShowFullMap(true);
  };

  const showDashboard = introDone && !showFullMap;

  return (
    <>
      <AnimatePresence>
        {!introDone && (
          <IntroSequence stage={stage} onSkip={handleSkip} onDelhiClick={handleIntroComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullMap && (
          <FullScreenMap
            stations={stations}
            cityAqi={cityAqi}
            onEnterDashboard={handleEnterDashboard}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDashboard ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="flex h-screen flex-col bg-background"
        style={{ pointerEvents: showDashboard ? "auto" : "none" }}
      >
        <Navbar lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} onLogoClick={handleReplay} />

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && stations.length === 0 ? (
          <HeroSkeleton />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden w-1/2 border-r border-border lg:block">
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

            <div className="flex w-full flex-col lg:w-1/2">
              <div className="block border-b border-border lg:hidden">
                <div className="h-48">
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="mx-3 mt-3 w-fit bg-secondary/50">
                  <TabsTrigger value="ward" className="gap-1.5 font-mono text-[10px]">
                    <Map className="h-3 w-3" /> {t("tab.ward")}
                  </TabsTrigger>
                  <TabsTrigger value="city" className="gap-1.5 font-mono text-[10px]">
                    <BarChart3 className="h-3 w-3" /> {t("tab.city")}
                  </TabsTrigger>
                  <TabsTrigger value="rankings" className="gap-1.5 font-mono text-[10px]">
                    <Trophy className="h-3 w-3" /> {t("tab.rankings")}
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="gap-1.5 font-mono text-[10px]">
                    <GitCompareArrows className="h-3 w-3" /> {t("tab.compare")}
                  </TabsTrigger>
                  <TabsTrigger value="dictionary" className="gap-1.5 font-mono text-[10px]">
                    <BookOpen className="h-3 w-3" /> {t("tab.dictionary")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ward" className="flex-1 overflow-hidden">
                  {displayWard ? (
                    <div className="relative flex-1 h-full">
                      <WardDetailPanel ward={displayWard} onClose={() => { setSelectedWard(null); setActiveTab("city"); }} />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground font-mono text-sm">
                      Loading wards...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="city" className="flex-1 overflow-hidden">
                  <CityOverviewTab stations={stations} cityAqi={cityAqi} />
                </TabsContent>

                <TabsContent value="rankings" className="flex-1 overflow-hidden">
                  <WardRankings stations={stations} />
                </TabsContent>

                <TabsContent value="compare" className="flex-1 overflow-hidden">
                  <CompareTab stations={stations} />
                </TabsContent>

                <TabsContent value="dictionary" className="flex-1 overflow-hidden">
                  <DictionaryTab />
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
