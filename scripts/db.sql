





CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";






CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    user_type text NOT NULL CHECK (user_type IN ('citizen', 'government', 'admin', 'super_admin')) DEFAULT 'citizen',
    organization text, 
    
    
    approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    approved_by uuid REFERENCES public.profiles(id),
    approved_at timestamp with time zone,
    rejection_reason text,
    
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


CREATE TABLE IF NOT EXISTS public.issues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('pothole', 'streetlight', 'sidewalk', 'traffic_sign', 'drainage', 'other')) DEFAULT 'pothole',
    status text NOT NULL CHECK (status IN ('reported', 'in_progress', 'resolved', 'rejected')) DEFAULT 'reported',
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    
    
    latitude decimal(10, 8) NOT NULL,
    longitude decimal(11, 8) NOT NULL,
    address text,
    
    
    photo_url text NOT NULL,
    photo_filename text,
    
    
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    
    assigned_to uuid REFERENCES public.profiles(id),
    
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at timestamp with time zone
);


CREATE TABLE IF NOT EXISTS public.issue_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    responder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    response_type text NOT NULL CHECK (response_type IN ('status_update', 'resolution', 'rejection', 'request_info')) DEFAULT 'status_update',
    message text NOT NULL,
    
    
    photo_url text, 
    photo_filename text,
    
    
    latitude decimal(10, 8),
    longitude decimal(11, 8),
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


CREATE TABLE IF NOT EXISTS public.admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type text NOT NULL CHECK (action_type IN ('approve_user', 'reject_user', 'delete_user', 'update_user', 'assign_issue', 'delete_issue', 'create_super_admin')),
    target_id uuid, 
    details jsonb, 
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);






ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;






CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);


CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


CREATE POLICY "approved_users_can_view_approved"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles viewer
            WHERE viewer.id = auth.uid() AND viewer.approval_status = 'approved'
        ) AND approval_status = 'approved'
    );


CREATE POLICY "admins_can_view_all_profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.user_type IN ('admin', 'super_admin')
        )
    );


CREATE POLICY "admins_can_update_profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.user_type IN ('admin', 'super_admin')
        )
    );






CREATE POLICY "citizens_can_view_all_issues"
    ON public.issues FOR SELECT
    USING (true);


CREATE POLICY "citizens_can_create_issues"
    ON public.issues FOR INSERT
    WITH CHECK (
        auth.uid() = reporter_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type = 'citizen'
        )
    );


CREATE POLICY "citizens_can_update_own_issues"
    ON public.issues FOR UPDATE
    USING (
        auth.uid() = reporter_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type = 'citizen'
        )
    );


CREATE POLICY "approved_government_can_manage_issues"
    ON public.issues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND user_type IN ('government', 'admin', 'super_admin')
            AND approval_status = 'approved'
        )
    );






CREATE POLICY "anyone_can_view_responses"
    ON public.issue_responses FOR SELECT
    USING (true);


CREATE POLICY "approved_government_can_create_responses"
    ON public.issue_responses FOR INSERT
    WITH CHECK (
        auth.uid() = responder_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND user_type IN ('government', 'admin', 'super_admin')
            AND approval_status = 'approved'
        )
    );


CREATE POLICY "approved_government_can_update_responses"
    ON public.issue_responses FOR UPDATE
    USING (
        auth.uid() = responder_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND user_type IN ('government', 'admin', 'super_admin')
            AND approval_status = 'approved'
        )
    );






CREATE POLICY "admins_can_view_admin_actions"
    ON public.admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );


CREATE POLICY "admins_can_create_admin_actions"
    ON public.admin_actions FOR INSERT
    WITH CHECK (
        auth.uid() = admin_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
        )
    );






CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, user_type, approval_status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(new.raw_user_meta_data ->> 'user_type', 'citizen'),
        CASE 
            WHEN COALESCE(new.raw_user_meta_data ->> 'user_type', 'citizen') = 'citizen' 
            THEN 'approved' 
            ELSE 'pending' 
        END
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
END;
$$;


CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;


CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();






