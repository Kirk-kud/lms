


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."is_class_tutor"("p_class_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.classes
    where id = p_class_id and tutor_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_class_tutor"("p_class_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_enrolled"("p_class_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.enrollments
    where class_id = p_class_id and student_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_enrolled"("p_class_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "week_number" integer NOT NULL,
    "due_date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "checked_in_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "pin_code" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."attendance_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tutor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "invite_code" "text" DEFAULT "upper"("substr"("md5"(("random"())::"text"), 1, 8)) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "content_url" "text",
    "content_text" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "module_items_type_check" CHECK (("type" = ANY (ARRAY['pdf'::"text", 'video'::"text", 'link'::"text", 'text'::"text"])))
);


ALTER TABLE "public"."module_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "avatar_initials" "text" GENERATED ALWAYS AS (("upper"("left"("full_name", 1)) || "upper"("left"("split_part"("full_name", ' '::"text", 2), 1)))) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['tutor'::"text", 'student'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "submissions_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'late'::"text"])))
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_session_id_student_id_key" UNIQUE ("session_id", "student_id");



ALTER TABLE ONLY "public"."attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_class_id_key" UNIQUE ("student_id", "class_id");



ALTER TABLE ONLY "public"."module_items"
    ADD CONSTRAINT "module_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_assignment_id_student_id_key" UNIQUE ("assignment_id", "student_id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."module_items"
    ADD CONSTRAINT "module_items_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assignments_student" ON "public"."assignments" FOR SELECT USING ("public"."is_enrolled"("class_id", "auth"."uid"()));



CREATE POLICY "assignments_tutor" ON "public"."assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "assignments"."class_id") AND ("classes"."tutor_id" = "auth"."uid"())))));



ALTER TABLE "public"."attendance_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "classes_student_select" ON "public"."classes" FOR SELECT USING ("public"."is_enrolled"("id", "auth"."uid"()));



CREATE POLICY "classes_tutor_all" ON "public"."classes" USING (("auth"."uid"() = "tutor_id"));



CREATE POLICY "enrollments_student" ON "public"."enrollments" USING (("student_id" = "auth"."uid"()));



CREATE POLICY "enrollments_tutor" ON "public"."enrollments" FOR SELECT USING ("public"."is_class_tutor"("class_id", "auth"."uid"()));



ALTER TABLE "public"."module_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "module_items_student" ON "public"."module_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."modules" "m"
  WHERE (("m"."id" = "module_items"."module_id") AND "public"."is_enrolled"("m"."class_id", "auth"."uid"())))));



CREATE POLICY "module_items_tutor" ON "public"."module_items" USING ((EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."classes" "c" ON (("m"."class_id" = "c"."id")))
  WHERE (("m"."id" = "module_items"."module_id") AND ("c"."tutor_id" = "auth"."uid"())))));



ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modules_student" ON "public"."modules" FOR SELECT USING ("public"."is_enrolled"("class_id", "auth"."uid"()));



CREATE POLICY "modules_tutor" ON "public"."modules" USING ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "modules"."class_id") AND ("classes"."tutor_id" = "auth"."uid"())))));



CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "records_student" ON "public"."attendance_records" USING (("student_id" = "auth"."uid"()));



CREATE POLICY "records_tutor" ON "public"."attendance_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."attendance_sessions" "s"
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
  WHERE (("s"."id" = "attendance_records"."session_id") AND ("c"."tutor_id" = "auth"."uid"())))));



CREATE POLICY "sessions_student" ON "public"."attendance_sessions" FOR SELECT USING ((("is_active" = true) AND "public"."is_enrolled"("class_id", "auth"."uid"())));



CREATE POLICY "sessions_tutor" ON "public"."attendance_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "attendance_sessions"."class_id") AND ("classes"."tutor_id" = "auth"."uid"())))));



ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "submissions_student" ON "public"."submissions" USING (("student_id" = "auth"."uid"()));



CREATE POLICY "submissions_tutor" ON "public"."submissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."assignments" "a"
     JOIN "public"."classes" "c" ON (("a"."class_id" = "c"."id")))
  WHERE (("a"."id" = "submissions"."assignment_id") AND ("c"."tutor_id" = "auth"."uid"())))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."is_class_tutor"("p_class_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_class_tutor"("p_class_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_class_tutor"("p_class_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_enrolled"("p_class_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_enrolled"("p_class_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_enrolled"("p_class_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_records" TO "anon";
GRANT ALL ON TABLE "public"."attendance_records" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_records" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_sessions" TO "anon";
GRANT ALL ON TABLE "public"."attendance_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."module_items" TO "anon";
GRANT ALL ON TABLE "public"."module_items" TO "authenticated";
GRANT ALL ON TABLE "public"."module_items" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







