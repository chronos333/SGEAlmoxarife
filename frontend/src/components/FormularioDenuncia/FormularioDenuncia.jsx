import React, { useState, useEffect } from 'react';
import {
  Send,
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { consultarViaCEP, formatarCEP } from '../../services/viacep';
import { api } from '../../services/api';
import './FormularioDenuncia.css';

export function FormularioDenuncia({
  usuarios = [],
  denuncias = [],
  listaDeDenuncias = [],
  onDenunciaCadastrada,
}) {
  // Estados do Formulário - Sem usuários pré-cadastrados (o munícipe digita seu próprio nome)
  const [autorNome, setAutorNome] = useState('');
  const [cep, setCep] = useState('');
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [erroCep, setErroCep] = useState('');
  
  // Endereço obtido via API do ViaCEP
  const [dadosEndereco, setDadosEndereco] = useState({
    logradouro: '',
    rua: '',
    bairro: '',
    complemento: '',
    cidade: 'Americana',
    uf: 'SP',
    lat: null,
    lng: null,
  });

  // Dados da Denúncia
  const [tipoDoProblema, setTipoDoProblema] = useState('estrutural');
  const [problemaPrincipal, setProblemaPrincipal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tempoDoProblema, setTempoDoProblema] = useState('Há 1 semana');
  const [detalheAdicional, setDetalheAdicional] = useState('');

  // Estados de Envio e Feedback
  const [enviando, setEnviando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState(false);
  const [contagemCepAtual, setContagemCepAtual] = useState(0);

  // Calcula a quantidade de denúncias existentes no CEP digitado em tempo real
  useEffect(() => {
    const cepFormatado = formatarCEP(cep);
    if (cepFormatado.length === 9) {
      const total = listaDeDenuncias.filter((item) => item.cep === cepFormatado).length;
      setContagemCepAtual(total);
    } else {
      setContagemCepAtual(0);
    }
  }, [cep, listaDeDenuncias]);

  /**
   * Executa a busca de endereço através da API do ViaCEP
   */
  const handleBuscarEnderecoPorCEP = async (cepParaBuscar) => {
    const cepFormatado = formatarCEP(cepParaBuscar || cep);
    if (cepFormatado.replace(/\D/g, '').length !== 8) {
      setErroCep('Digite um CEP válido com 8 dígitos (ex: 13465-000).');
      return;
    }

    setConsultandoCep(true);
    setErroCep('');

    try {
      const dados = await consultarViaCEP(cepFormatado);
      setDadosEndereco({
        logradouro: dados.logradouro,
        rua: dados.rua,
        bairro: dados.bairro,
        complemento: dados.complemento,
        cidade: dados.cidade || 'Americana',
        uf: dados.uf || 'SP',
        lat: dados.lat,
        lng: dados.lng,
      });
      setCep(dados.cep);
    } catch (err) {
      setErroCep(err.message || 'Não foi possível localizar o endereço para este CEP.');
    } finally {
      setConsultandoCep(false);
    }
  };

  /**
   * Monitora a digitação do CEP para disparar a consulta automaticamente ao atingir 8 dígitos
   */
  const handleCepChange = (e) => {
    const formatado = formatarCEP(e.target.value);
    setCep(formatado);
    setErroCep('');

    if (formatado.replace(/\D/g, '').length === 8) {
      handleBuscarEnderecoPorCEP(formatado);
    }
  };

  /**
   * REGRA DE NEGÓCIO PRINCIPAL: Submissão da Denúncia
   */
  const handleSubmitDenuncia = async (e) => {
    e.preventDefault();

    if (!cep || cep.length < 9) {
      setErroCep('Por favor, informe um CEP válido de Americana (ex: 13465-000) antes de enviar.');
      return;
    }

    if (!problemaPrincipal.trim()) {
      alert('Por favor, informe o tema principal da denúncia.');
      return;
    }

    if (!descricao.trim()) {
      alert('Por favor, forneça uma explicação detalhada sobre o problema.');
      return;
    }

    setEnviando(true);

    try {
      await api.registrarDenunciaCompleta({
        autorNome: autorNome || 'Cidadão de Americana',
        cep,
        enderecoCompleto: dadosEndereco,
        problemaPrincipal,
        descricao,
        tempoDoProblema,
        tipoDoProblema,
        detalhe: detalheAdicional || 'Manifestação registrada via portal cidadão de Americana',
      });

      // Feedback visual e limpeza do formulário
      setSucessoMsg(true);
      setProblemaPrincipal('');
      setDescricao('');
      setDetalheAdicional('');
      setAutorNome('');

      // Notifica o componente pai para recarregar todos os dados do json-server
      if (onDenunciaCadastrada) {
        onDenunciaCadastrada();
      }

      setTimeout(() => {
        setSucessoMsg(false);
      }, 5000);
    } catch (error) {
      console.error('Falha ao processar o registro da denúncia:', error);
      alert('Ocorreu um erro ao enviar a denúncia. Verifique se o json-server está rodando.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="formulario-denuncia-card glass-panel animate-fade-in">
      <div className="form-header">
        <div className="form-header-badge">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="form-title">Relatar Ocorrência Urbana em Americana - SP</h2>
          <p className="form-subtitle">
            Informe a localização e detalhes do problema para a gestão pública municipal
          </p>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {sucessoMsg && (
        <div className="alerta-sucesso animate-fade-in">
          <CheckCircle2 size={24} className="icon-sucesso" />
          <div>
            <strong>Denúncia registrada com sucesso em Americana - SP!</strong>
            <p>
              Ocorrência adicionada à lista pública e contador do CEP atualizado via sincronização sequencial.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitDenuncia} className="form-corpo">
        {/* Bloco 1: Identificação do Munícipe (Digitação Livre) */}
        <div className="form-secao">
          <label className="form-label">
            <User size={16} />
            <span>Seu Nome / Autor da Denúncia</span>
          </label>
          <input
            type="text"
            placeholder="Digite seu nome (ou deixe em branco para Cidadão Anônimo)"
            value={autorNome}
            onChange={(e) => setAutorNome(e.target.value)}
            className="input-autor"
          />
        </div>

        {/* Bloco 2: Localização e Integração ViaCEP */}
        <div className="form-secao secao-endereco">
          <label className="form-label">
            <MapPin size={16} />
            <span>CEP do Local em Americana - SP (Busca Automática ViaCEP)</span>
          </label>

          <div className="cep-input-row">
            <div className="input-wrapper-cep">
              <input
                type="text"
                placeholder="Ex: 13465-000"
                value={cep}
                onChange={handleCepChange}
                maxLength={9}
                className={`input-cep ${erroCep ? 'input-error' : ''}`}
                required
              />
              {consultandoCep && <Loader2 size={18} className="spinner-cep" />}
            </div>

            <button
              type="button"
              className="btn-buscar-cep"
              onClick={() => handleBuscarEnderecoPorCEP(cep)}
              disabled={consultandoCep || cep.length < 8}
            >
              <Search size={16} />
              <span>Consultar ViaCEP</span>
            </button>
          </div>

          {erroCep && <p className="msg-erro-cep">{erroCep}</p>}

          {/* Banner de Denúncias no mesmo CEP em Tempo Real */}
          {dadosEndereco.logradouro && (
            <div className="banner-contador-cep animate-fade-in">
              <div className="badge-cep-contagem">
                <span>{contagemCepAtual}</span>
              </div>
              <div className="texto-cep-contagem">
                <strong>
                  {contagemCepAtual === 0
                    ? 'Nenhuma denúncia anterior registrada neste CEP de Americana.'
                    : contagemCepAtual === 1
                    ? 'Atenção: Já existe 1 denúncia acumulada neste mesmo CEP!'
                    : `Atenção: Já existem ${contagemCepAtual} denúncias acumuladas neste mesmo CEP!`}
                </strong>
                <p>
                  Ao registrar, este endereço receberá mais uma ocorrência somada ao histórico municipal.
                </p>
              </div>
            </div>
          )}

          {/* Dados do Endereço preenchidos automaticamente */}
          {dadosEndereco.logradouro && (
            <div className="grid-dados-endereco animate-fade-in">
              <div className="campo-readonly">
                <span className="lbl-mini">Rua / Logradouro</span>
                <input
                  type="text"
                  value={dadosEndereco.logradouro}
                  readOnly
                  className="input-readonly"
                />
              </div>

              <div className="campo-readonly">
                <span className="lbl-mini">Bairro</span>
                <input
                  type="text"
                  value={dadosEndereco.bairro}
                  readOnly
                  className="input-readonly"
                />
              </div>

              <div className="campo-readonly">
                <span className="lbl-mini">Cidade / UF</span>
                <input
                  type="text"
                  value={`${dadosEndereco.cidade} - ${dadosEndereco.uf}`}
                  readOnly
                  className="input-readonly"
                />
              </div>

              <div className="campo-readonly">
                <span className="lbl-mini">Complemento / Ponto de Referência</span>
                <input
                  type="text"
                  placeholder="Ex: Próximo à praça, em frente ao comércio"
                  value={dadosEndereco.complemento}
                  onChange={(e) =>
                    setDadosEndereco({ ...dadosEndereco, complemento: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Bloco 3: Tipo do Problema */}
        <div className="form-secao">
          <label className="form-label">
            <AlertTriangle size={16} />
            <span>Tipo do Problema</span>
          </label>

          <div className="grid-tipos-problema">
            {/* 1. Problema Social */}
            <div
              className={`card-tipo-opcao tipo-social ${
                tipoDoProblema === 'problemaSocial' ? 'selecionado' : ''
              }`}
              onClick={() => setTipoDoProblema('problemaSocial')}
            >
              <div className="tipo-opcao-topo">
                <span className="tipo-emoji">👥</span>
                <span className="tipo-nome">Problema Social</span>
              </div>
              <p className="tipo-exemplos">
                Moradores de rua, roubos, assaltos, vandalismo e segurança.
              </p>
            </div>

            {/* 2. Estrutural */}
            <div
              className={`card-tipo-opcao tipo-estrutural ${
                tipoDoProblema === 'estrutural' ? 'selecionado' : ''
              }`}
              onClick={() => setTipoDoProblema('estrutural')}
            >
              <div className="tipo-opcao-topo">
                <span className="tipo-emoji">🏗️</span>
                <span className="tipo-nome">Estrutural</span>
              </div>
              <p className="tipo-exemplos">
                Encanamento, iluminação pública queimada, asfalto e tráfego.
              </p>
            </div>

            {/* 3. Saneamento */}
            <div
              className={`card-tipo-opcao tipo-saneamento ${
                tipoDoProblema === 'saneamento' ? 'selecionado' : ''
              }`}
              onClick={() => setTipoDoProblema('saneamento')}
            >
              <div className="tipo-opcao-topo">
                <span className="tipo-emoji">💧</span>
                <span className="tipo-nome">Saneamento</span>
              </div>
              <p className="tipo-exemplos">
                Descarte irregular de lixo, coleta, esgotos e água potável.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 4: Tema Principal e Explicação do Problema */}
        <div className="form-secao">
          <label className="form-label">
            <HelpCircle size={16} />
            <span>Tema Principal da Denúncia</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Poste apagado na Av. Brasil gerando escuridão no calçadão"
            value={problemaPrincipal}
            onChange={(e) => setProblemaPrincipal(e.target.value)}
            required
            className="input-tema"
          />
        </div>

        <div className="form-secao">
          <label className="form-label">
            <span>Explicação Detalhada do Problema</span>
          </label>
          <textarea
            rows={4}
            placeholder="Descreva a situação com clareza em Americana (o que acontece, riscos envolvidos, referências)..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            className="textarea-descricao"
          />
        </div>

        {/* Bloco 5: Tempo do Problema */}
        <div className="form-secao">
          <label className="form-label">
            <Clock size={16} />
            <span>Tempo de Persistência do Problema</span>
          </label>
          <select
            value={tempoDoProblema}
            onChange={(e) => setTempoDoProblema(e.target.value)}
            className="select-tempo"
          >
            <option value="Hoje / Poucas horas">Hoje / Poucas horas</option>
            <option value="Há 2 a 3 dias">Há 2 a 3 dias</option>
            <option value="Há 1 semana">Há 1 semana</option>
            <option value="Mais de 2 semanas">Mais de 2 semanas</option>
            <option value="Mais de 1 mês">Mais de 1 mês</option>
            <option value="Mais de 6 meses">Mais de 6 meses</option>
          </select>
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={enviando || consultandoCep}
          className="btn-enviar-denuncia"
        >
          {enviando ? (
            <>
              <Loader2 size={20} className="spinner-btn" />
              <span>Registrando Denúncia em Americana - SP...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Registrar Denúncia Oficial</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
