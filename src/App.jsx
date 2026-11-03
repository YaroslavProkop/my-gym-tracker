import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler
} from "chart.js";
import {
  Activity, Dumbbell, History, LogOut, Plus, Save, TrendingUp,
  UserRound, CalendarDays, Trash2, ChevronDown, Flame, Weight, Menu
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const plans = [
  { id: "day1", name: "День 1", subtitle: "Груди · плечі · трицепс", exercises: [
    ["Жим штанги лежачи",3,"6–10"],["Жим гантелей під кутом",3,"8–12"],
    ["Жим гантелей сидячи",3,"8–12"],["Розведення гантелей лежачи",2,"10–15"],
    ["Розгинання рук на блоці",3,"10–15"],["Скручування на прес",3,"12–20"]
  ]},
  { id: "day2", name: "День 2", subtitle: "Спина · біцепс", exercises: [
    ["Тяга верхнього блока до грудей",3,"8–12"],["Тяга штанги в нахилі",3,"8–12"],
    ["Горизонтальна тяга блока",3,"8–12"],["Тяга гантелі однією рукою",2,"10–12"],
    ["Підйом штанги на біцепс",3,"8–12"],["Згинання рук з гантелями",2,"10–15"]
  ]},
  { id: "day3", name: "День 3", subtitle: "Ноги · плечі", exercises: [
    ["Жим ногами",4,"8–12"],["Гіперекстензія",3,"10–15"],
    ["Згинання ніг у тренажері",3,"10–15"],["Підйоми на носки",3,"12–20"],
    ["Махи гантелями в сторони",3,"10–15"],["Скручування на прес",3,"12–20"]
  ]}
];

const today = () => new Date().toISOString().slice(0,10);
const fmt = (v) => Number(v || 0).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

function Auth({ onAuth }) {
  const [mode,setMode] = useState("login"), [email,setEmail] = useState(""), [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false), [error,setError] = useState(""), [notice,setNotice] = useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password});
    setBusy(false);
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session) setNotice("Перевір пошту та підтвердь реєстрацію, якщо підтвердження увімкнене в Supabase.");
    else onAuth(result.data.user);
  }
  return <main className="auth-wrap"><div className="auth-card">
    <div className="brand-mark"><Dumbbell size={25}/></div><div className="eyebrow">ТВІЙ ПРОГРЕС. ТВОЇ ПРАВИЛА.</div>
    <h1>MY GYM <span>TRACKER</span></h1><p className="muted">Тренуйся системно. Відстежуй кожен результат.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@email.com"/></label>
      <label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength="6" placeholder="Мінімум 6 символів"/></label>
      {error && <div className="error">{error}</div>}{notice && <div className="notice">{notice}</div>}
      <button className="primary full" disabled={busy}>{busy?"Зачекай…":mode==="login"?"УВІЙТИ":"СТВОРИТИ АКАУНТ"}</button>
    </form>
    <button className="text-button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setNotice("");}}>
      {mode==="login"?"Немає акаунта? Зареєструватися":"Вже маєш акаунт? Увійти"}
    </button>
  </div></main>
}

