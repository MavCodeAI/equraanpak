
-- Simple user profiles with name + 4-char code (no auth needed)
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin_code TEXT NOT NULL CHECK (char_length(pin_code) = 4),
  bookmarks JSONB DEFAULT '[]'::jsonb,
  progress JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT NULL,
  reading_time JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, pin_code)
);

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Anyone can create an account (signup)
CREATE POLICY "Anyone can create account"
  ON public.app_users FOR INSERT
  WITH CHECK (true);

-- Anyone can select (login check) - we filter by name+pin in app code
CREATE POLICY "Anyone can read by name and pin"
  ON public.app_users FOR SELECT
  USING (true);

-- Users can update their own data (identified by id stored in localStorage)
CREATE POLICY "Users can update own data"
  ON public.app_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
