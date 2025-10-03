"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Promo = { id: string; title: string; details?: string | null; promo_date: string };

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startOfMonthWeekday(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay(); // 0=Sun
}

export default function PromoCalendar({ orgId }: { orgId?: string | null }) {
  const supabase = supabaseBrowser();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11
  const [promos, setPromos] = useState<Promo[]>([]);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const ymStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const ymEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  async function load() {
    const from = ymStart.toISOString().slice(0, 10);
    const to = ymEnd.toISOString().slice(0, 10);
    let query = supabase.from("promotions").select("id,title,details,promo_date").gte("promo_date", from).lte("promo_date", to);
    if (orgId) query = query.eq("org_id", orgId);
    const { data } = await query.order("promo_date", { ascending: true });
    setPromos((data ?? []) as Promo[]);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year, month, orgId]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
  }

  async function addPromo(dateISO: string) {
    setAddingFor(dateISO);
    setTitle("");
    setDetails("");
  }

  async function savePromo() {
    if (!addingFor || !title.trim()) return;
    const payload: any = { title, details, promo_date: addingFor };
    if (orgId) payload.org_id = orgId;
    const { error } = await supabase.from("promotions").insert(payload);
    if (!error) {
      setAddingFor(null);
      await load();
    }
  }

  const grid: { date: Date | null; iso: string | null }[] = useMemo(() => {
    const dIM = daysInMonth(year, month);
    const startW = startOfMonthWeekday(year, month); // 0=Sun
    const cells: { date: Date | null; iso: string | null }[] = [];
    // leading blanks
    for (let i = 0; i < startW; i++) cells.push({ date: null, iso: null });
    // days
    for (let d = 1; d <= dIM; d++) {
      const date = new Date(year, month, d);
      const iso = date.toISOString().slice(0, 10);
      cells.push({ date, iso });
    }
    // trailing blanks to fill 6 rows x 7 cols
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });
    return cells;
  }, [year, month]);

  const promosByDay = useMemo(() => {
    const map = new Map<string, Promo[]>();
    for (const p of promos) {
      const arr = map.get(p.promo_date) || [];
      arr.push(p);
      map.set(p.promo_date, arr);
    }
    return map;
  }, [promos]);

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold">Promo Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-md border bg-background px-2 py-1 text-sm">←</button>
          <div className="text-sm font-medium">{monthLabel}</div>
          <button onClick={nextMonth} className="rounded-md border bg-background px-2 py-1 text-sm">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 px-5 pb-5">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="px-2 py-1 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {grid.map((cell, idx) => {
          const day = cell.date?.getDate();
          const iso = cell.iso;
          const list = iso ? promosByDay.get(iso) ?? [] : [];
          return (
            <div key={idx} className="rounded-lg border bg-background p-2 min-h-[84px]">
              {iso && (
                <button
                  onClick={() => addPromo(iso)}
                  className="text-xs font-medium hover:underline"
                  title="Add promo"
                >
                  {day}
                </button>
              )}
              <div className="mt-2 space-y-1">
                {list.map((p) => (
                  <div key={p.id} className="rounded-md border bg-card px-2 py-1 text-xs">
                    {p.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple modal */}
      {addingFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{addingFor}</div>
            <input
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Promo title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Details (optional)"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-md border bg-background px-3 py-1.5 text-sm" onClick={() => setAddingFor(null)}>Cancel</button>
              <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700" onClick={savePromo}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
