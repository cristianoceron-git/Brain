/**
 * FinanceFlow - Motor Nativo de Gráficos Canvas 2D
 * Totalmente autônomo, sem dependências externas, com suporte a alta resolução (Retina),
 * animações, modo escuro/claro e tooltips interativos.
 */

class FinanceCharts {
  constructor() {
    this.activeTooltips = {};
    this.chartInstances = {};
  }

  // Prepara o canvas para telas HiDPI / Retina
  setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Redimensionar para nitidez absoluta
    const width = rect.width || canvas.clientWidth || 400;
    const height = rect.height || canvas.clientHeight || 250;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.resetTransform && ctx.resetTransform();
    ctx.scale(dpr, dpr);

    return { ctx, width, height, dpr };
  }

  isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  getThemeColors() {
    const dark = this.isDarkMode();
    return {
      textMain: dark ? '#f8fafc' : '#0f172a',
      textMuted: dark ? '#64748b' : '#94a3b8',
      gridLine: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      tooltipBg: dark ? '#1e293b' : '#0f172a',
      income: '#10b981',
      incomeGrad: dark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
      expense: dark ? '#f43f5e' : '#ef4444',
      expenseGrad: dark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(239, 68, 68, 0.15)',
      primary: dark ? '#6366f1' : '#4f46e5',
      primaryGrad: dark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.15)'
    };
  }

  /**
   * Renderiza Gráfico de Barras Agrupadas (Receitas vs Despesas Mensais)
   */
  renderMonthlyBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const colors = this.getThemeColors();

    const padding = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (!data || !data.labels || data.labels.length === 0) {
      this.drawEmptyState(ctx, width, height, 'Sem dados no período');
      return;
    }

    // Calcula valor máximo para escala Y
    let maxVal = 0;
    data.labels.forEach((_, idx) => {
      const inc = (data.incomes && data.incomes[idx]) || 0;
      const exp = (data.expenses && data.expenses[idx]) || 0;
      maxVal = Math.max(maxVal, inc, exp);
    });
    maxVal = maxVal === 0 ? 1000 : maxVal * 1.15; // Margem no topo

    // Desenha linhas de grade horizontais
    const gridSteps = 4;
    ctx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + chartHeight - (i / gridSteps) * chartHeight;
      const val = (maxVal / gridSteps) * i;

      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Rótulo eixo Y
      ctx.fillStyle = colors.textMuted;
      let labelVal = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0);
      ctx.fillText(labelVal, padding.left - 8, y);
    }

    // Desenha Barras
    const numGroups = data.labels.length;
    const groupWidth = chartWidth / numGroups;
    const barWidth = Math.min(22, (groupWidth - 20) / 2);
    const barRadius = 4;

    const hitRegions = [];

    data.labels.forEach((label, idx) => {
      const groupX = padding.left + idx * groupWidth;
      const centerX = groupX + groupWidth / 2;

      const incVal = (data.incomes && data.incomes[idx]) || 0;
      const expVal = (data.expenses && data.expenses[idx]) || 0;

      const incHeight = (incVal / maxVal) * chartHeight;
      const expHeight = (expVal / maxVal) * chartHeight;

      const incX = centerX - barWidth - 3;
      const incY = padding.top + chartHeight - incHeight;

      const expX = centerX + 3;
      const expY = padding.top + chartHeight - expHeight;

      // Barra Receita (Verde)
      if (incHeight > 0) {
        this.drawRoundedBar(ctx, incX, incY, barWidth, incHeight, barRadius, colors.income);
      }

      // Barra Despesa (Vermelho)
      if (expHeight > 0) {
        this.drawRoundedBar(ctx, expX, expY, barWidth, expHeight, barRadius, colors.expense);
      }

      // Rótulo eixo X (Mês)
      ctx.fillStyle = colors.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, centerX, height - padding.bottom + 10);

      // Região de hover para tooltip
      hitRegions.push({
        x: groupX,
        y: padding.top,
        width: groupWidth,
        height: chartHeight,
        label,
        income: incVal,
        expense: expVal,
        balance: incVal - expVal
      });
    });

    this.bindHover(canvas, hitRegions, (region, mouseX, mouseY) => {
      return `
        <div class="tooltip-title">${region.label}</div>
        <div class="tooltip-row" style="color: ${colors.income};">
          <span>Receitas:</span> <span class="tooltip-value">${window.store.formatCurrency(region.income)}</span>
        </div>
        <div class="tooltip-row" style="color: ${colors.expense};">
          <span>Despesas:</span> <span class="tooltip-value">${window.store.formatCurrency(region.expense)}</span>
        </div>
        <div class="tooltip-row" style="border-top: 1px solid rgba(255,255,255,0.15); margin-top: 4px; padding-top: 4px;">
          <span>Saldo:</span> <span class="tooltip-value">${window.store.formatCurrency(region.balance)}</span>
        </div>
      `;
    });
  }

  /**
   * Renderiza Gráfico Donut (Distribuição de Despesas por Categoria)
   */
  renderDonutChart(canvasId, items, totalExpense) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const colors = this.getThemeColors();

    if (!items || items.length === 0 || totalExpense === 0) {
      this.drawEmptyState(ctx, width, height, 'Nenhuma despesa no período');
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 15;
    const innerRadius = outerRadius * 0.64;

    let startAngle = -Math.PI / 2;
    const segments = [];

    items.forEach(item => {
      const sliceAngle = (item.amount / totalExpense) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color || '#6366f1';
      ctx.fill();

      // Borda sutil entre fatias
      ctx.strokeStyle = this.isDarkMode() ? '#131d31' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      segments.push({
        startAngle,
        endAngle,
        item,
        percentage: ((item.amount / totalExpense) * 100).toFixed(1)
      });

      startAngle = endAngle;
    });

    // Texto Central (Total)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = colors.textMuted;
    ctx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.fillText('Total Despesas', centerX, centerY - 10);

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 15px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.fillText(window.store.formatCurrency(totalExpense), centerX, centerY + 12);

    // Hover interativo
    this.bindDonutHover(canvas, centerX, centerY, innerRadius, outerRadius, segments, (seg) => {
      return `
        <div class="tooltip-title">${seg.item.icon || '📁'} ${seg.item.name}</div>
        <div class="tooltip-row">
          <span>Valor:</span> <span class="tooltip-value">${window.store.formatCurrency(seg.item.amount)}</span>
        </div>
        <div class="tooltip-row" style="color: ${colors.primary};">
          <span>Participação:</span> <span class="tooltip-value">${seg.percentage}%</span>
        </div>
      `;
    });
  }

  /**
   * Renderiza Gráfico de Linha/Área de Fluxo de Caixa Acumulado
   */
  renderLineChart(canvasId, data, title = 'Fluxo de Caixa') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const colors = this.getThemeColors();

    const padding = { top: 30, right: 25, bottom: 40, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (!data || !data.labels || data.labels.length === 0) {
      this.drawEmptyState(ctx, width, height, 'Sem movimentações diárias');
      return;
    }

    const values = data.values || [];
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(100, ...values) * 1.15;
    const range = maxVal - minVal || 1;

    // Linhas de Grade
    const gridSteps = 4;
    ctx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + chartHeight - (i / gridSteps) * chartHeight;
      const val = minVal + (range / gridSteps) * i;

      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      let labelVal = Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0);
      ctx.fillText(labelVal, padding.left - 8, y);
    }

    // Calcula coordenadas dos pontos
    const points = values.map((val, idx) => {
      const x = padding.left + (idx / (values.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
      return { x, y, val, label: data.labels[idx] };
    });

    if (points.length > 1) {
      // Área com Gradiente
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, colors.primaryGrad);
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding.bottom);
      points.forEach((p, i) => {
        if (i === 0) ctx.lineTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
      });
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Linha Principal
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
      });
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Desenha Pontos e Rótulos do Eixo X
    const stepLabel = Math.ceil(data.labels.length / 8);
    points.forEach((p, idx) => {
      // Ponto
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
      ctx.strokeStyle = this.isDarkMode() ? '#131d31' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rótulo X intercalado
      if (idx % stepLabel === 0 || idx === points.length - 1) {
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(p.label, p.x, height - padding.bottom + 8);
      }
    });

    this.bindHover(canvas, points.map(p => ({
      x: p.x - 15,
      y: padding.top,
      width: 30,
      height: chartHeight,
      label: p.label,
      value: p.val
    })), (region) => {
      return `
        <div class="tooltip-title">${region.label}</div>
        <div class="tooltip-row" style="color: ${colors.primary};">
          <span>Saldo Líquido Acumulado:</span> <span class="tooltip-value">${window.store.formatCurrency(region.value)}</span>
        </div>
      `;
    });
  }

  /**
   * Renderiza Gráfico de Juros Compostos (Investimentos vs Juros)
   */
  renderCompoundInterestChart(canvasId, years, principalSeries, totalSeries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const colors = this.getThemeColors();

    const padding = { top: 30, right: 20, bottom: 40, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...totalSeries) * 1.12;

    // Linhas de Grade
    const gridSteps = 4;
    ctx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + chartHeight - (i / gridSteps) * chartHeight;
      const val = (maxVal / gridSteps) * i;

      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      let labelVal = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0));
      ctx.fillText(labelVal, padding.left - 8, y);
    }

    const numPoints = years.length;
    const pointsTotal = totalSeries.map((val, idx) => ({
      x: padding.left + (idx / (numPoints - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - (val / maxVal) * chartHeight,
      val,
      principal: principalSeries[idx],
      interest: val - principalSeries[idx],
      year: years[idx]
    }));

    const pointsPrincipal = principalSeries.map((val, idx) => ({
      x: padding.left + (idx / (numPoints - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - (val / maxVal) * chartHeight,
      val
    }));

    // Área de Juros (Verde/Primary)
    if (pointsTotal.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pointsTotal[0].x, height - padding.bottom);
      pointsTotal.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pointsTotal[pointsTotal.length - 1].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = colors.incomeGrad;
      ctx.fill();

      // Área Principal (Azul)
      ctx.beginPath();
      ctx.moveTo(pointsPrincipal[0].x, height - padding.bottom);
      pointsPrincipal.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pointsPrincipal[pointsPrincipal.length - 1].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = colors.primaryGrad;
      ctx.fill();

      // Linha Total
      ctx.beginPath();
      pointsTotal.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = colors.income;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Linha Principal
      ctx.beginPath();
      pointsPrincipal.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Rótulos do Eixo X
    const stepLabel = Math.max(1, Math.floor(years.length / 6));
    pointsTotal.forEach((p, idx) => {
      if (idx % stepLabel === 0 || idx === pointsTotal.length - 1) {
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`Ano ${p.year}`, p.x, height - padding.bottom + 8);
      }
    });

    this.bindHover(canvas, pointsTotal.map(p => ({
      x: p.x - 15,
      y: padding.top,
      width: 30,
      height: chartHeight,
      year: p.year,
      total: p.val,
      principal: p.principal,
      interest: p.interest
    })), (region) => {
      return `
        <div class="tooltip-title">Ano ${region.year}</div>
        <div class="tooltip-row" style="color: ${colors.income};">
          <span>Montante Total:</span> <span class="tooltip-value">${window.store.formatCurrency(region.total)}</span>
        </div>
        <div class="tooltip-row" style="color: ${colors.primary};">
          <span>Total Investido:</span> <span class="tooltip-value">${window.store.formatCurrency(region.principal)}</span>
        </div>
        <div class="tooltip-row" style="color: #f59e0b;">
          <span>Juros Acumulados:</span> <span class="tooltip-value">${window.store.formatCurrency(region.interest)}</span>
        </div>
      `;
    });
  }

  // Utilitários de desenho
  drawRoundedBar(ctx, x, y, width, height, radius, color) {
    const r = Math.min(radius, width / 2, height);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawEmptyState(ctx, width, height, message) {
    const colors = this.getThemeColors();
    ctx.fillStyle = colors.textMuted;
    ctx.font = '14px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, width / 2, height / 2);
  }

  // Gerenciador de Tooltip com Tooltip DOM Flutuante
  getOrCreateTooltip(canvas) {
    let tooltip = canvas.parentElement.querySelector('.custom-chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'custom-chart-tooltip';
      canvas.parentElement.appendChild(tooltip);
    }
    return tooltip;
  }

  bindHover(canvas, regions, contentFormatter) {
    const tooltip = this.getOrCreateTooltip(canvas);

    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hit = regions.find(r => mouseX >= r.x && mouseX <= r.x + r.width && mouseY >= r.y && mouseY <= r.y + r.height);

      if (hit) {
        tooltip.innerHTML = contentFormatter(hit, mouseX, mouseY);
        tooltip.style.left = `${mouseX}px`;
        tooltip.style.top = `${mouseY}px`;
        tooltip.classList.add('visible');
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.classList.remove('visible');
        canvas.style.cursor = 'default';
      }
    };

    canvas.onmouseleave = () => {
      tooltip.classList.remove('visible');
      canvas.style.cursor = 'default';
    };
  }

  bindDonutHover(canvas, cx, cy, innerR, outerR, segments, contentFormatter) {
    const tooltip = this.getOrCreateTooltip(canvas);

    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= innerR && dist <= outerR) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += Math.PI * 2;

        const hit = segments.find(s => angle >= s.startAngle && angle <= s.endAngle);
        if (hit) {
          tooltip.innerHTML = contentFormatter(hit);
          tooltip.style.left = `${mx}px`;
          tooltip.style.top = `${my}px`;
          tooltip.classList.add('visible');
          canvas.style.cursor = 'pointer';
          return;
        }
      }

      tooltip.classList.remove('visible');
      canvas.style.cursor = 'default';
    };

    canvas.onmouseleave = () => {
      tooltip.classList.remove('visible');
      canvas.style.cursor = 'default';
    };
  }
}

window.financeCharts = new FinanceCharts();
