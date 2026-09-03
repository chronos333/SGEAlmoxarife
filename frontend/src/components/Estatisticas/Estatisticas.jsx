import React, { useState } from 'react';
import { Users, Building2, Droplets, MapPin, Search, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { formatarCEP, limparCEP } from '../../services/viacep';
import './Estatisticas.css';

export function Estatisticas({ denuncias = [], listaDeDenuncias = [], enderecos = [], onFiltrarPorCEP }) {
  const [cepBusca, setCepBusca] = useState('');
  const [resultadoBuscaCEP, setResultadoBuscaCEP] = useState(null);

  // Total geral de manifestações/denúncias registradas na cidade inteira
  const totalCidade = listaDeDenuncias.length;

  // Contagem por categoria de problema
  const totalSocial = denuncias
    .filter((d) => d.tipoDoProblema === 'problemaSocial' && d.status !== 'resolvido')
    .reduce((acc, d) => acc + (Number(d.totalOcorrencias) || 1), 0);

  const totalEstrutural = denuncias
    .filter((d) => d.tipoDoProblema === 'estrutural' && d.status !== 'resolvido')
    .reduce((acc, d) => acc + (Number(d.totalOcorrencias) || 1), 0);

  const totalSaneamento = denuncias
    .filter((d) => d.tipoDoProblema === 'saneamento' && d.status !== 'resolvido')
    .reduce((acc, d) => acc + (Number(d.totalOcorrencias) || 1), 0);

  const totalResolvidas = denuncias.filter((d) => d.status === 'resolvido').length;

  // Ranking dos CEPs com mais denúncias acumuladas
  const contagemPorCep = {};
  listaDeDenuncias.forEach((item) => {
    if (item.cep) {
      contagemPorCep[item.cep] = (contagemPorCep[item.cep] || 0) + 1;
    }
  });

  const cepsMaisAfetados = Object.entries(contagemPorCep)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cep, total]) => {
      const endereco = enderecos.find((e) => e.cep === cep);
      return {
        cep,
        total,
        bairro: endereco ? endereco.bairro : 'Bairro não informado',
        rua: endereco ? endereco.rua || endereco.logradouro : '',
      };
    });

  /**
   * Consulta dinâmica de denúncias para um CEP específico
   */
  const handleBuscarCEP = (e) => {
    e.preventDefault();
    const cepFormatado = formatarCEP(cepBusca);
    const total = contagemPorCep[cepFormatado] || 0;
    const endereco = enderecos.find((e) => e.cep === cepFormatado);
    const denunciasDoCep = denuncias.filter((d) => d.cep === cepFormatado);

    setResultadoBuscaCEP({
      cep: cepFormatado,
      total,
      endereco,
      denuncias: denunciasDoCep,
    });
  };

  return (
    <section className="estatisticas-container animate-fade-in">
      {/* 4 Cards de Métricas Principais */}
      <div className="grid-metricas">
        {/* Total da Cidade */}
        <div className="card-metrica metrica-geral glass-panel">
          <div className="metrica-header">
            <span className="metrica-titulo">Total da Cidade</span>
            <div className="metrica-icon-wrapper bg-geral">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="metrica-valor">{totalCidade}</div>
          <p className="metrica-sub">
            Ocorrências registradas em todos os bairros
          </p>
        </div>

        {/* Problemas Sociais */}
        <div className="card-metrica metrica-social glass-panel">
          <div className="metrica-header">
            <span className="metrica-titulo">Problemas Sociais</span>
            <div className="metrica-icon-wrapper bg-social">
              <Users size={22} />
            </div>
          </div>
          <div className="metrica-valor color-social">{totalSocial}</div>
          <p className="metrica-sub">
            Moradores de rua, roubos, vandalismo
          </p>
        </div>

        {/* Problemas Estruturais */}
        <div className="card-metrica metrica-estrutural glass-panel">
          <div className="metrica-header">
            <span className="metrica-titulo">Problemas Estruturais</span>
            <div className="metrica-icon-wrapper bg-estrutural">
              <Building2 size={22} />
            </div>
          </div>
          <div className="metrica-valor color-estrutural">{totalEstrutural}</div>
          <p className="metrica-sub">
            Iluminação, buracos, encanamento e tráfego
          </p>
        </div>

        {/* Problemas de Saneamento */}
        <div className="card-metrica metrica-saneamento glass-panel">
          <div className="metrica-header">
            <span className="metrica-titulo">Saneamento Básico</span>
            <div className="metrica-icon-wrapper bg-saneamento">
              <Droplets size={22} />
            </div>
          </div>
          <div className="metrica-valor color-saneamento">{totalSaneamento}</div>
          <p className="metrica-sub">
            Lixo acumulado, esgoto a céu aberto, vazamentos
          </p>
        </div>
      </div>

      {/* Seção Inferior: Consulta de Denúncias por CEP & Top Locais Críticos */}
      <div className="grid-detalhes-estatisticas">
        {/* Ferramenta: Contador e Consulta de Denúncias por CEP */}
        <div className="card-consulta-cep glass-panel">
          <div className="consulta-header">
            <MapPin size={20} className="icon-destaque" />
            <div>
              <h3>Contador de Denúncias por CEP</h3>
              <p>Consulte quantas denúncias acumuladas existem em um CEP específico</p>
            </div>
          </div>

          <form onSubmit={handleBuscarCEP} className="form-busca-cep">
            <div className="input-group-cep">
              <input
                type="text"
                placeholder="Ex: 01001-000"
                value={cepBusca}
                onChange={(e) => setCepBusca(formatarCEP(e.target.value))}
                maxLength={9}
                className="input-cep"
              />
              <button type="submit" className="btn-consultar-cep">
                <Search size={18} />
                <span>Consultar</span>
              </button>
            </div>
          </form>

          {resultadoBuscaCEP && (
            <div className="resultado-cep-box animate-fade-in">
              <div className="resultado-badge-count">
                <span className="num-count">{resultadoBuscaCEP.total}</span>
                <span className="lbl-count">
                  {resultadoBuscaCEP.total === 1 ? 'Denúncia neste CEP' : 'Denúncias neste CEP'}
                </span>
              </div>
              <div className="resultado-info">
                <strong>CEP: {resultadoBuscaCEP.cep}</strong>
                {resultadoBuscaCEP.endereco ? (
                  <p>
                    {resultadoBuscaCEP.endereco.rua || resultadoBuscaCEP.endereco.logradouro} - {resultadoBuscaCEP.endereco.bairro} ({resultadoBuscaCEP.endereco.cidade}/{resultadoBuscaCEP.endereco.uf})
                  </p>
                ) : (
                  <p className="txt-aviso">Endereço ainda não registrado na base local.</p>
                )}
                {onFiltrarPorCEP && resultadoBuscaCEP.total > 0 && (
                  <button
                    type="button"
                    className="btn-ver-no-mapa"
                    onClick={() => onFiltrarPorCEP(resultadoBuscaCEP.cep)}
                  >
                    Filtrar este CEP no Mapa e Lista &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ranking de CEPs mais afetados */}
        <div className="card-ranking-ceps glass-panel">
          <div className="ranking-header">
            <AlertCircle size={20} className="icon-alerta" />
            <div>
              <h3>Regiões com Maior Incidência</h3>
              <p>Top 3 CEPs com maior volume de manifestações</p>
            </div>
          </div>

          <div className="lista-ranking">
            {cepsMaisAfetados.length === 0 ? (
              <p className="ranking-vazio">Nenhum registro encontrado ainda.</p>
            ) : (
              cepsMaisAfetados.map((item, idx) => (
                <div key={item.cep} className="ranking-item">
                  <div className="ranking-posicao">#{idx + 1}</div>
                  <div className="ranking-dados">
                    <div className="ranking-cep-bairro">
                      <strong>{item.cep}</strong>
                      <span className="ranking-bairro">&bull; {item.bairro}</span>
                    </div>
                    {item.rua && <span className="ranking-rua">{item.rua}</span>}
                  </div>
                  <div className="ranking-total">
                    <span className="total-numero">{item.total}</span>
                    <span className="total-label">relatos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
