-- Migration smoke test: institution seed, Auth trigger, role bootstrap, directory,
-- private messaging, room creation, ticket categories and profile row isolation.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

INSERT INTO public.colleges (name, code, email_domain)
VALUES ('CampOS Test College', 'CAMPTEST', 'campus.example.test');

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
('00000000-0000-4000-8000-000000000001', 'admin@campus.example.test', '{"display_name":"Test Admin","college_code":"CAMPTEST"}'),
('00000000-0000-4000-8000-000000000002', 'student@campus.example.test', '{"display_name":"Test Student","college_code":"CAMPTEST"}');

DO $$
BEGIN
  IF (SELECT count(*) FROM public.profiles) <> 2 THEN
    RAISE EXCEPTION 'Auth signup trigger did not create both profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE campus_id IS NULL OR account_status <> 'pending_verification') THEN
    RAISE EXCEPTION 'New profiles must receive Campus IDs and remain pending';
  END IF;
  IF (SELECT count(*) FROM public.ticket_categories) <> 8 THEN
    RAISE EXCEPTION 'College ticket categories were not seeded';
  END IF;
END;
$$;

UPDATE public.profiles SET account_status = 'active'
WHERE id = '00000000-0000-4000-8000-000000000001';

INSERT INTO public.role_assignments (user_id, role, scope_type, scope_id, granted_by)
SELECT id, 'college_admin', 'college', college_id, id
FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000001';

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);

DO $$
DECLARE
  v_room_id uuid;
  v_conversation_id uuid;
  v_report_id uuid;
  v_claim_id uuid;
  v_event_id uuid;
BEGIN
  IF (SELECT count(*) FROM public.search_campus_directory('Student')) <> 0 THEN
    RAISE EXCEPTION 'Campus directory exposed a pending student';
  END IF;

  IF (SELECT count(*) FROM public.list_pending_campus_users()) <> 1 THEN
    RAISE EXCEPTION 'Admin verification queue did not return the pending student';
  END IF;

  IF NOT public.approve_campus_user('00000000-0000-4000-8000-000000000002') THEN
    RAISE EXCEPTION 'Admin approval RPC did not approve the student';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000002' AND account_status = 'active') THEN
    RAISE EXCEPTION 'Approved student is not active';
  END IF;

  IF (SELECT count(*) FROM public.search_campus_directory('Student')) <> 1 THEN
    RAISE EXCEPTION 'Campus directory did not return the approved student';
  END IF;

  v_room_id := public.create_campus_room('Test Study Room', 'Migration smoke test', 'study_group', 'public');
  IF NOT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = v_room_id AND user_id = '00000000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION 'Room creator was not automatically enrolled';
  END IF;

  v_conversation_id := public.create_direct_conversation('00000000-0000-4000-8000-000000000002');
  IF (SELECT count(*) FROM public.conversation_members WHERE conversation_id = v_conversation_id) <> 2 THEN
    RAISE EXCEPTION 'Direct conversation did not create both participants';
  END IF;


  IF (SELECT count(*) FROM public.list_my_conversations()) <> 1 THEN
    RAISE EXCEPTION 'Conversation list RPC did not return the new conversation';
  END IF;

  INSERT INTO public.item_reports (
    college_id, report_type, title, description, category, location, date, reporter_id, status
  )
  SELECT college_id, 'found', 'Blue notebook', 'Found near the library entrance', 'Books', 'Library', '2026-10-31', id, 'open'
  FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000001'
  RETURNING id INTO v_report_id;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
  v_claim_id := public.claim_lost_found_item(v_report_id, 'The inside cover has my initials and a blue library stamp.');
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);

  IF (SELECT count(*) FROM public.list_my_item_claims()) <> 1 THEN
    RAISE EXCEPTION 'Reporter could not see the private ownership claim';
  END IF;
  PERFORM public.review_item_claim(v_claim_id, 'verified');
  IF NOT EXISTS (SELECT 1 FROM public.item_reports WHERE id = v_report_id AND status = 'handed_over') THEN
    RAISE EXCEPTION 'Verified item claim did not resolve the Lost and Found report';
  END IF;

  INSERT INTO public.events (college_id, title, description, location, start_date, end_date, max_capacity, organizer_id, status)
  SELECT college_id, 'Test Campus Event', 'Registration capacity test', 'Auditorium',
    now() + interval '7 days', now() + interval '7 days 2 hours', 1, id, 'published'
  FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000001'
  RETURNING id INTO v_event_id;

  IF public.register_for_campus_event(v_event_id) <> 'registered' THEN
    RAISE EXCEPTION 'First event registration was not confirmed';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);
  IF public.register_for_campus_event(v_event_id) <> 'waitlisted' THEN
    RAISE EXCEPTION 'Event capacity did not place the second user on the waitlist';
  END IF;

END;
$$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);
DO $
BEGIN
  IF (SELECT count(*) FROM public.profiles) <> 1 THEN
    RAISE EXCEPTION 'Profile RLS did not isolate the authenticated user';
  END IF;
END;
$;
RESET ROLE;
