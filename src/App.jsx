import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Activity, Save, Edit, UserPlus, CheckCircle, XCircle, Layout, List, Loader2, Trash2, Database, Calendar, Layers, Wifi, ShieldCheck, Fingerprint, FileUp, DollarSign, Download, Filter, Phone, Clock, Plus, Users } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDyufliI-fEn7iR5kVhKWLlPwUcUR2tSiI",
  authDomain: "app-fidelizacion-18fcb.firebaseapp.com",
  projectId: "app-fidelizacion-18fcb",
  storageBucket: "app-fidelizacion-18fcb.firebasestorage.app",
  messagingSenderId: "337074521389",
  appId: "1:337074521389:web:ca0ea7ff6d4acaaec73fa4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'nui-master-v10-identity-verified';

const COLORS = {
  stages: { '2do Pedido': '#6366f1', '3er Pedido': '#8b5cf6', '4to Pedido': '#ec4899', 'Histórico': '#10b981' },
  bgStages: { '2do Pedido': 'bg-indigo-50', '3er Pedido': 'bg-violet-50', '4to Pedido': 'bg-pink-50', 'Histórico': 'bg-emerald-50' },
  borderStages: { '2do Pedido': 'border-indigo-200', '3er Pedido': 'border-violet-200', '4to Pedido': 'border-pink-200', 'Histórico': 'border-emerald-200' }
};
const MESES = ["AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "ENERO", "FEBRERO"];
const ETAPAS = ["2do Pedido", "3er Pedido", "4to Pedido", "Histórico"];

const parseCSV = (text) => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(/,|;/).map(h => h.trim().toUpperCase().replace(/"/g, ''));
  const idxCodigo = headers.findIndex(h => h === 'CODIGO' || h === 'CÓDIGO' || h.includes('CÓDIGO'));
  const idxNombre = headers.findIndex(h => h.includes('NOMBRE'));
  const idxZona = headers.findIndex(h => h === 'ZONA' || h.includes('ZONA'));
  const idxSaldo = headers.findIndex(h => h.includes('SALDO ACTUAL'));
  const idxStatus = headers.findIndex(h => h.includes('STATUS'));
  const idxCumple = headers.findIndex(h => h.includes('REGALIA DE CUMPLEAÑOS') || h.includes('CUMPLEAÑOS'));
  
  const idxMes1 = headers.findIndex(h => h.includes('1º MES FACTURACION') || h.includes('1° MES FACTURACION'));
  const idxMes2 = headers.findIndex(h => h.includes('2º MES FACTURACION') || h.includes('2° MES FACTURACION'));
  const idxMes3 = headers.findIndex(h => h.includes('3º MES FACTURACION') || h.includes('3° MES FACTURACION'));
  const idxMes4 = headers.findIndex(h => h.includes('4º MES FACTURACION') || h.includes('4° MES FACTURACION'));

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].replace(/\r/g, '').split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)|;(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (row.length < 5) continue;
    const getVal = (idx) => idx !== -1 && row[idx] ? row[idx].replace(/"/g, '').trim() : '';
    const codigo = getVal(idxCodigo);
    const nombre = getVal(idxNombre);
    
    if (codigo && nombre) {
        let etapaDetectada = '2do Pedido';
        const v1 = getVal(idxMes1), v2 = getVal(idxMes2), v3 = getVal(idxMes3), v4 = getVal(idxMes4);
        if (v4 && v4 !== '0' && v4 !== '-') etapaDetectada = 'Histórico';
        else if (v3 && v3 !== '0' && v3 !== '-') etapaDetectada = '4to Pedido';
        else if (v2 && v2 !== '0' && v2 !== '-') etapaDetectada = '3er Pedido';
        else if (v1 && v1 !== '0' && v1 !== '-') etapaDetectada = '2do Pedido';

        result.push({
            codigo, nombre, zona: getVal(idxZona),
            saldo: parseFloat(getVal(idxSaldo).replace(/[$,]/g, '')) || 0,
            estado: getVal(idxStatus) || 'ACT',
            fechaNacimiento: getVal(idxCumple),
            etapaSugestida: etapaDetectada
        });
    }
  }
  return result;
};

const KpiCard = ({ title, value, subtext, color = "indigo" }) => (
  <div className={`bg-white p-4 rounded-xl border border-${color}-100 shadow-sm flex items-start gap-4`}>
    <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}><Activity size={24} /></div>
    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p><h3 className="text-2xl font-bold text-slate-800">{value}</h3><p className="text-[10px] text-slate-500 mt-1">{subtext}</p></div>
  </div>
);

