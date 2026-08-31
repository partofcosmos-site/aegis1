import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit3, Save, X, CheckCircle2, TrendingUp, TrendingDown,
  Info, BookOpen, ChevronDown, ChevronUp, School
} from "lucide-react";
import clsx from "clsx";

const STORAGE_KEY = "savantix_attendance_data_v1";

const CLASS_COLORS = ["indigo","emerald","rose","amber","sky","purple","orange","teal"];

const COLOR_MAP = {
  indigo:  { bg:"bg-indigo-500/10",  border:"border-indigo-500/30",  text:"text-indigo-400"  },
  emerald: { bg:"bg-emerald-500/10", border:"border-emerald-500/30", text:"text-emerald-400" },
  rose:    { bg:"bg-rose-500/10",    border:"border-rose-500/30",    text:"text-rose-400"    },
  amber:   { bg:"bg-amber-500/10",   border:"border-amber-500/30",   text:"text-amber-400"   },
  sky:     { bg:"bg-sky-500/10",     border:"border-sky-500/30",     text:"text-sky-400"     },
  purple:  { bg:"bg-purple-500/10",  border:"border-purple-500/30",  text:"text-purple-400"  },
  orange:  { bg:"bg-orange-500/10",  border:"border-orange-500/30",  text:"text-orange-400"  },
  teal:    { bg:"bg-teal-500/10",    border:"border-teal-500/30",    text:"text-teal-400"    },
};

function computeStats(cls) {
  const pct = cls.total > 0 ? (cls.attended / cls.total) * 100 : 0;
  const req = cls.required;
  let classesToAttend = 0;
  if (pct < req && req < 100) {
    classesToAttend = Math.ceil((req * cls.total - 100 * cls.attended) / (100 - req));
  }
  let classesCanSkip = 0;
  if (pct >= req && req > 0) {
    classesCanSkip = Math.floor((100 * cls.attended - req * cls.total) / req);
  }
  const status = pct >= req ? "safe" : pct >= req - 5 ? "warning" : "danger";
  return { pct, classesToAttend, classesCanSkip, status };
}

const DEFAULT_CLASSES = [
  { id:"physics",   name:"Physics",      attended:0, total:0, required:75, color:"indigo" },
  { id:"math",      name:"Mathematics",  attended:0, total:0, required:75, color:"emerald" },
  { id:"chemistry", name:"Chemistry",    attended:0, total:0, required:75, color:"rose" },
];

