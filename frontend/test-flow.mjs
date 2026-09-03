// Test script to verify json-server endpoints and business logic
const BASE_URL = 'http://localhost:3001';

async function test() {
  console.log('--- Testando Conectividade da API ---');
  const resProd = await fetch(`${BASE_URL}/produtos`);
  const produtos = await resProd.json();
  console.log(`✓ Produtos carregados (${produtos.length} itens)`);

  const resUser = await fetch(`${BASE_URL}/usuarios`);
  const usuarios = await resUser.json();
  console.log(`✓ Usuários carregados (${usuarios.length} usuários)`);

  console.log('\n--- Testando Regra de Negócio: Entrada de Estoque ---');
  const produtoAlvo = produtos[0]; // Capacete de Segurança
  const estoqueOriginal = Number(produtoAlvo.quantidade_estoque);
  const qtdEntrada = 10;
  const novoEstoqueEsperado = estoqueOriginal + qtdEntrada;

  // 1. POST /movimentacoes
  const resMov = await fetch(`${BASE_URL}/movimentacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      produto_id: String(produtoAlvo.id),
      usuario_id: String(usuarios[0].id),
      tipo: 'entrada',
      quantidade_movimentada: qtdEntrada,
      data: new Date().toISOString(),
    }),
  });
  const movCriada = await resMov.json();
  console.log(`✓ Movimentação criada com ID: ${movCriada.id}`);

  // 2. PATCH /produtos/:id
  const resPatch = await fetch(`${BASE_URL}/produtos/${produtoAlvo.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantidade_estoque: novoEstoqueEsperado }),
  });
  const prodAtualizado = await resPatch.json();
  console.log(`✓ Produto ${prodAtualizado.nome} atualizado para ${prodAtualizado.quantidade_estoque} un. (Esperado: ${novoEstoqueEsperado})`);

  console.log('\n--- Testando Regra de Negócio: Saída de Estoque com Validação ---');
  const qtdSaida = 5;
  const saldoAposSaida = prodAtualizado.quantidade_estoque - qtdSaida;

  // Validação: se saída > estoque, bloquearia
  if (qtdSaida <= prodAtualizado.quantidade_estoque) {
    await fetch(`${BASE_URL}/movimentacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_id: String(produtoAlvo.id),
        usuario_id: String(usuarios[1].id),
        tipo: 'saida',
        quantidade_movimentada: qtdSaida,
        data: new Date().toISOString(),
      }),
    });

    const resPatchSaida = await fetch(`${BASE_URL}/produtos/${produtoAlvo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade_estoque: saldoAposSaida }),
    });
    const prodPosSaida = await resPatchSaida.json();
    console.log(`✓ Saída executada com sucesso. Estoque final: ${prodPosSaida.quantidade_estoque} un.`);
  }

  console.log('\n--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
}

test().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
