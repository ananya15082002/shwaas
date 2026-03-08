import { useState } from "react";
import { useAqiData } from "@/hooks/useAqiData";
import { useIntroSequence } from "@/hooks/useIntroSequence";
import { StationData } from "@/lib/aqi";
import { WardFeature } from "@/hooks/useDelhiWards";
import { Navbar } from "@/components/dashboard/Navbar";
import { MapView } from "@/components/dashboard/MapView";
import { StationIntelTab } from "@/components/dashboard/StationIntelTab";
import { CityOverviewTab } from "@/components/dashboard/CityOverviewTab";
import { CompareTab } from "@/components/dashboard/CompareTab";
import { WardDetailPanel } from "@/components/dashboard/WardDetailPanel";
import { HeroSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Brain, BarChart3, GitCompareArrows, Map, BookOpen } from "lucide-react";
import { DictionaryTab } from "@/components/dashboard/DictionaryTab";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { stations, loading, error, lastUpdated, cityAqi, refresh } = useAqiData();
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardFeature["properties"] | null>(null);
  const [activeTab, setActiveTab] = useState("intel");
  const { stage, introDone, skip } = useIntroSequence();

  // Auto-select first station if none selected
  const effectiveStation = selectedStation || stations[0] || null;

  return (
    <>
      {/* Intro overlay */}
      <AnimatePresence>
        {!introDone && (
          <IntroSequence stage={stage} onSkip={skip} />
        )}
      </AnimatePresence>

      {/* Dashboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="flex h-screen flex-col bg-background"
      >
        <Navbar lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} />

        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && stations.length === 0 ? (
          <HeroSkeleton />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Map */}
            <div className="hidden w-1/2 border-r border-border lg:block">
              <MapView
                stations={stations}
                selectedStation={effectiveStation}
                onSelectStation={(s) => {
                  setSelectedStation(s);
                  setSelectedWard(null);
                  setActiveTab("intel");
                }}
                onWardSelect={(w) => {
                  setSelectedWard(w);
                  setActiveTab("ward");
                }}
              />
            </div>

            {/* Right: Tabbed Content */}
            <div className="flex w-full flex-col lg:w-1/2">
              {/* Mobile map toggle */}
              <div className="block border-b border-border lg:hidden">
                <div className="h-48">
                  <MapView
                    stations={stations}
                    selectedStation={effectiveStation}
                    onSelectStation={(s) => {
                      setSelectedStation(s);
                      setSelectedWard(null);
                      setActiveTab("intel");
                    }}
                    onWardSelect={(w) => {
                      setSelectedWard(w);
                      setActiveTab("ward");
                    }}
                  />
                </div>
              </div>

              {/* Station list strip */}
              <div className="flex gap-2 overflow-x-auto border-b border-border bg-card/50 px-3 py-2">
                {stations.map((s) => {
                  const isActive = effectiveStation?.stationId === s.stationId;
                  return (
                    <button
                      key={s.stationId}
                      onClick={() => {
                        setSelectedStation(s);
                        setActiveTab("intel");
                      }}
                      className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      {s.name}
                      <span className="font-display font-bold">{s.aqi}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="mx-3 mt-3 w-fit bg-secondary/50">
                  <TabsTrigger value="intel" className="gap-1.5 font-mono text-[10px]">
                    <Brain className="h-3 w-3" /> STATION INTEL
                  </TabsTrigger>
                  <TabsTrigger value="city" className="gap-1.5 font-mono text-[10px]">
                    <BarChart3 className="h-3 w-3" /> CITY OVERVIEW
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="gap-1.5 font-mono text-[10px]">
                    <GitCompareArrows className="h-3 w-3" /> COMPARE
                  </TabsTrigger>
                  {selectedWard && (
                    <TabsTrigger value="ward" className="gap-1.5 font-mono text-[10px]">
                      <Map className="h-3 w-3" /> WARD
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="dictionary" className="gap-1.5 font-mono text-[10px]">
                    <BookOpen className="h-3 w-3" /> DICTIONARY
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="intel" className="flex-1 overflow-hidden">
                  {effectiveStation ? (
                    <StationIntelTab station={effectiveStation} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="font-mono text-xs text-muted-foreground">Select a station on the map</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="city" className="flex-1 overflow-hidden">
                  <CityOverviewTab stations={stations} cityAqi={cityAqi} />
                </TabsContent>

                <TabsContent value="compare" className="flex-1 overflow-hidden">
                  <CompareTab stations={stations} />
                </TabsContent>

                {selectedWard && (
                  <TabsContent value="ward" className="flex-1 overflow-hidden">
                    <WardDetailPanel ward={selectedWard} onClose={() => { setSelectedWard(null); setActiveTab("intel"); }} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Index;
