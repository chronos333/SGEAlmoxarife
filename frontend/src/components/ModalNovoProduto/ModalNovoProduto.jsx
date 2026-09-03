import React, { useState } from 'react';
import { api } from '../../services/api';
import './ModalNovoProduto.css';

export function ModalNovoProduto({ isOpen, onClose, onProdutoCriado }) {
  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || !sku.trim()) {
      setErro('Nome e SKU são obrigatórios.');
      return;
    }

    setCarregando(true);
    try {
      await api.criarProduto({
        nome: nome.trim(),
        sku: sku.trim().toUpperCase(),
        quantidade_estoque: Number(quantidadeEstoque) || 0,
      });

      setNome('');
      setSku('');
      setQuantidadeEstoque('');
      onProdutoCriado();
      onClose();
    } catch (err) {
      setErro('Erro ao cadastrar novo produto. Verifique a conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <h3>📦 Novo Produto no Almoxarifado</h3>
          <button className="btn-fechar" onClick={onClose}>×</button>
        </div>

        {erro && <div className="alerta-erro-modal">{erro}</div>}

        <form onSubmit={handleSubmit} className="form-modal">
          <div className="form-group">
            <label htmlFor="nome-prod">Nome do Material / Equipamento:</label>
            <input
              id="nome-prod"
              type="text"
              placeholder="Ex: Luva de Raspa Soldador"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sku-prod">Código SKU:</label>
            <input
              id="sku-prod"
              type="text"
              placeholder="Ex: EPI-LUV-009"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="estoque-inicial">Estoque Inicial (Unidades):</label>
            <input
              id="estoque-inicial"
              type="number"
              min="0"
              placeholder="Ex: 50"
              value={quantidadeEstoque}
              onChange={(e) => setQuantidadeEstoque(e.target.value)}
              disabled={carregando}
            />
          </div>

          <div className="modal-acoes">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onClose}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-salvar"
              disabled={carregando}
            >
              {carregando ? 'Salvando...' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
