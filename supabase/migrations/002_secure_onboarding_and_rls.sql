-- CampOS migration 002: secure onboarding and fail-closed row access.
-- Apply only after 001_initial_schema.sql. Review the institution seed data before enabling registrations.

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;

CREATE OR REPLACE FUNCTION app_private.current_college_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.college_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_private.is_active_college_member(p_college_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.college_id = p_college_id
      AND p.account_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION app_private.has_college_role(p_college_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.role_assignments ra ON ra.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.college_id = p_college_id
      AND p.account_status = 'active'
      AND ra.scope_type = 'college'
      AND ra.scope_id = p_college_id
      AND ra.role = ANY(p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_room_member(p_room_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members rm
    JOIN public.rooms r ON r.id = rm.room_id
    JOIN public.profiles p ON p.id = rm.user_id
    WHERE rm.room_id = p_room_id
      AND rm.user_id = auth.uid()
      AND p.account_status = 'active'
      AND p.college_id = r.college_id
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = auth.uid()
      AND p.account_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION app_private.can_read_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = p_ticket_id
      AND app_private.is_active_college_member(t.college_id)
      AND (
        t.requester_id = auth.uid()
        OR t.assigned_staff_id = auth.uid()
        OR app_private.has_college_role(t.college_id, ARRAY['support_staff','department_admin','college_admin','super_admin'])
      )
  );
$$;

CREATE OR REPLACE FUNCTION app_private.bootstrap_auth_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_college_id uuid;
  v_display_name text;
  v_college_code text;
BEGIN
  v_college_code := upper(trim(coalesce(NEW.raw_user_meta_data ->> 'college_code', '')));
  v_display_name := trim(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''));

  IF v_college_code = '' OR v_display_name = '' OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Registration requires a college code, full name and email address';
  END IF;

  SELECT c.id INTO v_college_id
  FROM public.colleges c
  WHERE upper(c.code) = v_college_code
    AND lower(c.email_domain) = lower(split_part(NEW.email, '@', 2))
  LIMIT 1;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'College code or college email domain is not recognized';
  END IF;

  INSERT INTO public.profiles (
    id, college_id, display_name, email, account_status
  ) VALUES (
    NEW.id, v_college_id, v_display_name, lower(NEW.email), 'pending_verification'
  );

  -- The trigger, not the browser, assigns the initial least-privilege student role.
  INSERT INTO public.role_assignments (
    user_id, role, scope_type, scope_id, granted_by
  ) VALUES (
    NEW.id, 'student', 'college', v_college_id, NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_camp_os ON auth.users;
CREATE TRIGGER on_auth_user_created_camp_os
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION app_private.bootstrap_auth_user();

REVOKE ALL ON FUNCTION app_private.current_college_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_active_college_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.has_college_role(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_room_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_conversation_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.can_read_ticket(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.current_college_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_active_college_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_college_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_room_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_conversation_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_read_ticket(uuid) TO authenticated;

-- Enable RLS on every application table, not only the original 12 tables.
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Remove the permissive first-pass policies before replacing them.
DROP POLICY IF EXISTS "Profiles are viewable by college members" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Rooms are viewable by college members" ON public.rooms;
DROP POLICY IF EXISTS "Users can see their room memberships" ON public.room_members;
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation members can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Approved resources are viewable" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can upload resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Announcements are viewable" ON public.announcements;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Published events are viewable" ON public.events;
DROP POLICY IF EXISTS "Item reports are viewable" ON public.item_reports;
DROP POLICY IF EXISTS "Users can create item reports" ON public.item_reports;

-- Institution directory: authenticated active members see only their own college.
CREATE POLICY college_read ON public.colleges FOR SELECT TO authenticated
USING (id = app_private.current_college_id() AND app_private.is_active_college_member(id));
CREATE POLICY departments_read ON public.departments FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));
CREATE POLICY programs_read ON public.programs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.departments d WHERE d.id = department_id AND d.college_id = app_private.current_college_id()));
CREATE POLICY academic_years_read ON public.academic_years FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));
CREATE POLICY semesters_read ON public.semesters FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.academic_years ay WHERE ay.id = academic_year_id AND ay.college_id = app_private.current_college_id()));
CREATE POLICY sections_read ON public.sections FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.programs pr JOIN public.departments d ON d.id = pr.department_id WHERE pr.id = program_id AND d.college_id = app_private.current_college_id()));
CREATE POLICY subjects_read ON public.subjects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.departments d WHERE d.id = department_id AND d.college_id = app_private.current_college_id()));
CREATE POLICY classrooms_read ON public.classrooms FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));