export const AttendanceCalculator = () => {
  const [classes, setClasses] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_CLASSES; } catch { return DEFAULT_CLASSES; }
  });
  const [isAdding, setIsAdding]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [newName, setNewName]     = useState("");
  const [newAttended, setNewAttended] = useState("0");
  const [newTotal, setNewTotal]   = useState("0");
  const [newRequired, setNewRequired] = useState("75");
  const [newColor, setNewColor]   = useState("indigo");
  const [editForm, setEditForm]   = useState({ name:"", attended:0, total:0, required:75, color:"indigo" });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(classes)); } catch {}
  }, [classes]);

  const overall = useMemo(() => {
    const ta = classes.reduce((s,c) => s+c.attended, 0);
    const tc = classes.reduce((s,c) => s+c.total, 0);
    return { ta, tc, pct: tc>0?(ta/tc)*100:0, safe: classes.filter(c=>computeStats(c).status==="safe").length };
  }, [classes]);

  const addCls = () => {
    if (!newName.trim()) return;
    const a = Math.max(0, parseInt(newAttended)||0);
    const t = Math.max(a, parseInt(newTotal)||0);
    setClasses(p => [...p, { id:"cls_"+Date.now(), name:newName.trim(), attended:a, total:t, required:Math.min(100,Math.max(1,parseInt(newRequired)||75)), color:newColor }]);
    setNewName(""); setNewAttended("0"); setNewTotal("0"); setNewRequired("75");
    setNewColor(CLASS_COLORS[classes.length % CLASS_COLORS.length]);
    setIsAdding(false);
  };

  const saveEdit = (id: string) => {
    setClasses(p => p.map(c => {
      if (c.id !== id) return c;
      const a = Math.max(0, Math.round(Number(editForm.attended))||0);
      const t = Math.max(a, Math.round(Number(editForm.total))||0);
      return { ...c, ...editForm, attended:a, total:t, required:Math.min(100,Math.max(1,Math.round(Number(editForm.required))||75)) };
    }));
    setEditingId(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400"><School className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Attendance Calculator</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Track required attendance for any institute · fully customizable</p>
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {classes.length > 0 && (
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label:"Attended",   val: overall.ta },
            { label:"Total Held", val: overall.tc },
            { label:"Overall %",  val: overall.pct.toFixed(1)+"%", colored: overall.pct>=75 },
            { label:"Subjects Safe", val: `${overall.safe}/${classes.length}` },
          ].map(item => (
            <div key={item.label}>
              <div className={clsx("text-2xl font-bold", item.colored !== undefined ? (item.colored ? "text-emerald-400":"text-rose-400") : "text-zinc-100")}>{item.val}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100">Add New Subject</h3>
            <button onClick={() => setIsAdding(false)} className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:"Subject Name",   val:newName,    set:setNewName,    type:"text",   ph:"Physics..." },
              { label:"Required %",     val:newRequired,set:setNewRequired,type:"number", ph:"75" },
              { label:"Attended",       val:newAttended,set:setNewAttended,type:"number", ph:"0" },
              { label:"Total Held",     val:newTotal,   set:setNewTotal,   type:"number", ph:"0" },
            ].map(f => (
              <div key={f.label} className={f.type==="text"?"col-span-2 sm:col-span-2":""}>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wide">{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"/>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addCls} disabled={!newName.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
              <Save className="w-3.5 h-3.5"/> Save
            </button>
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm cursor-pointer hover:bg-zinc-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {classes.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <School className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p className="text-sm">No subjects yet. Click "Add Subject" to start.</p>
          </div>
        )}
        {classes.map(cls => {
          const { pct, classesToAttend, classesCanSkip, status } = computeStats(cls);
          const colors = COLOR_MAP[cls.color] || COLOR_MAP.indigo;
          const isExp = expandedId === cls.id;

          return (
            <div key={cls.id} className={clsx("bg-zinc-900/70 backdrop-blur-md border rounded-2xl overflow-hidden shadow-lg", colors.border)}>
              {editingId === cls.id ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-100">Edit Subject</h3>
                    <button onClick={()=>setEditingId(null)} className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"><X className="w-4 h-4"/></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label:"Name",       val:editForm.name,     key:"name",     type:"text",   span:true },
                      { label:"Required %", val:editForm.required, key:"required", type:"number" },
                      { label:"Attended",   val:editForm.attended, key:"attended", type:"number" },
                      { label:"Total Held", val:editForm.total,    key:"total",    type:"number" },
                    ].map(f => (
                      <div key={f.key} className={f.span?"col-span-2 sm:col-span-2":""}>
                        <label className="text-[11px] text-zinc-500 uppercase tracking-wide">{f.label}</label>
                        <input type={f.type} value={f.val} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))}
                          className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"/>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { saveEdit(cls.id); setEditingId(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer"><Save className="w-3.5 h-3.5"/> Save</button>
                    <button onClick={()=>setEditingId(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm cursor-pointer hover:bg-zinc-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx("p-2 rounded-lg border", colors.bg, colors.border)}><BookOpen className={clsx("w-4 h-4", colors.text)}/></div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-100 text-sm truncate">{cls.name}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{cls.attended}/{cls.total} classes · Target: {cls.required}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                        status==="safe"?"bg-emerald-500/15 text-emerald-300 border-emerald-500/30":
                        status==="warning"?"bg-amber-500/15 text-amber-300 border-amber-500/30":
                        "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
                        {status==="safe"?"✓ Safe":status==="warning"?"⚠ Warning":"✗ Low"}
                      </span>
                      <span className={clsx("text-lg font-extrabold", status==="safe"?"text-emerald-400":status==="warning"?"text-amber-400":"text-rose-400")}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-500", status==="safe"?"bg-emerald-500":status==="warning"?"bg-amber-500":"bg-rose-500")} style={{width:`${Math.min(100,pct)}%`}}/>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {status!=="safe" && classesToAttend>0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300">
                        <TrendingUp className="w-3 h-3"/> Attend <strong className="mx-0.5">{classesToAttend}</strong> more to reach {cls.required}%
                      </div>
                    )}
                    {status==="safe" && classesCanSkip>0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-300">
                        <TrendingDown className="w-3 h-3"/> Can skip <strong className="mx-0.5">{classesCanSkip}</strong> class{classesCanSkip!==1?"es":""} safely
                      </div>
                    )}
                    {cls.total===0 && <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-400"><Info className="w-3 h-3"/> Log your first class below</div>}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={()=>setClasses(p=>p.map(c=>c.id===cls.id?{...c,attended:c.attended+1,total:c.total+1}:c))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Attended
                    </button>
                    <button onClick={()=>setClasses(p=>p.map(c=>c.id===cls.id?{...c,total:c.total+1}:c))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/30 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer">
                      <X className="w-3.5 h-3.5"/> Missed
                    </button>
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={()=>{setEditingId(cls.id);setEditForm({name:cls.name,attended:cls.attended,total:cls.total,required:cls.required,color:cls.color});setExpandedId(null);}} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"><Edit3 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>setExpandedId(isExp?null:cls.id)} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer">
                        {isExp?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}
                      </button>
                      <button onClick={()=>{if(window.confirm("Delete this subject?"))setClasses(p=>p.filter(c=>c.id!==cls.id));}} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>

                  {isExp && (
                    <div className={clsx("border-t mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3", colors.border)}>
                      {[
                        { label:"Current %",   val:pct.toFixed(2)+"%",     sub:`Target: ${cls.required}%`, color:status==="safe"?"text-emerald-400":"text-rose-400" },
                        status!=="safe"
                          ? { label:"Classes Needed",val:String(classesToAttend), sub:`consecutive to reach ${cls.required}%`, color:"text-rose-300" }
                          : { label:"Can Skip",      val:String(classesCanSkip),  sub:`&amp; stay ≥${cls.required}%`,           color:"text-emerald-300" },
                        { label:"Deficit/Surplus", val:(pct>=cls.required?"+":"")+((pct-cls.required).toFixed(1))+"%", sub:`vs ${cls.required}% requirement`, color:pct>=cls.required?"text-emerald-400":"text-rose-400" },
                      ].map(s=>(
                        <div key={s.label} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{s.label}</div>
                          <div className={clsx("text-xl font-bold",s.color)}>{s.val}</div>
                          <div className="text-[10px] text-zinc-600 mt-0.5" dangerouslySetInnerHTML={{__html:s.sub}}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {classes.length>0 && <p className="text-center text-[10px] text-zinc-700 pb-4">All data stored locally on your device · Zero cloud sync</p>}
    </div>
  );
};
