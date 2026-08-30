/**
 * FinanceFlow - Gerenciador de Metas Financeiras e Cofrinhos
 */

class GoalManager {
  constructor() {
    this.selectedGoalId = null;
    this.actionType = 'deposit'; // 'deposit' ou 'withdraw'
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Formulário de Nova Meta
    const formGoal = document.getElementById('goal-form');
    if (formGoal) {
      formGoal.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGoalFormSubmit();
      });
    }

    // Formulário de Aporte/Resgate
    const formAction = document.getElementById('goal-action-form');
    if (formAction) {
      formAction.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGoalActionSubmit();
      });
    }
  }

  render() {
    const goals = window.store.state.goals || [];
    const grid = document.getElementById('goals-grid');
    const dashboardPreview = document.getElementById('dashboard-goals-preview');

    if (grid) {
      if (goals.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
            Nenhuma meta cadastrada ainda. Comece definindo seu primeiro objetivo financeiro!
          </div>
        `;
      } else {
        grid.innerHTML = goals.map(g => {
          const percent = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);

          // Cálculo de estimativa mensal
          let monthlyNeededText = '';
          if (g.targetDate && remaining > 0) {
            const target = new Date(g.targetDate + 'T12:00:00');
            const now = new Date();
            const months = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
            const perMonth = remaining / months;
            monthlyNeededText = `Economizar ~${window.store.formatCurrency(perMonth)}/mês (${months} meses restantes)`;
          } else if (remaining === 0) {
            monthlyNeededText = '🎉 Meta atingida com sucesso!';
          }

          return `
            <div class="goal-card">
              <div class="goal-card-top">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${g.color}20; color: ${g.color}; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
                    ${g.icon || '🎯'}
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${g.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${monthlyNeededText}</div>
                  </div>
                </div>
                <button class="btn-table-action delete" onclick="window.goalManager.deleteGoal('${g.id}')" title="Excluir Meta">
                  🗑️
                </button>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                  <span style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); font-family: var(--font-mono);">
                    ${window.store.formatCurrency(g.currentAmount)}
                  </span>
                  <span style="font-size: 0.85rem; color: var(--text-muted);">
                    de ${window.store.formatCurrency(g.targetAmount)}
                  </span>
                </div>

                <div class="progress-bar-container" style="height: 10px;">
                  <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${g.color || 'var(--primary)'};"></div>
                </div>

                <div class="goal-details" style="margin-top: 0.5rem;">
                  <span>${percent.toFixed(1)}% alcançado</span>
                  <span>Falta: ${window.store.formatCurrency(remaining)}</span>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <button class="btn btn-secondary btn-sm" onclick="window.goalManager.openActionModal('${g.id}', 'withdraw')">
                  - Resgatar
                </button>
                <button class="btn btn-primary btn-sm" onclick="window.goalManager.openActionModal('${g.id}', 'deposit')">
                  + Depositar
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Preview de Metas no Dashboard
    if (dashboardPreview) {
      if (goals.length === 0) {
        dashboardPreview.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Nenhuma meta ativa.</div>`;
      } else {
        dashboardPreview.innerHTML = goals.slice(0, 3).map(g => {
          const percent = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
          return `
            <div style="display: flex; flex-direction: column; gap: 0.35rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="font-weight: 600; color: var(--text-main);">${g.icon || '🎯'} ${g.name}</span>
                <span style="font-weight: 700; color: var(--text-main); font-family: var(--font-mono);">${percent.toFixed(0)}%</span>
              </div>
              <div class="progress-bar-container" style="height: 6px;">
                <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${g.color || 'var(--primary)'};"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  openNewGoalModal() {
    document.getElementById('goal-name-input').value = '';
    document.getElementById('goal-target-input').value = '';
    document.getElementById('goal-initial-input').value = '';
    document.getElementById('goal-date-input').value = '';
    document.getElementById('goal-icon-input').value = '🎯';
    document.getElementById('goal-color-input').value = '#10b981';

    document.getElementById('new-goal-modal').classList.add('active');
  }

  closeNewGoalModal() {
    document.getElementById('new-goal-modal').classList.remove('active');
  }

  handleGoalFormSubmit() {
    const name = document.getElementById('goal-name-input').value.trim();
    const targetAmount = parseFloat(document.getElementById('goal-target-input').value);
    const currentAmount = parseFloat(document.getElementById('goal-initial-input').value) || 0;
    const targetDate = document.getElementById('goal-date-input').value;
    const icon = document.getElementById('goal-icon-input').value.trim() || '🎯';
    const color = document.getElementById('goal-color-input').value || '#10b981';

    if (!name || isNaN(targetAmount) || targetAmount <= 0) {
      window.app.showToast('Informe um nome e um valor alvo válido.', 'warning');
      return;
    }

    window.store.addGoal({
      name,
      targetAmount,
      currentAmount,
      targetDate,
      icon,
      color
    });

    window.app.showToast('Nova meta cadastrada!', 'success');
    this.closeNewGoalModal();
    this.render();
  }

  openActionModal(goalId, type) {
    this.selectedGoalId = goalId;
    this.actionType = type;
    const goal = (window.store.state.goals || []).find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('goal-action-title').textContent = type === 'deposit' ? `Depositar em: ${goal.name}` : `Resgatar de: ${goal.name}`;
    document.getElementById('goal-action-btn-text').textContent = type === 'deposit' ? 'Confirmar Depósito' : 'Confirmar Resgate';
    document.getElementById('goal-action-amount-input').value = '';

    document.getElementById('goal-action-modal').classList.add('active');
  }

  closeActionModal() {
    document.getElementById('goal-action-modal').classList.remove('active');
  }

  handleGoalActionSubmit() {
    const amount = parseFloat(document.getElementById('goal-action-amount-input').value);
    if (isNaN(amount) || amount <= 0) {
      window.app.showToast('Informe um valor válido maior que zero.', 'warning');
      return;
    }

    if (this.actionType === 'deposit') {
      window.store.depositToGoal(this.selectedGoalId, amount);
      window.app.showToast(`Depósito de ${window.store.formatCurrency(amount)} realizado!`, 'success');
    } else {
      window.store.withdrawFromGoal(this.selectedGoalId, amount);
      window.app.showToast(`Resgate de ${window.store.formatCurrency(amount)} efetuado!`, 'info');
    }

    this.closeActionModal();
    this.render();
  }

  deleteGoal(id) {
    if (confirm('Deseja excluir esta meta?')) {
      window.store.deleteGoal(id);
      window.app.showToast('Meta removida.', 'info');
      this.render();
    }
  }
}

window.goalManager = new GoalManager();
