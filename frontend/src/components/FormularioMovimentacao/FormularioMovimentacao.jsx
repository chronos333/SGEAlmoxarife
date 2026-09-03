import React, { useState } from 'react';
import { api } from '../../services/api';
import './FormularioMovimentacao.css';

/**
 * Componente responsável pelo Registro de Movimentações de Estoque
 * Contém a REGRA DE NEGÓCIO PRINCIPAL:
 * 1. Validação de saída com saldo insuficiente.
 * 2. Atualização atômica simulada (POST em /movimentacoes + PATCH em /produtos/:id).
 */
export function FormularioMovimentacao({ produtos = [], usuarios = [], onMovimentacaoRealizada }) {
  const [produtoId, setProdutoId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [tipo, setTipo] = useState('entrada'); // 'entrada' ou 'saida'
  const [quantidade, setQuantidade] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  // Localiza o produto selecionado em tempo real para exibir prévia do estoque
  const produtoSelecionado = produtos.find((p) => String(p.id) === String(produtoId));
  const estoqueAtual = produtoSelecionado ? Number(produtoSelecionado.quantidade_estoque) : 0;
  const qtdNumerica = Number(quantidade) || 0;

  // Cálculo da prévia do novo estoque
  const novoEstoquePrevisto =
    tipo === 'entrada' ? estoqueAtual + qtdNumerica : estoqueAtual - qtdNumerica;

  /**
   * Submissão e processamento da movimentação
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback({ tipo: '', mensagem: '' });

    if (!produtoId || !usuarioId || !quantidade || qtdNumerica <= 0) {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Preencha todos os campos e certifique-se de que a quantidade seja superior a 0.',
      });
      return;
    }

    if (!produtoSelecionado) {
      setFeedback({ tipo: 'erro', mensagem: 'Produto selecionado inválido.' });
      return;
    }

    // =========================================================================
    // REGRA DE NEGÓCIO 1: Bloqueio de Saída com Saldo Insuficiente
    // =========================================================================
    if (tipo === 'saida' && qtdNumerica > estoqueAtual) {
      setFeedback({
        tipo: 'erro',
        mensagem: `Ação bloqueada! Saldo insuficiente para saída. O produto "${produtoSelecionado.nome}" possui apenas ${estoqueAtual} unidade(s) disponível(is) em estoque.`,
      });
      return;
    }

    // =========================================================================
    // REGRA DE NEGÓCIO 2: Cálculo do Novo Estoque
    // =========================================================================
    const novoEstoqueCalculado =
      tipo === 'entrada' ? estoqueAtual + qtdNumerica : estoqueAtual - qtdNumerica;

    setCarregando(true);

    try {
      // 1. Grava o registro da movimentação no json-server (POST /movimentacoes)
      await api.criarMovimentacao({
        produto_id: String(produtoId),
        usuario_id: String(usuarioId),
        tipo,
        quantidade_movimentada: qtdNumerica,
      });

      // 2. Atualiza a quantidade do produto no json-server (PATCH /produtos/:id)
      await api.atualizarEstoqueProduto(produtoId, novoEstoqueCalculado);

      setFeedback({
        tipo: 'sucesso',
        mensagem: `Sucesso! Movimentação de ${tipo.toUpperCase()} registrada. O estoque de "${produtoSelecionado.nome}" agora é de ${novoEstoqueCalculado} unidades.`,
      });

      // Limpa os campos do formulário
      setQuantidade('');
      setProdutoId('');

      // Notifica o componente raiz (App.jsx) para sincronizar todas as listas e cards
      if (onMovimentacaoRealizada) {
        await onMovimentacaoRealizada();
      }
    } catch (error) {
      setFeedback({
        tipo: 'erro',
        mensagem: 'Ocorreu um erro ao comunicar com a API. Verifique se o json-server está rodando.',
      });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="card-movimentacao glass-panel animate-fade-in">
      <div className="card-movimentacao-header">
        <div className="header-icon-box">⚡</div>
        <div>
          <h2 className="card-title">Registrar Movimentação</h2>
          <p className="card-desc">Lançamento de entrada ou saída física no almoxarifado</p>
        </div>
      </div>

      {feedback.mensagem && (
        <div className={`feedback-alert feedback-${feedback.tipo}`}>
          <span className="feedback-icon">{feedback.tipo === 'erro' ? '🚫' : '✅'}</span>
          <span>{feedback.mensagem}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-movimentacao">
        {/* Seletor de Tipo com botões visuais */}
        <div className="form-group">
          <label className="form-label">Tipo de Movimentação</label>
          <div className="tipo-selector">
            <button
              type="button"
              className={`btn-tipo entrada ${tipo === 'entrada' ? 'ativo' : ''}`}
              onClick={() => setTipo('entrada')}
              disabled={carregando}
            >
              <span className="tipo-simbolo">+</span> Entrada no Estoque
            </button>
            <button
              type="button"
              className={`btn-tipo saida ${tipo === 'saida' ? 'ativo' : ''}`}
              onClick={() => setTipo('saida')}
              disabled={carregando}
            >
              <span className="tipo-simbolo">-</span> Saída / Retirada
            </button>
          </div>
        </div>

        {/* Seleção do Produto */}
        <div className="form-group">
          <label htmlFor="select-produto" className="form-label">
            Produto a ser movimentado <span className="req">*</span>
          </label>
          <select
            id="select-produto"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            disabled={carregando}
            required
          >
            <option value="">-- Selecione o item no estoque --</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.nome} ({prod.sku}) — Saldo: {prod.quantidade_estoque} un.
              </option>
            ))}
          </select>
        </div>

        {/* Seleção do Usuário Responsável */}
        <div className="form-group">
          <label htmlFor="select-usuario" className="form-label">
            Responsável pela Operação <span className="req">*</span>
          </label>
          <select
            id="select-usuario"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            disabled={carregando}
            required
          >
            <option value="">-- Selecione o usuário --</option>
            {usuarios.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nome} — {user.cargo}
              </option>
            ))}
          </select>
        </div>

        {/* Campo Quantidade */}
        <div className="form-group">
          <label htmlFor="input-quantidade" className="form-label">
            Quantidade a Movimentar <span className="req">*</span>
          </label>
          <input
            id="input-quantidade"
            type="number"
            min="1"
            step="1"
            placeholder="Ex: 10"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            disabled={carregando}
            required
          />
        </div>

        {/* Prévia de Estoque em Tempo Real */}
        {produtoSelecionado && qtdNumerica > 0 && (
          <div className="preview-estoque">
            <div className="preview-item">
              <span className="preview-label">Estoque Atual:</span>
              <span className="preview-value">{estoqueAtual} un.</span>
            </div>
            <div className="preview-arrow">➔</div>
            <div className="preview-item">
              <span className="preview-label">Após {tipo.toUpperCase()}:</span>
              <span
                className={`preview-value ${
                  novoEstoquePrevisto < 0
                    ? 'val-invalido'
                    : tipo === 'entrada'
                    ? 'val-positivo'
                    : 'val-neutro'
                }`}
              >
                {novoEstoquePrevisto} un. {novoEstoquePrevisto < 0 && '(Saldo Insuficiente!)'}
              </span>
            </div>
          </div>
        )}

        {/* Botão de Envio */}
        <button
          type="submit"
          id="btn-submeter-movimentacao"
          className={`btn-submeter ${tipo === 'entrada' ? 'btn-submeter-entrada' : 'btn-submeter-saida'}`}
          disabled={carregando}
        >
          {carregando ? (
            <span className="btn-loading">Processando atualização...</span>
          ) : (
            `Confirmar ${tipo === 'entrada' ? 'Entrada no Estoque' : 'Saída de Material'}`
          )}
        </button>
      </form>
    </div>
  );
}
