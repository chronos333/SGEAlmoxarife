# Voz Urbana — Sistema de Gestão e Denúncias de Problemas Urbanos

Plataforma web full-stack para **registro, monitoramento geoespacial e gerenciamento de problemas urbanos** (infraestrutura, saneamento e demandas sociais), conectando a população à gestão municipal através de geolocalização com mapas interativos e consulta automática de logradouros via **API ViaCEP**.

---

## 1. Sobre o Projeto

Cidades modernas enfrentam desafios constantes relacionados à manutenção viária, iluminação pública, vazamentos, descarte irregular de resíduos e demandas sociais. Frequentemente, a população não dispõe de canais transparentes e georreferenciados para comunicar essas ocorrências.

O **Voz Urbana** resolve esse problema ao oferecer uma plataforma centralizada onde:
* O cidadão registra uma denúncia informando apenas seu nome, CEP e a descrição do problema.
* O sistema consulta automaticamente a **API ViaCEP** para preencher rua, bairro, cidade e estado.
* O problema é georreferenciado e plotado instantaneamente em um **mapa interativo com Leaflet e OpenStreetMap**.
* Indicadores e contadores dinâmicos calculam as demandas por CEP e o total da cidade.
* O poder público e os próprios cidadãos podem acompanhar as ocorrências e marcar **"✓ Problema Resolvido"** assim que a manutenção for executada, mantendo o banco de dados íntegro e atualizado.

---

## 2. Funcionalidades Principais

* **Cadastro Simplificado de Usuários:** Identificação do autor vinculado por chave estrangeira.
* **Consulta Automática de Endereço (ViaCEP):** Validação de CEP de 8 dígitos com autopreenchimento imediato de logradouro, bairro, município e UF.
* **Classificação de Problemas em 3 Categorias:** Problemas Sociais, Estruturais e de Saneamento, com ícones e cores temáticas.
* **Mapeamento Geoespacial Interativo:** Mapa completo com OpenStreetMap + Leaflet, marcadores personalizados com pins coloridos por categoria e popups informativos com detalhes e fotos/ações.
* **Contadores Dinâmicos em Tempo Real:**
  * 🏙️ Total de denúncias da cidade (sincronizado via `PATCH` na entidade `cidades`).
  * 📍 Total de denúncias por CEP específico consultado.
  * 📊 Percentuais e totais por categoria (Sociais, Estruturais, Saneamento).
* **Explorador e Listagem com Filtros Avançados:** Busca por palavra-chave, CEP, rua, bairro ou autor, filtro por categoria e ordenação por data.
* **Fluxo de Resolução ("✓ Problema Resolvido"):** Modal de confirmação que remove a ocorrência da lista ativa, elimina o registro de características sem deixar dados órfãos e decrementa os contadores.
* **Efeitos Visuais e Feedback Moderno:** Notificações flutuantes (*Toasts*), feedback com confetes (*canvas-confetti*) e design responsivo com *Glassmorphism*.

---

## 3. Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **React (v18)** | Biblioteca front-end para componentização e gerenciamento de estado reativo |
| **Vite** | Bundler e servidor de desenvolvimento ultra-rápido |
| **React Router DOM (v6)** | Roteamento dinâmico SPA (`/`, `/denunciar`, `/denuncias`, `/mapa`, `/estatisticas`) |
| **Leaflet & React-Leaflet** | Renderização de mapas interativos, tiles do OpenStreetMap e pins geoespaciais |
| **Axios** | Cliente HTTP com interceptors para consumo de APIs REST |
| **JSON Server** | Backend REST mock servindo a base `db.json` com persistência em tempo real |
| **API ViaCEP** | Web Service público dos Correios para consulta de CEPs brasileiros |
| **OpenStreetMap / Nominatim** | Geocodificação de endereços para coordenadas de latitude e longitude |
| **Lucide React** | Biblioteca de ícones modernos e consistentes |
| **CSS3 Modular & Tokens** | Estilização customizada com variáveis CSS, responsividade e Glassmorphism |
| **Canvas Confetti** | Animação de celebração após envio da denúncia |