-- Profiles are private by default. Public campus directory/search will use a safe RPC/view later.
CREATE POLICY profiles_read_self ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, interests, skills, bio, privacy_settings)
ON public.profiles TO authenticated;
CREATE POLICY role_assignments_read_self ON public.role_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Rooms and room membership.
CREATE POLICY rooms_read_scoped ON public.rooms FOR SELECT TO authenticated
USING (
  college_id = app_private.current_college_id()
  AND app_private.is_active_college_member(college_id)
  AND (visibility = 'public' OR app_private.is_room_member(id))
);
CREATE POLICY rooms_create_limited ON public.rooms FOR INSERT TO authenticated
WITH CHECK (
  college_id = app_private.current_college_id()
  AND created_by = auth.uid()
  AND app_private.is_active_college_member(college_id)
  AND type IN ('interest_community','study_group')
);
CREATE POLICY room_members_read_scoped ON public.room_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.is_room_member(room_id));
CREATE POLICY room_members_join_public ON public.room_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_id AND r.college_id = app_private.current_college_id()
      AND r.visibility = 'public' AND app_private.is_active_college_member(r.college_id)
  )
);
CREATE POLICY room_members_leave_self ON public.room_members FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Messages are visible and writable only to members of the referenced room/conversation.
CREATE POLICY messages_read_members ON public.messages FOR SELECT TO authenticated
USING (
  (room_id IS NOT NULL AND app_private.is_room_member(room_id))
  OR (conversation_id IS NOT NULL AND app_private.is_conversation_member(conversation_id))
);
CREATE POLICY messages_send_members ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    (room_id IS NOT NULL AND conversation_id IS NULL AND app_private.is_room_member(room_id))
    OR (conversation_id IS NOT NULL AND room_id IS NULL AND app_private.is_conversation_member(conversation_id))
  )
);
CREATE POLICY messages_edit_own ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid() AND (
  (room_id IS NOT NULL AND app_private.is_room_member(room_id))
  OR (conversation_id IS NOT NULL AND app_private.is_conversation_member(conversation_id))
))
WITH CHECK (sender_id = auth.uid());

CREATE POLICY message_reactions_read ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id));
CREATE POLICY message_reactions_insert ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id));
CREATE POLICY message_reactions_delete ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY message_attachments_read ON public.message_attachments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id));
CREATE POLICY message_attachments_insert ON public.message_attachments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.sender_id = auth.uid()));

-- Direct conversations. Membership rows cannot be fabricated to add arbitrary users.
CREATE POLICY conversations_read_members ON public.conversations FOR SELECT TO authenticated
USING (app_private.is_conversation_member(id));
CREATE POLICY conversations_create_self ON public.conversations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY conversation_members_read ON public.conversation_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.is_conversation_member(conversation_id));
CREATE POLICY conversation_members_create_self ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
);
CREATE POLICY message_requests_read_participants ON public.message_requests FOR SELECT TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY message_requests_create_self ON public.message_requests FOR INSERT TO authenticated
WITH CHECK (
  from_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = to_user_id AND p.college_id = app_private.current_college_id()
      AND p.account_status = 'active'
  )
);
CREATE POLICY user_blocks_read_self ON public.user_blocks FOR SELECT TO authenticated
USING (blocker_id = auth.uid());
CREATE POLICY user_blocks_create_self ON public.user_blocks FOR INSERT TO authenticated
WITH CHECK (blocker_id = auth.uid() AND blocked_id <> auth.uid());
CREATE POLICY user_blocks_delete_self ON public.user_blocks FOR DELETE TO authenticated
USING (blocker_id = auth.uid());

