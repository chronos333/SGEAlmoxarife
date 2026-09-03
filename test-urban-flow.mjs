async function runTests() {
  console.log('🚀 Iniciando testes de integração: ViaCEP + JSON-Server + Regras de Negócio...');

  // Teste 1: Consulta ViaCEP
  console.log('\n[TESTE 1] Testando API do ViaCEP com CEP 01001-000...');
  try {
    const resViaCep = await fetch('https://viacep.com.br/ws/01001000/json/');
    const dadosViaCep = await resViaCep.json();
    if (dadosViaCep.logradouro === 'Praça da Sé' && dadosViaCep.bairro === 'Sé') {
      console.log('✅ ViaCEP OK: Praça da Sé, Sé - São Paulo/SP');
    } else {
      console.error('❌ Falha nos dados do ViaCEP:', dadosViaCep);
    }
  } catch (err) {
    console.error('❌ Erro de conexão com ViaCEP:', err.message);
  }

  // Teste 2: Entidades no json-server
  console.log('\n[TESTE 2] Verificando as 5 entidades no JSON-Server (http://localhost:3001)...');
  try {
    const [usuarios, enderecos, denuncias, lista, tipos] = await Promise.all([
      fetch('http://localhost:3001/usuarios').then((r) => r.json()),
      fetch('http://localhost:3001/enderecos').then((r) => r.json()),
      fetch('http://localhost:3001/denuncias').then((r) => r.json()),
      fetch('http://localhost:3001/listaDeDenuncias').then((r) => r.json()),
      fetch('http://localhost:3001/tiposDeProblema').then((r) => r.json()),
    ]);

    console.log(`✅ 1. Usuários: ${usuarios.length} registros`);
    console.log(`✅ 2. Endereços: ${enderecos.length} registros`);
    console.log(`✅ 3. Denúncias: ${denuncias.length} registros`);
    console.log(`✅ 4. Lista de Denúncias: ${lista.length} registros`);
    console.log(`✅ 5. Tipos de Problema: ${tipos.length} categorias`);

    // Teste 3: Execução da Regra de Negócio (POST em listaDeDenuncias + PATCH em denuncias/:id)
    console.log('\n[TESTE 3] Testando Regra de Negócio: POST em listaDeDenuncias seguido de PATCH em denuncias/:id...');
    
    // Pegamos a primeira denúncia
    const denunciaAlvo = denuncias[0];
    const ocorrenciasIniciais = Number(denunciaAlvo.totalOcorrencias || 1);

    // Passo A: POST na lista
    const postRes = await fetch('http://localhost:3001/listaDeDenuncias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataDenuncia: '2026-09-03',
        horaDenuncia: '10:00:00',
        autorDenuncia: 'Carlos Silva',
        caracteristicasDenuncia: String(denunciaAlvo.id),
        cep: denunciaAlvo.cep,
        detalhe: 'Manifestação de teste automatizado',
      }),
    });
    const novoItem = await postRes.json();
    console.log(`✅ POST em listaDeDenuncias concluído (ID gerado: ${novoItem.id})`);

    // Passo B: PATCH imediato na denúncia
    const patchRes = await fetch(`http://localhost:3001/denuncias/${denunciaAlvo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalOcorrencias: ocorrenciasIniciais + 1,
      }),
    });
    const denunciaAtualizada = await patchRes.json();
    console.log(`✅ PATCH em denuncias/${denunciaAlvo.id} concluído! Novo total: ${denunciaAtualizada.totalOcorrencias} (era ${ocorrenciasIniciais})`);

    if (denunciaAtualizada.totalOcorrencias === ocorrenciasIniciais + 1) {
      console.log('🎉 REGRA DE NEGÓCIO ATÔMICA EXECUTADA COM SUCESSO!');
    }

    // Teste 4: Resolução / Remoção de denúncia
    console.log('\n[TESTE 4] Testando resolução de denúncia...');
    const resolverRes = await fetch(`http://localhost:3001/denuncias/${denunciaAlvo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolvido' }),
    });
    const resolvida = await resolverRes.json();
    console.log(`✅ Denúncia ID ${denunciaAlvo.id} marcada como: ${resolvida.status}`);

    // Reverter status para pendente e contador para manter a base consistente
    await fetch(`http://localhost:3001/denuncias/${denunciaAlvo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pendente', totalOcorrencias: ocorrenciasIniciais }),
    });
    // Remove o item de teste criado
    await fetch(`http://localhost:3001/listaDeDenuncias/${novoItem.id}`, {
      method: 'DELETE',
    });
    console.log('✅ Base de dados redefinida para o estado limpo inicial.');

  } catch (err) {
    console.error('❌ Erro durante o fluxo de teste:', err);
  }
}

runTests();