---

## 4. Estrutura do Projeto

```text
sistema-denuncias-urbanas/
├── public/
│   └── favicon.svg             # Favicon SVG temático
├── src/
│   ├── components/             # Componentes modulares e reutilizáveis
│   │   ├── BadgeCategoria/     # Badges coloridos por tipo de problema
│   │   ├── BuscaCep/           # Campo de busca e card de endereço ViaCEP
│   │   ├── Cabecalho/          # Barra de navegação responsiva com contador
│   │   ├── CardDenuncia/       # Card individual de exibição e ação da denúncia
│   │   ├── Contadores/         # Contadores da cidade e por CEP
│   │   ├── FormularioDenuncia/ # Formulário estruturado em passos
│   │   ├── ListaDenuncias/     # Grid com filtros, busca e ordenação
│   │   ├── Mapa/               # Mapa Leaflet com marcadores customizados
│   │   ├── MensagemFeedback/   # Notificações Toast temporizadas
│   │   ├── ModalConfirmacao/   # Modal para confirmar "Problema Resolvido"
│   │   ├── ModalDetalhes/      # Modal com raio-x completo da ocorrência
│   │   ├── Rodape/             # Rodapé com links cívicos e status
│   │   └── SeletorTipoProblema/# Cards de seleção e chips com sugestões
│   ├── controllers/            # Camada de regras de negócio e orquestração
│   │   ├── denunciaController.js
│   │   ├── enderecoController.js
│   │   └── usuarioController.js
│   ├── models/                 # Definições de constantes e categorias
│   │   └── tiposProblema.js
│   ├── pages/                  # Telas da aplicação
│   │   ├── Denunciar/          # Cadastro de novas ocorrências
│   │   ├── Denuncias/          # Consulta e listagem completa
│   │   ├── Estatisticas/       # Painel analítico de indicadores
│   │   ├── Inicio/             # Dashboard municipal e destaques
│   │   └── MapaGeral/          # Visualização ampla do mapa
│   ├── services/               # Camada de comunicação HTTP e APIs
│   │   ├── api.js              # Instância do Axios (JSON Server :3000)
│   │   ├── cidadeService.js    # CRUD e PATCH de /cidades
│   │   ├── denunciaService.js  # CRUD de /denuncias e /listaDenuncias
│   │   ├── enderecoService.js  # CRUD de /enderecos
│   │   ├── mapaService.js      # Geocodificação Nominatim / Coordenadas
│   │   ├── usuarioService.js   # CRUD de /usuarios
│   │   └── viaCepService.js    # Consulta https://viacep.com.br/
│   ├── styles/                 # Estilos globais e design system
│   │   ├── global.css
│   │   └── variaveis.css
│   ├── utils/                  # Formatadores e validadores pt-BR
│   │   ├── formatadores.js
│   │   └── validadores.js
│   ├── App.jsx                 # Estado global, modais e roteamento
│   ├── App.css
│   └── main.jsx                # Ponto de entrada React
├── db.json                     # Banco de dados local com 5 entidades
├── package.json
├── vite.config.js
├── index.html
└── README.md
```

---

## 5. Modelagem do Banco de Dados (`db.json`)

O banco no **JSON Server** é estruturado rigorosamente em **5 entidades normalizadas**:

