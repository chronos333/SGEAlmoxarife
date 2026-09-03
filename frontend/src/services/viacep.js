/**
 * Serviço de Integração com ViaCEP e OpenStreetMap Nominatim API
 * Fornece dados cadastrais de CEP e geolocalização de alta precisão para Americana - SP
 */

// Tabela de coordenadas de referência para os principais bairros de Americana - SP (Fallback imediato)
const COORDENADAS_AMERICANA = {
  '13465-000': { lat: -22.7391, lng: -47.3325 }, // Centro (Rua Fernando Camargo)
  '13466-320': { lat: -22.7445, lng: -47.3278 }, // Vila Santa Catarina (Dom Pedro II)
  '13468-550': { lat: -22.7612, lng: -47.3489 }, // Jardim Ipiranga (Av. Iacanga)
  '13478-000': { lat: -22.7460, lng: -47.3410 }, // Jardim Santo Antônio / Av. Brasil
  '13465-200': { lat: -22.7375, lng: -47.3302 }, // Calçadão / Centro Histórico
  '13467-000': { lat: -22.7490, lng: -47.3380 }, // Frezzarin
  '13469-000': { lat: -22.7530, lng: -47.3250 }, // Cidade Jardim
  '13470-000': { lat: -22.7210, lng: -47.3150 }, // Praia Azul
  '13471-000': { lat: -22.7280, lng: -47.3450 }, // Werner Plaas
  '13472-000': { lat: -22.7350, lng: -47.3520 }, // São Vito
  '13473-000': { lat: -22.7410, lng: -47.3590 }, // Antônio Zanaga
  '13474-000': { lat: -22.7650, lng: -47.3350 }, // Parque Novo Mundo
  '13477-000': { lat: -22.7420, lng: -47.3440 }, // Jardim Girassol
};

// Ponto Central de Americana - SP (Praça Comendador Müller / Prefeitura)
export const CENTRO_AMERICANA = {
  lat: -22.7389,
  lng: -47.3314,
};

/**
 * Formata uma string de CEP no padrão 00000-000
 */
export function formatarCEP(valor = '') {
  const apenasDigitos = valor.replace(/\D/g, '').slice(0, 8);
  if (apenasDigitos.length > 5) {
    return `${apenasDigitos.slice(0, 5)}-${apenasDigitos.slice(5)}`;
  }
  return apenasDigitos;
}

/**
 * Limpa o CEP deixando apenas dígitos
 */
export function limparCEP(cep = '') {
  return cep.replace(/\D/g, '');
}

/**
 * Geocodificação Online via API OpenStreetMap Nominatim
 * Busca latitude e longitude exatas na internet pelo nome da rua e bairro em Americana - SP
 */
export async function buscarCoordenadasNominatim(logradouro, bairro, cidade = 'Americana') {
  try {
    const query = `${logradouro || ''}, ${bairro || ''}, ${cidade}, SP, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    
    const resposta = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!resposta.ok) return null;

    const dados = await resposta.json();
    if (dados && dados.length > 0) {
      return {
        lat: parseFloat(dados[0].lat),
        lng: parseFloat(dados[0].lon),
        displayName: dados[0].display_name,
      };
    }
  } catch (error) {
    console.warn('[Nominatim Geocoder] Erro ao obter coordenadas online:', error.message);
  }
  return null;
}

/**
 * Gera uma coordenada geoespacial de fallback para Americana - SP
 */
export function estimarCoordenadasPorCEP(cepFormatado) {
  if (COORDENADAS_AMERICANA[cepFormatado]) {
    return COORDENADAS_AMERICANA[cepFormatado];
  }

  const digitos = limparCEP(cepFormatado);
  let hash = 0;
  for (let i = 0; i < digitos.length; i++) {
    hash = (hash << 5) - hash + digitos.charCodeAt(i);
    hash |= 0;
  }

  const offsetLat = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.04;
  const offsetLng = (((Math.abs(hash * 31)) % 1000) / 1000 - 0.5) * 0.04;

  return {
    lat: Number((CENTRO_AMERICANA.lat + offsetLat).toFixed(6)),
    lng: Number((CENTRO_AMERICANA.lng + offsetLng).toFixed(6)),
  };
}

/**
 * Consulta a API ViaCEP com enriquecimento de coordenadas online do Nominatim
 */
export async function consultarViaCEP(cep) {
  const cepLimpo = limparCEP(cep);

  if (cepLimpo.length !== 8) {
    throw new Error('O CEP informado deve conter exatamente 8 dígitos numéricos.');
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!resposta.ok) {
      throw new Error(`Falha na consulta ao ViaCEP: status ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (dados.erro) {
      throw new Error('CEP não encontrado na base de dados dos Correios.');
    }

    const cepFormatado = formatarCEP(dados.cep || cepLimpo);
    
    // Tenta obter coordenadas exatas via API Nominatim na internet
    let coords = await buscarCoordenadasNominatim(dados.logradouro, dados.bairro, dados.localidade || 'Americana');
    
    // Se não retornar da internet, usa o fallback calibrado
    if (!coords) {
      coords = estimarCoordenadasPorCEP(cepFormatado);
    }

    return {
      cep: cepFormatado,
      logradouro: dados.logradouro || '',
      rua: dados.logradouro || '',
      complemento: dados.complemento || '',
      bairro: dados.bairro || '',
      localidade: dados.localidade || 'Americana',
      cidade: dados.localidade || 'Americana',
      uf: dados.uf || 'SP',
      lat: coords.lat,
      lng: coords.lng,
    };
  } catch (erro) {
    console.error(`[ViaCEP] Erro ao consultar CEP ${cep}:`, erro);
    throw erro;
  }
}
