import React, { useState } from 'react';
import './ListaProdutos.css';

export function ListaProdutos({ produtos = [], onAbrirModalNovo, onSelecionarParaMovimentar }) {
  const [busca, setBusca] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState('todos');

  // Filtra produtos por busca de texto e status de quantidade
  const produtosFiltrados = produtos.filter((prod) => {
    const correspondeTexto =
      prod.nome.toLowerCase().includes(busca.toLowerCase()) ||
      prod.sku.toLowerCase().includes(busca.toLowerCase());

    const estoque = Number(prod.quantidade_estoque);

    if (!correspondeTexto) return false;

    if (filtroEstoque === 'critico') return estoque <= 15;
    if (filtroEstoque === 'medio') return estoque > 15 && estoque <= 50;
    if (filtroEstoque === 'alto') return estoque > 50;

    return true;
  });

  function getStatusBadge(estoque) {
    if (estoque <= 15) {
      return <span className="badge-estoque badge-critico">Crítico ({estoque} un)</span>;
    }
    if (estoque <= 50) {
      return <span className="badge-estoque badge-alerta">Moderado ({estoque} un)</span>;
    }
    return <span className="badge-estoque badge-normal">Adequado ({estoque} un)</span>;
  }

  return (
    <div className="card-produtos glass-panel animate-fade-in">
      <div className="card-produtos-header">
        <div>
          <h2 className="section-title">Estoque do Almoxarifado</h2>
          <p className="section-subtitle">
            {produtos.length} produtos cadastrados no inventário
          </p>
        </div>

        <button 
          type="button" 
          id="btn-novo-produto"
          className="btn-novo-produto" 
          onClick={onAbrirModalNovo}
        >
          <span>+</span> Novo Produto
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-wrapper">
          <span className="busca-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-busca"
          />
          {busca && (
            <button className="btn-limpar-busca" onClick={() => setBusca('')}>
              ×
            </button>
          )}
        </div>

        <div className="filtro-status-wrapper">
          <button
            className={`btn-filtro ${filtroEstoque === 'todos' ? 'ativo' : ''}`}
            onClick={() => setFiltroEstoque('todos')}
          >
            Todos
          </button>
          <button
            className={`btn-filtro ${filtroEstoque === 'critico' ? 'ativo' : ''}`}
            onClick={() => setFiltroEstoque('critico')}
          >
            Baixo / Crítico
          </button>
          <button
            className={`btn-filtro ${filtroEstoque === 'medio' ? 'ativo' : ''}`}
            onClick={() => setFiltroEstoque('medio')}
          >
            Moderado
          </button>
          <button
            className={`btn-filtro ${filtroEstoque === 'alto' ? 'ativo' : ''}`}
            onClick={() => setFiltroEstoque('alto')}
          >
            Alto
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔎</span>
          <p>Nenhum produto encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="tabela-wrapper">
          <table className="tabela-produtos">
            <thead>
              <tr>
                <th>Código / SKU</th>
                <th>Nome do Item</th>
                <th>Status Estoque</th>
                <th style={{ textAlign: 'right' }}>Qtd. Física</th>
                <th style={{ textAlign: 'center' }}>Ação Rápida</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((item) => (
                <tr key={item.id} className="linha-produto">
                  <td>
                    <span className="sku-badge">{item.sku}</span>
                  </td>
                  <td>
                    <strong className="produto-nome">{item.nome}</strong>
                  </td>
                  <td>{getStatusBadge(Number(item.quantidade_estoque))}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="estoque-numero">{item.quantidade_estoque} un.</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-acao-movimentar"
                      title="Movimentar este item"
                      onClick={() => onSelecionarParaMovimentar(item.id)}
                    >
                      ⚡ Movimentar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
