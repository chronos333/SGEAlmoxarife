import React from 'react';
import './DashboardCards.css';

export function DashboardCards({ produtos = [], movimentacoes = [] }) {
  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((acc, p) => acc + (Number(p.quantidade_estoque) || 0), 0);
  
  const entradas = movimentacoes.filter((m) => m.tipo === 'entrada');
  const saidas = movimentacoes.filter((m) => m.tipo === 'saida');

  const totalQtdEntrada = entradas.reduce((acc, m) => acc + (Number(m.quantidade_movimentada) || 0), 0);
  const totalQtdSaida = saidas.reduce((acc, m) => acc + (Number(m.quantidade_movimentada) || 0), 0);

  const produtosAlerta = produtos.filter((p) => Number(p.quantidade_estoque) <= 15).length;

  return (
    <div className="dashboard-cards-grid animate-fade-in">
      <div className="dash-card card-primary">
        <div className="dash-icon">🏷️</div>
        <div className="dash-info">
          <span className="dash-label">Variedade de Itens</span>
          <span className="dash-value">{totalProdutos}</span>
          <span className="dash-subtext">SKUs cadastrados</span>
        </div>
      </div>

      <div className="dash-card card-info">
        <div className="dash-icon">📊</div>
        <div className="dash-info">
          <span className="dash-label">Estoque Total</span>
          <span className="dash-value">{totalEstoque}</span>
          <span className="dash-subtext">Unidades físicas armazenadas</span>
        </div>
      </div>

      <div className="dash-card card-success">
        <div className="dash-icon">📥</div>
        <div className="dash-info">
          <span className="dash-label">Total Entradas</span>
          <span className="dash-value">+{totalQtdEntrada}</span>
          <span className="dash-subtext">{entradas.length} operações registradas</span>
        </div>
      </div>

      <div className="dash-card card-warning">
        <div className="dash-icon">📤</div>
        <div className="dash-info">
          <span className="dash-label">Total Saídas</span>
          <span className="dash-value">-{totalQtdSaida}</span>
          <span className="dash-subtext">{saidas.length} requisições atendidas</span>
        </div>
      </div>

      {produtosAlerta > 0 && (
        <div className="dash-card card-alert">
          <div className="dash-icon">⚠️</div>
          <div className="dash-info">
            <span className="dash-label">Estoque Baixo</span>
            <span className="dash-value alert-text">{produtosAlerta}</span>
            <span className="dash-subtext">Produtos com &le; 15 unidades</span>
          </div>
        </div>
      )}
    </div>
  );
}