const RetentionStep = ({ label, count, percent, isLast, conversionRate }) => {
  let color = conversionRate < 50 ? 'bg-red-500' : conversionRate < 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex flex-col items-center flex-1 relative z-10">
      <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-bold text-sm shadow-md mb-3 ${color} border-4 border-white ring-2 ring-slate-100`}><span>{percent}%</span></div>
      <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</p><p className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full mt-1">{count} Clientes</p>
      {!isLast && (<div className="absolute top-7 left-1/2 w-full h-1 bg-slate-200 -z-10"><div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-white px-1 text-[9px] text-slate-400 font-bold border border-slate-100 rounded">{conversionRate}% Pasan</div></div>)}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('gestion'); 
  const [currentMonth, setCurrentMonth] = useState('FEBRERO'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [lastSaved, setLastSaved] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [filterZone, setFilterZone] = useState('TODAS');
  
  // NUEVO ESTADO: Filtro Modo Agente
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  useEffect(() => { signInAnonymously(auth).catch(console.error); return onAuthStateChanged(auth, setUser); }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'clients'));
    const unsub = onSnapshot(q, snap => {
        if (snap.empty) setData([]);
        else {
            const loadedData = snap.docs.map(d => ({...d.data(), id: d.id}));
            loadedData.sort((a,b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
            setData(loadedData);
        }
        setLoading(false); setLastSaved(new Date()); 
    }, () => { setSyncStatus('error'); setLoading(false); });
    return () => unsub();
  }, [user]);

  const showNotification = (msg, type='success') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  const handleExportExcel = () => {
    if (data.length === 0) return showNotification("No hay datos para exportar", "error");
    let csvContent = "Codigo,Nombre,Zona,Saldo,Estado,Etapa Actual,Cumpleaños,Gestion Efectiva,Fecha FollowUp,Comentarios\n";
    data.forEach(row => {
        const cleanName = row.nombre ? row.nombre.replace(/,/g, "") : "";
        const cleanComment = row.comentario ? row.comentario.replace(/,/g, " ") : "";
        const currentStage = row.history?.[currentMonth] || row.etapa || "";
        csvContent += `${row.codigo},${cleanName},${row.zona},${row.saldo},${row.estado},${currentStage},${row.fechaNacimiento || ''},${row.gestionEfectiva || ''},${row.fechaFollowUp || ''},${cleanComment}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Clientes_${currentMonth}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showNotification("Reporte descargado");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsImporting(true); setSyncStatus('saving');
    const batch = writeBatch(db); let count = 0;
    const tempMap = new Map(); data.forEach(d => tempMap.set(d.codigo, d));

    for (const file of files) {
        const text = await file.text();
        const records = parseCSV(text); 
        records.forEach(rec => {
            const existing = tempMap.get(rec.codigo) || { history: {} };
            const newHistory = { ...existing.history };
            if (rec.etapaSugestida) newHistory[currentMonth] = rec.etapaSugestida;
            
            // Al actualizar con Excel, si el cliente avanzó de etapa, le reseteamos la gestión a "pendiente" si lo deseas.
            // Por ahora solo actualizamos los datos duros.
            const merged = { 
                ...existing, nombre: rec.nombre || existing.nombre, zona: rec.zona || existing.zona,
                saldo: rec.saldo, estado: rec.estado || existing.estado, fechaNacimiento: rec.fechaNacimiento || existing.fechaNacimiento,
                history: newHistory, etapa: rec.etapaSugestida || existing.etapa || '2do Pedido', updatedAt: new Date().toISOString()
            };
            delete merged.etapaSugestida;
            tempMap.set(rec.codigo, merged);
        });
    }

    tempMap.forEach((val, key) => { batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'clients', key), val); count++; });
    try { await batch.commit(); setSyncStatus('synced'); showNotification(`¡Éxito! ${count} procesados.`); } 
    catch (err) { setSyncStatus('error'); showNotification("Error al importar.", "error"); } 
    finally { setIsImporting(false); e.target.value = null; }
  };

  const handleAdvanceStage = async (client) => {
      const currentIdx = MESES.indexOf(currentMonth);
      if (currentIdx >= MESES.length - 1) return showNotification("No hay mes siguiente", "error");
      const nextMonth = MESES[currentIdx + 1];
      const stageNow = client.history?.[currentMonth];
      if (!stageNow || stageNow === "Histórico") return;
      const nextStage = { "2do Pedido": "3er Pedido", "3er Pedido": "4to Pedido", "4to Pedido": "Histórico" }[stageNow];
      
      if (window.confirm(`¿Avanzar a ${client.nombre} a ${nextStage}?`)) {
          setSyncStatus('saving');
          try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', client.id), { history: { ...client.history, [nextMonth]: nextStage }, etapa: nextStage, updatedAt: new Date().toISOString(), gestionEfectiva: 'SI' });
            setSyncStatus('synced'); showNotification(`Avanzado a ${nextStage}.`);
          } catch(e) { setSyncStatus('error'); }
      }
  };

  const handleSave = async (e) => {
    e.preventDefault(); if (!user) return;
    setSyncStatus('saving');
    try {
        const docId = formData.codigo || Date.now().toString();
        let finalData = { ...formData };
        if (editingId === 'NEW' && (!formData.history || Object.keys(formData.history).length === 0)) { finalData.history = { [currentMonth]: formData.etapa || '2do Pedido' }; }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', docId), { ...finalData, updatedAt: new Date().toISOString() }, { merge: true });
        setSyncStatus('synced'); showNotification("Guardado."); setEditingId(null);
    } catch (e) { setSyncStatus('error'); showNotification("Error al guardar.", "error"); }
  };

  const handleDelete = async () => {
      if(!editingId || editingId === 'NEW') return setEditingId(null);
      if(window.confirm("¿Eliminar registro?")) {
          setSyncStatus('saving'); await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', editingId));
          setSyncStatus('synced'); setEditingId(null); showNotification("Eliminado.");
      }
  };

  const filteredData = useMemo(() => filterZone === 'TODAS' ? data : data.filter(d => d.zona?.includes(filterZone)), [data, filterZone]);

  const historicalKPIs = useMemo(() => {
      const currentIdx = MESES.indexOf(currentMonth);
      const selectedMonths = MESES.slice(Math.max(0, currentIdx - 3), currentIdx + 1);
      const baseData = filteredData.filter(d => d.history?.[selectedMonths[0]]);
      const totalBase = baseData.length;
      
      const steps = selectedMonths.map((m, i) => {
          const count = baseData.filter(d => d.history[m]).length;
          const prevCount = i > 0 ? baseData.filter(d => d.history[selectedMonths[i-1]]).length : totalBase;
          return { month: m, count, retentionBase: totalBase > 0 ? Math.round((count/totalBase)*100) : 0, conversion: prevCount > 0 ? Math.round((count/prevCount)*100) : 100 };
      });
      return { 
          steps, totalBase, 
          activeInMonth: filteredData.filter(d => d.history?.[currentMonth] && d.history[currentMonth] !== 'Histórico').length, 
          moraInMonth: filteredData.filter(d => d.history?.[currentMonth] && d.estado === 'MOR').length 
      };
  }, [filteredData, currentMonth]);

  // APLICANDO EL FILTRO MODO AGENTE AQUÍ
  const globalList = useMemo(() => {
      return data.filter(d => {
          const inCurrentMonth = d.history?.[currentMonth];
          if (!inCurrentMonth) return false;
          
          // Si "Solo Pendientes" está activo, escondemos a los que ya tienen gestión "SÍ"
          if (showOnlyPending && d.gestionEfectiva === 'SI') return false;

          const matchSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || d.codigo.includes(searchTerm);
          return matchSearch;
      });
  }, [data, currentMonth, searchTerm, showOnlyPending]);

  const handleNewClient = (stagePreset) => { setEditingId('NEW'); setFormData({ codigo: '', nombre: '', zona: '', saldo: 0, estado: 'ACT', etapa: stagePreset || '2do Pedido', comentario: '', history: { [currentMonth]: stagePreset || '2do Pedido' }, gestionEfectiva: '', fechaFollowUp: '', fechaNacimiento: '' }); };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white p-2 rounded-lg"><Database size={24}/></div>
            <div>
                <h1 className="font-black text-xl tracking-tight">CONTROL NUI</h1>
                <div className="flex items-center gap-2 mt-0.5"><p className="text-xs font-bold text-slate-400 uppercase">Zona Nathaly</p><span className="text-slate-300">|</span><p className="text-[10px] text-slate-400 font-bold uppercase">CICLO 2025-2026</p></div>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-indigo-500 uppercase mb-1">MES DE TRABAJO</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {MESES.map(m => <button key={m} onClick={() => setCurrentMonth(m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentMonth === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{m.substring(0,3)}</button>)}
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Download size={16}/> EXCEL</button>
            <div className="relative group">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full opacity-0 cursor-pointer" disabled={isImporting} />
                <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">{isImporting ? <Loader2 className="animate-spin" size={16}/> : <FileUp size={16}/>} SUBIR CSV</button>
            </div>
            <button onClick={() => setActiveTab(activeTab === 'gestion' ? 'dashboard' : 'gestion')} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                {activeTab === 'gestion' ? <Layout size={16}/> : <List size={16}/>} {activeTab === 'gestion' ? 'VER DASHBOARD' : 'TABLERO'}
            </button>
        </div>
      </header>

      {notification && <div className="fixed top-24 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl z-50 font-bold flex items-center gap-3"><CheckCircle/> {notification.msg}</div>}

      <main className="flex-1 w-full mx-auto p-4 pb-16 h-[calc(100vh-80px)] overflow-hidden">
        {activeTab === 'gestion' && (
            <div className="flex flex-col h-full gap-4">
                <div className="flex justify-between shrink-0">
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-2 rounded-xl border flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={16}/></div><div><p className="text-[10px] uppercase font-bold text-slate-400">Mostrando</p><p className="text-lg font-black">{globalList.length}</p></div></div>
                        
                        {/* BOTÓN MODO AGENTE */}
                        <button 
                            onClick={() => setShowOnlyPending(!showOnlyPending)} 
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showOnlyPending ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-inner' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'}`}
                        >
                            <Filter size={16}/> {showOnlyPending ? 'VISTA: SOLO PENDIENTES' : 'VISTA: TODOS'}
                        </button>

                        <div className="relative w-64"><Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" /><input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    </div>
                    <button onClick={() => handleNewClient()} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-colors"><UserPlus size={18}/> NUEVO INGRESO</button>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex h-full gap-6 min-w-max px-2">
                        {ETAPAS.map((stage) => {
                            const clientsInStage = globalList.filter(c => c.history[currentMonth] === stage);
                            return (
                                <div key={stage} className={`w-80 flex flex-col rounded-2xl ${COLORS.bgStages[stage]} border ${COLORS.borderStages[stage]} h-full`}>
                                    <div className="p-4 flex justify-between shrink-0 border-b border-white/50"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS.stages[stage]}}></div><h3 className="font-black text-sm uppercase">{stage}</h3></div><span className="bg-white/60 px-2 rounded-md text-xs font-bold text-slate-500">{clientsInStage.length}</span></div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                        {clientsInStage.map(client => (
                                            <div key={client.id} onClick={() => { setEditingId(client.id); setFormData(client); }} className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${client.gestionEfectiva === 'NO' ? 'border-l-4 border-l-red-500' : 'border-slate-100'}`}>
                                                <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 rounded-md flex items-center gap-1"><Fingerprint size={10}/> {client.codigo}</span>{client.estado === 'MOR' && <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 rounded">MORA</span>}</div>
                                                <h4 className="font-bold text-sm mb-3 leading-tight">{client.nombre}</h4>
                                                {client.fechaFollowUp && <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded"><Clock size={10}/> Seguir: {client.fechaFollowUp}</div>}
                                                <div className="flex justify-between pt-3 border-t border-slate-50">
                                                    <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase">Saldo</span><span className="font-mono text-xs font-bold flex items-center"><DollarSign size={10}/>{client.saldo}</span></div>
                                                    {stage !== '4to Pedido' && stage !== 'Histórico' && <button onClick={(e) => { e.stopPropagation(); handleAdvanceStage(client); }} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors" title="Confirmar Pedido"><CheckCircle size={16}/></button>}
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => handleNewClient(stage)} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-white transition-all flex justify-center items-center gap-2"><Plus size={16}/> Agregar a {stage}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {editingId && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                            <div className="p-6 border-b flex justify-between bg-slate-50">
                                <div><h3 className="font-black text-xl flex items-center gap-2">{editingId === 'NEW' ? <UserPlus className="text-emerald-500"/> : <Edit className="text-indigo-500"/>} {editingId === 'NEW' ? 'Nuevo Ingreso' : 'Ficha de Cliente'}</h3><p className="text-xs text-slate-500 mt-1">Mes: {currentMonth}</p></div>
                                <div className="flex gap-2">{editingId !== 'NEW' && <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg"><Trash2 size={20}/></button>}<button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-lg"><XCircle size={24}/></button></div>
                            </div>
                            <form className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2"><label className="text-xs font-bold uppercase block mb-2 text-slate-400">Nombre</label><input required className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400">Código</label><input required className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500" value={formData.codigo || ''} onChange={e => setFormData({...formData, codigo: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400">Zona</label><input className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500" value={formData.zona || ''} onChange={e => setFormData({...formData, zona: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400">Cumpleaños</label><input type="text" className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500" value={formData.fechaNacimiento || ''} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400">Saldo ($)</label><input type="number" className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold" value={formData.saldo || 0} onChange={e => setFormData({...formData, saldo: e.target.value})} /></div>
                                    <div className="col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <h4 className="text-sm font-black mb-4 flex items-center gap-2"><Phone size={16} className="text-indigo-500"/>Registro de Gestión</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400">¿Gestión Efectiva?</label><select className={`w-full p-3.5 border-2 rounded-xl outline-none font-bold ${formData.gestionEfectiva === 'SI' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : formData.gestionEfectiva === 'NO' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-100'}`} value={formData.gestionEfectiva || ''} onChange={e => setFormData({...formData, gestionEfectiva: e.target.value})}><option value="">-- Seleccionar --</option><option value="SI">SÍ - Confirmado</option><option value="NO">NO - FollowUp</option></select></div>
                                            {formData.gestionEfectiva === 'NO' && <div><label className="text-xs font-bold uppercase text-red-400 block mb-2">Fecha Follow-Up</label><input type="date" className="w-full p-3.5 bg-white border-2 border-red-100 rounded-xl outline-none focus:border-red-500 font-bold" value={formData.fechaFollowUp || ''} onChange={e => setFormData({...formData, fechaFollowUp: e.target.value})} /></div>}
                                        </div>
                                    </div>
                                    {editingId === 'NEW' && <div className="col-span-2 bg-indigo-50 p-5 rounded-2xl border border-indigo-100"><label className="text-xs font-bold uppercase text-indigo-500 block mb-3 flex items-center gap-2"><Calendar size={14}/>Etapa en {currentMonth}</label><div className="flex gap-3">{ETAPAS.slice(0,3).map(st => <button key={st} type="button" onClick={() => setFormData({...formData, etapa: st, history: {[currentMonth]: st}})} className={`flex-1 py-3 text-xs rounded-xl font-bold border-2 transition-all ${formData.etapa === st ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400'}`}>{st}</button>)}</div></div>}
                                </div>
                                <div><label className="text-xs font-bold uppercase block mb-2 text-slate-400 mt-6">Comentarios</label><textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl h-32 outline-none focus:border-indigo-500" value={formData.comentario || ''} onChange={e => setFormData({...formData, comentario: e.target.value})} /></div>
                            </form>
                            <div className="p-6 border-t bg-slate-50 flex justify-end gap-4"><button type="button" onClick={() => setEditingId(null)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-100">Cancelar</button><button onClick={handleSave} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 flex items-center gap-2 shadow-lg shadow-indigo-200">{syncStatus === 'saving' ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {syncStatus === 'saving' ? 'Guardando...' : 'GUARDAR'}</button></div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8 overflow-y-auto pb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4"><Filter size={16}/><select className="bg-slate-50 border rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={filterZone} onChange={e => setFilterZone(e.target.value)}>{uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                <div className="bg-white p-8 rounded-2xl shadow-sm relative">
                    <div className="flex justify-between items-start mb-8"><h3 className="font-black text-2xl uppercase flex items-center gap-3"><Layers className="text-indigo-600"/> Efectividad ({filterZone})</h3><div className="bg-indigo-50 p-3 rounded-xl"><p className="text-xs font-bold text-indigo-400 uppercase">Retención Acumulada</p><p className="text-3xl font-black text-indigo-600">{historicalKPIs.steps[historicalKPIs.steps.length - 1]?.retentionBase || 0}%</p></div></div>
                    <div className="flex justify-between gap-2 px-2 pb-8 overflow-x-auto">{historicalKPIs.steps.map((step, idx) => <RetentionStep key={idx} label={step.month} count={step.count} percent={step.retentionBase} conversionRate={step.conversion} isLast={idx === historicalKPIs.steps.length - 1}/>)}</div>
                    <div className="h-64 w-full mt-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historicalKPIs.steps}><defs><linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="month" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} /><CartesianGrid vertical={false} stroke="#f1f5f9" /><Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" /></AreaChart></ResponsiveContainer></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><KpiCard title={`Activos en ${currentMonth}`} value={historicalKPIs.activeInMonth} subtext={`Clientes gestionables en ${filterZone}`} color="indigo"/><KpiCard title="Cartera en Riesgo" value={historicalKPIs.moraInMonth} subtext="Detectados en Mora" color="red"/><KpiCard title="Total Histórico" value={filteredData.length} subtext="Base de datos filtrada" color="emerald"/></div>
            </div>
        )}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-2 px-6 flex justify-between items-center text-[10px] uppercase font-bold fixed bottom-0 w-full z-50">
        <div className="flex items-center gap-4"><span className="flex items-center gap-1.5">{syncStatus === 'synced' ? <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}{syncStatus === 'synced' ? 'SISTEMA OPERATIVO' : 'SINCRONIZANDO...'}</span><span className="text-slate-600">|</span><span className="flex items-center gap-1"><ShieldCheck size={10}/> TLS 1.3</span></div>
        <div className="flex items-center gap-2"><Wifi size={10} className={syncStatus === 'error' ? 'text-red-500' : 'text-emerald-500'}/>{lastSaved ? `ÚLTIMA SYNC: ${lastSaved.toLocaleTimeString()}` : 'INICIANDO...'}</div>
      </footer>
    </div>
  );
}