-- Academic resources and bookmarks.
CREATE POLICY resources_read_approved_college ON public.resources FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND status = 'approved' AND app_private.is_active_college_member(college_id));
CREATE POLICY resources_upload_pending ON public.resources FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() AND college_id = app_private.current_college_id() AND status = 'pending_review');
CREATE POLICY resource_bookmarks_read_self ON public.resource_bookmarks FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY resource_bookmarks_create_self ON public.resource_bookmarks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.resources r WHERE r.id = resource_id AND r.college_id = app_private.current_college_id() AND r.status = 'approved'
));
CREATE POLICY resource_bookmarks_delete_self ON public.resource_bookmarks FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Lost & Found.
CREATE POLICY item_reports_read_college ON public.item_reports FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id) AND status NOT IN ('closed','expired'));
CREATE POLICY item_reports_create_self ON public.item_reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid() AND college_id = app_private.current_college_id() AND status = 'open');
CREATE POLICY item_claims_read_parties ON public.item_claims FOR SELECT TO authenticated
USING (claimant_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.item_reports ir WHERE ir.id = report_id AND ir.reporter_id = auth.uid()
));
CREATE POLICY item_claims_create_self ON public.item_claims FOR INSERT TO authenticated
WITH CHECK (claimant_id = auth.uid() AND status = 'pending' AND EXISTS (
  SELECT 1 FROM public.item_reports ir WHERE ir.id = report_id AND ir.college_id = app_private.current_college_id() AND ir.status = 'open'
));

-- Request desk.
CREATE POLICY ticket_categories_read_college ON public.ticket_categories FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND is_active AND app_private.is_active_college_member(college_id));
CREATE POLICY tickets_read_authorized ON public.tickets FOR SELECT TO authenticated
USING (app_private.can_read_ticket(id));
CREATE POLICY tickets_create_self ON public.tickets FOR INSERT TO authenticated
WITH CHECK (
  requester_id = auth.uid() AND college_id = app_private.current_college_id()
  AND status = 'submitted' AND app_private.is_active_college_member(college_id)
);
CREATE POLICY tickets_update_staff ON public.tickets FOR UPDATE TO authenticated
USING (assigned_staff_id = auth.uid() OR app_private.has_college_role(college_id, ARRAY['support_staff','department_admin','college_admin','super_admin']))
WITH CHECK (assigned_staff_id = auth.uid() OR app_private.has_college_role(college_id, ARRAY['support_staff','department_admin','college_admin','super_admin']));
CREATE POLICY ticket_comments_read_authorized ON public.ticket_comments FOR SELECT TO authenticated
USING (app_private.can_read_ticket(ticket_id) AND (
  NOT is_internal OR EXISTS (
    SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
      AND app_private.has_college_role(t.college_id, ARRAY['support_staff','department_admin','college_admin','super_admin'])
  )
));
CREATE POLICY ticket_comments_create_authorized ON public.ticket_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND app_private.can_read_ticket(ticket_id) AND (
  NOT is_internal OR EXISTS (
    SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
      AND app_private.has_college_role(t.college_id, ARRAY['support_staff','department_admin','college_admin','super_admin'])
  )
));

