-- Optional label for instruction links (students see this text; URL stays in href).
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS instruction_link_label TEXT;

-- Link module entries to an assignment so students open the assignment detail view from modules.
ALTER TABLE public.module_items DROP CONSTRAINT IF EXISTS module_items_type_check;

ALTER TABLE public.module_items ADD CONSTRAINT module_items_type_check CHECK (
  type IN ('pdf', 'video', 'link', 'text', 'image', 'assignment')
);

ALTER TABLE public.module_items
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS module_items_assignment_id_idx ON public.module_items(assignment_id);
