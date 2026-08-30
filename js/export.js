/**
 * FinanceFlow - Módulo de Exportação (JSON / CSV / Impressão) e Importação
 */

class FinanceExporter {
  // Exportar Backup Completo em JSON
  exportJSON() {
    try {
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        currency: window.store.getCurrency(),
        categories: window.store.state.categories,
        budgets: window.store.state.budgets,
        goals: window.store.state.goals,
        transactions: window.store.state.transactions
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `FinanceFlow_Backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.app.showToast('Backup JSON exportado com sucesso!', 'success');
    } catch (e) {
      console.error('Erro ao exportar JSON:', e);
      window.app.showToast('Falha ao exportar backup JSON.', 'danger');
    }
  }

  // Importar Backup JSON
  importJSON(file) {
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);

        if (!parsed || !Array.isArray(parsed.transactions)) {
          throw new Error('Estrutura de arquivo JSON inválida para o FinanceFlow.');
        }

        window.store.saveState({
          transactions: parsed.transactions || [],
          categories: parsed.categories || DEFAULT_CATEGORIES,
          budgets: parsed.budgets || DEFAULT_BUDGETS,
          goals: parsed.goals || DEFAULT_GOALS,
          currency: parsed.currency || 'BRL'
        });

        window.app.showToast('Dados restaurados com sucesso do backup!', 'success');
        window.app.refreshAllViews();
      } catch (err) {
        console.error('Erro ao importar JSON:', err);
        window.app.showToast('Erro ao ler arquivo de backup: ' + err.message, 'danger');
      }
    };

    reader.readAsText(file);
  }

  // Exportar Relatório em CSV (Compatível com Excel pt-BR)
  exportCSV(onlyFiltered = false) {
    try {
      const transactions = onlyFiltered 
        ? window.transactionManager.getFilteredTransactions() 
        : window.store.state.transactions;

      if (!transactions || transactions.length === 0) {
        window.app.showToast('Nenhuma transação para exportar.', 'warning');
        return;
      }

      // Cabeçalho CSV pt-BR
      const headers = ['ID', 'Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor (R$)', 'Status', 'Observações'];
      
      const rows = transactions.map(tx => {
        const cat = window.store.getCategoryById(tx.categoryId);
        const method = window.store.getPaymentMethodById(tx.paymentMethod);
        const tipoDesc = tx.type === 'income' ? 'Receita' : 'Despesa';
        const valorFormatado = tx.amount.toFixed(2).replace('.', ',');
        const statusDesc = tx.status === 'paid' ? 'Pago' : 'Pendente';
        const notesSanitized = (tx.notes || '').replace(/"/g, '""');

        return [
          `"${tx.id}"`,
          `"${window.store.formatDate(tx.date)}"`,
          `"${tipoDesc}"`,
          `"${tx.description.replace(/"/g, '""')}"`,
          `"${cat.name}"`,
          `"${method.name}"`,
          `"${valorFormatado}"`,
          `"${statusDesc}"`,
          `"${notesSanitized}"`
        ].join(';');
      });

      // Adiciona BOM UTF-8 (\uFEFF) para abrir com acentuação correta no Excel brasileiro
      const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `FinanceFlow_Transacoes_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.app.showToast('Relatório CSV exportado!', 'success');
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      window.app.showToast('Falha ao exportar CSV.', 'danger');
    }
  }

  // Imprimir Relatório
  printReport() {
    window.print();
  }
}

window.financeExporter = new FinanceExporter();
