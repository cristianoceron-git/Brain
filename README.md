# 💎 FinanceFlow - Painel de Controle Financeiro Completo

Uma aplicação web moderna, responsiva e completa para **gestão e controle financeiro pessoal**, construída com foco em privacidade (100% de persistência local no navegador), alta performance (gráficos nativos Canvas 2D sem dependências externas) e excelente usabilidade (modo escuro, atalhos de teclado e ferramentas integradas).

---

## 🌟 Principais Funcionalidades

### 1. 📊 Visão Geral & Dashboard em Tempo Real
- **KPIs Principais**: Saldo Acumulado, Total de Receitas do Mês, Total de Despesas do Mês, Economia Líquida e Taxa de Poupança (%).
- **Gráfico de Evolução Mensal**: Comparativo de barras com Receitas vs Despesas dos últimos meses e saldo com tooltips interativos.
- **Gráfico Donut de Despesas por Categoria**: Proporção percentual e monetária com animação ao passar o cursor.
- **Últimas Transações & Preview de Metas Ativas**.
- **Alertas de Orçamento Inteligentes**: Avisos visuais instantâneos quando alguma categoria atinge 80% ou 100% do limite.

### 2. 💳 Gestão Completa de Transações
- **CRUD Completo**: Adicionar, editar, duplicar e excluir lançamentos de receitas e despesas.
- **Filtros Avançados**:
  - Por Período (Mês Atual, Mês Anterior, Últimos 3 Meses, Este Ano, Todo o Histórico).
  - Por Tipo (Receitas / Despesas).
  - Por Categoria (Moradia, Alimentação, Transporte, Saúde, Lazer, Educação, Compras, Contas, Salário, etc.).
  - Por Meio de Pagamento (Pix, Cartão de Crédito, Débito, Dinheiro, Boleto, TED).
  - Por Status de Pagamento (Pago/Recebido vs Pendente).
- **Busca em Tempo Real** (com debounce) por descrição, categoria ou anotações.
- **Ordenação Dinâmica** por Data, Valor e Descrição.
- **Paginação Inteligente** e resumo estatístico em tempo real do conjunto filtrado.

### 3. 📈 Relatórios & Gráficos Avançados
- **Histórico Anual de Fluxo (12 Meses)** em alta resolução.
- **Gráfico de Fluxo de Caixa Diário Acumulado**: Visualização em área/linha da progressão financeira no mês.
- **Distribuição de Gastos por Meio de Pagamento**.
- **Diagnóstico e Insights Financeiros Automáticos** (Identificação da maior despesa, comparação percentual com o mês anterior e avaliação da taxa de poupança).
- **Exportação para Impressão / PDF** com estilos dedicados `@media print`.

### 4. 🎯 Orçamentos & Tetos por Categoria (Budgets)
- Definição de limites mensais personalizados para cada categoria de gasto.
- Barras de progresso dinâmicas coloridas (🟢 Seguro < 80%, 🟡 Alerta 80-99%, 🔴 Excedido >= 100%).
- Indicadores de valor restante ou excedido.

### 5. 🐖 Metas & Cofrinhos (Goals)
- Criação de metas financeiras (ex: Reserva de Emergência, Viagens, Compras).
- Cálculo automático de valor mensal necessário para atingir o objetivo na data limite.
- Aportes rápidos (`+ Depositar`) e resgates (`- Resgatar`).

### 6. 🧮 Calculadoras Financeiras Integradas
- **Calculadora de Juros Compostos**: Simulação com aporte inicial, aporte mensal, taxa anual/mensal, prazo e gráfico interativo (Patrimônio Total vs Juros Acumulados) com tabela ano a ano.
- **Simulador de Empréstimos / Financiamentos**: Comparativo detalhado entre a **Tabela Price** (parcelas fixas) e a **Tabela SAC** (amortização constante com parcelas decrescentes).

### 7. 🌓 Modo Escuro & Design System
- Alternador de tema no rodapé da barra lateral: ☀️ **Claro**, 🌙 **Escuro** ou 💻 **Automático do Sistema** (`prefers-color-scheme`).
- Design System moderno com tipografia nítida, glassmorphism sutil e transições suaves.
- Layout 100% responsivo para computadores, tablets e smartphones.

### 8. 💾 Salvamento Local & Exportação de Dados
- **Privacidade Total**: Todos os dados são salvos no `LocalStorage` do seu navegador.
- **Backup Completo em JSON**: Exporte e importe seus dados com facilidade.
- **Exportação para Planilha CSV**: Compatível com Excel e Google Sheets no padrão brasileiro (delimitador `;`, decimais com vírgula e cabeçalho UTF-8).
- **Recarregar Dados de Demonstração / Limpar Dados**.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
| :---: | :--- |
| <kbd>N</kbd> | Abrir modal de Nova Transação |
| <kbd>T</kbd> | Alternar Tema (Claro / Escuro / Sistema) |
| <kbd>?</kbd> | Abrir modal de Atalhos de Teclado |
| <kbd>Esc</kbd> | Fechar qualquer janela / modal aberta |

---

## 🚀 Como Executar

### Opção 1: Abrir diretamente no Navegador
Basta dar duplo clique no arquivo [`index.html`](file:///home/mint/Documentos/Brain/index.html) ou abri-lo em qualquer navegador moderno (Chrome, Firefox, Edge, Safari, Brave, etc.).

### Opção 2: Executar via Servidor Local Python
Execute no terminal:
```bash
python3 server.py
```
E acesse no seu navegador:
👉 **`http://localhost:8000`**
