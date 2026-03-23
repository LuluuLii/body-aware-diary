CREATE TYPE body_part AS ENUM (
  'head', 'neck',
  'left_shoulder', 'right_shoulder', 'left_chest', 'right_chest',
  'left_upper_arm', 'right_upper_arm', 'left_forearm', 'right_forearm',
  'left_hand', 'right_hand', 'abdomen_upper', 'abdomen_lower',
  'upper_back', 'middle_back', 'lower_back',
  'left_oblique', 'right_oblique', 'left_hip', 'right_hip',
  'left_glute', 'right_glute', 'left_quadricep', 'right_quadricep',
  'left_hamstring', 'right_hamstring', 'left_inner_thigh', 'right_inner_thigh',
  'left_knee', 'right_knee', 'left_calf', 'right_calf',
  'left_shin', 'right_shin', 'left_ankle', 'right_ankle',
  'left_foot', 'right_foot'
);

CREATE TYPE sensation_type AS ENUM (
  'soreness', 'tightness', 'pain', 'fatigue', 'pump', 'stretch',
  'numbness', 'warmth', 'weakness', 'strength', 'relaxation', 'other'
);

CREATE TABLE public.body_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_part body_part NOT NULL,
  sensation sensation_type NOT NULL DEFAULT 'soreness',
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  note TEXT,
  side TEXT CHECK (side IN ('front', 'back', 'both')) DEFAULT 'front',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_annotations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_body_annotations_entry_id ON public.body_annotations(entry_id);
CREATE INDEX idx_body_annotations_user_id ON public.body_annotations(user_id);
CREATE INDEX idx_body_annotations_body_part ON public.body_annotations(body_part);