```
  ┌──────────────┐                 ┌──────────────────┐
  │   usuarios   │ 1             N │  listaDenuncias  │
  ├──────────────┤─────────────────┼──────────────────┤
  │ id (PK)      │                 │ id (PK)          │
  │ nome         │                 │ dataDenuncia     │
  └──────────────┘                 │ horaDenuncia     │
                                   │ autorDenuncia(FK)├─► usuarios.id
  ┌──────────────┐                 │ caracteristicas  ├─► denuncias.id
  │  denuncias   │ 1             1 │   Denuncia (FK)  │
  ├──────────────┤─────────────────┤ endereco (FK)    ├─► enderecos.id
  │ id (PK)      │                 └──────────────────┘
  │ problemaPrin │                           │ N
  │ descricao    │                           │
  │ tempoProblema│                           ▼ 1
  │ tipoProblema │                 ┌──────────────────┐
  └──────────────┘                 │    enderecos     │
                                   ├──────────────────┤
                                   │ id (PK)          │
                                   │ cep, rua, bairro │
                                   │ cidade, estado   │
                                   │ lat, lng         │
                                   └──────────────────┘
                                             │ N
                                             ▼ 1
                                   ┌──────────────────┐
                                   │     cidades      │
                                   ├──────────────────┤
                                   │ id (PK)          │
                                   │ nome, estado     │
                                   │ totalDenuncias   │
                                   └──────────────────┘
```

### Detalhamento das 5 Entidades:

1. **`usuarios`**:
   - `id`: Identificador único do cidadão.
   - `nome`: Nome completo do solicitante.
2. **`enderecos`**:
   - `id`: Identificador único do local.
   - `cep`: Código de Endereçamento Postal formatado (`XXXXX-XXX`).
   - `rua` / `logradouro`: Nome do logradouro público.
   - `bairro`: Bairro identificado via ViaCEP.
   - `complemento`: Ponto de referência ou número do imóvel.
   - `cidade` / `estado`: Município e UF.
   - `latitude` / `longitude`: Coordenadas para renderização no Leaflet.
3. **`denuncias`**:
   - `id`: Identificador das características da ocorrência.
   - `problemaPrincipal`: Resumo ou tema do problema.
   - `descricao`: Relato detalhado do fato.
   - `tempoDoProblema`: Tempo de existência (ex: `"Há 2 semanas"`).
   - `tipoDoProblema`: Categoria restrita (`"problemaSocial"`, `"estrutural"`, `"saneamento"`).
4. **`listaDenuncias`**:
   - `id`: Registro principal da ocorrência.
   - `dataDenuncia`: Data de cadastro (`DD/MM/YYYY`).
   - `horaDenuncia`: Horário do cadastro (`HH:mm`).
   - `autorDenuncia`: Chave estrangeira para `usuarios.id`.
   - `caracteristicasDenuncia`: Chave estrangeira para `denuncias.id`.
   - `endereco`: Chave estrangeira para `enderecos.id`.
5. **`cidades`**:
   - `id`: Identificador da cidade (ex: `1`).
   - `nome`: Nome do município (ex: `"Americana"`).
   - `estado`: UF (ex: `"SP"`).
   - `totalDenuncias`: Contador mantido atualizado pelo Controller via requisição `PATCH`.

---

## 6. Categorias de Problemas

O sistema restringe e classifica as ocorrências em 3 pilares:

### 1. 👥 Problema Social (`problemaSocial`)
* **Temas atendidos:** Pessoas em situação de rua e vulnerabilidade, falta de patrulhamento/segurança pública, furtos, assaltos, vandalismo e perturbação da ordem.
* **Cor temática:** Roxo / Índigo (`#7c3aed`).

### 2. 🔧 Problema Estrutural (`estrutural`)
* **Temas atendidos:** Iluminação pública queimada, buracos em vias, calçadas danificadas, semáforos quebrados, sinalização e trânsito.
* **Cor temática:** Laranja / Âmbar (`#d97706`).

### 3. 🗑️ Problema de Saneamento (`saneamento`)
* **Temas atendidos:** Descarte irregular de lixo e entulho, falha na coleta domiciliar, esgoto a céu aberto, vazamento de água e alagamentos.
* **Cor temática:** Ciano / Esmeralda (`#0891b2`).

---

## 7. Fluxo de Cadastro e Resolução

