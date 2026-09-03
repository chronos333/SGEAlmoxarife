import React from 'react';
import { X, Calendar, Clock, User, MapPin, CheckCircle, AlertTriangle, Hash, FileText } from 'lucide-react';
import './ModalDetalhes.css';

export function ModalDetalhes({
  isOpen,
  onClose,
  denuncia,
  endereco,
  listaDeDenuncias = [],
  onResolverDenuncia,
}) {
  if (!isOpen || !denuncia) return null;

  // Filtra as ocorrências registradas em listaDeDenuncias associadas a esta denúncia (FK)
  const ocorrenciasRelacionadas = listaDeDenuncias.filter(
    (item) => String(item.caracteristicasDenuncia) === String(denuncia.id) || item.cep === denuncia.cep
  );

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

  const isResolvido = denuncia.status === 'resolvido';

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-conteudo glass-panel animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className={`badge-categoria ${tagClasse}`}>
              {tagEmoji} {tagNome}
            </span>
            <span className={`badge-status ${isResolvido ? 'status-ok' : 'status-alerta'}`}>
              {isResolvido ? 'Resolvido' : 'Pendente'}
            </span>
          </div>

          <button className="btn-fechar-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Informações Principais da Denúncia */}
        <div className="modal-secao-principal">
          <h2 className="modal-titulo">{denuncia.problemaPrincipal}</h2>
          <p className="modal-descricao">{denuncia.descricao}</p>

          {/* Endereço e CEP */}
          <div className="modal-box-endereco">
            <MapPin size={20} className="icon-modal-pin" />
            <div>
              <strong>
                {endereco
                  ? `${endereco.rua || endereco.logradouro}, ${endereco.bairro}`
                  : 'Endereço Local'}
              </strong>
              <p>
                CEP: {denuncia.cep} &bull; {endereco ? `${endereco.cidade}/${endereco.uf}` : 'São Paulo/SP'}
                {endereco?.complemento && ` &bull; ${endereco.complemento}`}
              </p>
            </div>
          </div>
        </div>

        {/* Linha do Tempo de Ocorrências (listaDeDenuncias) */}
        <div className="modal-secao-historico">
          <div className="historico-titulo-bar">
            <Hash size={18} className="icon-historico" />
            <h3>
              Histórico de Ocorrências Registradas ({ocorrenciasRelacionadas.length})
            </h3>
          </div>

          <div className="timeline-ocorrencias">
            {ocorrenciasRelacionadas.length === 0 ? (
              <p className="timeline-vazia">Nenhum registro detalhado na lista de denúncias.</p>
            ) : (
              ocorrenciasRelacionadas.map((ocorrencia, idx) => (
                <div key={ocorrencia.id || idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-card">
                    <div className="timeline-card-topo">
                      <span className="autor-nome">
                        <User size={14} />
                        {ocorrencia.autorDenuncia || 'Cidadão'}
                      </span>
                      <span className="data-hora">
                        <Calendar size={13} />
                        {ocorrencia.dataDenuncia || 'Data recente'} às {ocorrencia.horaDenuncia || '00:00'}
                      </span>
                    </div>
                    {ocorrencia.detalhe && (
                      <p className="detalhe-ocorrencia">
                        &ldquo;{ocorrencia.detalhe}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="modal-rodape">
          {!isResolvido && (
            <button
              type="button"
              className="btn-modal-resolver"
              onClick={() => {
                onResolverDenuncia(denuncia.id, false);
                onClose();
              }}
            >
              <CheckCircle size={18} />
              <span>Marcar como Problema Resolvido</span>
            </button>
          )}

          <button type="button" className="btn-modal-fechar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
