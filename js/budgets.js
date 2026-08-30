/**
 * FinanceFlow - Gerenciador de Orçamentos e Tetos de Gastos por Categoria
 */

class BudgetManager {
  constructor() {
    this.editingCategoryId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const form = document.getElementById('budget-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }

  // Calcula gastos da categoria no mês atual
  getMonthlySpentByCategory(categoryId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return window.store.state.transactions
      .filter(tx => {
        if (tx.type !== 'expense' || tx.categoryId !== categoryId) return false;
        const d = new Date(tx.date + 'T12:00:00');
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  // Dados consolidados de todos os orçamentos
  getBudgetData() {
    const expenseCategories = window.store.state.categories.filter(c => c.type === 'expense');
    const budgets = window.store.state.budgets || [];

    return expenseCategories.map(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id);
      const limit = budget ? budget.monthlyLimit : 0;
      const spent = this.getMonthlySpentByCategory(cat.id);
      const remaining = Math.max(0, limit - spent);
      const percent = limit > 0 ? Math.min(200, (spent / limit) * 100) : (spent > 0 ? 100 : 0);

      let status = 'safe';
      if (percent >= 100) status = 'danger';
      else if (percent >= 80) status = 'warning';

      return {
        category: cat,
        limit,
        spent,
        remaining,
        percent,
        status
      };
    });
  }

  render() {
    const data = this.getBudgetData();
    const grid = document.getElementById('budgets-grid');

    let totalBudget = 0;
    let totalSpentInBudgets = 0;

    data.forEach(item => {
      totalBudget += item.limit;
      totalSpentInBudgets += item.spent;
    });

    // Atualiza Resumo de Orçamento no Topo da aba Orçamentos
    const summaryCard = document.getElementById('budgets-overview-card');
    if (summaryCard) {
      const globalPercent = totalBudget > 0 ? ((totalSpentInBudgets / totalBudget) * 100).toFixed(1) : 0;
      summaryCard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Limite Mensal Total Planejado</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${window.store.formatCurrency(totalBudget)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">Gasto em Categorias Orçadas</div>
              <div style="font-size: 1.3rem; font-weight: 700; color: ${totalSpentInBudgets > totalBudget ? 'var(--expense)' : 'var(--text-main)'};">
                ${window.store.formatCurrency(totalSpentInBudgets)} (${globalPercent}%)
              </div>
            </div>
          </div>
          <div class="progress-bar-container" style="height: 10px;">
            <div class="progress-bar-fill ${globalPercent >= 100 ? 'progress-danger' : (globalPercent >= 80 ? 'progress-warning' : 'progress-success')}"
                 style="width: ${Math.min(100, globalPercent)}%;"></div>
          </div>
        </div>
      `;
    }

    // Renderiza Cards Individuais
    if (grid) {
      grid.innerHTML = data.map(item => {
        const cat = item.category;
        const progressClass = item.status === 'danger' ? 'progress-danger' : (item.status === 'warning' ? 'progress-warning' : 'progress-success');

        return `
          <div class="budget-card">
            <div class="budget-card-header">
              <div class="budget-cat-info">
                <div class="tx-cat-icon" style="background-color: ${cat.color}15; color: ${cat.color}; width: 36px; height: 36px;">
                  ${cat.icon}
                </div>
                <div>
                  <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${cat.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Limite: ${item.limit > 0 ? window.store.formatCurrency(item.limit) : 'Não definido'}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="window.budgetManager.openEditModal('${cat.id}')">
                Ajustar
              </button>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.825rem; margin-bottom: 0.4rem;">
                <span style="color: var(--text-muted);">Gasto: <strong>${window.store.formatCurrency(item.spent)}</strong></span>
                <span style="font-weight: 700; color: ${item.status === 'danger' ? 'var(--expense)' : (item.status === 'warning' ? 'var(--warning)' : 'var(--income)')};">
                  ${item.percent.toFixed(0)}%
                </span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill ${progressClass}" style="width: ${Math.min(100, item.percent)}%;"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.6rem;">
              <span>${item.limit > item.spent ? 'Restante:' : 'Excedido em:'}</span>
              <strong style="color: ${item.limit >= item.spent ? 'var(--income)' : 'var(--expense)'}; font-family: var(--font-mono);">
                ${window.store.formatCurrency(Math.abs(item.limit - item.spent))}
              </strong>
            </div>
          </div>
        `;
      }).join('');
    }

    // Renderiza Widget de Alertas no Dashboard
    this.renderDashboardAlerts(data);
  }

  renderDashboardAlerts(data) {
    const alertBox = document.getElementById('dashboard-budget-alerts');
    if (!alertBox) return;

    const critical = data.filter(d => d.limit > 0 && d.percent >= 80);

    if (critical.length === 0) {
      alertBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem; color: var(--income); font-size: 0.85rem; font-weight: 500;">
          <span>✓</span> Seus gastos estão todos dentro dos limites planejados neste mês!
        </div>
      `;
    } else {
      alertBox.innerHTML = critical.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <span>${d.percent >= 100 ? '🚨' : '⚠️'}</span>
            <strong>${d.category.icon} ${d.category.name}</strong> atingiu ${d.percent.toFixed(0)}% do limite
          </div>
          <span style="font-weight: 700; color: ${d.percent >= 100 ? 'var(--expense)' : 'var(--warning)'}; font-family: var(--font-mono);">
            ${window.store.formatCurrency(d.spent)} / ${window.store.formatCurrency(d.limit)}
          </span>
        </div>
      `).join('');
    }
  }

  openEditModal(categoryId) {
    this.editingCategoryId = categoryId;
    const cat = window.store.getCategoryById(categoryId);
    const budget = (window.store.state.budgets || []).find(b => b.categoryId === categoryId);

    document.getElementById('modal-budget-title').textContent = `Definir Teto: ${cat.icon} ${cat.name}`;
    document.getElementById('budget-category-name').textContent = cat.name;
    document.getElementById('budget-limit-input').value = budget ? budget.monthlyLimit : '';

    document.getElementById('budget-modal').classList.add('active');
  }

  closeModal() {
    document.getElementById('budget-modal').classList.remove('active');
  }

  handleFormSubmit() {
    const limit = parseFloat(document.getElementById('budget-limit-input').value) || 0;
    if (this.editingCategoryId) {
      window.store.setBudget(this.editingCategoryId, limit);
      window.app.showToast('Orçamento atualizado!', 'success');
      this.closeModal();
      this.render();
    }
  }
}

window.budgetManager = new BudgetManager();
