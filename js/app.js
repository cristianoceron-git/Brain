/**
 * FinanceFlow - Orquestrador Principal da Aplicação
 */

class FinanceApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.currentPeriod = 'current-month';
    this.toastContainer = null;
  }

  init() {
    this.createToastContainer();
    this.bindNavigation();
    this.bindThemeControls();
    this.bindPeriodSelector();
    this.bindKeyboardShortcuts();
    this.bindGlobalModals();

    // Inicializa subsistemas
    window.transactionManager.init();
    window.budgetManager.init();
    window.goalManager.init();
    window.financeCalculators.init();

    // Escuta alterações do store para re-renderizar automaticamente
    window.store.subscribe(() => {
      this.renderCurrentView();
    });

    // Renderiza a visualização inicial
    this.switchTab('dashboard');

    // Redimensionamento de janela (atualiza gráficos responsivamente)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.renderCharts(), 150);
    });
  }

  createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'danger') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  bindNavigation() {
    // Nav Items Sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        if (tab) {
          this.switchTab(tab);
          // Fecha sidebar no mobile
          document.querySelector('.sidebar').classList.remove('open');
        }
      });
    });

    // Mobile Menu Toggle
    const menuBtn = document.getElementById('menu-toggle-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
      });
    }

    // Fechar ao clicar fora no mobile
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.sidebar');
      const menuBtn = document.getElementById('menu-toggle-btn');
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Atualiza classes ativas na Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.tab === tabName) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Atualiza Panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabName}`) pane.classList.add('active');
      else pane.classList.remove('active');
    });

    // Atualiza Título do Cabeçalho
    const titleMap = {
      dashboard: { title: 'Visão Geral', sub: 'Resumo das suas finanças e fluxo de caixa' },
      transactions: { title: 'Transações', sub: 'Extrato completo de receitas e despesas' },
      reports: { title: 'Relatórios & Gráficos', sub: 'Análise detalhada da evolução financeira' },
      budgets: { title: 'Orçamentos & Limites', sub: 'Controle de gastos por categoria' },
      goals: { title: 'Metas & Cofrinhos', sub: 'Planejamento e economia para seus objetivos' },
      calculators: { title: 'Calculadoras Financeiras', sub: 'Simulações de juros compostos e empréstimos' },
      settings: { title: 'Configurações & Backup', sub: 'Gerencie moedas, backups e preferências' }
    };

    const header = titleMap[tabName] || { title: 'FinanceFlow', sub: '' };
    document.getElementById('page-title').textContent = header.title;
    document.getElementById('page-subtitle').textContent = header.sub;

    this.renderCurrentView();
  }

  bindThemeControls() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const updateActiveBtn = (currentTheme) => {
      themeBtns.forEach(btn => {
        if (btn.dataset.theme === currentTheme) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    };

    updateActiveBtn(window.store.getTheme());

    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        window.store.setTheme(theme);
        updateActiveBtn(theme);
        this.renderCharts();
      });
    });
  }

  bindPeriodSelector() {
    const select = document.getElementById('global-period-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.currentPeriod = e.target.value;
        window.transactionManager.setPeriod(this.currentPeriod);
        this.renderCurrentView();
      });
    }
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignorar se estiver digitando em um input
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') {
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.transactionManager.openAddModal('expense');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        const themes = ['light', 'dark', 'system'];
        const next = themes[(themes.indexOf(window.store.getTheme()) + 1) % themes.length];
        window.store.setTheme(next);
        document.querySelectorAll('.theme-btn').forEach(b => {
          if (b.dataset.theme === next) b.classList.add('active');
          else b.classList.remove('active');
        });
        this.renderCharts();
        this.showToast(`Tema alterado para: ${next}`, 'info');
      } else if (e.key === '?') {
        e.preventDefault();
        document.getElementById('shortcuts-modal').classList.toggle('active');
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  bindGlobalModals() {
    // Fechamento de modais ao clicar no botão X ou no backdrop
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAllModals();
      });
    });

    // Upload JSON Backup
    const fileInput = document.getElementById('import-json-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          window.financeExporter.importJSON(e.target.files[0]);
          fileInput.value = '';
        }
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }

  renderCurrentView() {
    if (this.currentTab === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentTab === 'transactions') {
      window.transactionManager.render();
    } else if (this.currentTab === 'reports') {
      this.renderReports();
    } else if (this.currentTab === 'budgets') {
      window.budgetManager.render();
    } else if (this.currentTab === 'goals') {
      window.goalManager.render();
    } else if (this.currentTab === 'calculators') {
      window.financeCalculators.calculateCompoundInterest();
      window.financeCalculators.calculateLoan();
    } else if (this.currentTab === 'settings') {
      this.renderSettings();
    }
  }

  refreshAllViews() {
    window.transactionManager.populateCategoryOptions();
    window.transactionManager.populatePaymentMethodOptions();
    window.transactionManager.render();
    window.budgetManager.render();
    window.goalManager.render();
    this.renderCurrentView();
  }

  // ==========================================
  // Renderização do Dashboard
  // ==========================================
  renderDashboard() {
    const transactions = window.transactionManager.getFilteredTransactions();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'expense') totalExpense += tx.amount;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100).toFixed(1) : 0;

    // Saldo Geral Acumulado de Todas as Transações do Histórico
    const allTx = window.store.state.transactions || [];
    let lifetimeBalance = 0;
    allTx.forEach(tx => {
      if (tx.type === 'income') lifetimeBalance += tx.amount;
      else if (tx.type === 'expense') lifetimeBalance -= tx.amount;
    });

    // Atualiza KPIs
    const elBal = document.getElementById('kpi-balance');
    const elInc = document.getElementById('kpi-income');
    const elExp = document.getElementById('kpi-expense');
    const elSav = document.getElementById('kpi-savings');
    const elRate = document.getElementById('kpi-savings-rate');

    if (elBal) elBal.textContent = window.store.formatCurrency(lifetimeBalance);
    if (elInc) elInc.textContent = window.store.formatCurrency(totalIncome);
    if (elExp) elExp.textContent = window.store.formatCurrency(totalExpense);
    if (elSav) {
      elSav.textContent = window.store.formatCurrency(netSavings);
      elSav.style.color = netSavings >= 0 ? 'var(--income)' : 'var(--expense)';
    }
    if (elRate) elRate.textContent = `${savingsRate}% do total ganho`;

    this.renderDashboardCharts(transactions, totalExpense);
    window.transactionManager.renderDashboardRecentTable();
    window.budgetManager.render();
    window.goalManager.render();
  }

  renderDashboardCharts(transactions, totalExpense) {
    // 1. Gráfico de Barras Mensais dos últimos 6 meses
    const monthlyData = this.getHistoricalMonthlyData(6);
    window.financeCharts.renderMonthlyBarChart('dashboard-monthly-chart', monthlyData);

    // 2. Gráfico Donut de Despesas por Categoria no Período Selecionado
    const categoryTotals = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
    });

    const donutItems = Object.keys(categoryTotals).map(catId => {
      const cat = window.store.getCategoryById(catId);
      return {
        id: catId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: categoryTotals[catId]
      };
    }).sort((a, b) => b.amount - a.amount);

    window.financeCharts.renderDonutChart('dashboard-donut-chart', donutItems, totalExpense);

    // Atualiza Lista Lateral ao lado do Donut
    const catList = document.getElementById('dashboard-category-list');
    if (catList) {
      if (donutItems.length === 0) {
        catList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.85rem;">Nenhuma despesa no período.</div>`;
      } else {
        catList.innerHTML = donutItems.slice(0, 5).map(item => {
          const pct = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0;
          return `
            <div class="category-breakdown-item">
              <div class="category-item-left">
                <div class="category-color-badge" style="background-color: ${item.color};"></div>
                <div>
                  <div class="category-name">${item.icon} ${item.name}</div>
                  <div class="category-percentage">${pct}% do total</div>
                </div>
              </div>
              <div class="category-amount">${window.store.formatCurrency(item.amount)}</div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ==========================================
  // Renderização dos Relatórios Avançados
  // ==========================================
  renderReports() {
    // 1. Gráfico Histórico 12 Meses
    const historical12 = this.getHistoricalMonthlyData(12);
    window.financeCharts.renderMonthlyBarChart('reports-historical-chart', historical12);

    // 2. Gráfico de Fluxo de Caixa Diário Acumulado do Mês
    const dailyData = this.getDailyCashFlowData();
    window.financeCharts.renderLineChart('reports-cashflow-chart', dailyData);

    // 3. Detalhamento por Forma de Pagamento
    const transactions = window.transactionManager.getFilteredTransactions();
    this.renderPaymentMethodsBreakdown(transactions);

    // 4. Insights Automáticos
    this.renderAutomatedInsights(transactions, historical12);
  }

  getHistoricalMonthlyData(numMonths = 6) {
    const allTx = window.store.state.transactions || [];
    const now = new Date();
    const labels = [];
    const incomes = [];
    const expenses = [];

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const label = `${monthNames[mo]}/${String(yr).slice(2)}`;

      labels.push(label);

      let inc = 0;
      let exp = 0;

      allTx.forEach(tx => {
        const txDate = new Date(tx.date + 'T12:00:00');
        if (txDate.getFullYear() === yr && txDate.getMonth() === mo) {
          if (tx.type === 'income') inc += tx.amount;
          else if (tx.type === 'expense') exp += tx.amount;
        }
      });

      incomes.push(inc);
      expenses.push(exp);
    }

    return { labels, incomes, expenses };
  }

  getDailyCashFlowData() {
    const transactions = window.transactionManager.getFilteredTransactions();
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyMap = {};
    sorted.forEach(tx => {
      const day = tx.date.split('-')[2] || '01';
      const net = tx.type === 'income' ? tx.amount : -tx.amount;
      dailyMap[day] = (dailyMap[day] || 0) + net;
    });

    const days = Object.keys(dailyMap).sort((a, b) => parseInt(a) - parseInt(b));
    let accumulated = 0;
    const values = [];
    const labels = [];

    days.forEach(day => {
      accumulated += dailyMap[day];
      labels.push(`Dia ${day}`);
      values.push(accumulated);
    });

    return { labels, values };
  }

  renderPaymentMethodsBreakdown(transactions) {
    const container = document.getElementById('reports-methods-breakdown');
    if (!container) return;

    const methodTotals = {};
    let totalExpense = 0;

    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const mId = tx.paymentMethod || 'outro';
      methodTotals[mId] = (methodTotals[mId] || 0) + tx.amount;
      totalExpense += tx.amount;
    });

    const items = Object.keys(methodTotals).map(mId => {
      const m = window.store.getPaymentMethodById(mId);
      const amount = methodTotals[mId];
      const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
      return { ...m, amount, pct };
    }).sort((a, b) => b.amount - a.amount);

    if (items.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Nenhuma despesa no período selecionado.</div>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div style="display: flex; flex-direction: column; gap: 0.35rem; padding: 0.6rem 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
          <span style="font-weight: 600; color: var(--text-main);">${item.icon} ${item.name}</span>
          <span style="font-weight: 700; font-family: var(--font-mono); color: var(--text-main);">
            ${window.store.formatCurrency(item.amount)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(${item.pct}%)</span>
          </span>
        </div>
        <div class="progress-bar-container" style="height: 6px;">
          <div class="progress-bar-fill progress-success" style="width: ${item.pct}%; background-color: var(--primary);"></div>
        </div>
      </div>
    `).join('');
  }

  renderAutomatedInsights(transactions, historical) {
    const container = document.getElementById('reports-insights-container');
    if (!container) return;

    const insights = [];

    // 1. Maior Categoria de Despesa
    const catTotals = {};
    let totalExpense = 0;
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      catTotals[tx.categoryId] = (catTotals[tx.categoryId] || 0) + tx.amount;
      totalExpense += tx.amount;
    });

    const topCatId = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
    if (topCatId && totalExpense > 0) {
      const cat = window.store.getCategoryById(topCatId);
      const pct = ((catTotals[topCatId] / totalExpense) * 100).toFixed(0);
      insights.push(`💡 <strong>Maior foco de gastos:</strong> A categoria <strong>${cat.icon} ${cat.name}</strong> representou <strong>${pct}%</strong> de todas as suas despesas no período (${window.store.formatCurrency(catTotals[topCatId])}).`);
    }

    // 2. Comparativo de Gastos com o Mês Anterior
    if (historical.expenses.length >= 2) {
      const curr = historical.expenses[historical.expenses.length - 1];
      const prev = historical.expenses[historical.expenses.length - 2];
      if (prev > 0) {
        const diffPct = (((curr - prev) / prev) * 100).toFixed(1);
        if (curr > prev) {
          insights.push(`📈 <strong>Aumento de Despesas:</strong> Você gastou <strong>${Math.abs(diffPct)}% a mais</strong> do que no mês anterior. Considere revisar categorias não essenciais.`);
        } else {
          insights.push(`👏 <strong>Economia Conquistada:</strong> Seus gastos foram <strong>${Math.abs(diffPct)}% menores</strong> em relação ao mês anterior! Parabéns pelo controle financeiro.`);
        }
      }
    }

    // 3. Taxa de Poupança
    let totalInc = 0;
    transactions.filter(tx => tx.type === 'income').forEach(tx => totalInc += tx.amount);
    if (totalInc > 0) {
      const rate = (((totalInc - totalExpense) / totalInc) * 100).toFixed(0);
      if (rate >= 20) {
        insights.push(`🌟 <strong>Excelente Taxa de Poupança:</strong> Você está poupando <strong>${rate}%</strong> da sua renda bruta. O recomendado por especialistas é pelo menos 20%.`);
      } else if (rate > 0) {
        insights.push(`ℹ️ <strong>Potencial de Otimização:</strong> Sua taxa de poupança atual é de <strong>${rate}%</strong>. Pequenos ajustes em lazer ou alimentação fora podem ajudar a elevar para 20%.`);
      }
    }

    container.innerHTML = insights.map(i => `
      <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.85rem; line-height: 1.45;">
        ${i}
      </div>
    `).join('');
  }

  // ==========================================
  // Renderização das Configurações
  // ==========================================
  renderSettings() {
    const currSelect = document.getElementById('settings-currency-select');
    if (currSelect) {
      currSelect.value = window.store.getCurrency();
      currSelect.onchange = (e) => {
        window.store.setCurrency(e.target.value);
        this.showToast(`Moeda atualizada para: ${e.target.value}`, 'success');
        this.renderCurrentView();
      };
    }
  }

  renderCharts() {
    if (this.currentTab === 'dashboard') {
      const transactions = window.transactionManager.getFilteredTransactions();
      let totalExpense = 0;
      transactions.forEach(t => { if (t.type === 'expense') totalExpense += t.amount; });
      this.renderDashboardCharts(transactions, totalExpense);
    } else if (this.currentTab === 'reports') {
      this.renderReports();
    } else if (this.currentTab === 'calculators') {
      window.financeCalculators.calculateCompoundInterest();
    }
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FinanceApp();
  window.app.init();
});
