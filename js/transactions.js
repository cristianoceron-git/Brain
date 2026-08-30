/**
 * FinanceFlow - Gerenciador de Transações (CRUD, Filtros, Busca e Tabela)
 */

class TransactionManager {
  constructor() {
    this.filters = {
      period: 'current-month',
      type: 'all',
      categoryId: 'all',
      paymentMethod: 'all',
      status: 'all',
      search: '',
      customStartDate: '',
      customEndDate: ''
    };

    this.sorting = {
      field: 'date',
      direction: 'desc'
    };

    this.pagination = {
      page: 1,
      perPage: 12
    };

    this.editingTxId = null;
    this.searchDebounceTimer = null;
  }

  init() {
    this.bindEvents();
    this.populateCategoryOptions();
    this.populatePaymentMethodOptions();
    this.render();
  }

  bindEvents() {
    // Busca com debounce
    const searchInput = document.getElementById('tx-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.filters.search = e.target.value.trim().toLowerCase();
          this.pagination.page = 1;
          this.render();
        }, 200);
      });
    }

    // Filtros de Select
    const filterType = document.getElementById('tx-filter-type');
    if (filterType) {
      filterType.addEventListener('change', (e) => {
        this.filters.type = e.target.value;
        this.pagination.page = 1;
        this.render();
      });
    }

    const filterCategory = document.getElementById('tx-filter-category');
    if (filterCategory) {
      filterCategory.addEventListener('change', (e) => {
        this.filters.categoryId = e.target.value;
        this.pagination.page = 1;
        this.render();
      });
    }

    const filterMethod = document.getElementById('tx-filter-method');
    if (filterMethod) {
      filterMethod.addEventListener('change', (e) => {
        this.filters.paymentMethod = e.target.value;
        this.pagination.page = 1;
        this.render();
      });
    }

    const filterStatus = document.getElementById('tx-filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.pagination.page = 1;
        this.render();
      });
    }

    // Modal de Transação Form Submit
    const form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Toggle de Tipo no Modal (Receita / Despesa)
    const typeBtns = document.querySelectorAll('.type-toggle-btn');
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        document.getElementById('tx-type-input').value = type;
        this.updateCategoryOptionsByType(type);
      });
    });
  }

  setPeriod(period) {
    this.filters.period = period;
    this.pagination.page = 1;
    this.render();
  }

  populateCategoryOptions() {
    const select = document.getElementById('tx-category-input');
    const filterSelect = document.getElementById('tx-filter-category');
    const currentType = document.getElementById('tx-type-input')?.value || 'expense';

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="all">Todas as Categorias</option>';
      window.store.state.categories.forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
      });
    }

    this.updateCategoryOptionsByType(currentType);
  }

  updateCategoryOptionsByType(type) {
    const select = document.getElementById('tx-category-input');
    if (!select) return;

    const filtered = window.store.state.categories.filter(c => c.type === type);
    select.innerHTML = filtered.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('');
  }

  populatePaymentMethodOptions() {
    const select = document.getElementById('tx-method-input');
    const filterSelect = document.getElementById('tx-filter-method');

    if (select) {
      select.innerHTML = DEFAULT_PAYMENT_METHODS.map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join('');
    }
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="all">Todos os Meios</option>' +
        DEFAULT_PAYMENT_METHODS.map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join('');
    }
  }

  // Filtra as transações baseado nos critérios atuais
  getFilteredTransactions() {
    const all = window.store.state.transactions || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return all.filter(tx => {
      const txDate = new Date(tx.date + 'T12:00:00');
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      // Filtro de Período
      if (this.filters.period === 'current-month') {
        if (txYear !== currentYear || txMonth !== currentMonth) return false;
      } else if (this.filters.period === 'last-month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        if (txYear !== lastMonthDate.getFullYear() || txMonth !== lastMonthDate.getMonth()) return false;
      } else if (this.filters.period === 'last-3-months') {
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        if (txDate < threeMonthsAgo) return false;
      } else if (this.filters.period === 'current-year') {
        if (txYear !== currentYear) return false;
      }

      // Filtro de Tipo
      if (this.filters.type !== 'all' && tx.type !== this.filters.type) {
        return false;
      }

      // Filtro de Categoria
      if (this.filters.categoryId !== 'all' && tx.categoryId !== this.filters.categoryId) {
        return false;
      }

      // Filtro de Meio de Pagamento
      if (this.filters.paymentMethod !== 'all' && tx.paymentMethod !== this.filters.paymentMethod) {
        return false;
      }

      // Filtro de Status
      if (this.filters.status !== 'all' && tx.status !== this.filters.status) {
        return false;
      }

      // Filtro de Busca
      if (this.filters.search) {
        const cat = window.store.getCategoryById(tx.categoryId);
        const matchDesc = (tx.description || '').toLowerCase().includes(this.filters.search);
        const matchCat = (cat.name || '').toLowerCase().includes(this.filters.search);
        const matchNotes = (tx.notes || '').toLowerCase().includes(this.filters.search);
        if (!matchDesc && !matchCat && !matchNotes) return false;
      }

      return true;
    });
  }

  // Ordenação
  getSortedTransactions(filteredList) {
    const list = [...filteredList];
    const { field, direction } = this.sorting;
    const factor = direction === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (field === 'date') {
        return (new Date(a.date) - new Date(b.date)) * factor;
      }
      if (field === 'amount') {
        return (a.amount - b.amount) * factor;
      }
      if (field === 'description') {
        return a.description.localeCompare(b.description) * factor;
      }
      return 0;
    });

    return list;
  }

  setSorting(field) {
    if (this.sorting.field === field) {
      this.sorting.direction = this.sorting.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sorting.field = field;
      this.sorting.direction = 'desc';
    }
    this.render();
  }

  render() {
    const filtered = this.getFilteredTransactions();
    const sorted = this.getSortedTransactions(filtered);

    // Totais do filtro
    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'expense') totalExpense += tx.amount;
    });

    // Atualiza Barra de Resumo de Filtros
    const summaryBar = document.getElementById('tx-filter-summary');
    if (summaryBar) {
      summaryBar.innerHTML = `
        <div>Exibindo <strong>${filtered.length}</strong> transações</div>
        <div class="filter-stats-group">
          <div>Receitas: <strong style="color: var(--income);">${window.store.formatCurrency(totalIncome)}</strong></div>
          <div>Despesas: <strong style="color: var(--expense);">${window.store.formatCurrency(totalExpense)}</strong></div>
          <div>Saldo: <strong style="color: ${totalIncome >= totalExpense ? 'var(--income)' : 'var(--expense)'};">${window.store.formatCurrency(totalIncome - totalExpense)}</strong></div>
        </div>
      `;
    }

    // Paginação
    const totalPages = Math.ceil(sorted.length / this.pagination.perPage) || 1;
    if (this.pagination.page > totalPages) this.pagination.page = totalPages;
    const startIdx = (this.pagination.page - 1) * this.pagination.perPage;
    const paginated = sorted.slice(startIdx, startIdx + this.pagination.perPage);

    // Renderiza Tabela Principal
    const tbody = document.getElementById('tx-table-body');
    if (tbody) {
      if (paginated.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
              Nenhuma transação encontrada para os filtros selecionados.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = paginated.map(tx => {
          const cat = window.store.getCategoryById(tx.categoryId);
          const method = window.store.getPaymentMethodById(tx.paymentMethod);
          const isIncome = tx.type === 'income';

          return `
            <tr>
              <td>
                <div class="tx-desc-cell">
                  <div class="tx-cat-icon" style="background-color: ${cat.color}15; color: ${cat.color};">
                    ${cat.icon}
                  </div>
                  <div>
                    <div class="tx-main-desc">${tx.description}</div>
                    ${tx.notes ? `<div class="tx-sub-desc">${tx.notes}</div>` : ''}
                  </div>
                </div>
              </td>
              <td>
                <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
                  ${cat.icon} ${cat.name}
                </span>
              </td>
              <td>
                <span style="font-size: 0.825rem; color: var(--text-secondary);">
                  ${method.icon} ${method.name}
                </span>
              </td>
              <td>${window.store.formatDate(tx.date)}</td>
              <td>
                <button class="badge ${tx.status === 'paid' ? 'badge-paid' : 'badge-pending'}" 
                        style="cursor: pointer; border: none;"
                        onclick="window.transactionManager.toggleStatus('${tx.id}')"
                        title="Clique para alternar status">
                  ${tx.status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                </button>
              </td>
              <td class="tx-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'} ${window.store.formatCurrency(tx.amount)}
              </td>
              <td>
                <div class="tx-actions">
                  <button class="btn-table-action" onclick="window.transactionManager.openEditModal('${tx.id}')" title="Editar">
                    ✏️
                  </button>
                  <button class="btn-table-action" onclick="window.transactionManager.duplicate('${tx.id}')" title="Duplicar">
                    📋
                  </button>
                  <button class="btn-table-action delete" onclick="window.transactionManager.delete('${tx.id}')" title="Excluir">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Atualiza controles de paginação
    const paginationContainer = document.getElementById('tx-pagination');
    if (paginationContainer) {
      paginationContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
          <div>Página ${this.pagination.page} de ${totalPages} (${sorted.length} itens)</div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" ${this.pagination.page <= 1 ? 'disabled style="opacity: 0.5;"' : ''} onclick="window.transactionManager.changePage(${this.pagination.page - 1})">
              ← Anterior
            </button>
            <button class="btn btn-secondary btn-sm" ${this.pagination.page >= totalPages ? 'disabled style="opacity: 0.5;"' : ''} onclick="window.transactionManager.changePage(${this.pagination.page + 1})">
              Próxima →
            </button>
          </div>
        </div>
      `;
    }

    // Atualiza mini tabela de transações recentes do Dashboard
    this.renderDashboardRecentTable();
  }

  changePage(newPage) {
    this.pagination.page = newPage;
    this.render();
  }

  renderDashboardRecentTable() {
    const recentTbody = document.getElementById('dashboard-recent-table');
    if (!recentTbody) return;

    const all = [...window.store.state.transactions];
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recents = all.slice(0, 6);

    if (recents.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Nenhuma transação cadastrada.</td></tr>`;
      return;
    }

    recentTbody.innerHTML = recents.map(tx => {
      const cat = window.store.getCategoryById(tx.categoryId);
      const isIncome = tx.type === 'income';

      return `
        <tr>
          <td>
            <div class="tx-desc-cell">
              <div class="tx-cat-icon" style="background-color: ${cat.color}15; color: ${cat.color}; width: 30px; height: 30px; font-size: 0.95rem;">
                ${cat.icon}
              </div>
              <div>
                <div class="tx-main-desc" style="font-size: 0.85rem;">${tx.description}</div>
                <div class="tx-sub-desc">${window.store.formatDate(tx.date)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
              ${cat.name}
            </span>
          </td>
          <td class="tx-amount ${isIncome ? 'income' : 'expense'}" style="text-align: right;">
            ${isIncome ? '+' : '-'} ${window.store.formatCurrency(tx.amount)}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Modais de Criação & Edição
  openAddModal(type = 'expense') {
    this.editingTxId = null;
    document.getElementById('modal-tx-title').textContent = 'Nova Transação';
    document.getElementById('tx-id-input').value = '';
    document.getElementById('tx-description').value = '';
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('tx-notes').value = '';
    document.getElementById('tx-status-input').value = 'paid';

    // Ativa botão de tipo correspondente
    document.querySelectorAll('.type-toggle-btn').forEach(b => {
      if (b.dataset.type === type) b.classList.add('active');
      else b.classList.remove('active');
    });
    document.getElementById('tx-type-input').value = type;
    this.updateCategoryOptionsByType(type);

    document.getElementById('transaction-modal').classList.add('active');
  }

  openEditModal(id) {
    const tx = window.store.state.transactions.find(t => t.id === id);
    if (!tx) return;

    this.editingTxId = id;
    document.getElementById('modal-tx-title').textContent = 'Editar Transação';
    document.getElementById('tx-id-input').value = tx.id;
    document.getElementById('tx-description').value = tx.description;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-method-input').value = tx.paymentMethod || 'cartao_credito';
    document.getElementById('tx-status-input').value = tx.status || 'paid';
    document.getElementById('tx-notes').value = tx.notes || '';

    document.querySelectorAll('.type-toggle-btn').forEach(b => {
      if (b.dataset.type === tx.type) b.classList.add('active');
      else b.classList.remove('active');
    });
    document.getElementById('tx-type-input').value = tx.type;
    this.updateCategoryOptionsByType(tx.type);
    document.getElementById('tx-category-input').value = tx.categoryId;

    document.getElementById('transaction-modal').classList.add('active');
  }

  closeModal() {
    document.getElementById('transaction-modal').classList.remove('active');
  }

  handleFormSubmit() {
    const description = document.getElementById('tx-description').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type-input').value;
    const categoryId = document.getElementById('tx-category-input').value;
    const paymentMethod = document.getElementById('tx-method-input').value;
    const date = document.getElementById('tx-date').value;
    const status = document.getElementById('tx-status-input').value;
    const notes = document.getElementById('tx-notes').value.trim();

    if (!description || isNaN(amount) || amount <= 0 || !date) {
      window.app.showToast('Por favor, preencha os campos obrigatórios com valores válidos.', 'warning');
      return;
    }

    const txData = {
      description,
      amount,
      type,
      categoryId,
      paymentMethod,
      date,
      status,
      notes
    };

    if (this.editingTxId) {
      window.store.updateTransaction(this.editingTxId, txData);
      window.app.showToast('Transação atualizada com sucesso!', 'success');
    } else {
      window.store.addTransaction(txData);
      window.app.showToast('Nova transação adicionada!', 'success');
    }

    this.closeModal();
    this.render();
  }

  toggleStatus(id) {
    const updated = window.store.toggleTransactionStatus(id);
    if (updated) {
      window.app.showToast(`Status alterado para: ${updated.status === 'paid' ? 'Pago' : 'Pendente'}`, 'info');
      this.render();
    }
  }

  duplicate(id) {
    const copy = window.store.duplicateTransaction(id);
    if (copy) {
      window.app.showToast('Transação duplicada!', 'success');
      this.render();
    }
  }

  delete(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      window.store.deleteTransaction(id);
      window.app.showToast('Transação excluída.', 'info');
      this.render();
    }
  }
}

window.transactionManager = new TransactionManager();