export default function App() {
  const [user,setUser] = useState(null), [configured,setConfigured] = useState(!!supabase);
  const [tab,setTab] = useState("dashboard"), [selected,setSelected] = useState("day1");
  const [logs,setLogs] = useState([]), [workouts,setWorkouts] = useState([]);
  const [date,setDate] = useState(today()), [bodyWeight,setBodyWeight] = useState("");
  const [notes,setNotes] = useState(""), [sets,setSets] = useState({});
  const [busy,setBusy] = useState(false), [message,setMessage] = useState("");
  const [expanded,setExpanded] = useState(null);

  useEffect(()=>{
    if (!supabase) return;
    supabase.auth.getSession().then(({data})=>setUser(data.session?.user || null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user || null));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{ if(user) loadData(); },[user]);
  async function loadData() {
    const {data: ws,error} = await supabase.from("workouts").select("*").order("workout_date",{ascending:false}).limit(100);
    if(error){setMessage(error.message);return;}
    setWorkouts(ws||[]);
    if(ws?.length){
      const ids=ws.map(w=>w.id);
      const {data: ls}=await supabase.from("exercise_logs").select("*").in("workout_id",ids).order("set_number");
      setLogs(ls||[]);
    } else setLogs([]);
  }
  const plan = plans.find(p=>p.id===selected) || plans[0];
  function changeSet(key,field,value){setSets(old=>({...old,[key]:{...(old[key]||{}),[field]:value}}));}
  async function saveWorkout(){
    if(!user)return;
    setBusy(true);setMessage("");
    const {data: workout,error}=await supabase.from("workouts").insert({
      user_id:user.id,workout_date:date,day_name:plan.name,body_weight:bodyWeight?Number(bodyWeight):null,notes
    }).select().single();
    if(error){setMessage(error.message);setBusy(false);return;}
    const rows=[];
    plan.exercises.forEach(([name,defaultSets])=>{
      for(let i=1;i<=defaultSets;i++){
        const key=`${name}-${i}`, s=sets[key]||{};
        if(s.weight!==undefined || s.reps!==undefined){
          rows.push({workout_id:workout.id,user_id:user.id,exercise_name:name,set_number:i,weight:Number(s.weight||0),reps:Number(s.reps||0)});
        }
      }
    });
    if(rows.length){
      const {error: logError}=await supabase.from("exercise_logs").insert(rows);
      if(logError)setMessage("Тренування створено, але не всі підходи збережено: "+logError.message);
    }
    setSets({});setNotes("");setBodyWeight("");await loadData();setBusy(false);setTab("history");setMessage("Тренування збережено!");
  }
  async function deleteWorkout(id){
    if(!confirm("Видалити це тренування?"))return;
    const {error}=await supabase.from("workouts").delete().eq("id",id);
    if(error)setMessage(error.message);else {await loadData();setMessage("Тренування видалено.");}
  }
  const bodyPoints=useMemo(()=>workouts.filter(w=>w.body_weight).slice().reverse(),[workouts]);
  const allExercises=useMemo(()=>{
    const map={};
    logs.forEach(l=>{if(!map[l.exercise_name])map[l.exercise_name]=[];map[l.exercise_name].push(l);});
    return map;
  },[logs]);
  const bestLift=useMemo(()=>Object.entries(allExercises).map(([name,arr])=>({name,max:Math.max(...arr.map(x=>Number(x.weight)||0))})).sort((a,b)=>b.max-a.max)[0],[allExercises]);
  const stats = [
    {label:"ТРЕНУВАНЬ",value:workouts.length,icon:Activity},
    {label:"ПОТОЧНА ВАГА",value:bodyPoints.at(-1)?.body_weight?`${fmt(bodyPoints.at(-1).body_weight)} кг`:"—",icon:Weight},
    {label:"ВПРАВИ ЗАПИСАНО",value:Object.keys(allExercises).length,icon:Dumbbell}
  ];
  if(!configured) return <main className="setup-screen"><div className="setup-card"><div className="brand-mark"><Dumbbell/></div><h1>ЩЕ ОДИН КРОК ДО <span>GYM TRACKER</span></h1><p>Сайт готовий до підключення онлайн-бази. Додай адресу Supabase та публічний ключ у файл <code>.env</code>, як описано в README.</p><p className="muted">Це потрібно для акаунтів і синхронізації між пристроями.</p></div></main>;
  if(!user) return <Auth onAuth={setUser}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><div className="brand-mark small"><Dumbbell size={20}/></div><div>MY GYM<span>TRACKER</span></div></div>
      <div className="side-label">МЕНЮ</div>
      <button className={tab==="dashboard"?"nav active":"nav"} onClick={()=>setTab("dashboard")}><Activity size={18}/> Огляд</button>
      <button className={tab==="training"?"nav active":"nav"} onClick={()=>setTab("training")}><Dumbbell size={18}/> Тренування</button>
      <button className={tab==="history"?"nav active":"nav"} onClick={()=>setTab("history")}><History size={18}/> Історія</button>
      <button className={tab==="progress"?"nav active":"nav"} onClick={()=>setTab("progress")}><TrendingUp size={18}/> Прогрес</button>
      <div className="sidebar-bottom"><div className="user-chip"><UserRound size={17}/><span>{user.email}</span></div><button className="nav logout" onClick={()=>supabase.auth.signOut()}><LogOut size={18}/> Вийти</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">PERSONAL FITNESS SPACE</div><h2>{({dashboard:"Огляд",training:"Нове тренування",history:"Історія тренувань",progress:"Мій прогрес"})[tab]}</h2></div><div className="top-date"><CalendarDays size={16}/>{new Date().toLocaleDateString("uk-UA",{day:"numeric",month:"long",year:"numeric"})}</div></header>
      {message && <div className="toast" onClick={()=>setMessage("")}>{message} <span>×</span></div>}
      {tab==="dashboard" && <section>
        <div className="welcome"><div><div className="eyebrow">НЕ ЗУПИНЯЙСЯ</div><h1>Кожне повторення<br/><span>наближає до цілі.</span></h1><p>Фіксуй результати — бач прогрес.</p><button className="primary" onClick={()=>setTab("training")}><Plus size={17}/> РОЗПОЧАТИ ТРЕНУВАННЯ</button></div><div className="welcome-art"><Flame size={94}/><div className="art-ring"/></div></div>
        <div className="stat-grid">{stats.map(s=><div className="stat-card" key={s.label}><div className="stat-icon"><s.icon size={19}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>)}</div>
        <div className="section-head"><div><div className="eyebrow">ТВОЯ ПРОГРАМА</div><h3>План тренувань</h3></div><button className="text-button" onClick={()=>setTab("training")}>Відкрити <ChevronDown size={15}/></button></div>
        <div className="plan-grid">{plans.map((p,i)=><button className="plan-card" key={p.id} onClick={()=>{setSelected(p.id);setTab("training");}}><div className="plan-number">0{i+1}</div><h3>{p.name}</h3><p>{p.subtitle}</p><div className="plan-foot">{p.exercises.length} вправ <span>→</span></div></button>)}</div>
        <div className="section-head"><div><div className="eyebrow">ОСТАННІ ЗАПИСИ</div><h3>Недавні тренування</h3></div><button className="text-button" onClick={()=>setTab("history")}>Уся історія →</button></div>
        <HistoryList workouts={workouts.slice(0,4)} logs={logs} onDelete={deleteWorkout}/>
      </section>}
      {tab==="training" && <section>
        <div className="training-intro"><div><div className="eyebrow">ЗАПИС РЕЗУЛЬТАТУ</div><h1>Сьогодні — твій день.</h1><p className="muted">Обери тренувальний день і заповни фактичні результати підходів.</p></div></div>
        <div className="day-tabs">{plans.map(p=><button key={p.id} className={selected===p.id?"day-tab selected":"day-tab"} onClick={()=>setSelected(p.id)}><b>{p.name}</b><span>{p.subtitle}</span></button>)}</div>
        <div className="form-row"><label>Дата тренування<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Вага тіла, кг<input type="number" step="0.1" placeholder="Напр. 55.0" value={bodyWeight} onChange={e=>setBodyWeight(e.target.value)}/></label></div>
        <div className="exercise-list">{plan.exercises.map(([name,count,reps],idx)=><div className="exercise-card" key={name}><div className="exercise-title"><div className="exercise-index">{String(idx+1).padStart(2,"0")}</div><div><b>{name}</b><small>{count} підходи · {reps} повторень</small></div></div><div className="set-head"><span>ПІДХІД</span><span>ВАГА, КГ</span><span>ПОВТОРЕННЯ</span></div>{Array.from({length:count},(_,i)=>{const key=`${name}-${i+1}`;return <div className="set-row" key={key}><span className="set-num">{i+1}</span><input aria-label="Вага" type="number" min="0" step="0.5" placeholder="0" value={sets[key]?.weight??""} onChange={e=>changeSet(key,"weight",e.target.value)}/><input aria-label="Повторення" type="number" min="0" step="1" placeholder="0" value={sets[key]?.reps??""} onChange={e=>changeSet(key,"reps",e.target.value)}/></div>})}</div>)}</div>
        <label className="notes-label">Нотатки до тренування<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Самопочуття, техніка, що покращити наступного разу…"/></label>
        <button className="primary save-workout" onClick={saveWorkout} disabled={busy}><Save size={18}/>{busy?"ЗБЕРЕЖЕННЯ…":"ЗБЕРЕГТИ ТРЕНУВАННЯ"}</button>
      </section>}
      {tab==="history" && <section><div className="eyebrow">УСІ ЗАПИСИ</div><h1 className="page-title">Історія тренувань</h1><HistoryList workouts={workouts} logs={logs} onDelete={deleteWorkout}/></section>}
      {tab==="progress" && <section><div className="eyebrow">АНАЛІЗ РЕЗУЛЬТАТІВ</div><h1 className="page-title">Твій прогрес</h1>
        <div className="chart-grid"><div className="panel"><h3>Динаміка ваги тіла</h3>{bodyPoints.length?<Line data={{labels:bodyPoints.map(w=>new Date(w.workout_date+"T12:00:00").toLocaleDateString("uk-UA",{day:"numeric",month:"short"})),datasets:[{label:"Вага тіла",data:bodyPoints.map(w=>w.body_weight),borderColor:"#f04444",backgroundColor:"rgba(240,68,68,.12)",fill:true,tension:.35}]}} options={chartOptions("кг")}/>:<Empty text="Додай вагу тіла під час тренування, щоб побачити графік."/>}</div>
        <div className="panel"><h3>Найбільша зафіксована вага</h3>{bestLift?<div className="best-lift"><div className="best-number">{fmt(bestLift.max)} <small>кг</small></div><div>{bestLift.name}</div></div>:<Empty text="Заповни вагу та повторення в підходах."/>}</div></div>
        <div className="panel"><h3>Прогрес за вправами</h3>{Object.keys(allExercises).length?Object.entries(allExercises).map(([name,arr])=><div className="progress-row" key={name}><span>{name}</span><b>{fmt(Math.max(...arr.map(x=>Number(x.weight)||0)))} кг</b></div>):<Empty text="Тут з’явиться статистика після збереження тренувань."/>}</div>
      </section>}
      <footer>MY GYM TRACKER <span>·</span> ТРЕНУЙСЯ РОЗУМНО</footer>
    </main>
  </div>
}

function chartOptions(unit){return {responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y} ${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:"#85858e"}},y:{grid:{color:"#292a30"},ticks:{color:"#85858e"}}}}}
function Empty({text}){return <div className="empty">{text}</div>}
function HistoryList({workouts,logs,onDelete}){
  if(!workouts.length)return <div className="empty large"><History size={28}/><b>Поки немає тренувань</b><span>Збережи перше тренування — і воно з’явиться тут.</span></div>;
  return <div className="history-list">{workouts.map(w=>{const items=logs.filter(l=>l.workout_id===w.id);return <article className="history-card" key={w.id}><button className="history-main" onClick={()=>{}}><div className="history-date">{new Date(w.workout_date+"T12:00:00").toLocaleDateString("uk-UA",{day:"2-digit",month:"short",year:"numeric"})}</div><div className="history-info"><b>{w.day_name}</b><span>{items.length} записаних підходів {w.body_weight?` · ${w.body_weight} кг`:''}</span></div><span className="history-chevron">●</span></button><button className="delete-btn" title="Видалити тренування" onClick={()=>onDelete(w.id)}><Trash2 size={16}/></button>{w.notes&&<p className="history-notes">{w.notes}</p>}{items.length>0&&<details><summary>Показати підходи</summary><div className="logged-sets">{items.map(l=><div key={l.id}><span>{l.exercise_name} · підхід {l.set_number}</span><b>{fmt(l.weight)} кг × {l.reps}</b></div>)}</div></details>}</article>})}</div>
}
