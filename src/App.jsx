import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Search, TrendingUp, Activity, Save, Edit, UserPlus, CheckCircle, XCircle,
  Layout, List, Loader2, Trash2, Database, Calendar, Layers, Wifi, ShieldCheck, Fingerprint, FileUp, DollarSign, Download, Filter, Phone, Clock
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- CONSTANTES ---
const COLORS = {
  stages: { '2do Pedido': '#6366f1', '3er Pedido': '#8b5cf6', '4to Pedido': '#ec4899', 'Histórico': '#10b981' },
  bgStages: { '2do Pedido': 'bg-indigo-50', '3er Pedido': 'bg-violet-50', '4to Pedido': 'bg-pink-50', 'Histórico': 'bg-emerald-50' },
  borderStages: { '2do Pedido': 'border-indigo-200', '3er Pedido': 'border-violet-200', '4to Pedido': 'border-pink-200', 'Histórico': 'border-emerald-200' }
};
const MESES = ["AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "ENERO", "FEBRERO"];
const ETAPAS = ["2do Pedido", "3er Pedido", "4to Pedido", "Histórico"];
const INITIAL_DATA = [];

// --- PARSER CSV INTELIGENTE (ADAPTADO EXACTAMENTE A TU ERP) ---
const parseCSV = (text) => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Encontrar índices de columnas basados en tus NUEVOS encabezados
  const headers = lines[0].split(/,|;/).map(h => h.trim().toUpperCase().replace(/"/g, ''));
  
  const idxCodigo = headers.findIndex(h => h === 'CODIGO' || h === 'CÓDIGO' || h.includes('CÓDIGO'));
  const idxNombre = headers.findIndex(h => h.includes('NOMBRE'));
  const idxZona = headers.findIndex(h => h === 'ZONA' || h.includes('ZONA'));
  const idxSaldo = headers.findIndex(h => h.includes('SALDO ACTUAL'));
  const idxStatus = headers.findIndex(h => h.includes('STATUS'));
  const idxCumple = headers.findIndex(h => h.includes('REGALIA DE CUMPLEAÑOS') || h.includes('CUMPLEAÑOS'));
  
  // Detección EXCLUSIVA de columnas de FACTURACIÓN (Ignoramos REGALÍA)
  const idxMes1 = headers.findIndex(h => h.includes('1º MES FACTURACION') || h.includes('1° MES FACTURACION'));
  const idxMes2 = headers.findIndex(h => h.includes('2º MES FACTURACION') || h.includes('2° MES FACTURACION'));
  const idxMes3 = headers.findIndex(h => h.includes('3º MES FACTURACION') || h.includes('3° MES FACTURACION'));
  const idxMes4 = headers.findIndex(h => h.includes('4º MES FACTURACION') || h.includes('4° MES FACTURACION'));

  const result = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex para separar por comas o punto y coma ignorando las que están dentro de comillas
    const row = lines[i].replace(/\r/g, '').split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)|;(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (row.length < 5) continue;

    const getVal = (idx) => idx !== -1 && row[idx] ? row[idx].replace(/"/g, '').trim() : '';

    const codigo = getVal(idxCodigo);
    const nombre = getVal(idxNombre);
    
    if (codigo && nombre) {
        // Lógica Automática de Etapa:
        let etapaDetectada = '2do Pedido'; // Default
        
        const v1 = getVal(idxMes1);
        const v2 = getVal(idxMes2);
        const v3 = getVal(idxMes3);
        const v4 = getVal(idxMes4);

        // Si tiene facturación en Mes 4 -> Histórico
        // Si tiene facturación en Mes 3 -> Va para 4to Pedido
        // Si tiene facturación en Mes 2 -> Va para 3er Pedido
        if (v4 && v4 !== '0' && v4 !== '-') etapaDetectada = 'Histórico';
        else if (v3 && v3 !== '0' && v3 !== '-') etapaDetectada = '4to Pedido';
        else if (v2 && v2 !== '0' && v2 !== '-') etapaDetectada = '3er Pedido';
        else if (v1 && v1 !== '0' && v1 !== '-') etapaDetectada = '2do Pedido';

        const saldoLimpio = parseFloat(getVal(idxSaldo).replace(/[$,]/g, '')) || 0;

        result.push({
            codigo,
            nombre,
            zona: getVal(idxZona),
            saldo: saldoLimpio,
            estado: getVal(idxStatus) || 'ACT',
            fechaNacimiento: getVal(idxCumple),
            etapaSugestida: etapaDetectada
        });
    }
  }
  return result;
};

// --- COMPONENTES VISUALES ---
const KpiCard = ({ title, value, subtext, color = "indigo" }) => (
  <div className={`bg-white p-4 rounded-xl border border-${color}-100 shadow-sm flex items-start gap-4`}>
    <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}><Activity size={24} /></div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>
    </div>
  </div>
);

const RetentionStep = ({ label, count, percent, isLast, conversionRate }) => {
  let color = 'bg-emerald-500';
  if (conversionRate < 50) color = 'bg-red-500';
  else if (conversionRate < 80) color = 'bg-amber-500';

  return (
    <div className="flex flex-col items-center flex-1 relative z-1
    