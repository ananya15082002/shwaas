
CREATE TABLE public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'ward',
  ward_no INTEGER,
  ward_name TEXT,
  aqi_value INTEGER,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

CREATE INDEX idx_cache_key ON public.ai_analysis_cache(cache_key);
CREATE INDEX idx_expires_at ON public.ai_analysis_cache(expires_at);

ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of cached analysis"
ON public.ai_analysis_cache FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow edge functions to insert/update cache"
ON public.ai_analysis_cache FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