```text
[ Cidadão ]
    │
    ▼
Digita Nome Completo
    │
    ▼
Informa CEP (8 dígitos) ──► Consulta Automática ViaCEP ──► Preenche Rua, Bairro e Cidade
    │
    ▼
Seleciona Categoria (Social / Estrutural / Saneamento)
    │
    ▼
Informa Tema do Problema e Descrição Detalhada
    │
    ▼
Informa Há Quanto Tempo o Problema Existe
    │
    ▼
[ denunciaController ] Executa a Transação:
    ├─► 1. POST /usuarios
    ├─► 2. Geocodifica e POST /enderecos
    ├─► 3. POST /denuncias
    ├─► 4. POST /listaDenuncias
    └─► 5. PATCH /cidades/1 (incrementa totalDenuncias)
    │
    ▼
Feedback com Confete, Toast de Sucesso e Atualização do Mapa em Tempo Real
```

---

## 8. APIs Utilizadas

1. **API ViaCEP (`https://viacep.com.br/`)**:
   - Endpoint: `GET /ws/{cep}/json/`
   - Utilizada para validação e obtenção automática de logradouro, bairro, município e UF.
2. **OpenStreetMap & Leaflet**:
   - Renderização dos mapas, tiles e controle de camadas com marcadores dinâmicos.
3. **OpenStreetMap Nominatim (`https://nominatim.openstreetmap.org/search`)**:
   - Geocodificação das vias para conversão em coordenadas geográficas reais (Latitude/Longitude).
4. **JSON Server Local (`http://localhost:3001`)**:
   - API RESTful mockada para persistência dos dados e relacionamentos.

---

## 9. Requisitos do Sistema

* **Node.js** (versão 18.x ou superior recomendada)
* **npm** ou **yarn**
* Navegador moderno (Chrome, Firefox, Edge, Safari)

---

## 10. Instalação e Execução

### Passo 1: Clonar ou Acessar a Pasta do Projeto

```bash
cd sistema-denuncias-urbanas
```

### Passo 2: Instalar as Dependências

```bash
npm install
```

### Passo 3: Iniciar o Backend (JSON Server)

Abra um terminal e execute:

```bash
npx json-server --watch db.json --port 3000
```
> O servidor de dados estará disponível em `http://localhost:3001`.

### Passo 4: Iniciar o Front-end (React + Vite)

Em outro terminal (na mesma pasta), execute:

```bash
npm run dev
```
> Acesse a aplicação no seu navegador em `http://localhost:5173`.

---

## 11. Regras de Negócio e Integridade Relacional

* **Sem Dados Órfãos:** Ao marcar uma ocorrência como **"✓ Problema Resolvido"**, o `denunciaController` remove o registro em `listaDenuncias`, remove as características correspondentes em `denuncias` e decrementa o contador em `cidades` via `PATCH`.
* **Validação de CEP:** Não é permitido submeter uma denúncia com CEP inexistente ou sem os 8 dígitos válidos.
* **Prevenção de Duplo Clique:** Botões de envio entram em estado de *loading* desabilitando cliques concorrentes.
* **Georreferenciamento com Fallback:** Caso o serviço de geocodificação sofra oscilações na rede, coordenadas seguras com leve dispersão geográfica garantem que o pino sempre apareça no mapa.

---

## 12. Autores e Equipe

Projeto desenvolvido para fins acadêmicos e demonstração técnica na disciplina de **Fábrica de Software**.

* **Desenvolvedor / Equipe:** Estudantes Análise e Desenvolvimento de Software
* **Instituição:** Escola Técnica

---

## 13. Licença
Este projeto está sob a licença **MIT** — livre para fins educacionais, acadêmicos e estudos de desenvolvimento full-stack. 

---

## 14. Processo de criação do Projeto
Durante o processo de criação do projeto não encontramos tantos desafios utilizando o Antigravity, mas um dos únicos problemas identficados foi em relação ao mapa geografico do site, pois ele estava retornando as coordenadas erradas e os pinos apareciam em locais totalmente diferentes do solicitado, mas isso foi decorrido ao uso de uma API paga onde limitava a utilização de algumas funções que colocamos no nosso site mas utilizando outra API nós iremos corrigir isso futuramente.
