"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ChevronDown,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Org = { id: string; name: string; slug: string };
type Course = { id: string; name: string; org_id: string };

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-xl border p-2.5 bg-muted/40">{icon}</div>
      </div>
    </motion.div>
  );
}

export default function DashboardOverview() {
  console.log("[DashboardOverview] render");
  const supabase = supabaseBrowser();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement | null>(null);
  const courseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("[DashboardOverview] mounted");
  }, []);

  // Outside click handler
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const closeClient =
        clientRef.current && !clientRef.current.contains(t);
      const closeCourse =
        courseRef.current && !courseRef.current.contains(t);
      if (closeClient) {
        console.debug(
          "[DashboardOverview] outside click: closing org menu"
        );
        setIsClientOpen(false);
      }
      if (closeCourse) {
        console.debug(
          "[DashboardOverview] outside click: closing course menu"
        );
        setIsCourseOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Load orgs and courses
  useEffect(() => {
    (async () => {
      console.info("[DashboardOverview] fetching organizations");
      const { data: orgRows, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .order("name");
      if (orgErr) {
        console.error("[DashboardOverview] org fetch error", orgErr);
      } else {
        setOrgs(orgRows || []);
      }

      console.info("[DashboardOverview] fetching courses");
      const { data: courseRows, error: courseErr } = await supabase
        .from("courses")
        .select("id,name,org_id")
        .order("name");
      if (courseErr) {
        console.error("[DashboardOverview] courses fetch error", courseErr);
      } else {
        setCourses(courseRows || []);
      }
    })();
  }, [supabase]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Organizations"
          value={orgs.length.toString()}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Courses"
          value={courses.length.toString()}
          icon={<LayoutDashboard className="h-5 w-5" />}
        />
        <StatCard
          title="Users"
          value="0"
          icon={<Users className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
