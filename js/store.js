/**
 * FinanceFlow - Store e Gerenciamento de Estado com Persistência Local
 */

class FinanceStore {
  constructor() {
    this.STORAGE_KEY = 'FINANCEFLOW_DATA_V1';
    this.THEME_KEY = 'FINANCEFLOW_THEME';
    this.CURRENCY_KEY = 'FINANCEFLOW_CURRENCY';
    this.listeners = [];

    this.state = this.loadState();
    this.initTheme();
  }

  // Carrega estado do LocalStorage ou inicializa com dados de demonstração
  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.transactions)) {
          return {
            transactions: parsed.transactions || [],
            categories: parsed.categories || DEFAULT_CATEGORIES,
            budgets: parsed.budgets || DEFAULT_BUDGETS,
            goals: parsed.goals || DEFAULT_GOALS,
            currency: localStorage.getItem(this.CURRENCY_KEY) || 'BRL'
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do LocalStorage, usando dados de exemplo:', e);
    }

    // Inicialização padrão
    const initialState = {
      transactions: generateSampleTransactions(),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      budgets: JSON.parse(JSON.stringify(DEFAULT_BUDGETS)),
      goals: JSON.parse(JSON.stringify(DEFAULT_GOALS)),
      currency: 'BRL'
    };
    this.saveState(initialState);
    return initialState;
  }

  saveState(stateToSave = null) {
    const data = stateToSave || this.state;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CURRENCY_KEY, data.currency || 'BRL');
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
    this.notify();
  }

  // Inscrição em mudanças de estado
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.state);
      } catch (e) {
        console.error('Erro no listener do store:', e);
      }
    });
  }

  // Gerenciamento de Tema (Claro / Escuro / Sistema)
  initTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) || 'system';
    this.setTheme(savedTheme, false);

    // Escuta mudança de tema do sistema operacional
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem(this.THEME_KEY) === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        this.notify();
      }
    });
  }

  setTheme(theme, save = true) {
    if (save) {
      localStorage.setItem(this.THEME_KEY, theme);
    }
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    this.notify();
  }

  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'system';
  }

  // Moeda
  setCurrency(curr) {
    this.state.currency = curr;
    this.saveState();
  }

  getCurrency() {
    return this.state.currency || 'BRL';
  }

  // Formatadores Auxiliares
  formatCurrency(value, customCurrency = null) {
    const curr = customCurrency || this.getCurrency();
    const num = Number(value) || 0;
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: curr
      }).format(num);
    } catch (e) {
      return `R$ ${num.toFixed(2).replace('.', ',')}`;
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // CRUD Transações
  addTransaction(tx) {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      amount: parseFloat(tx.amount) || 0,
      status: tx.status || 'paid',
      createdAt: new Date().toISOString()
    };
    this.state.transactions.unshift(newTx);
    this.saveState();
    return newTx;
  }

  updateTransaction(id, updatedData) {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.transactions[idx] = {
        ...this.state.transactions[idx],
        ...updatedData,
        amount: parseFloat(updatedData.amount) || 0
      };
      this.saveState();
      return this.state.transactions[idx];
    }
    return null;
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.saveState();
  }

  duplicateTransaction(id) {
    const original = this.state.transactions.find(t => t.id === id);
    if (original) {
      const copy = {
        ...original,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        description: `${original.description} (Cópia)`,
        createdAt: new Date().toISOString()
      };
      this.state.transactions.unshift(copy);
      this.saveState();
      return copy;
    }
    return null;
  }

  toggleTransactionStatus(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (tx) {
      tx.status = tx.status === 'paid' ? 'pending' : 'paid';
      this.saveState();
      return tx;
    }
    return null;
  }

  // Orçamentos
  setBudget(categoryId, limit) {
    const numericLimit = parseFloat(limit) || 0;
    const existing = this.state.budgets.find(b => b.categoryId === categoryId);
    if (existing) {
      existing.monthlyLimit = numericLimit;
    } else {
      this.state.budgets.push({ categoryId, monthlyLimit: numericLimit });
    }
    this.saveState();
  }

  // Metas
  addGoal(goal) {
    const newGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      targetAmount: parseFloat(goal.targetAmount) || 0,
      currentAmount: parseFloat(goal.currentAmount) || 0,
      createdAt: new Date().toISOString()
    };
    this.state.goals.push(newGoal);
    this.saveState();
    return newGoal;
  }

  updateGoal(id, updatedData) {
    const idx = this.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.goals[idx] = {
        ...this.state.goals[idx],
        ...updatedData,
        targetAmount: parseFloat(updatedData.targetAmount) || 0,
        currentAmount: parseFloat(updatedData.currentAmount) || 0
      };
      this.saveState();
      return this.state.goals[idx];
    }
    return null;
  }

  depositToGoal(id, amount) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.currentAmount = Math.min(goal.targetAmount * 2, (goal.currentAmount || 0) + parseFloat(amount));
      this.saveState();
      return goal;
    }
    return null;
  }

  withdrawFromGoal(id, amount) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - parseFloat(amount));
      this.saveState();
      return goal;
    }
    return null;
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.saveState();
  }

  // Categorias
  addCategory(category) {
    const newCat = {
      ...category,
      id: `cat-${Date.now()}`
    };
    this.state.categories.push(newCat);
    this.saveState();
    return newCat;
  }

  getCategoryById(id) {
    return this.state.categories.find(c => c.id === id) || {
      id: 'unknown',
      name: 'Sem Categoria',
      icon: '📁',
      color: '#94a3b8'
    };
  }

  getPaymentMethodById(id) {
    return DEFAULT_PAYMENT_METHODS.find(p => p.id === id) || {
      id: 'outro',
      name: 'Outro',
      icon: '💵'
    };
  }

  // Restauração e Limpeza
  resetToSampleData() {
    this.state = {
      transactions: generateSampleTransactions(),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      budgets: JSON.parse(JSON.stringify(DEFAULT_BUDGETS)),
      goals: JSON.parse(JSON.stringify(DEFAULT_GOALS)),
      currency: 'BRL'
    };
    this.saveState();
  }

  clearAllData() {
    this.state = {
      transactions: [],
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      budgets: [],
      goals: [],
      currency: 'BRL'
    };
    this.saveState();
  }
}

// Instância única global do store
window.store = new FinanceStore();
