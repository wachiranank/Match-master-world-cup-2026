-- ============================================================
-- Atomic increment for profile total_points
-- Called by the scoring API to avoid read-modify-write races
-- ============================================================
create or replace function public.increment_profile_points(
  p_user_id uuid,
  p_delta   integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set    total_points = total_points + p_delta,
         updated_at   = now()
  where  id = p_user_id;
end;
$$;