-- Official announcements and campus events.
CREATE POLICY announcements_read_college ON public.announcements FOR SELECT TO authenticated
USING (
  college_id = app_private.current_college_id()
  AND app_private.is_active_college_member(college_id)
  AND published_at <= now() AND (expires_at IS NULL OR expires_at > now())
);
CREATE POLICY announcements_create_authorized ON public.announcements FOR INSERT TO authenticated
WITH CHECK (
  published_by = auth.uid() AND college_id = app_private.current_college_id()
  AND app_private.has_college_role(college_id, ARRAY['faculty','department_admin','college_admin','super_admin'])
);
CREATE POLICY events_read_published_college ON public.events FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND status = 'published' AND app_private.is_active_college_member(college_id));
CREATE POLICY events_create_authorized ON public.events FOR INSERT TO authenticated
WITH CHECK (
  organizer_id = auth.uid() AND college_id = app_private.current_college_id()
  AND app_private.has_college_role(college_id, ARRAY['faculty','club_moderator','department_admin','college_admin','super_admin'])
);
CREATE POLICY event_registrations_read_self ON public.event_registrations FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY event_registrations_create_self ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = event_id AND e.college_id = app_private.current_college_id() AND e.status = 'published'
));
CREATE POLICY event_registrations_delete_self ON public.event_registrations FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Clubs, marketplace and study groups.
CREATE POLICY clubs_read_college ON public.clubs FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));
CREATE POLICY club_memberships_read_college ON public.club_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.college_id = app_private.current_college_id()));
CREATE POLICY club_memberships_join_self ON public.club_memberships FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.college_id = app_private.current_college_id()));
CREATE POLICY club_memberships_leave_self ON public.club_memberships FOR DELETE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY marketplace_read_college ON public.marketplace_listings FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND status = 'active' AND app_private.is_active_college_member(college_id));
CREATE POLICY marketplace_create_self ON public.marketplace_listings FOR INSERT TO authenticated
WITH CHECK (seller_id = auth.uid() AND college_id = app_private.current_college_id() AND status = 'active');
CREATE POLICY marketplace_update_self ON public.marketplace_listings FOR UPDATE TO authenticated
USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid() AND college_id = app_private.current_college_id());
CREATE POLICY study_groups_read_college ON public.study_groups FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));
CREATE POLICY study_groups_create_self ON public.study_groups FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND college_id = app_private.current_college_id());
CREATE POLICY study_group_members_read ON public.study_group_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.study_groups sg WHERE sg.id = group_id AND sg.college_id = app_private.current_college_id()));
CREATE POLICY study_group_members_join_self ON public.study_group_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.study_groups sg WHERE sg.id = group_id AND sg.college_id = app_private.current_college_id()));
CREATE POLICY study_group_members_leave_self ON public.study_group_members FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Timetable, notifications and feedback.
CREATE POLICY timetable_read_college ON public.timetable_entries FOR SELECT TO authenticated
USING (college_id = app_private.current_college_id() AND app_private.is_active_college_member(college_id));
CREATE POLICY notifications_read_self ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY notifications_update_self ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY feedback_create_self ON public.feedback_submissions FOR INSERT TO authenticated
WITH CHECK (
  (submitter_id = auth.uid() OR (is_anonymous AND submitter_id IS NULL))
  AND college_id = app_private.current_college_id()
);
CREATE POLICY feedback_read_self_or_admin ON public.feedback_submissions FOR SELECT TO authenticated
USING (
  submitter_id = auth.uid()
  OR app_private.has_college_role(college_id, ARRAY['department_admin','college_admin','super_admin'])
);
CREATE POLICY ai_usage_read_self ON public.ai_usage_records FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY audit_logs_read_admin ON public.audit_logs FOR SELECT TO authenticated
USING (app_private.has_college_role(
  (SELECT p.college_id FROM public.profiles p WHERE p.id = auth.uid()),
  ARRAY['college_admin','super_admin']
));
CREATE POLICY moderation_reports_read_authorized ON public.moderation_reports FOR SELECT TO authenticated
USING (
  reporter_id = auth.uid()
  OR app_private.has_college_role(
    (SELECT p.college_id FROM public.profiles p WHERE p.id = auth.uid()),
    ARRAY['club_moderator','department_admin','college_admin','super_admin']
  )
);
CREATE POLICY moderation_reports_create_self ON public.moderation_reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Intentionally no client-side INSERT/UPDATE/DELETE policies for role assignments,
-- audit logs, account approval, or moderation decisions. Those require trusted admin
-- workflows or server-side functions and must never be granted by changing client payloads.
