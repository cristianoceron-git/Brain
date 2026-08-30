/**
 * FinanceFlow - Calculadoras Financeiras (Juros Compostos e Empréstimos)
 */

class FinanceCalculators {
  constructor() {
    this.currentTool = 'compound'; // 'compound' ou 'loan'
  }

  init() {
    this.bindEvents();
    this.calculateCompoundInterest();
    this.calculateLoan();
  }

  bindEvents() {
    // Alternador de ferramenta
    const calcTabs = document.querySelectorAll('.calc-nav-btn');
    calcTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        calcTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.calc;

        document.getElementById('calc-compound-view').style.display = this.currentTool === 'compound' ? 'block' : 'none';
        document.getElementById('calc-loan-view').style.display = this.currentTool === 'loan' ? 'block' : 'none';
      });
    });

    // Inputs de Juros Compostos
    const compInputs = ['calc-initial', 'calc-monthly', 'calc-rate', 'calc-rate-type', 'calc-years'];
    compInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateCompoundInterest());
    });

    // Inputs de Empréstimo
    const loanInputs = ['loan-amount', 'loan-rate', 'loan-months'];
    loanInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateLoan());
    });
  }

  calculateCompoundInterest() {
    const initial = parseFloat(document.getElementById('calc-initial')?.value) || 0;
    const monthly = parseFloat(document.getElementById('calc-monthly')?.value) || 0;
    let rate = parseFloat(document.getElementById('calc-rate')?.value) || 0;
    const rateType = document.getElementById('calc-rate-type')?.value || 'annual';
    const years = parseInt(document.getElementById('calc-years')?.value) || 1;

    // Converter para taxa mensal decimal
    let monthlyRate = 0;
    if (rateType === 'annual') {
      monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
    } else {
      monthlyRate = rate / 100;
    }

    const totalMonths = years * 12;
    let currentBalance = initial;
    let totalInvested = initial;

    const yearsData = [];
    const principalSeries = [];
    const totalSeries = [];

    for (let m = 1; m <= totalMonths; m++) {
      currentBalance = currentBalance * (1 + monthlyRate) + monthly;
      totalInvested += monthly;

      if (m % 12 === 0 || m === totalMonths) {
        const yr = Math.ceil(m / 12);
        yearsData.push(yr);
        principalSeries.push(Math.round(totalInvested));
        totalSeries.push(Math.round(currentBalance));
      }
    }

    const totalInterest = currentBalance - totalInvested;

    // Atualiza KPIs
    const elFinal = document.getElementById('calc-res-total');
    const elInvested = document.getElementById('calc-res-invested');
    const elInterest = document.getElementById('calc-res-interest');

    if (elFinal) elFinal.textContent = window.store.formatCurrency(currentBalance);
    if (elInvested) elInvested.textContent = window.store.formatCurrency(totalInvested);
    if (elInterest) elInterest.textContent = window.store.formatCurrency(totalInterest);

    // Renderiza Gráfico Canvas
    window.financeCharts.renderCompoundInterestChart('compound-chart-canvas', yearsData, principalSeries, totalSeries);

    // Tabela Anual Detalhada
    const tbody = document.getElementById('calc-breakdown-table');
    if (tbody) {
      tbody.innerHTML = yearsData.map((yr, idx) => {
        const inv = principalSeries[idx];
        const tot = totalSeries[idx];
        const jur = tot - inv;

        return `
          <tr>
            <td><strong>Ano ${yr}</strong></td>
            <td>${window.store.formatCurrency(inv)}</td>
            <td style="color: #f59e0b;">${window.store.formatCurrency(jur)}</td>
            <td style="font-weight: 700; color: var(--income); font-family: var(--font-mono);">${window.store.formatCurrency(tot)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  calculateLoan() {
    const amount = parseFloat(document.getElementById('loan-amount')?.value) || 0;
    const annualRate = parseFloat(document.getElementById('loan-rate')?.value) || 0;
    const months = parseInt(document.getElementById('loan-months')?.value) || 12;

    const monthlyRate = (annualRate / 100) / 12;

    // 1. Tabela Price (Parcelas Fixas)
    let priceMonthlyPmt = 0;
    let priceTotalPaid = 0;
    let priceTotalInterest = 0;

    if (monthlyRate > 0) {
      priceMonthlyPmt = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      priceMonthlyPmt = amount / months;
    }
    priceTotalPaid = priceMonthlyPmt * months;
    priceTotalInterest = priceTotalPaid - amount;

    // 2. Tabela SAC (Amortização Constante)
    const sacAmortization = amount / months;
    let sacTotalInterest = 0;
    let sacFirstPayment = 0;
    let sacLastPayment = 0;

    let sacBalance = amount;
    for (let m = 1; m <= months; m++) {
      const interest = sacBalance * monthlyRate;
      const pmt = sacAmortization + interest;
      sacTotalInterest += interest;
      if (m === 1) sacFirstPayment = pmt;
      if (m === months) sacLastPayment = pmt;
      sacBalance -= sacAmortization;
    }
    const sacTotalPaid = amount + sacTotalInterest;

    // Atualiza resultados no DOM
    const elPricePmt = document.getElementById('loan-price-pmt');
    const elPriceTot = document.getElementById('loan-price-total');
    const elPriceInt = document.getElementById('loan-price-interest');

    if (elPricePmt) elPricePmt.textContent = window.store.formatCurrency(priceMonthlyPmt);
    if (elPriceTot) elPriceTot.textContent = window.store.formatCurrency(priceTotalPaid);
    if (elPriceInt) elPriceInt.textContent = window.store.formatCurrency(priceTotalInterest);

    const elSacPmt = document.getElementById('loan-sac-pmt');
    const elSacTot = document.getElementById('loan-sac-total');
    const elSacInt = document.getElementById('loan-sac-interest');

    if (elSacPmt) elSacPmt.textContent = `${window.store.formatCurrency(sacFirstPayment)} ➔ ${window.store.formatCurrency(sacLastPayment)}`;
    if (elSacTot) elSacTot.textContent = window.store.formatCurrency(sacTotalPaid);
    if (elSacInt) elSacInt.textContent = window.store.formatCurrency(sacTotalInterest);
  }
}

window.financeCalculators = new FinanceCalculators();
