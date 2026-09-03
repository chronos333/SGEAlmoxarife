import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Eye,
  CheckCircle,
  Trash2,
  Filter,
  Search,
  Crosshair,
  Navigation,
  Globe,
  Sun,
  Moon,
  Mountain,
  Loader2,
} from 'lucide-react';
import { CENTRO_AMERICANA, buscarCoordenadasNominatim } from '../../services/viacep';
import './MapaCidade.css';

// Provedores de Tiles de Alta Definição da Internet
const PROVEDORES_MAPA = {
  osm: {
    nome: 'Ruas Detalhadas (OpenStreetMap)',
    icone: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satelite: {
    nome: 'Satélite HD com Ruas (Esri World)',
    icone: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  dark: {
    nome: 'Modo Cyber Escuro (CartoDB)',
    icone: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  topo: {
    nome: 'Topográfico & Terreno (OpenTopoMap)',
    icone: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

export function MapaCidade({
  denuncias = [],
  enderecos = [],
  listaDeDenuncias = [],
  filtroCepAtivo = '',
  onLimparFiltroCep,
  onVerDetalhes,
  onResolverDenuncia,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const overlayTileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);

  // Estados do Mapa
  const [estiloMapa, setEstiloMapa] = useState('osm'); // 'osm' | 'satelite' | 'dark' | 'topo'
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [termoBuscaMapa, setTermoBuscaMapa] = useState('');
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [localBuscadoMsg, setLocalBuscadoMsg] = useState('');

  // 1. Inicialização do Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [CENTRO_AMERICANA.lat, CENTRO_AMERICANA.lng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Camada de Tile Inicial (OpenStreetMap)
      const baseTile = L.tileLayer(PROVEDORES_MAPA.osm.url, {
        attribution: PROVEDORES_MAPA.osm.attribution,
        maxZoom: PROVEDORES_MAPA.osm.maxZoom,
      }).addTo(map);

      baseTileLayerRef.current = baseTile;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }
  }, []);

  // 2. Troca dinâmica da API de Tiles (Satélite / OpenStreetMap / Dark / Topográfico)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const provedor = PROVEDORES_MAPA[estiloMapa];

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }
    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    // Adiciona o novo provedor de mapa
    const novoBaseTile = L.tileLayer(provedor.url, {
      attribution: provedor.attribution,
      maxZoom: provedor.maxZoom,
    }).addTo(map);
    baseTileLayerRef.current = novoBaseTile;

    // Se for satélite, adiciona camada de sobreposição de nomes de ruas e avenidas
    if (provedor.overlayUrl) {
      const overlayTile = L.tileLayer(provedor.overlayUrl, {
        maxZoom: provedor.maxZoom,
      }).addTo(map);
      overlayTileLayerRef.current = overlayTile;
    }
  }, [estiloMapa]);

  // 3. Atualização dos Marcadores, Círculos de Calor e Popups de Americana - SP
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const contagemPorCep = {};
    listaDeDenuncias.forEach((item) => {
      if (item.cep) {
        contagemPorCep[item.cep] = (contagemPorCep[item.cep] || 0) + 1;
      }
    });

    const denunciasFiltradas = denuncias.filter((d) => {
      if (filtroCepAtivo && d.cep !== filtroCepAtivo) return false;
      if (categoriaFiltro === 'todas') return true;
      if (categoriaFiltro === 'resolvido') return d.status === 'resolvido';
      return d.tipoDoProblema === categoriaFiltro && d.status !== 'resolvido';
    });

    const bounds = [];

    denunciasFiltradas.forEach((denuncia) => {
      const endereco = enderecos.find((e) => e.cep === denuncia.cep || String(e.id) === String(denuncia.enderecoId));

      const lat = endereco?.lat || CENTRO_AMERICANA.lat;
      const lng = endereco?.lng || CENTRO_AMERICANA.lng;
      bounds.push([lat, lng]);

      const totalCep = contagemPorCep[denuncia.cep] || Number(denuncia.totalOcorrencias) || 1;

      let pinClass = 'pin-social';
      let pinEmoji = '👥';
      let nomeCategoria = 'Problema Social';
      let corRaio = '#ef4444';

      if (denuncia.tipoDoProblema === 'estrutural') {
        pinClass = 'pin-estrutural';
        pinEmoji = '🏗️';
        nomeCategoria = 'Estrutural';
        corRaio = '#f59e0b';
      } else if (denuncia.tipoDoProblema === 'saneamento') {
        pinClass = 'pin-saneamento';
        pinEmoji = '💧';
        nomeCategoria = 'Saneamento';
        corRaio = '#06b6d4';
      }

      if (denuncia.status === 'resolvido') {
        pinEmoji = '✅';
        corRaio = '#10b981';
      }

      // Círculo de Raio de Incidência (Heat Hotspot) ao redor do ponto em Americana
      if (totalCep > 1 && denuncia.status !== 'resolvido') {
        const heatCircle = L.circle([lat, lng], {
          radius: 120 + Math.min(totalCep * 40, 200),
          color: corRaio,
          fillColor: corRaio,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 8',
        });
        markersLayer.addLayer(heatCircle);
      }

      // Ícone HTML Customizado com Badge de Contagem
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="custom-map-pin ${pinClass}">
            <span>${pinEmoji}</span>
            <span class="pin-badge-count" title="${totalCep} denúncias no CEP em Americana">${totalCep}</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const linkGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-urbano">
          <div class="popup-tag ${pinClass}">
            ${pinEmoji} ${nomeCategoria} ${denuncia.status === 'resolvido' ? '(Resolvido)' : ''}
          </div>
          <h4 class="popup-titulo">${denuncia.problemaPrincipal}</h4>
          <p class="popup-desc">${denuncia.descricao || 'Sem descrição adicional.'}</p>
          
          <div class="popup-endereco">
            <strong>📍 ${endereco ? `${endereco.rua || endereco.logradouro}, ${endereco.bairro}` : 'Americana - SP'}</strong>
            <span>CEP: ${denuncia.cep} &bull; Americana/SP</span>
            <span class="coords-mini">Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
          </div>

          <div class="popup-stats-bar">
            <span class="popup-badge-cep">
              <strong>${totalCep}</strong> ${totalCep === 1 ? 'denúncia neste CEP' : 'denúncias neste CEP'}
            </span>
            <span class="popup-tempo">⏱️ ${denuncia.tempoDoProblema || 'Recente'}</span>
          </div>

          <div class="popup-acoes-externas">
            <a href="${linkGoogleMaps}" target="_blank" rel="noopener noreferrer" class="btn-gps-rota">
              🗺️ Ver no Google Maps &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    });

    if (bounds.length > 0) {
      if (bounds.length === 1 || filtroCepAtivo) {
        map.setView(bounds[0], 16, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [denuncias, enderecos, listaDeDenuncias, categoriaFiltro, filtroCepAtivo]);

  /**
   * Busca Geográfica Online via OpenStreetMap Nominatim
   */
  const handleBuscarLocalNoMapa = async (e) => {
    e.preventDefault();
    if (!termoBuscaMapa.trim()) return;

    setBuscandoLocal(true);
    setLocalBuscadoMsg('');

    try {
      const resultado = await buscarCoordenadasNominatim(termoBuscaMapa, '', 'Americana');
      if (resultado && mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        map.setView([resultado.lat, resultado.lng], 16, { animate: true });

        // Adiciona ou reposiciona o marcador de busca
        if (searchMarkerRef.current) {
          map.removeLayer(searchMarkerRef.current);
        }

        const iconBusca = L.divIcon({
          className: 'marker-busca-local',
          html: `<div class="pin-busca-online">🔍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const novoMarcador = L.marker([resultado.lat, resultado.lng], { icon: iconBusca })
          .addTo(map)
          .bindPopup(`<strong>📍 Local Encontrado em Americana:</strong><br>${termoBuscaMapa}`)
          .openPopup();

        searchMarkerRef.current = novoMarcador;
        setLocalBuscadoMsg(`Local localizado com sucesso em Americana!`);
      } else {
        setLocalBuscadoMsg('Local não localizado na base online de Americana. Tente outro nome de rua ou bairro.');
      }
    } catch (err) {
      setLocalBuscadoMsg('Erro ao conectar com a API de mapas.');
    } finally {
      setBuscandoLocal(false);
    }
  };

  /**
   * Centraliza na geolocalização do usuário (GPS)
   */
  const handleMinhaLocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapInstanceRef.current) {
          const { latitude, longitude } = pos.coords;
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });

          L.popup()
            .setLatLng([latitude, longitude])
            .setContent('<strong>📍 Você está aqui em Americana</strong>')
            .openOn(mapInstanceRef.current);
        }
      },
      (err) => {
        alert('Não foi possível obter a sua localização GPS.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="mapa-cidade-wrapper glass-panel animate-fade-in">
      {/* Topo: Título e Seletor de Camadas (Satélite / OSM / Dark / Topo) */}
      <div className="mapa-topo-controles">
        <div className="mapa-titulo-area">
          <Layers size={22} className="icon-mapa-header" />
          <div>
            <h3>Mapa Geográfico Avançado de Americana - SP</h3>
            <p>Satélite HD, Ruas Detalhadas e Geocodificação OpenStreetMap</p>
          </div>
        </div>

        {/* Seletor de Modos do Mapa */}
        <div className="seletor-estilos-mapa">
          <button
            type="button"
            className={`btn-estilo-mapa ${estiloMapa === 'osm' ? 'ativo' : ''}`}
            onClick={() => setEstiloMapa('osm')}
            title="Mapa com detalhes de ruas, comércio e pontos de interesse"
          >
            <span>🗺️ Ruas Detalhadas</span>
          </button>

          <button
            type="button"
            className={`btn-estilo-mapa ${estiloMapa === 'satelite' ? 'ativo' : ''}`}
            onClick={() => setEstiloMapa('satelite')}
            title="Satélite de alta definição da Esri com nomes de ruas"
          >
            <span>🛰️ Satélite HD</span>
          </button>

          <button
            type="button"
            className={`btn-estilo-mapa ${estiloMapa === 'dark' ? 'ativo' : ''}`}
            onClick={() => setEstiloMapa('dark')}
            title="Tema noturno moderno com alto contraste"
          >
            <span>🌙 Cyber Noturno</span>
          </button>

          <button
            type="button"
            className={`btn-estilo-mapa ${estiloMapa === 'topo' ? 'ativo' : ''}`}
            onClick={() => setEstiloMapa('topo')}
            title="Mapa de relevo e elevação do terreno"
          >
            <span>⛰️ Topográfico</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca de Ruas na Internet + GPS + Filtros de Categorias */}
      <div className="mapa-ferramentas-bar">
        {/* Formulário de Busca por Rua / Ponto de Americana */}
        <form onSubmit={handleBuscarLocalNoMapa} className="form-busca-geografica">
          <div className="input-busca-geo-wrapper">
            <Search size={16} className="icon-geo-busca" />
            <input
              type="text"
              placeholder="Buscar rua, praça ou bairro em Americana (ex: Av. Brasil, Praia Azul)..."
              value={termoBuscaMapa}
              onChange={(e) => setTermoBuscaMapa(e.target.value)}
              className="input-geo-busca"
            />
          </div>
          <button type="submit" className="btn-executar-busca-geo" disabled={buscandoLocal}>
            {buscandoLocal ? <Loader2 size={16} className="spinner-btn" /> : 'Localizar'}
          </button>
          <button
            type="button"
            className="btn-gps-local"
            onClick={handleMinhaLocalizacao}
            title="Centralizar na Minha Localização GPS"
          >
            <Crosshair size={18} />
          </button>
        </form>

        {/* Filtro por Categorias */}
        <div className="botoes-filtro-categoria">
          <button
            className={`btn-filtro-cat ${categoriaFiltro === 'todas' ? 'ativo' : ''}`}
            onClick={() => setCategoriaFiltro('todas')}
          >
            Todos ({denuncias.length})
          </button>
          <button
            className={`btn-filtro-cat cat-social ${categoriaFiltro === 'problemaSocial' ? 'ativo' : ''}`}
            onClick={() => setCategoriaFiltro('problemaSocial')}
          >
            👥 Social
          </button>
          <button
            className={`btn-filtro-cat cat-estrutural ${categoriaFiltro === 'estrutural' ? 'ativo' : ''}`}
            onClick={() => setCategoriaFiltro('estrutural')}
          >
            🏗️ Estrutural
          </button>
          <button
            className={`btn-filtro-cat cat-saneamento ${categoriaFiltro === 'saneamento' ? 'ativo' : ''}`}
            onClick={() => setCategoriaFiltro('saneamento')}
          >
            💧 Saneamento
          </button>
          <button
            className={`btn-filtro-cat cat-resolvido ${categoriaFiltro === 'resolvido' ? 'ativo' : ''}`}
            onClick={() => setCategoriaFiltro('resolvido')}
          >
            ✅ Resolvidos
          </button>
        </div>
      </div>

      {localBuscadoMsg && (
        <div className="msg-feedback-busca-geo animate-fade-in">
          <span>{localBuscadoMsg}</span>
        </div>
      )}

      {/* Banner de Filtro por CEP ativo */}
      {filtroCepAtivo && (
        <div className="banner-filtro-cep-ativo">
          <div className="info-filtro-cep">
            <MapPin size={16} />
            <span>Exibindo ocorrências no CEP de Americana: <strong>{filtroCepAtivo}</strong></span>
          </div>
          <button className="btn-limpar-filtro" onClick={onLimparFiltroCep}>
            Limpar Filtro de CEP
          </button>
        </div>
      )}

      {/* Contêiner onde o Leaflet renderiza o mapa em alta resolução */}
      <div className="mapa-leaflet-container" ref={mapContainerRef} style={{ height: '520px', width: '100%' }}></div>

      {/* Legenda Informativa */}
      <div className="mapa-legenda-bar">
        <div className="legenda-item">
          <span className="legenda-dot dot-social"></span>
          <span>Social (moradores de rua, assaltos, vandalismo)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-dot dot-estrutural"></span>
          <span>Estrutural (iluminação, tráfego, asfalto)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-dot dot-saneamento"></span>
          <span>Saneamento (lixo, esgotos, vazamentos de água)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-badge">Nº</span>
          <span>Contador de denúncias no mesmo CEP</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-raio"></span>
          <span>Raio de calor em áreas com múltiplos relatos</span>
        </div>
      </div>
    </div>
  );
}
