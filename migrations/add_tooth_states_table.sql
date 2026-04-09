-- Create tooth_states table
CREATE TABLE IF NOT EXISTS public.tooth_states (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  border_color VARCHAR(20),
  icon VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tooth_states ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.tooth_states
  FOR SELECT USING (true);

CREATE POLICY "Enable all access for admins and doctors" ON public.tooth_states
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE role IN ('admin', 'doctor')
    )
  );

-- Insert default states
INSERT INTO public.tooth_states (code, name, color, border_color, is_system, order_index) VALUES
('HEALTHY', 'Sain', '#FAFAFA', '#E5E7EB', true, 10),
('SELECTED', 'Sélectionné', '#BFDBFE', '#3B82F6', true, 20),
('CARIES', 'Carie', '#FECACA', '#EF4444', true, 30),
('EXTRACTED', 'Extraite', '#E5E7EB', '#9CA3AF', true, 40),
('IMPLANT', 'Implant', '#E0F2FE', '#0EA5E9', false, 50),
('CROWN', 'Couronne', '#FEF08A', '#EAB308', false, 60),
('ROOT_CANAL', 'Trait. Racine', '#E9D5FF', '#A855F7', false, 70),
('BRIDGE', 'Bridge', '#FBCFE8', '#EC4899', false, 80)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  border_color = EXCLUDED.border_color,
  is_system = EXCLUDED.is_system;