CREATE OR REPLACE FUNCTION public.approve_government_user(
    user_id uuid,
    admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    user_exists boolean;
BEGIN
    
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = admin_id 
        AND user_type IN ('admin', 'super_admin')
        AND approval_status = 'approved'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can approve users';
    END IF;
    
    
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND user_type = 'government'
        AND approval_status = 'pending'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found or not pending approval';
    END IF;
    
    
    UPDATE public.profiles 
    SET 
        approval_status = 'approved',
        approved_by = admin_id,
        approved_at = now()
    WHERE id = user_id;
    
    
    INSERT INTO public.admin_actions (admin_id, action_type, target_id, details)
    VALUES (admin_id, 'approve_user', user_id, jsonb_build_object('approved_at', now()));
    
    RETURN true;
END;
$$;


CREATE OR REPLACE FUNCTION public.reject_government_user(
    user_id uuid,
    admin_id uuid,
    reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    user_exists boolean;
BEGIN
    
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = admin_id 
        AND user_type IN ('admin', 'super_admin')
        AND approval_status = 'approved'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can reject users';
    END IF;
    
    
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND user_type = 'government'
        AND approval_status = 'pending'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found or not pending approval';
    END IF;
    
    
    UPDATE public.profiles 
    SET 
        approval_status = 'rejected',
        approved_by = admin_id,
        approved_at = now(),
        rejection_reason = reason
    WHERE id = user_id;
    
    
    INSERT INTO public.admin_actions (admin_id, action_type, target_id, details)
    VALUES (admin_id, 'reject_user', user_id, jsonb_build_object('reason', reason, 'rejected_at', now()));
    
    RETURN true;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_pending_government_users()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    organization text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    
    IF NOT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND user_type IN ('admin', 'super_admin')
        AND approval_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.organization,
        p.created_at
    FROM public.profiles p
    WHERE p.user_type = 'government' 
    AND p.approval_status = 'pending'
    ORDER BY p.created_at DESC;
END;
$$;


CREATE OR REPLACE FUNCTION public.add_issue_response(
  p_issue_id uuid,
  p_responder_id uuid,
  p_response_type text,
  p_message text,
  p_photo_url text DEFAULT NULL,
  p_photo_filename text DEFAULT NULL,
  p_latitude decimal(10,8) DEFAULT NULL,
  p_longitude decimal(11,8) DEFAULT NULL,
  p_new_status text DEFAULT NULL -- e.g. 'in_progress' or 'resolved'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert response
  INSERT INTO public.issue_responses(
    issue_id, responder_id, response_type, message, photo_url, photo_filename, latitude, longitude
  ) VALUES (
    p_issue_id, p_responder_id, p_response_type, p_message, p_photo_url, p_photo_filename, p_latitude, p_longitude
  );

  -- Optionally update issue status / resolved_at
  IF p_new_status IS NOT NULL THEN
    UPDATE public.issues
    SET status = p_new_status,
        updated_at = timezone('utc', now()),
        resolved_at = CASE WHEN p_new_status = 'resolved' THEN timezone('utc', now()) ELSE resolved_at END
    WHERE id = p_issue_id;
  END IF;

  -- Optionally mirror the latest photo on the issue row (so it appears as the "main" photo)
  IF p_photo_url IS NOT NULL THEN
    UPDATE public.issues
    SET photo_url = p_photo_url,
        updated_at = timezone('utc', now())
    WHERE id = p_issue_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_issue_response(uuid, uuid, text, text, text, text, decimal, decimal, text) TO authenticated;




CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles (user_type);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_approval_status_idx ON public.profiles (approval_status);


CREATE INDEX IF NOT EXISTS issues_location_idx ON public.issues USING gist (
    ST_Point(longitude, latitude)
);
CREATE INDEX IF NOT EXISTS issues_reporter_idx ON public.issues (reporter_id);
CREATE INDEX IF NOT EXISTS issues_assigned_to_idx ON public.issues (assigned_to);
CREATE INDEX IF NOT EXISTS issues_status_idx ON public.issues (status);
CREATE INDEX IF NOT EXISTS issues_category_idx ON public.issues (category);
CREATE INDEX IF NOT EXISTS issues_created_at_idx ON public.issues (created_at DESC);
CREATE INDEX IF NOT EXISTS issues_priority_idx ON public.issues (priority);


CREATE INDEX IF NOT EXISTS issue_responses_issue_idx ON public.issue_responses (issue_id);
CREATE INDEX IF NOT EXISTS issue_responses_responder_idx ON public.issue_responses (responder_id);
CREATE INDEX IF NOT EXISTS issue_responses_created_at_idx ON public.issue_responses (created_at DESC);


CREATE INDEX IF NOT EXISTS admin_actions_admin_idx ON public.admin_actions (admin_id);
CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON public.admin_actions (target_id);
CREATE INDEX IF NOT EXISTS admin_actions_type_idx ON public.admin_actions (action_type);
CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON public.admin_actions (created_at DESC);






GRANT USAGE ON SCHEMA public TO authenticated, anon;


GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.issues TO authenticated;
GRANT ALL ON public.issue_responses TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;


GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


GRANT EXECUTE ON FUNCTION public.approve_government_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_government_user(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_government_users() TO authenticated;





DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMADHAN DATABASE SCHEMA SETUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: profiles, issues, issue_responses, admin_actions';
    RAISE NOTICE 'RLS policies configured for all tables';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Admin functions available for user management';
    RAISE NOTICE '';
    RAISE NOTICE 'READY FOR TESTING!';
    RAISE NOTICE '========================================';
END $$;