import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  CheckCircle,
  Trash2,
  Eye,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import './ListaDenuncias.css';

export function ListaDenuncias({
  denuncias = [],
  enderecos = [],
  listaDeDenuncias = [],
  onResolverDenuncia,
  onExcluirDenuncia,
  onVerDetalhes,
}) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'problemaSocial' | 'estrutural' | 'saneamento'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'pendente' | 'resolvido'

  // Mapa de CEP para contagem acumulada
  const contagemPorCep = {};
  listaDeDenuncias.forEach((item) => {
    if (item.cep) {
      contagemPorCep[item.cep] = (contagemPorCep[item.cep] || 0) + 1;
    }
  });

  // Filtragem das denúncias
  const denunciasFiltradas = denuncias.filter((denuncia) => {
    // Filtro por tipo
    if (filtroTipo !== 'todos' && denuncia.tipoDoProblema !== filtroTipo) {
      return false;
    }

    // Filtro por status
    if (filtroStatus !== 'todos' && denuncia.status !== filtroStatus) {
      return false;
    }

    // Filtro por busca textual (CEP, título, descrição, bairro)
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const endereco = enderecos.find((e) => e.cep === denuncia.cep);
      const matchCep = (denuncia.cep || '').toLowerCase().includes(termo);
      const matchTitulo = (denuncia.problemaPrincipal || '').toLowerCase().includes(termo);
      const matchDesc = (denuncia.descricao || '').toLowerCase().includes(termo);
      const matchBairro = (endereco?.bairro || '').toLowerCase().includes(termo);
      const matchRua = (endereco?.rua || endereco?.logradouro || '').toLowerCase().includes(termo);

      return matchCep || matchTitulo || matchDesc || matchBairro || matchRua;
    }

    return true;
  });

  return (
    <div className="lista-denuncias-card glass-panel animate-fade-in">
      {/* Header com Controles e Filtros */}
      <div className="lista-header">
        <div className="lista-header-left">
          <FileText size={22} className="icon-lista-header" />
          <div>
            <h3 className="lista-titulo">Ocorrências Registradas ({denunciasFiltradas.length})</h3>
            <p className="lista-subtitulo">
              Acompanhamento e gestão do ciclo de vida das denúncias
            </p>
          </div>
        </div>

        {/* Barra de Busca Rápida */}
        <div className="busca-wrapper">
          <Search size={16} className="icon-busca" />
          <input
            type="text"
            placeholder="Buscar por CEP, rua, bairro ou tema..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-busca-lista"
          />
        </div>
      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="filtros-chips-bar">
        <div className="chips-grupo">
          <span className="lbl-filtro">Categoria:</span>
          <button
            className={`chip-btn ${filtroTipo === 'todos' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('todos')}
          >
            Todas
          </button>
          <button
            className={`chip-btn chip-social ${filtroTipo === 'problemaSocial' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('problemaSocial')}
          >
            👥 Social
          </button>
          <button
            className={`chip-btn chip-estrutural ${filtroTipo === 'estrutural' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('estrutural')}
          >
            🏗️ Estrutural
          </button>
          <button
            className={`chip-btn chip-saneamento ${filtroTipo === 'saneamento' ? 'ativo' : ''}`}
            onClick={() => setFiltroTipo('saneamento')}
          >
            💧 Saneamento
          </button>
        </div>

        <div className="chips-grupo">
          <span className="lbl-filtro">Status:</span>
          <button
            className={`chip-btn ${filtroStatus === 'todos' ? 'ativo' : ''}`}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos
          </button>
          <button
            className={`chip-btn ${filtroStatus === 'pendente' ? 'ativo' : ''}`}
            onClick={() => setFiltroStatus('pendente')}
          >
            Pendentes
          </button>
          <button
            className={`chip-btn chip-resolvido ${filtroStatus === 'resolvido' ? 'ativo' : ''}`}
            onClick={() => setFiltroStatus('resolvido')}
          >
            Resolvidos
          </button>
        </div>
      </div>

      {/* Grid de Cards de Denúncias */}
      <div className="grid-cards-denuncias">
        {denunciasFiltradas.length === 0 ? (
          <div className="estado-vazio glass-panel">
            <AlertCircle size={40} className="icon-vazio" />
            <p className="txt-vazio-titulo">Nenhuma ocorrência encontrada</p>
            <p className="txt-vazio-sub">
              Tente ajustar os filtros de categoria ou busque por outro termo.
            </p>
          </div>
        ) : (
          denunciasFiltradas.map((denuncia) => {
            const endereco = enderecos.find((e) => e.cep === denuncia.cep);
            const totalOcorrenciasCep = contagemPorCep[denuncia.cep] || Number(denuncia.totalOcorrencias) || 1;
            const isResolvido = denuncia.status === 'resolvido';

            let tagClasse = 'tag-social';
            let tagEmoji = '👥';
            let tagNome = 'Problema Social';

            if (denuncia.tipoDoProblema === 'estrutural') {
              tagClasse = 'tag-estrutural';
              tagEmoji = '🏗️';
              tagNome = 'Estrutural';
            } else if (denuncia.tipoDoProblema === 'saneamento') {
              tagClasse = 'tag-saneamento';
              tagEmoji = '💧';
              tagNome = 'Saneamento';
            }

            return (
              <div
                key={denuncia.id}
                className={`card-item-denuncia ${isResolvido ? 'card-resolvido' : ''}`}
              >
                {/* Cabeçalho do Card */}
                <div className="card-item-topo">
                  <div className="card-tags-row">
                    <span className={`badge-categoria ${tagClasse}`}>
                      {tagEmoji} {tagNome}
                    </span>

                    <span className={`badge-status ${isResolvido ? 'status-ok' : 'status-alerta'}`}>
                      {isResolvido ? 'Resolvido' : 'Pendente'}
                    </span>
                  </div>

                  {/* Contador de Reclamações no mesmo CEP */}
                  <div className="badge-contador-ocorrencias" title="Total de denúncias associadas a este CEP">
                    <TrendingUp size={14} />
                    <span>{totalOcorrenciasCep} {totalOcorrenciasCep === 1 ? 'relato no CEP' : 'relatos no CEP'}</span>
                  </div>
                </div>

                {/* Título e Descrição */}
                <h4 className="card-item-titulo">{denuncia.problemaPrincipal}</h4>
                <p className="card-item-desc">{denuncia.descricao}</p>

                {/* Dados de Endereço */}
                <div className="card-item-endereco">
                  <MapPin size={16} className="icon-pin-card" />
                  <div className="endereco-detalhes">
                    <strong>{endereco ? `${endereco.rua || endereco.logradouro}, ${endereco.bairro}` : 'Endereço Local'}</strong>
                    <span>CEP: {denuncia.cep} &bull; {endereco ? `${endereco.cidade}/${endereco.uf}` : 'São Paulo/SP'}</span>
                  </div>
                </div>

                {/* Rodapé com Tempo e Ações */}
                <div className="card-item-rodape">
                  <div className="tempo-indicador">
                    <Clock size={14} />
                    <span>{denuncia.tempoDoProblema || 'Recente'}</span>
                  </div>

                  <div className="acoes-card">
                    {/* Botão Ver Ocorrências / Histórico */}
                    <button
                      type="button"
                      className="btn-acao btn-detalhes"
                      onClick={() => onVerDetalhes(denuncia)}
                      title="Ver histórico de ocorrências registradas"
                    >
                      <Eye size={15} />
                      <span>Histórico</span>
                    </button>

                    {/* Botão Resolver Denúncia */}
                    {!isResolvido && (
                      <button
                        type="button"
                        className="btn-acao btn-resolver"
                        onClick={() => onResolverDenuncia(denuncia.id, false)}
                        title="Marcar problema como solucionado"
                      >
                        <CheckCircle size={15} />
                        <span>Resolver</span>
                      </button>
                    )}

                    {/* Botão Excluir / Remover Problema */}
                    <button
                      type="button"
                      className="btn-acao btn-excluir"
                      onClick={() => onExcluirDenuncia(denuncia.id)}
                      title="Remover denúncia definitivamente"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
