/**
 * FinanceFlow - Dados de Demonstração e Configurações Padrão
 */

const DEFAULT_CATEGORIES = [
  // Despesas
  { id: 'cat-moradia', name: 'Moradia', type: 'expense', icon: '🏠', color: '#6366f1' },
  { id: 'cat-alimentacao', name: 'Alimentação', type: 'expense', icon: '🍔', color: '#f59e0b' },
  { id: 'cat-transporte', name: 'Transporte', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { id: 'cat-saude', name: 'Saúde & Farmácia', type: 'expense', icon: '💊', color: '#ef4444' },
  { id: 'cat-lazer', name: 'Lazer & Cultura', type: 'expense', icon: '🎮', color: '#ec4899' },
  { id: 'cat-educacao', name: 'Educação', type: 'expense', icon: '📚', color: '#8b5cf6' },
  { id: 'cat-compras', name: 'Compras & Vestuário', type: 'expense', icon: '🛍️', color: '#14b8a6' },
  { id: 'cat-contas', name: 'Contas & Serviços', type: 'expense', icon: '💡', color: '#f97316' },
  { id: 'cat-outros-exp', name: 'Outros Gastos', type: 'expense', icon: '📦', color: '#64748b' },

  // Receitas
  { id: 'cat-salario', name: 'Salário & Pró-labore', type: 'income', icon: '💼', color: '#10b981' },
  { id: 'cat-freelance', name: 'Freelance & Projetos', type: 'income', icon: '💻', color: '#06b6d4' },
  { id: 'cat-investimentos', name: 'Rendimentos & Dividendos', type: 'income', icon: '📈', color: '#84cc16' },
  { id: 'cat-outros-inc', name: 'Outras Receitas', type: 'income', icon: '💰', color: '#a855f7' }
];

const DEFAULT_PAYMENT_METHODS = [
  { id: 'pix', name: 'Pix', icon: '⚡' },
  { id: 'cartao_credito', name: 'Cartão de Crédito', icon: '💳' },
  { id: 'cartao_debito', name: 'Cartão de Débito', icon: '🏧' },
  { id: 'dinheiro', name: 'Dinheiro', icon: '💵' },
  { id: 'boleto', name: 'Boleto Bancário', icon: '📄' },
  { id: 'transferencia', name: 'TED / Transferência', icon: '🏦' }
];

function generateSampleTransactions() {
  const transactions = [];
  const now = new Date();
  let idCounter = 1;

  // Gerar dados para os últimos 6 meses (do mês atual para trás)
  for (let m = 5; m >= 0; m--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');

    // Receita 1: Salário (dia 05)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Salário Mensal',
      amount: 7500.00,
      type: 'income',
      categoryId: 'cat-salario',
      paymentMethod: 'transferencia',
      date: `${year}-${month}-05`,
      status: 'paid',
      notes: 'Depósito em conta corrente'
    });

    // Receita 2: Freelance / Consultoria (dia 15)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Consultoria e Desenvolvimento',
      amount: 1800.00 + (m % 3) * 400,
      type: 'income',
      categoryId: 'cat-freelance',
      paymentMethod: 'pix',
      status: 'paid',
      notes: 'Projeto web'
    });

    // Receita 3: Rendimentos (dia 20)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Rendimentos CDB & Dividendos',
      amount: 320.00 + (5 - m) * 45,
      type: 'income',
      categoryId: 'cat-investimentos',
      paymentMethod: 'transferencia',
      status: 'paid',
      notes: 'Corretora'
    });

    // Despesas fixas
    // Aluguel / Condomínio (dia 08)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Aluguel & Condomínio',
      amount: 2200.00,
      type: 'expense',
      categoryId: 'cat-moradia',
      paymentMethod: 'boleto',
      date: `${year}-${month}-08`,
      status: 'paid',
      notes: 'Apartamento'
    });

    // Energia e Internet (dia 10)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Energia Elétrica & Fibra Óptica',
      amount: 340.00 + (m % 2) * 35,
      type: 'expense',
      categoryId: 'cat-contas',
      paymentMethod: 'pix',
      date: `${year}-${month}-10`,
      status: 'paid',
      notes: 'Enel + Internet 500MB'
    });

    // Supermercado 1 (dia 06)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Supermercado (Compras do Mês)',
      amount: 780.00 + (m % 4) * 60,
      type: 'expense',
      categoryId: 'cat-alimentacao',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-06`,
      status: 'paid',
      notes: 'Pão de Açúcar'
    });

    // Supermercado 2 (dia 20)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Hortifruti & Feira da Semana',
      amount: 310.00 + (m % 3) * 40,
      type: 'expense',
      categoryId: 'cat-alimentacao',
      paymentMethod: 'pix',
      date: `${year}-${month}-20`,
      status: 'paid',
      notes: 'Feira orgânica'
    });

    // Transporte / Combustível (dia 12)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Combustível & Manutenção Carro',
      amount: 420.00 + (m % 2) * 50,
      type: 'expense',
      categoryId: 'cat-transporte',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-12`,
      status: 'paid',
      notes: 'Posto Shell'
    });

    // Aplicativos de Transporte (dia 18)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Uber / 99 Táxi',
      amount: 145.00 + (m % 3) * 25,
      type: 'expense',
      categoryId: 'cat-transporte',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-18`,
      status: 'paid',
      notes: 'Deslocamentos urbanos'
    });

    // Restaurantes e Delivery (dia 14)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Jantar Restaurante & iFood',
      amount: 390.00 + (m % 4) * 45,
      type: 'expense',
      categoryId: 'cat-alimentacao',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-14`,
      status: 'paid',
      notes: 'Fim de semana'
    });

    // Saúde / Academia / Farmácia (dia 07)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Mensalidade Academia & Vitaminas',
      amount: 210.00,
      type: 'expense',
      categoryId: 'cat-saude',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-07`,
      status: 'paid',
      notes: 'SmartFit'
    });

    // Lazer / Streaming / Cinema (dia 16)
    transactions.push({
      id: `tx-${idCounter++}`,
      description: 'Netflix, Spotify & Cinema',
      amount: 185.00 + (m % 2) * 40,
      type: 'expense',
      categoryId: 'cat-lazer',
      paymentMethod: 'cartao_credito',
      date: `${year}-${month}-16`,
      status: 'paid',
      notes: 'Assinaturas digitais'
    });

    // Compras / Vestuário (dia 22)
    if (m % 2 === 0) {
      transactions.push({
        id: `tx-${idCounter++}`,
        description: 'Roupas & Acessórios',
        amount: 290.00 + m * 30,
        type: 'expense',
        categoryId: 'cat-compras',
        paymentMethod: 'cartao_credito',
        date: `${year}-${month}-22`,
        status: 'paid',
        notes: 'Shopping'
      });
    }

    // Educação / Cursos (dia 25)
    if (m % 3 === 0) {
      transactions.push({
        id: `tx-${idCounter++}`,
        description: 'Curso Online & Livros Técnicos',
        amount: 199.00,
        type: 'expense',
        categoryId: 'cat-educacao',
        paymentMethod: 'pix',
        date: `${year}-${month}-25`,
        status: 'paid',
        notes: 'Plataforma de cursos'
      });
    }
  }

  return transactions;
}

const DEFAULT_BUDGETS = [
  { categoryId: 'cat-moradia', monthlyLimit: 2500.00 },
  { categoryId: 'cat-alimentacao', monthlyLimit: 1600.00 },
  { categoryId: 'cat-transporte', monthlyLimit: 700.00 },
  { categoryId: 'cat-saude', monthlyLimit: 400.00 },
  { categoryId: 'cat-lazer', monthlyLimit: 500.00 },
  { categoryId: 'cat-compras', monthlyLimit: 600.00 },
  { categoryId: 'cat-contas', monthlyLimit: 450.00 }
];

const DEFAULT_GOALS = [
  {
    id: 'goal-1',
    name: 'Reserva de Emergência (6 Meses)',
    targetAmount: 30000.00,
    currentAmount: 21500.00,
    targetDate: '2026-12-31',
    icon: '🛡️',
    color: '#10b981'
  },
  {
    id: 'goal-2',
    name: 'Viagem de Férias para a Europa',
    targetAmount: 18000.00,
    currentAmount: 9400.00,
    targetDate: '2027-05-15',
    icon: '✈️',
    color: '#3b82f6'
  },
  {
    id: 'goal-3',
    name: 'Troca de Carro / Entrada',
    targetAmount: 25000.00,
    currentAmount: 6800.00,
    targetDate: '2027-11-30',
    icon: '🚗',
    color: '#8b5cf6'
  }
];
