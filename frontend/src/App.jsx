import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';

// Componentes da Aplicação Urbana
import { Header } from './components/Header/Header';
import { Estatisticas } from './components/Estatisticas/Estatisticas';
import { MapaCidade } from './components/MapaCidade/MapaCidade';
import { FormularioDenuncia } from './components/FormularioDenuncia/FormularioDenuncia';
import { ListaDenuncias } from './components/ListaDenuncias/ListaDenuncias';
import { ModalDetalhes } from './components/ModalDetalhes/ModalDetalhes';

import { Map, PlusCircle, List, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import './App.css';

export function App() {
  // Estados das 5 Entidades do Sistema (db.json)
  const [usuarios, setUsuarios] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [denuncias, setDenuncias] = useState([]);
  const [listaDeDenuncias, setListaDeDenuncias] = useState([]);
  const [tiposDeProblema, setTiposDeProblema] = useState([]);

  // Estados de Controle de Interface
  const [carregando, setCarregando] = useState(true);
  const [serverOnline, setServerOnline] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('mapa'); // 'mapa' | 'relatar' | 'lista' | 'estatisticas'
  const [filtroCepAtivo, setFiltroCepAtivo] = useState('');
  
  // Modal de Detalhes da Denúncia
  const [denunciaSelecionada, setDenunciaSelecionada] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  /**
   * FUNÇÃO CENTRALIZADA DE SINCRONIZAÇÃO
   * Carrega todas as 5 entidades da base de dados (json-server) em paralelo
   */
  const carregarDados = useCallback(async () => {
    try {
      const [
        dadosUsuarios,
        dadosEnderecos,
        dadosDenuncias,
        dadosLista,
        dadosTipos,
      ] = await Promise.all([
        api.getUsuarios().catch(() => []),
        api.getEnderecos().catch(() => []),
        api.getDenuncias().catch(() => []),
        api.getListaDenuncias().catch(() => []),
        api.getTiposDeProblema().catch(() => []),
      ]);

      setUsuarios(dadosUsuarios);
      setEnderecos(dadosEnderecos);
      setDenuncias(dadosDenuncias);
      setListaDeDenuncias(dadosLista);
      setTiposDeProblema(dadosTipos);
      setServerOnline(true);
    } catch (error) {
      console.error('[ERRO] Falha ao carregar dados do json-server:', error);
      setServerOnline(false);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carregamento inicial ao montar o componente
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  /**
   * REGRA DE NEGÓCIO: Resolver ou Remover Denúncia
   * 
   * Se removerDefinitivo = true, exclui a denúncia e suas ocorrências em listaDeDenuncias.
   * Se removerDefinitivo = false, altera o status para 'resolvido'.
   */
  const handleResolverOuExcluirDenuncia = async (denunciaId, removerDefinitivo = false) => {
    try {
      await api.resolverDenuncia(denunciaId, removerDefinitivo);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao processar resolução/exclusão da denúncia:', error);
      alert('Não foi possível atualizar o status da denúncia.');
    }
  };

  /**
   * Abertura do modal de histórico detalhado
   */
  const handleAbrirDetalhes = (denuncia) => {
    setDenunciaSelecionada(denuncia);
    setModalDetalhesAberto(true);
  };

  /**
   * Filtra ocorrências por CEP e navega automaticamente até a visualização no mapa
   */
  const handleFiltrarPorCEP = (cep) => {
    setFiltroCepAtivo(cep);
    setAbaAtiva('mapa');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Cálculos de métricas para o Header
  const totalCidade = listaDeDenuncias.length;
  const totalPendentes = denuncias.filter((d) => d.status !== 'resolvido').length;
  const totalResolvidas = denuncias.filter((d) => d.status === 'resolvido').length;

  return (
    <div className="app-layout">
      <div className="container">
        {/* Topo do Sistema com Branding e Contadores Globais */}
        <Header
          totalCidade={totalCidade}
          totalPendentes={totalPendentes}
          totalResolvidas={totalResolvidas}
          serverOnline={serverOnline}
        />

        {/* Alerta caso o json-server esteja fora do ar */}
        {!serverOnline && (
          <div className="alerta-servidor-offline animate-fade-in glass-panel">
            <AlertCircle className="offline-icon" size={28} />
            <div className="alerta-texto">
              <strong>Atenção: json-server não detectado em http://localhost:3001!</strong>
              <p>
                Inicie o servidor de banco de dados executando no terminal:{' '}
                <code>npx json-server backend/db.json --port 3001</code>
              </p>
            </div>
            <button className="btn-tentar-novamente" onClick={carregarDados}>
              <RefreshCw size={16} />
              <span>Reconectar</span>
            </button>
          </div>
        )}

        {/* Barra Superior de Navegação em Abas */}
        <nav className="nav-abas-principais glass-panel">
          <button
            className={`btn-aba-principal ${abaAtiva === 'mapa' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('mapa')}
          >
            <Map size={18} />
            <span>Mapa & Painel Cidadão</span>
          </button>

          <button
            className={`btn-aba-principal ${abaAtiva === 'relatar' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('relatar')}
          >
            <PlusCircle size={18} />
            <span>Relatar Ocorrência</span>
          </button>

          <button
            className={`btn-aba-principal ${abaAtiva === 'lista' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('lista')}
          >
            <List size={18} />
            <span>Todas as Denúncias ({denuncias.length})</span>
          </button>

          <button
            className={`btn-aba-principal ${abaAtiva === 'estatisticas' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('estatisticas')}
          >
            <BarChart3 size={18} />
            <span>Estatísticas & CEPs</span>
          </button>
        </nav>

        {/* Conteúdo Dinâmico conforme a Aba Selecionada */}
        {carregando ? (
          <div className="loading-state glass-panel animate-fade-in">
            <div className="spinner-urbano"></div>
            <p>Carregando dados geoespaciais e ocorrências urbanas...</p>
          </div>
        ) : (
          <main className="main-content">
            {/* ABA 1: MAPA & PAINEL CIDADÃO (VISÃO COMPLETA) */}
            {abaAtiva === 'mapa' && (
              <div className="fluxo-mapa-grid">
                {/* Métricas Rápidas no Topo do Mapa */}
                <Estatisticas
                  denuncias={denuncias}
                  listaDeDenuncias={listaDeDenuncias}
                  enderecos={enderecos}
                  onFiltrarPorCEP={handleFiltrarPorCEP}
                />

                {/* Mapa Interativo com Pins e Popups */}
                <MapaCidade
                  denuncias={denuncias}
                  enderecos={enderecos}
                  listaDeDenuncias={listaDeDenuncias}
                  filtroCepAtivo={filtroCepAtivo}
                  onLimparFiltroCep={() => setFiltroCepAtivo('')}
                  onVerDetalhes={handleAbrirDetalhes}
                  onResolverDenuncia={handleResolverOuExcluirDenuncia}
                />

                {/* Seção com Formulário de Envio Rápido e Lista Recente */}
                <div className="grid-duplo-painel">
                  <FormularioDenuncia
                    usuarios={usuarios}
                    denuncias={denuncias}
                    listaDeDenuncias={listaDeDenuncias}
                    onDenunciaCadastrada={carregarDados}
                  />

                  <ListaDenuncias
                    denuncias={denuncias}
                    enderecos={enderecos}
                    listaDeDenuncias={listaDeDenuncias}
                    onResolverDenuncia={(id) => handleResolverOuExcluirDenuncia(id, false)}
                    onExcluirDenuncia={(id) => handleResolverOuExcluirDenuncia(id, true)}
                    onVerDetalhes={handleAbrirDetalhes}
                  />
                </div>
              </div>
            )}

            {/* ABA 2: FORMULÁRIO EXCLUSIVO DE DENÚNCIA */}
            {abaAtiva === 'relatar' && (
              <div className="secao-formulario-foco">
                <FormularioDenuncia
                  usuarios={usuarios}
                  denuncias={denuncias}
                  listaDeDenuncias={listaDeDenuncias}
                  onDenunciaCadastrada={() => {
                    carregarDados();
                    setAbaAtiva('mapa');
                  }}
                />
              </div>
            )}

            {/* ABA 3: TODAS AS DENÚNCIAS (LISTAGEM AMPLA) */}
            {abaAtiva === 'lista' && (
              <div className="secao-lista-foco">
                <ListaDenuncias
                  denuncias={denuncias}
                  enderecos={enderecos}
                  listaDeDenuncias={listaDeDenuncias}
                  onResolverDenuncia={(id) => handleResolverOuExcluirDenuncia(id, false)}
                  onExcluirDenuncia={(id) => handleResolverOuExcluirDenuncia(id, true)}
                  onVerDetalhes={handleAbrirDetalhes}
                />
              </div>
            )}

            {/* ABA 4: ESTATÍSTICAS & CONSULTA DE CEPS */}
            {abaAtiva === 'estatisticas' && (
              <div className="secao-estatisticas-foco">
                <Estatisticas
                  denuncias={denuncias}
                  listaDeDenuncias={listaDeDenuncias}
                  enderecos={enderecos}
                  onFiltrarPorCEP={handleFiltrarPorCEP}
                />
              </div>
            )}
          </main>
        )}

        {/* Modal de Histórico e Detalhes da Denúncia */}
        <ModalDetalhes
          isOpen={modalDetalhesAberto}
          onClose={() => {
            setModalDetalhesAberto(false);
            setDenunciaSelecionada(null);
          }}
          denuncia={denunciaSelecionada}
          endereco={
            denunciaSelecionada
              ? enderecos.find((e) => e.cep === denunciaSelecionada.cep)
              : null
          }
          listaDeDenuncias={listaDeDenuncias}
          onResolverDenuncia={(id) => handleResolverOuExcluirDenuncia(id, false)}
        />

        {/* Rodapé da Aplicação */}
        <footer className="app-footer">
          <p>
            Voz Urbana &bull; Sistema Colaborativo de Mapeamento Urbano &bull; Integrado com ViaCEP e json-server
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
