/**
 * Camada de Serviço de API (Sistema Urbano de Denúncias - Americana/SP)
 * Conexão REST com o json-server em http://localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

/**
 * Utilitário central de requisições HTTP
 */
async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`Erro na requisição [${response.status}]: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API ERROR] Falha no endpoint ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // ==========================================
  // 1. USUÁRIOS (Dinâmicos / Cadastrados sob demanda)
  // ==========================================
  getUsuarios: () => request('/usuarios'),
  getUsuarioById: (id) => request(`/usuarios/${id}`),
  criarUsuario: (usuario) =>
    request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    }),

  // ==========================================
  // 2. ENDEREÇOS (Americana - SP)
  // ==========================================
  getEnderecos: () => request('/enderecos'),
  getEnderecoById: (id) => request(`/enderecos/${id}`),
  criarEndereco: (endereco) =>
    request('/enderecos', {
      method: 'POST',
      body: JSON.stringify(endereco),
    }),
  atualizarEndereco: (id, dados) =>
    request(`/enderecos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }),

  // ==========================================
  // 3. DENÚNCIAS
  // ==========================================
  getDenuncias: () => request('/denuncias'),
  getDenunciaById: (id) => request(`/denuncias/${id}`),
  criarDenuncia: (denuncia) =>
    request('/denuncias', {
      method: 'POST',
      body: JSON.stringify({
        ...denuncia,
        totalOcorrencias: Number(denuncia.totalOcorrencias || 1),
        status: denuncia.status || 'pendente',
      }),
    }),
  atualizarDenuncia: (id, dados) =>
    request(`/denuncias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }),
  excluirDenuncia: (id) =>
    request(`/denuncias/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // 4. LISTA DE DENÚNCIAS (Histórico de ocorrências)
  // ==========================================
  getListaDenuncias: () => request('/listaDeDenuncias'),
  criarItemListaDenuncia: (item) =>
    request('/listaDeDenuncias', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  excluirItemListaDenuncia: (id) =>
    request(`/listaDeDenuncias/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // 5. TIPOS DE PROBLEMA
  // ==========================================
  getTiposDeProblema: () => request('/tiposDeProblema'),

  // =========================================================================
  // REGRAS DE NEGÓCIO (Orquestração Frontend React)
  // =========================================================================

  /**
   * REGRA DE NEGÓCIO: Registrar Denúncia em Americana - SP
   * 
   * 1. Salva o usuário em 'usuarios' caso ainda não exista no banco.
   * 2. Salva ou atualiza o endereço de Americana correspondente ao CEP.
   * 3. Localiza ou cria a denúncia principal com status 'pendente'.
   * 4. Executa o POST na coleção 'listaDeDenuncias'.
   * 5. Executa imediatamente o PATCH em 'denuncias/:id' somando a nova ocorrência.
   */
  registrarDenunciaCompleta: async (payload) => {
    const {
      autorNome,
      cep,
      enderecoCompleto,
      problemaPrincipal,
      descricao,
      tempoDoProblema,
      tipoDoProblema,
      detalhe,
    } = payload;

    const agora = new Date();
    const dataDenuncia = agora.toISOString().split('T')[0];
    const horaDenuncia = agora.toTimeString().split(' ')[0];

    const nomeAutorFinal = autorNome?.trim() || 'Cidadão de Americana';

    // Passo 1: Registra o munícipe na entidade 'usuarios' caso não exista
    const usuariosExistentes = await api.getUsuarios();
    const usuarioJaExiste = usuariosExistentes.find(
      (u) => u.nome?.toLowerCase() === nomeAutorFinal.toLowerCase()
    );
    if (!usuarioJaExiste && nomeAutorFinal) {
      await api.criarUsuario({ nome: nomeAutorFinal });
    }

    // Passo 2: Garantir que o endereço exista na base
    const todosEnderecos = await api.getEnderecos();
    let enderecoSalvo = todosEnderecos.find((e) => e.cep === cep);

    if (!enderecoSalvo && enderecoCompleto) {
      enderecoSalvo = await api.criarEndereco({
        cep,
        rua: enderecoCompleto.rua || enderecoCompleto.logradouro || '',
        logradouro: enderecoCompleto.logradouro || enderecoCompleto.rua || '',
        bairro: enderecoCompleto.bairro || '',
        complemento: enderecoCompleto.complemento || '',
        cidade: 'Americana',
        uf: 'SP',
        lat: enderecoCompleto.lat,
        lng: enderecoCompleto.lng,
      });
    }

    // Passo 3: Verificar denúncia ativa para o mesmo problema e CEP
    const todasDenuncias = await api.getDenuncias();
    let denunciaAlvo = todasDenuncias.find(
      (d) =>
        d.cep === cep &&
        d.tipoDoProblema === tipoDoProblema &&
        d.status !== 'resolvido'
    );

    let denunciaId;
    let ocorrenciasAtuais = 0;

    if (!denunciaAlvo) {
      const novaDenuncia = await api.criarDenuncia({
        problemaPrincipal,
        descricao,
        tempoDoProblema,
        tipoDoProblema,
        totalOcorrencias: 0,
        status: 'pendente',
        enderecoId: enderecoSalvo ? enderecoSalvo.id : '1',
        cep,
      });
      denunciaAlvo = novaDenuncia;
      denunciaId = novaDenuncia.id;
      ocorrenciasAtuais = 0;
    } else {
      denunciaId = denunciaAlvo.id;
      ocorrenciasAtuais = Number(denunciaAlvo.totalOcorrencias || 0);
    }

    // Passo 4: POST em listaDeDenuncias (Registro individual da ocorrência)
    const novoItemLista = await api.criarItemListaDenuncia({
      dataDenuncia,
      horaDenuncia,
      autorDenuncia: nomeAutorFinal,
      caracteristicasDenuncia: String(denunciaId), // FK
      cep,
      detalhe: detalhe || 'Manifestação registrada via portal cidadão de Americana',
    });

    // Passo 5: PATCH imediato em denuncia/:id somando a nova ocorrência
    const novoTotalOcorrencias = ocorrenciasAtuais + 1;
    const denunciaAtualizada = await api.atualizarDenuncia(denunciaId, {
      totalOcorrencias: novoTotalOcorrencias,
      descricao: descricao || denunciaAlvo.descricao,
      tempoDoProblema: tempoDoProblema || denunciaAlvo.tempoDoProblema,
    });

    return {
      denuncia: denunciaAtualizada,
      itemLista: novoItemLista,
      endereco: enderecoSalvo,
    };
  },

  /**
   * REGRA DE NEGÓCIO: Resolver ou Remover Denúncia
   */
  resolverDenuncia: async (denunciaId, removerDefinitivo = false) => {
    if (removerDefinitivo) {
      await api.excluirDenuncia(denunciaId);

      const lista = await api.getListaDenuncias();
      const itensAssociados = lista.filter(
        (item) => String(item.caracteristicasDenuncia) === String(denunciaId)
      );

      await Promise.all(
        itensAssociados.map((item) => api.excluirItemListaDenuncia(item.id))
      );
      return { status: 'removido', id: denunciaId };
    } else {
      const atualizada = await api.atualizarDenuncia(denunciaId, {
        status: 'resolvido',
        dataResolucao: new Date().toISOString(),
      });
      return { status: 'resolvido', denuncia: atualizada };
    }
  },
};
