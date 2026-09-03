import React from 'react';
import { MapPin, AlertTriangle, ShieldCheck, Activity, Radio } from 'lucide-react';
import './Header.css';

export function Header({ totalCidade, totalPendentes, totalResolvidas, serverOnline }) {
  return (
    <header className="header-urbano glass-panel animate-fade-in">
      <div className="header-left">
        <div className="logo-badge">
          <MapPin className="logo-icon" size={28} />
          <div className="logo-pulse"></div>
        </div>
        <div>
          <div className="title-wrapper">
            <h1 className="header-title">Voz Urbana</h1>
            <span className="badge-versao">Americana - SP</span>
          </div>
          <p className="header-subtitle">
            Central Colaborativa de Mapeamento e Denúncias de Americana
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Contadores Rápidos do Header */}
        <div className="stat-pill">
          <span className="stat-pill-label">Total Americana</span>
          <span className="stat-pill-value">{totalCidade}</span>
        </div>

        <div className="stat-pill pill-pendente">
          <span className="stat-pill-label">Em Aberto</span>
          <span className="stat-pill-value">{totalPendentes}</span>
        </div>

        <div className="stat-pill pill-resolvido">
          <span className="stat-pill-label">Resolvidas</span>
          <span className="stat-pill-value">{totalResolvidas}</span>
        </div>

        {/* Indicador de Status do json-server */}
        <div className={`status-conexao ${serverOnline ? 'online' : 'offline'}`}>
          <Radio size={14} className="icon-pulse" />
          <span>{serverOnline ? 'API Conectada' : 'API Offline'}</span>
        </div>
      </div>
    </header>
  );
}
