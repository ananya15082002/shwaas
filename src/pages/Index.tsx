import { useState } from "react";
import { useAqiData } from "@/hooks/useAqiData";
import { StationData } from "@/lib/aqi";
import { Navbar } from "@/components/dashboard/Navbar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { StationCard } from "@/components/dashboard/StationCard";
import { StationDetail } from "@/components/dashboard/StationDetail";
import { HeroSkeleton, StationGridSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";

const Index = () => {
  const { stations, loading, error, lastUpdated, cityAqi, refresh } = useAqiData();
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar lastUpdated={lastUpdated} onRefresh={refresh} loading={loading} />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          {loading && stations.length === 0 ? (
            <HeroSkeleton />
          ) : (
            <HeroSection aqi={cityAqi} stationCount={stations.length} />
          )}

          <main className="container mx-auto px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xs font-bold tracking-widest text-primary">
                MONITORING STATIONS
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {stations.length} ACTIVE NODES
              </span>
            </div>

            {loading && stations.length === 0 ? (
              <StationGridSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stations.map((station, i) => (
                  <StationCard
                    key={station.stationId}
                    station={station}
                    onClick={() => setSelectedStation(station)}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* AQI Legend */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Good", color: "#00e676" },
                { label: "Moderate", color: "#ffeb3b" },
                { label: "Sensitive", color: "#ff9800" },
                { label: "Unhealthy", color: "#f44336" },
                { label: "Very Unhealthy", color: "#9c27b0" },
                { label: "Hazardous", color: "#7e0023" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      <StationDetail
        station={selectedStation}
        open={!!selectedStation}
        onClose={() => setSelectedStation(null)}
      />

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="font-mono text-[10px] text-muted-foreground">
          DATA SOURCE: WAQI.INFO • DELHI AIR QUALITY INTELLIGENCE SYSTEM • REAL-TIME MONITORING
        </p>
      </footer>
    </div>
  );
};

export default Index;
