import React, { useState } from 'react';
import './HistoricoMovimentacoes.css';

export function HistoricoMovimentacoes({ movimentacoes = [], produtos = [], usuarios = [] }) {
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Mapeamentos rápidos para buscar nomes de produtos e usuários sem O(N*M)
  const produtosMap = React.useMemo(() => {
    const map = new Map();
    produtos.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [produtos]);

  const usuariosMap = React.useMemo(() => {
    const map = new Map();
    usuarios.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [usuarios]);

  // Filtra as movimentações
  const movimentacoesFiltradas = movimentacoes.filter((mov) => {
    if (filtroTipo === 'entrada') return mov.tipo === 'entrada';
    if (filtroTipo === 'saida') return mov.tipo === 'saida';
    return true;
  });

  // Ordena por data decrescente (mais recente primeiro)
  const movimentacoesOrdenadas = [...movimentacoesFiltradas].sort((a, b) => {
    const dataA = new Date(a.data || 0).getTime();
    const dataB = new Date(b.data || 0).getTime();
    return dataB - dataA;
  });

  function formatarData(dataIso) {
    if (!dataIso) return '-';
    try {
      const data = new Date(dataIso);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(data);
    } catch {
      return dataIso;
    }
  }

  return (
    <div className="card-historico glass-panel animate-fade-in">
      <div className="card-historico-header">
        <div>
          <h2 className="section-title">Histórico de Movimentações</h2>
          <p className="section-subtitle">
            Registro de auditoria de todas as entradas e saídas de estoque
          </p>
        </div>

        <div className="filtro-tipo-historico">
          <button
            className={`btn-filtro-hist ${filtroTipo === 'todos' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('todos')}
          >
            Todas ({movimentacoes.length})
          </button>
          <button
            className={`btn-filtro-hist btn-hist-entrada ${filtroTipo === 'entrada' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('entrada')}
          >
            Entradas
          </button>
          <button
            className={`btn-filtro-hist btn-hist-saida ${filtroTipo === 'saida' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('saida')}
          >
            Saídas
          </button>
        </div>
      </div>

      {movimentacoesOrdenadas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>Nenhuma movimentação registrada no histórico.</p>
        </div>
      ) : (
        <div className="tabela-wrapper">
          <table className="tabela-historico">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Operação</th>
                <th>Produto / SKU</th>
                <th style={{ textAlign: 'right' }}>Qtd. Movimentada</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoesOrdenadas.map((mov) => {
                const prod = produtosMap.get(String(mov.produto_id));
                const user = usuariosMap.get(String(mov.usuario_id));
                const isEntrada = mov.tipo === 'entrada';

                return (
                  <tr key={mov.id} className="linha-historico">
                    <td className="col-data">{formatarData(mov.data)}</td>
                    <td>
                      <span className={`badge-operacao ${isEntrada ? 'badge-in' : 'badge-out'}`}>
                        {isEntrada ? '📥 Entrada' : '📤 Saída'}
                      </span>
                    </td>
                    <td>
                      <div className="hist-prod-info">
                        <strong>{prod ? prod.nome : `Produto #${mov.produto_id}`}</strong>
                        {prod && <span className="hist-prod-sku">{prod.sku}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`hist-qtd ${isEntrada ? 'qtd-in' : 'qtd-out'}`}>
                        {isEntrada ? `+${mov.quantidade_movimentada}` : `-${mov.quantidade_movimentada}`} un.
                      </span>
                    </td>
                    <td>
                      <div className="hist-user-info">
                        <span className="hist-user-name">
                          {user ? user.nome : `Usuário #${mov.usuario_id}`}
                        </span>
                        {user && <span className="hist-user-cargo">{user.cargo}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
