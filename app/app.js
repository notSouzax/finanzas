/* =====================================================
   CONTROL DE FINANZAS - APP.JS
   Firebase Firestore Integration
   ===================================================== */

// App State
const state = {
    currentMonth: new Date(),
    categories: [],
    expenses: [],
    payments: [],
    incomes: [],           // Extra incomes for the month
    extraExpenses: [],     // Extra one-time expenses for the month
    settings: {
        monthlyIncome: 0   // Fixed monthly income
    },
    currentView: 'dashboard',
    currentCategoryId: null,
    editingIncomeId: null,
    editingExtraExpenseId: null,
    editingSavingsGoalId: null, // Track which savings goal is being edited
    savingsGoals: [],           // Savings goals
    isLoading: true
};

// DOM Elements
const elements = {};

// Initialize App
async function initApp() {
    console.log('Firebase ready, initializing app...');
    try {
        cacheElements();
        setupEventListeners();
        setCurrentMonth();
        await loadData();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    } finally {
        // Always hide loading, even if there was an error
        hideLoading();
        console.log('Loading hidden');
    }
}

// Cache DOM Elements
function cacheElements() {
    elements.loading = document.getElementById('loading');
    elements.mainContent = document.getElementById('main-content');
    elements.monthDisplay = document.getElementById('current-month');
    elements.prevMonth = document.getElementById('prev-month');
    elements.nextMonth = document.getElementById('next-month');

    // Views
    elements.viewDashboard = document.getElementById('view-dashboard');
    elements.viewCategories = document.getElementById('view-categories');
    elements.viewCategoryDetail = document.getElementById('view-category-detail');
    elements.viewSavings = document.getElementById('view-savings');

    // Dashboard
    elements.totalBudget = document.getElementById('total-budget');
    elements.totalSpent = document.getElementById('total-spent');
    elements.totalRemaining = document.getElementById('total-remaining');
    elements.balancePercent = document.getElementById('balance-percent');
    elements.countPaid = document.getElementById('count-paid');
    elements.countPending = document.getElementById('count-pending');
    elements.categoriesSummary = document.getElementById('categories-summary');
    elements.emptyCategories = document.getElementById('empty-categories');

    // Categories
    elements.fixedCategories = document.getElementById('fixed-categories');
    elements.variableCategories = document.getElementById('variable-categories');

    // Savings
    elements.savingsTotal = document.getElementById('savings-total');
    elements.savingsGoalsList = document.getElementById('savings-goals-list');
    elements.emptySavings = document.getElementById('empty-savings');
    elements.btnAddSavingsGoal = document.getElementById('btn-add-savings-goal');
    elements.modalSavingsGoal = document.getElementById('modal-savings-goal');
    elements.formSavingsGoal = document.getElementById('form-savings-goal');
    elements.savingsColorSelector = document.getElementById('savings-color-selector');

    // Savings Contribution
    elements.modalSavingsContribution = document.getElementById('modal-savings-contribution');
    elements.formSavingsContribution = document.getElementById('form-savings-contribution');
    elements.contributionGoalId = document.getElementById('contribution-goal-id');
    elements.contributionGoalName = document.getElementById('contribution-goal-name');
    elements.contributionAmount = document.getElementById('contribution-amount');

    // Detail
    elements.detailHeader = document.getElementById('detail-header');
    elements.detailContent = document.getElementById('detail-content');

    // Navigation
    elements.navItems = document.querySelectorAll('.nav-item[data-view]');
    elements.btnAdd = document.getElementById('btn-add');

    // FAB Menu
    elements.fabMenu = document.getElementById('fab-menu');
    elements.fabAddExpense = document.getElementById('fab-add-expense');
    elements.fabAddCategory = document.getElementById('fab-add-category');

    // Modals
    elements.modalCategory = document.getElementById('modal-category');
    elements.modalExpense = document.getElementById('modal-expense');
    elements.modalConfirm = document.getElementById('modal-confirm');
    elements.modalMonthlyIncome = document.getElementById('modal-monthly-income');
    elements.modalIncome = document.getElementById('modal-income');

    // Forms
    elements.formCategory = document.getElementById('form-category');
    elements.formExpense = document.getElementById('form-expense');
    elements.formMonthlyIncome = document.getElementById('form-monthly-income');
    elements.formIncome = document.getElementById('form-income');
    elements.formExtraExpense = document.getElementById('form-extra-expense');

    // Profile
    elements.viewProfile = document.getElementById('view-profile');
    elements.navProfile = document.getElementById('nav-profile');
    elements.btnEditIncome = document.getElementById('btn-edit-income');
    elements.fabAddIncome = document.getElementById('fab-add-income');
    elements.fabAddExtraExpense = document.getElementById('fab-add-extra-expense');
    elements.modalExtraExpense = document.getElementById('modal-extra-expense');
    elements.formExtraExpense = document.getElementById('form-extra-expense');

    // Extra Expenses List
    elements.btnViewExtraExpenses = document.getElementById('btn-view-extra-expenses');
    elements.modalExtraExpensesList = document.getElementById('modal-extra-expenses-list');
    elements.extraExpensesListContent = document.getElementById('extra-expenses-list-content');
    elements.profileExtraExpensesTotal = document.getElementById('profile-extra-expenses-total');
    elements.btnViewExtraExpensesHeader = document.getElementById('btn-view-extra-expenses-header');

    // Incomes List
    elements.btnViewIncomes = document.getElementById('btn-view-incomes');
    elements.modalIncomesList = document.getElementById('modal-incomes-list');
    elements.incomesListContent = document.getElementById('incomes-list-content');

    // Toast
    elements.toastContainer = document.getElementById('toast-container');
}

// Setup Event Listeners
function setupEventListeners() {
    // Month Navigation
    elements.prevMonth.addEventListener('click', () => changeMonth(-1));
    elements.nextMonth.addEventListener('click', () => changeMonth(1));

    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view) switchView(view);
        });
    });

    // FAB
    elements.btnAdd.addEventListener('click', toggleFabMenu);
    elements.fabMenu.querySelector('.fab-backdrop').addEventListener('click', closeFabMenu);
    elements.fabAddExpense.addEventListener('click', () => {
        closeFabMenu();
        openExpenseModal();
    });
    elements.fabAddCategory.addEventListener('click', () => {
        closeFabMenu();
        openCategoryModal();
    });

    // View All / Add First Category
    document.getElementById('btn-view-all')?.addEventListener('click', () => switchView('categories'));
    document.getElementById('btn-add-first-category')?.addEventListener('click', () => {
        openCategoryModal();
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', closeAllModals);
    });

    // Icon Selector
    document.querySelectorAll('#icon-selector .icon-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#icon-selector .icon-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('category-icon').value = btn.dataset.icon;
        });
    });

    // Color Selector
    document.querySelectorAll('#color-selector .color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#color-selector .color-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('category-color').value = btn.dataset.color;
        });
    });

    // Form Submissions
    elements.formCategory.addEventListener('submit', handleCategorySubmit);
    elements.formExpense.addEventListener('submit', handleExpenseSubmit);
    elements.formMonthlyIncome.addEventListener('submit', saveMonthlyIncome);
    elements.formIncome.addEventListener('submit', saveIncome);
    elements.formExtraExpense.addEventListener('submit', saveExtraExpense);

    // Profile & Income
    elements.navProfile.addEventListener('click', () => switchView('profile'));
    elements.btnEditIncome.addEventListener('click', openMonthlyIncomeModal);
    elements.fabAddIncome.addEventListener('click', () => {
        toggleFabMenu();
        openIncomeModal();
    });
    elements.fabAddExtraExpense.addEventListener('click', () => {
        toggleFabMenu();
        openExtraExpenseModal();
    });

    // View Incomes & Extra Expenses List
    elements.btnViewIncomes.addEventListener('click', openIncomesListModal);
    elements.btnViewExtraExpenses.addEventListener('click', openExtraExpensesListModal);
    elements.btnViewExtraExpensesHeader.addEventListener('click', openExtraExpensesListModal);

    // Savings
    elements.btnAddSavingsGoal.addEventListener('click', () => openSavingsGoalModal());
    elements.formSavingsGoal.addEventListener('submit', handleSavingsGoalSubmit);
    elements.formSavingsContribution.addEventListener('submit', handleContributionSubmit);

    // Savings Color Selector
    elements.savingsColorSelector.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            elements.savingsColorSelector.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('savings-color').value = btn.dataset.color;
        });
    });
}

// Month Functions
function setCurrentMonth() {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = months[state.currentMonth.getMonth()];
    const year = state.currentMonth.getFullYear();
    elements.monthDisplay.textContent = `${monthName} ${year}`;
}

function changeMonth(delta) {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + delta);
    setCurrentMonth();
    loadData();
}

function getMonthKey() {
    const year = state.currentMonth.getFullYear();
    const month = String(state.currentMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Data Loading
async function loadData() {
    showLoading();
    try {
        await Promise.all([
            loadSettings(),
            loadCategories(),
            loadPayments(),
            loadExpenses(),
            loadIncomes(),
            loadExtraExpenses(),
            loadSavingsGoals()
        ]);
        renderAll();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error al cargar datos', 'error');
    }
    hideLoading();
}

async function loadCategories() {
    try {
        const { collection, getDocs } = window.firestore;
        const snapshot = await getDocs(collection(window.db, 'categories'));
        state.categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by order in client
        state.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error loading categories:', error);
        state.categories = [];
    }
}

async function loadPayments() {
    try {
        const { collection, getDocs, where, query } = window.firestore;
        const monthKey = getMonthKey();
        const q = query(collection(window.db, 'payments'), where('month', '==', monthKey));
        const snapshot = await getDocs(q);
        state.payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error loading payments:', error);
        state.payments = [];
    }
}

async function loadExpenses() {
    try {
        const { collection, getDocs } = window.firestore;
        const monthKey = getMonthKey();

        // Get all expenses and filter in client (avoids index requirement)
        const snapshot = await getDocs(collection(window.db, 'expenses'));
        const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by month in client
        state.expenses = allExpenses.filter(e => e.date && e.date.startsWith(monthKey));
        // Sort by date desc in client
        state.expenses.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        console.error('Error loading expenses:', error);
        state.expenses = [];
    }
}

async function loadSettings() {
    try {
        const { doc, getDoc } = window.firestore;
        const docRef = doc(window.db, 'settings', 'user');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            state.settings = { ...state.settings, ...docSnap.data() };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadIncomes() {
    try {
        const { collection, getDocs } = window.firestore;
        const monthKey = getMonthKey();

        // Get all incomes and filter in client
        const snapshot = await getDocs(collection(window.db, 'incomes'));
        const allIncomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by month in client
        state.incomes = allIncomes.filter(i => i.date && i.date.startsWith(monthKey));
        // Sort by date desc
        state.incomes.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        console.error('Error loading incomes:', error);
        state.incomes = [];
    }
}

async function loadExtraExpenses() {
    try {
        const { collection, getDocs } = window.firestore;
        const monthKey = getMonthKey();

        // Get all extra expenses and filter in client
        const snapshot = await getDocs(collection(window.db, 'extraExpenses'));
        const allExtra = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by month in client
        state.extraExpenses = allExtra.filter(e => e.date && e.date.startsWith(monthKey));
        // Sort by date desc
        state.extraExpenses.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        console.error('Error loading extra expenses:', error);
        state.extraExpenses = [];
    }
}

// Render Functions
function renderAll() {
    renderDashboard();
    renderSavings();
    renderProfile();
}

function renderDashboard() {
    // Calculate totals
    // Budget = Monthly income + Extra incomes (NOT category amounts)
    const monthlyIncome = state.settings.monthlyIncome || 0;
    const extraIncomeTotal = state.incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalBudget = monthlyIncome + extraIncomeTotal;

    let totalSpent = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let totalCategories = state.categories.length;

    state.categories.forEach(cat => {
        if (cat.type === 'fixed') {
            const payment = state.payments.find(p => p.categoryId === cat.id);
            if (payment && payment.isPaid) {
                totalSpent += cat.amount || 0;
                paidCount++;
            } else {
                pendingCount++;
            }
        } else {
            // Variable category - count as "paid" if has any expenses, otherwise "pending"
            const catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
            const catSpent = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            totalSpent += catSpent;

            if (catSpent > 0) {
                paidCount++;
            } else {
                pendingCount++;
            }
        }
    });

    // Add extra expenses (one-time expenses for this month)
    const extraExpenseTotal = state.extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    totalSpent += extraExpenseTotal;

    const remaining = totalBudget - totalSpent;
    const percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Update UI
    elements.totalBudget.textContent = formatCurrency(totalBudget);
    elements.totalSpent.textContent = formatCurrency(totalSpent);
    elements.totalRemaining.textContent = formatCurrency(remaining);
    elements.balancePercent.textContent = `${percent}%`;
    elements.countPaid.textContent = `${paidCount} / ${totalCategories}`;
    elements.countPending.textContent = pendingCount.toString();

    // Render categories summary
    renderCategoriesSummary();
}

function renderCategoriesSummary() {
    if (state.categories.length === 0) {
        elements.emptyCategories.classList.remove('hidden');
        elements.categoriesSummary.innerHTML = '';
        elements.categoriesSummary.appendChild(elements.emptyCategories);
        return;
    }

    elements.emptyCategories.classList.add('hidden');
    // Show ALL categories (no limit)
    elements.categoriesSummary.innerHTML = state.categories.map(cat => {
        return createCategoryCard(cat);
    }).join('');

    // Add click listeners
    elements.categoriesSummary.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const catId = card.dataset.id;
            openCategoryDetail(catId);
        });
    });

    // Add toggle listeners for fixed categories
    elements.categoriesSummary.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        toggle.addEventListener('change', async (e) => {
            const catId = e.target.closest('.category-card').dataset.id;
            await togglePayment(catId, e.target.checked);
        });
    });
}


function createCategoryCard(cat) {
    const isFixed = cat.type === 'fixed';
    const payment = state.payments.find(p => p.categoryId === cat.id);
    const isPaid = payment && payment.isPaid;

    let spent = 0;
    let percent = 0;

    if (isFixed) {
        spent = isPaid ? cat.amount : 0;
        percent = isPaid ? 100 : 0;
    } else {
        const catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
        spent = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        percent = cat.amount > 0 ? Math.round((spent / cat.amount) * 100) : 0;
    }

    const progressClass = percent < 75 ? 'low' : percent < 100 ? 'medium' : 'high';

    if (isFixed) {
        return `
            <div class="category-card" data-id="${cat.id}">
                <div class="category-header">
                    <div class="category-info">
                        <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                            <span class="material-symbols-outlined">${cat.icon || 'category'}</span>
                        </div>
                        <div class="category-details">
                            <span class="category-name">${cat.name}</span>
                            <span class="category-type-label">Gasto Fijo</span>
                        </div>
                    </div>
                    <div class="toggle-container">
                        <label class="toggle-switch">
                            <input type="checkbox" ${isPaid ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'PAGADO' : 'PENDIENTE'}</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-info">
                        <span class="progress-text">${formatCurrency(spent)} / ${formatCurrency(cat.amount)}</span>
                        <span class="progress-percent">${percent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percent, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const remaining = cat.amount - spent;
        return `
            <div class="category-card" data-id="${cat.id}">
                <div class="category-header">
                    <div class="category-info">
                        <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                            <span class="material-symbols-outlined">${cat.icon || 'category'}</span>
                        </div>
                        <div class="category-details">
                            <span class="category-name">${cat.name}</span>
                            <span class="category-type-label">Límite mensual</span>
                        </div>
                    </div>
                    <div class="category-amount-info">
                        <span class="category-amount">${formatCurrency(spent)}</span>
                        <span class="category-limit">de ${formatCurrency(cat.amount)}</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percent, 100)}%"></div>
                    </div>
                    <div class="progress-info" style="margin-top: 6px;">
                        <span class="progress-text">${remaining >= 0 ? 'Disponible: ' + formatCurrency(remaining) : 'Excedido: ' + formatCurrency(Math.abs(remaining))}</span>
                        <span class="progress-percent" style="color: var(--${progressClass === 'low' ? 'primary' : progressClass === 'medium' ? 'warning' : 'danger'})">${percent}%</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Category Detail
function openCategoryDetail(categoryId) {
    // Save the previous view to return to it later (only if not already in category-detail)
    if (state.currentView !== 'category-detail') {
        state.previousView = state.currentView;
    }
    state.currentCategoryId = categoryId;
    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return;

    const isFixed = cat.type === 'fixed';
    const payment = state.payments.find(p => p.categoryId === cat.id);
    const isPaid = payment && payment.isPaid;

    let spent = 0;
    let catExpenses = [];

    if (isFixed) {
        spent = isPaid ? cat.amount : 0;
    } else {
        catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
        spent = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    const remaining = cat.amount - spent;
    const percent = cat.amount > 0 ? Math.round((spent / cat.amount) * 100) : 0;
    const progressClass = percent < 75 ? 'low' : percent < 100 ? 'medium' : 'high';
    const statusClass = percent < 75 ? 'ok' : percent < 100 ? 'warning' : 'danger';
    const statusText = percent < 75 ? 'En orden' : percent < 100 ? 'Cerca del límite' : 'Excedido';
    const statusIcon = percent < 75 ? 'check_circle' : percent < 100 ? 'warning' : 'error';

    // Focus on the total budgeted amount for the category in the header
    let headerAmount = formatCurrency(cat.amount);
    let headerLabel;

    if (isFixed) {
        headerLabel = isPaid ? 'Pagado' : 'Pendiente';
    } else {
        headerLabel = remaining >= 0 ? 'Presupuesto Mensual' : 'Presupuesto Excedido';
    }

    elements.detailHeader.innerHTML = `
        <button class="back-btn" id="btn-back">
            <span class="material-symbols-outlined">arrow_back</span>
            Volver
        </button>
        <div class="detail-icon" style="background: ${cat.color}20; color: ${cat.color}">
            <span class="material-symbols-outlined">${cat.icon || 'category'}</span>
        </div>
        <h2 class="detail-amount">${headerAmount}</h2>
        <p class="detail-label">${headerLabel}</p>
    `;

    if (isFixed) {
        elements.detailContent.innerHTML = `
            <div class="detail-progress">
                <div class="detail-progress-header">
                    <div class="detail-progress-spent">
                        <span class="label">Importe</span>
                        <span class="amount">${formatCurrency(cat.amount)}</span>
                    </div>
                    <div class="detail-status ${isPaid ? 'ok' : 'warning'}">
                        <span class="material-symbols-outlined">${isPaid ? 'check_circle' : 'schedule'}</span>
                        <span>${isPaid ? 'Pagado' : 'Pendiente'}</span>
                    </div>
                </div>
                <div class="detail-progress-bar">
                    <div class="detail-progress-fill" style="width: ${isPaid ? 100 : 0}%; background: ${cat.color}; color: ${cat.color}"></div>
                </div>
            </div>
            
            <div class="detail-fixed-actions">
                <button class="toggle-paid-btn ${isPaid ? 'paid' : 'unpaid'}" id="btn-toggle-paid">
                    <span class="material-symbols-outlined">${isPaid ? 'check_circle' : 'radio_button_unchecked'}</span>
                    <span>${isPaid ? 'Marcado como pagado' : 'Marcar como pagado'}</span>
                </button>
            </div>
            
            <div class="category-actions">
                <button class="btn-secondary" id="btn-edit-category">
                    <span class="material-symbols-outlined">edit</span>
                    Editar
                </button>
                <button class="btn-danger" id="btn-delete-category">
                    <span class="material-symbols-outlined">delete</span>
                    Eliminar
                </button>
            </div>
        `;
    } else {
        const expensesHtml = catExpenses.length > 0 ? catExpenses.map(exp => `
            <div class="expense-item" data-id="${exp.id}">
                <div class="expense-icon">
                    <span class="material-symbols-outlined">receipt</span>
                </div>
                <div class="expense-info">
                    <span class="expense-desc">${exp.description || 'Sin descripción'}</span>
                    <span class="expense-date">${formatDate(exp.date)}</span>
                </div>
                <span class="expense-amount">-${formatCurrency(exp.amount)}</span>
                <button class="expense-delete" data-expense-id="${exp.id}">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay gastos este mes</p>';

        elements.detailContent.innerHTML = `
            <div class="detail-progress">
                <div class="detail-progress-header">
                    <div class="detail-progress-spent">
                        <span class="label">Gastado</span>
                        <span class="amount">${formatCurrency(spent)}</span>
                    </div>
                    <span class="detail-progress-percent" style="color: var(--${progressClass === 'low' ? 'primary' : progressClass === 'medium' ? 'warning' : 'danger'})">${percent}%</span>
                </div>
                <div class="detail-progress-bar">
                    <div class="detail-progress-fill" style="width: ${Math.min(percent, 100)}%; background: var(--${progressClass === 'low' ? 'primary' : progressClass === 'medium' ? 'warning' : 'danger'})"></div>
                </div>
                <div class="detail-progress-limit">
                    <span class="detail-progress-limit-text">Límite Mensual: ${formatCurrency(cat.amount)}</span>
                    <div class="detail-status ${statusClass}">
                        <span class="material-symbols-outlined">${statusIcon}</span>
                        <span>${statusText}</span>
                    </div>
                </div>
            </div>
            
            <div class="expenses-section">
                <div class="expenses-header">
                    <h3 class="expenses-title">Movimientos</h3>
                </div>
                <div class="expenses-list">
                    ${expensesHtml}
                </div>
            </div>
            
            <div class="category-actions">
                <button class="btn-secondary" id="btn-edit-category">
                    <span class="material-symbols-outlined">edit</span>
                    Editar
                </button>
                <button class="btn-danger" id="btn-delete-category">
                    <span class="material-symbols-outlined">delete</span>
                    Eliminar
                </button>
            </div>
            
            <button class="add-expense-btn" id="btn-add-expense-detail">
                <span class="material-symbols-outlined">add</span>
                Añadir Gasto
            </button>
        `;
    }

    // Add event listeners
    document.getElementById('btn-back')?.addEventListener('click', () => {
        // Return to the previous view (dashboard or categories)
        const previousView = state.previousView || 'dashboard';
        switchView(previousView);
    });

    document.getElementById('btn-toggle-paid')?.addEventListener('click', async () => {
        await togglePayment(categoryId, !isPaid);
        openCategoryDetail(categoryId); // Refresh
    });

    document.getElementById('btn-edit-category')?.addEventListener('click', () => {
        openCategoryModal(cat);
    });

    document.getElementById('btn-delete-category')?.addEventListener('click', () => {
        openConfirmModal('¿Eliminar esta categoría y todos sus gastos?', async () => {
            await deleteCategory(categoryId);
            switchView('categories');
        });
    });

    document.getElementById('btn-add-expense-detail')?.addEventListener('click', () => {
        openExpenseModal(categoryId);
    });

    document.querySelectorAll('.expense-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const expenseId = btn.dataset.expenseId;
            openConfirmModal('¿Eliminar este gasto?', async () => {
                await deleteExpense(expenseId);
                openCategoryDetail(categoryId); // Refresh
            });
        });
    });

    switchView('category-detail');
}

// Toggle Payment
async function togglePayment(categoryId, isPaid) {
    try {
        const { collection, doc, getDocs, addDoc, updateDoc, where, query } = window.firestore;
        const monthKey = getMonthKey();

        // Find existing payment
        const q = query(
            collection(window.db, 'payments'),
            where('categoryId', '==', categoryId),
            where('month', '==', monthKey)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Create new payment
            await addDoc(collection(window.db, 'payments'), {
                categoryId,
                month: monthKey,
                isPaid,
                paidDate: isPaid ? new Date().toISOString().split('T')[0] : null
            });
        } else {
            // Update existing
            const paymentDoc = snapshot.docs[0];
            await updateDoc(doc(window.db, 'payments', paymentDoc.id), {
                isPaid,
                paidDate: isPaid ? new Date().toISOString().split('T')[0] : null
            });
        }

        await loadPayments();
        renderAll();
        showToast(isPaid ? 'Marcado como pagado' : 'Marcado como pendiente', 'success');
    } catch (error) {
        console.error('Error toggling payment:', error);
        showToast('Error al actualizar', 'error');
    }
}

// View Navigation
function switchView(viewName) {
    state.currentView = viewName;

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show target view
    let targetId;
    switch (viewName) {
        case 'category-detail': targetId = 'view-category-detail'; break;
        case 'savings': targetId = 'view-savings'; break;
        case 'stats': targetId = 'view-stats'; break;
        case 'profile': targetId = 'view-profile'; break;
        default: targetId = 'view-dashboard';
    }
    document.getElementById(targetId)?.classList.add('active');

    // Render stats when switching to stats view
    if (viewName === 'stats') {
        renderStats();
    }

    // Update nav
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update profile nav highlight
    elements.navProfile.classList.toggle('active', viewName === 'profile');

    // Show/hide month selector based on view
    const monthSelector = document.getElementById('month-selector');
    if (viewName === 'category-detail' || viewName === 'profile' || viewName === 'stats') {
        monthSelector.style.display = 'none';
    } else {
        monthSelector.style.display = 'flex';
    }
}

// FAB Menu
function toggleFabMenu() {
    elements.fabMenu.classList.toggle('hidden');
}

function closeFabMenu() {
    elements.fabMenu.classList.add('hidden');
}

// Modals
function openCategoryModal(category = null) {
    const isEdit = !!category;
    document.getElementById('modal-category-title').textContent = isEdit ? 'Editar Categoría' : 'Nueva Categoría';

    // Reset form
    elements.formCategory.reset();
    document.getElementById('category-id').value = category?.id || '';
    document.getElementById('category-name').value = category?.name || '';
    document.getElementById('category-amount').value = category?.amount || '';

    // Set type
    document.querySelectorAll('input[name="category-type"]').forEach(radio => {
        radio.checked = radio.value === (category?.type || 'fixed');
    });

    // Set icon
    const iconValue = category?.icon || 'shopping_cart';
    document.querySelectorAll('#icon-selector .icon-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.icon === iconValue);
    });
    document.getElementById('category-icon').value = iconValue;

    // Set color
    const colorValue = category?.color || '#13ec5b';
    document.querySelectorAll('#color-selector .color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === colorValue);
    });
    document.getElementById('category-color').value = colorValue;

    elements.modalCategory.classList.remove('hidden');
}

function openExpenseModal(categoryId = null) {
    elements.formExpense.reset();

    // Populate category select
    const select = document.getElementById('expense-category');
    const variableCategories = state.categories.filter(c => c.type === 'variable');
    select.innerHTML = '<option value="">Selecciona categoría...</option>' +
        variableCategories.map(c => `<option value="${c.id}" ${c.id === categoryId ? 'selected' : ''}>${c.name}</option>`).join('');

    // Set today's date
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

    elements.modalExpense.classList.remove('hidden');
}

function openConfirmModal(message, onConfirm) {
    document.getElementById('confirm-message').textContent = message;

    const btnConfirm = document.getElementById('btn-confirm');
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

    newBtn.addEventListener('click', async () => {
        closeAllModals();
        await onConfirm();
    });

    elements.modalConfirm.classList.remove('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// Form Handlers
async function handleCategorySubmit(e) {
    e.preventDefault();

    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const amount = parseFloat(document.getElementById('category-amount').value) || 0;
    const type = document.querySelector('input[name="category-type"]:checked').value;
    const icon = document.getElementById('category-icon').value;
    const color = document.getElementById('category-color').value;

    if (!name || amount <= 0) {
        showToast('Completa todos los campos', 'error');
        return;
    }

    try {
        const { collection, doc, addDoc, updateDoc } = window.firestore;

        if (id) {
            // Update
            await updateDoc(doc(window.db, 'categories', id), {
                name, amount, type, icon, color
            });
            showToast('Categoría actualizada', 'success');
        } else {
            // Create
            await addDoc(collection(window.db, 'categories'), {
                name, amount, type, icon, color,
                order: state.categories.length
            });
            showToast('Categoría creada', 'success');
        }

        closeAllModals();
        await loadCategories();
        renderAll();

        if (state.currentView === 'category-detail' && id) {
            openCategoryDetail(id);
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Error al guardar', 'error');
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();

    const categoryId = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const date = document.getElementById('expense-date').value;

    if (!categoryId || amount <= 0 || !date) {
        showToast('Completa todos los campos', 'error');
        return;
    }

    try {
        const { collection, addDoc } = window.firestore;

        await addDoc(collection(window.db, 'expenses'), {
            categoryId,
            description: description || 'Sin descripción',
            amount,
            date
        });

        showToast('Gasto añadido', 'success');
        closeAllModals();
        await loadExpenses();
        renderAll();

        if (state.currentView === 'category-detail') {
            openCategoryDetail(state.currentCategoryId);
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showToast('Error al añadir gasto', 'error');
    }
}

async function deleteCategory(categoryId) {
    try {
        const { doc, deleteDoc, collection, getDocs, where, query } = window.firestore;

        // Delete category
        await deleteDoc(doc(window.db, 'categories', categoryId));

        // Delete related payments
        const paymentsQ = query(collection(window.db, 'payments'), where('categoryId', '==', categoryId));
        const paymentsSnap = await getDocs(paymentsQ);
        for (const paymentDoc of paymentsSnap.docs) {
            await deleteDoc(doc(window.db, 'payments', paymentDoc.id));
        }

        // Delete related expenses
        const expensesQ = query(collection(window.db, 'expenses'), where('categoryId', '==', categoryId));
        const expensesSnap = await getDocs(expensesQ);
        for (const expenseDoc of expensesSnap.docs) {
            await deleteDoc(doc(window.db, 'expenses', expenseDoc.id));
        }

        showToast('Categoría eliminada', 'success');
        await loadData();
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Error al eliminar', 'error');
    }
}

async function deleteExpense(expenseId) {
    try {
        const { doc, deleteDoc } = window.firestore;
        await deleteDoc(doc(window.db, 'expenses', expenseId));
        showToast('Gasto eliminado', 'success');
        await loadExpenses();
        renderAll();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Error al eliminar', 'error');
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + '€';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
        return 'Hoy';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
        return 'Ayer';
    } else {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span class="toast-message">${message}</span>
    `;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.25s ease forwards';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function showLoading() {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
}

// =====================================================
// PROFILE & INCOME FUNCTIONS
// =====================================================

function renderProfile() {
    const monthlyIncome = state.settings.monthlyIncome || 0;
    const extraIncomeTotal = state.incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = monthlyIncome + extraIncomeTotal;

    // Calculate total expenses (gastos fijos + gastos variables)
    let totalExpenses = 0;
    const monthKey = getMonthKey();

    state.categories.forEach(cat => {
        if (cat.type === 'fixed') {
            // Check if paid this month
            const payment = state.payments.find(p => p.categoryId === cat.id && p.month === monthKey);
            if (payment && payment.paid) {
                totalExpenses += cat.amount;
            }
        } else {
            // Variable: sum expenses
            const catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
            totalExpenses += catExpenses.reduce((sum, e) => sum + e.amount, 0);
        }
    });

    // Add extra expenses (one-time expenses)
    const extraExpenseTotal = state.extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    totalExpenses += extraExpenseTotal;

    const balance = totalIncome - totalExpenses;

    // Update profile view
    document.getElementById('profile-monthly-income').textContent = formatCurrency(monthlyIncome);
    document.getElementById('profile-extra-income').textContent = formatCurrency(extraIncomeTotal);
    elements.profileExtraExpensesTotal.textContent = formatCurrency(extraExpenseTotal);
    document.getElementById('profile-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('profile-total-expenses').textContent = formatCurrency(totalExpenses);

    const balanceEl = document.getElementById('profile-balance');
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.className = 'profile-item-value ' + (balance >= 0 ? 'income' : 'expense');
}

function openMonthlyIncomeModal() {
    document.getElementById('monthly-income-amount').value = state.settings.monthlyIncome || '';
    elements.modalMonthlyIncome.classList.remove('hidden');
}

function openIncomeModal() {
    state.editingIncomeId = null;
    elements.formIncome.reset();
    document.getElementById('income-date').value = new Date().toISOString().split('T')[0];

    // Reset modal title and button
    elements.modalIncome.querySelector('.modal-title').textContent = 'Añadir Ingreso Extra';
    elements.modalIncome.querySelector('button[type="submit"]').textContent = 'Añadir';

    elements.modalIncome.classList.remove('hidden');
}

async function saveMonthlyIncome(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('monthly-income-amount').value) || 0;

    try {
        showLoading();
        const { doc, setDoc } = window.firestore;
        await setDoc(doc(window.db, 'settings', 'user'), {
            monthlyIncome: amount
        }, { merge: true });

        state.settings.monthlyIncome = amount;
        elements.modalMonthlyIncome.classList.add('hidden');
        renderProfile();
        showToast('Ingreso mensual actualizado', 'success');
    } catch (error) {
        console.error('Error saving monthly income:', error);
        showToast('Error al guardar', 'error');
    } finally {
        hideLoading();
    }
}

async function saveIncome(e) {
    e.preventDefault();

    const income = {
        description: document.getElementById('income-description').value.trim() || 'Ingreso extra',
        amount: parseFloat(document.getElementById('income-amount').value),
        date: document.getElementById('income-date').value
    };

    try {
        showLoading();
        const { collection, addDoc, doc, updateDoc } = window.firestore;

        if (state.editingIncomeId) {
            // Update existing
            await updateDoc(doc(window.db, 'incomes', state.editingIncomeId), income);

            // Update local state
            const index = state.incomes.findIndex(i => i.id === state.editingIncomeId);
            if (index !== -1) {
                state.incomes[index] = { id: state.editingIncomeId, ...income };
            }
            showToast('Ingreso actualizado', 'success');
        } else {
            // Create new
            const docRef = await addDoc(collection(window.db, 'incomes'), income);
            state.incomes.unshift({ id: docRef.id, ...income });
            showToast('Ingreso añadido', 'success');
        }

        elements.modalIncome.classList.add('hidden');
        state.editingIncomeId = null; // Clear state
        renderDashboard();
        renderProfile();
    } catch (error) {
        console.error('Error saving income:', error);
        showToast('Error al guardar', 'error');
    } finally {
        hideLoading();
    }
}

function openExtraExpenseModal() {
    state.editingExtraExpenseId = null;
    elements.formExtraExpense.reset();
    document.getElementById('extra-expense-date').value = new Date().toISOString().split('T')[0];

    // Reset modal title and button
    elements.modalExtraExpense.querySelector('.modal-title').textContent = 'Gasto Extra';
    elements.modalExtraExpense.querySelector('button[type="submit"]').textContent = 'Añadir';

    elements.modalExtraExpense.classList.remove('hidden');
}

async function saveExtraExpense(e) {
    e.preventDefault();

    const expense = {
        description: document.getElementById('extra-expense-description').value.trim(),
        amount: parseFloat(document.getElementById('extra-expense-amount').value),
        date: document.getElementById('extra-expense-date').value
    };

    try {
        showLoading();
        const { collection, addDoc, doc, updateDoc } = window.firestore;

        if (state.editingExtraExpenseId) {
            // Update existing
            await updateDoc(doc(window.db, 'extraExpenses', state.editingExtraExpenseId), expense);

            // Update local state
            const index = state.extraExpenses.findIndex(e => e.id === state.editingExtraExpenseId);
            if (index !== -1) {
                state.extraExpenses[index] = { id: state.editingExtraExpenseId, ...expense };
            }
            showToast('Gasto extra actualizado', 'success');
        } else {
            // Create new
            const docRef = await addDoc(collection(window.db, 'extraExpenses'), expense);
            state.extraExpenses.unshift({ id: docRef.id, ...expense });
            showToast('Gasto extra añadido', 'success');
        }

        elements.modalExtraExpense.classList.add('hidden');
        state.editingExtraExpenseId = null;
        renderDashboard();
        renderProfile();
    } catch (error) {
        console.error('Error saving extra expense:', error);
        showToast('Error al guardar', 'error');
    } finally {
        hideLoading();
    }
}

function openExtraExpensesListModal() {
    const total = state.extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    if (state.extraExpenses.length === 0) {
        elements.extraExpensesListContent.innerHTML = `
            <p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay gastos extra este mes</p>
        `;
    } else {
        elements.extraExpensesListContent.innerHTML = `
            <div style="background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted);">Total gastos extra</span>
                    <span style="font-size: 20px; font-weight: 600; color: var(--danger);">${formatCurrency(total)}</span>
                </div>
            </div>
            <div class="expenses-list">
                ${state.extraExpenses.map(exp => `
                    <div class="expense-item" data-id="${exp.id}">
                        <div class="expense-info">
                            <span class="expense-description">${exp.description || 'Gasto extra'}</span>
                            <span class="expense-date">${formatDate(exp.date)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="expense-amount" style="color: var(--danger);">-${formatCurrency(exp.amount)}</span>
                            <button class="expense-delete extra-expense-edit" data-expense-id="${exp.id}" style="color: var(--text-muted);">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button class="expense-delete extra-expense-delete" data-expense-id="${exp.id}">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add edit listeners
        elements.extraExpensesListContent.querySelectorAll('.extra-expense-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.dataset.expenseId;
                const expense = state.extraExpenses.find(ex => ex.id === expenseId);
                if (expense) {
                    openExtraExpenseEditModal(expense);
                }
            });
        });

        // Add delete listeners
        elements.extraExpensesListContent.querySelectorAll('.extra-expense-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.dataset.expenseId;
                openConfirmModal('¿Eliminar este gasto extra?', async () => {
                    await deleteExtraExpense(expenseId);
                    openExtraExpensesListModal(); // Refresh the list
                });
            });
        });
    }

    elements.modalExtraExpensesList.classList.remove('hidden');
}

function openExtraExpenseEditModal(expense) {
    state.editingExtraExpenseId = expense.id;

    // Fill form
    document.getElementById('extra-expense-description').value = expense.description || '';
    document.getElementById('extra-expense-amount').value = expense.amount || '';
    document.getElementById('extra-expense-date').value = expense.date || '';

    // Update modal title and button
    elements.modalExtraExpense.querySelector('.modal-title').textContent = 'Editar Gasto Extra';
    elements.modalExtraExpense.querySelector('button[type="submit"]').textContent = 'Actualizar';

    elements.modalExtraExpensesList.classList.add('hidden'); // Close list
    elements.modalExtraExpense.classList.remove('hidden'); // Open form
}

async function deleteExtraExpense(expenseId) {
    try {
        showLoading();
        const { doc, deleteDoc } = window.firestore;
        await deleteDoc(doc(window.db, 'extraExpenses', expenseId));

        state.extraExpenses = state.extraExpenses.filter(e => e.id !== expenseId);
        renderDashboard();
        renderProfile();
        showToast('Gasto extra eliminado', 'success');
    } catch (error) {
        console.error('Error deleting extra expense:', error);
        showToast('Error al eliminar', 'error');
    } finally {
        hideLoading();
    }
}

function openIncomesListModal() {
    const total = state.incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

    if (state.incomes.length === 0) {
        elements.incomesListContent.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 12px;">savings</span>
                <p>No hay ingresos extra este mes</p>
                <p style="font-size: 13px; margin-top: 8px;">Usa el botón + para añadir ingresos</p>
            </div>
        `;
    } else {
        elements.incomesListContent.innerHTML = `
            <div style="background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted);">Total ingresos extra</span>
                    <span style="font-size: 20px; font-weight: 600; color: var(--accent);">${formatCurrency(total)}</span>
                </div>
            </div>
            <div class="expenses-list">
                ${state.incomes.map(income => `
                    <div class="expense-item" data-id="${income.id}">
                        <div class="expense-info">
                            <span class="expense-description">${income.description || 'Ingreso extra'}</span>
                            <span class="expense-date">${formatDate(income.date)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="expense-amount" style="color: var(--accent);">+${formatCurrency(income.amount)}</span>
                            <button class="expense-delete income-edit" data-income-id="${income.id}" style="color: var(--text-muted);">
                                <span class="material-symbols-outlined">edit</span>
                            </button>
                            <button class="expense-delete income-delete" data-income-id="${income.id}">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add edit listeners
        elements.incomesListContent.querySelectorAll('.income-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incomeId = btn.dataset.incomeId;
                const income = state.incomes.find(i => i.id === incomeId);
                if (income) {
                    openIncomeEditModal(income);
                }
            });
        });

        // Add delete listeners
        elements.incomesListContent.querySelectorAll('.income-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incomeId = btn.dataset.incomeId;
                openConfirmModal('¿Eliminar este ingreso extra?', async () => {
                    await deleteIncome(incomeId);
                    openIncomesListModal(); // Refresh the list
                });
            });
        });
    }

    elements.modalIncomesList.classList.remove('hidden');
}

function openIncomeEditModal(income) {
    state.editingIncomeId = income.id;

    // Fill form
    document.getElementById('income-description').value = income.description || '';
    document.getElementById('income-amount').value = income.amount || '';
    document.getElementById('income-date').value = income.date || '';

    // Update modal title and button
    elements.modalIncome.querySelector('.modal-title').textContent = 'Editar Ingreso Extra';
    elements.modalIncome.querySelector('button[type="submit"]').textContent = 'Actualizar';

    elements.modalIncomesList.classList.add('hidden'); // Close list
    elements.modalIncome.classList.remove('hidden'); // Open form
}

async function deleteIncome(incomeId) {
    try {
        showLoading();
        const { doc, deleteDoc } = window.firestore;
        await deleteDoc(doc(window.db, 'incomes', incomeId));

        state.incomes = state.incomes.filter(i => i.id !== incomeId);
        renderDashboard();
        renderProfile();
        showToast('Ingreso eliminado', 'success');
    } catch (error) {
        console.error('Error deleting income:', error);
        showToast('Error al eliminar', 'error');
    } finally {
        hideLoading();
    }
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

let weeklyChart = null;
let categoryChart = null;

function renderStats() {
    renderWeeklyChart();
    renderCategoryChart();
    renderCategoryAverages();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;

    // Get current week's start and end dates
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Get variable categories
    const variableCategories = state.categories.filter(c => c.type === 'variable');
    const variableCategoryIds = variableCategories.map(c => c.id);

    // Filter expenses for current week only
    const weekExpenses = state.expenses.filter(e => {
        if (!variableCategoryIds.includes(e.categoryId)) return false;
        const expenseDate = new Date(e.date);
        return expenseDate >= monday && expenseDate <= sunday;
    });

    // Group by day of week (Mon-Sun)
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];

    weekExpenses.forEach(expense => {
        const date = new Date(expense.date);
        let dayIndex = date.getDay() - 1; // Monday = 0
        if (dayIndex < 0) dayIndex = 6; // Sunday = 6
        dailyTotals[dayIndex] += expense.amount || 0;
    });

    // Calculate this week's total and averages
    const totalThisWeek = dailyTotals.reduce((a, b) => a + b, 0);
    const daysElapsed = Math.min(7, dayOfWeek === 0 ? 7 : dayOfWeek);
    const avgDaily = daysElapsed > 0 ? totalThisWeek / daysElapsed : 0;

    document.getElementById('avg-daily').textContent = formatCurrency(avgDaily);
    document.getElementById('avg-weekly').textContent = formatCurrency(totalThisWeek);

    // Destroy existing chart
    if (weeklyChart) {
        weeklyChart.destroy();
    }

    // Create chart
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                data: dailyTotals,
                backgroundColor: 'rgba(19, 236, 91, 0.6)',
                borderColor: '#13ec5b',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#92c9a4' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#6b8f7a',
                        callback: (value) => value + '€'
                    }
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    const legendContainer = document.getElementById('category-legend');
    if (!ctx || !legendContainer) return;

    // Get ALL expenses for variable categories (no month filter)
    const variableCategories = state.categories.filter(c => c.type === 'variable');

    const categoryData = variableCategories.map(cat => {
        const catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
        const total = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return { name: cat.name, total, color: cat.color, icon: cat.icon };
    }).filter(c => c.total > 0);

    if (categoryData.length === 0) {
        legendContainer.innerHTML = '<div class="stats-empty"><span class="material-symbols-outlined">pie_chart</span><p>Sin gastos registrados</p></div>';
        if (categoryChart) categoryChart.destroy();
        return;
    }

    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Create donut chart
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.map(c => c.name),
            datasets: [{
                data: categoryData.map(c => c.total),
                backgroundColor: categoryData.map(c => c.color || '#13ec5b'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });

    // Custom legend
    legendContainer.innerHTML = categoryData.map(c => `
        <div class="legend-item">
            <span class="legend-color" style="background: ${c.color}"></span>
            <span>${c.name}</span>
        </div>
    `).join('');
}

function renderCategoryAverages() {
    const container = document.getElementById('category-averages');
    if (!container) return;

    const variableCategories = state.categories.filter(c => c.type === 'variable');

    // Calculate monthly average for each category
    const categoryStats = variableCategories.map(cat => {
        const catExpenses = state.expenses.filter(e => e.categoryId === cat.id);
        const total = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Get unique months with expenses for this category
        const monthsSet = new Set(catExpenses.map(e => e.date?.substring(0, 7)).filter(Boolean));
        const monthCount = monthsSet.size;

        // Average per month
        const monthlyAverage = monthCount > 0 ? total / monthCount : 0;

        return { ...cat, total, monthCount, monthlyAverage };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    if (categoryStats.length === 0) {
        container.innerHTML = '<div class="stats-empty"><span class="material-symbols-outlined">analytics</span><p>Sin datos de gastos</p></div>';
        return;
    }

    container.innerHTML = categoryStats.map(cat => `
        <div class="category-avg-item">
            <div class="category-avg-icon" style="background: ${cat.color}20; color: ${cat.color}">
                <span class="material-symbols-outlined">${cat.icon || 'category'}</span>
            </div>
            <div class="category-avg-info">
                <div class="category-avg-name">${cat.name}</div>
                <div class="category-avg-detail">${cat.monthCount} meses · Media mensual: ${formatCurrency(cat.monthlyAverage)}</div>
            </div>
            <div class="category-avg-value">${formatCurrency(cat.total)}</div>
        </div>
    `).join('');
}

// =====================================================
// SAVINGS FUNCTIONS
// =====================================================

async function loadSavingsGoals() {
    try {
        const { collection, getDocs } = window.firestore;
        const snapshot = await getDocs(collection(window.db, 'savingsGoals'));
        state.savingsGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by name
        state.savingsGoals.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error) {
        console.error('Error loading savings goals:', error);
        state.savingsGoals = [];
    }
}

function renderSavings() {
    if (!elements.viewSavings) return;

    const totalSaved = state.savingsGoals.reduce((sum, g) => sum + (parseFloat(g.current) || 0), 0);
    elements.savingsTotal.textContent = formatCurrency(totalSaved);

    if (state.savingsGoals.length === 0) {
        elements.emptySavings.classList.remove('hidden');
        elements.savingsGoalsList.innerHTML = '';
        elements.savingsGoalsList.appendChild(elements.emptySavings);
        return;
    }

    elements.emptySavings.classList.add('hidden');
    elements.savingsGoalsList.innerHTML = state.savingsGoals.map(goal => {
        const current = parseFloat(goal.current) || 0;
        const target = parseFloat(goal.target) || 1; // Avoid division by zero
        const percent = Math.min(Math.round((current / target) * 100), 100);

        return `
            <div class="savings-goal-card" data-id="${goal.id}">
                <div class="savings-goal-header">
                    <div class="savings-goal-info">
                        <div class="savings-goal-icon" style="background: ${goal.color}20; color: ${goal.color}">
                            <span class="material-symbols-outlined">savings</span>
                        </div>
                        <div class="savings-goal-details">
                            <span class="savings-goal-name">${goal.name}</span>
                            <span class="savings-goal-meta">Meta: ${formatCurrency(goal.target)}</span>
                        </div>
                    </div>
                    <div class="savings-goal-values">
                        <span class="savings-goal-percent" style="color: ${goal.color}">${percent}%</span>
                        <span class="savings-goal-current">${formatCurrency(goal.current)}</span>
                    </div>
                </div>
                
                <div class="savings-progress-container">
                    <div class="savings-progress-bar" style="width: ${percent}%; background: ${goal.color}"></div>
                </div>

                    <div class="savings-goal-footer">
                        <button class="savings-add-btn" title="Aportar">
                            <span class="material-symbols-outlined">add_circle</span>
                        </button>
                        <button class="savings-edit-btn" title="Editar">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    <button class="savings-delete-btn" title="Eliminar">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add listeners
    elements.savingsGoalsList.querySelectorAll('.savings-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = btn.closest('.savings-goal-card').dataset.id;
            const goal = state.savingsGoals.find(g => g.id === goalId);
            openContributionModal(goal);
        });
    });

    elements.savingsGoalsList.querySelectorAll('.savings-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = btn.closest('.savings-goal-card').dataset.id;
            const goal = state.savingsGoals.find(g => g.id === goalId);
            openSavingsGoalModal(goal);
        });
    });

    elements.savingsGoalsList.querySelectorAll('.savings-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = btn.closest('.savings-goal-card').dataset.id;
            const goal = state.savingsGoals.find(g => g.id === goalId);
            openConfirmModal(`¿Eliminar la meta "${goal.name}"?`, async () => {
                await deleteSavingsGoal(goalId);
            });
        });
    });
}

function openSavingsGoalModal(goal = null) {
    const isEdit = !!goal;
    state.editingSavingsGoalId = goal?.id || null;

    document.getElementById('modal-savings-title').textContent = isEdit ? 'Editar Meta' : 'Nueva Meta de Ahorro';

    // Reset form
    elements.formSavingsGoal.reset();
    document.getElementById('savings-goal-id').value = goal?.id || '';
    document.getElementById('savings-name').value = goal?.name || '';
    document.getElementById('savings-target').value = goal?.target || '';
    // document.getElementById('savings-current').value = goal?.current || '0';

    // Set color
    const colorValue = goal?.color || '#13ec5b';
    elements.savingsColorSelector.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === colorValue);
    });
    document.getElementById('savings-color').value = colorValue;

    elements.modalSavingsGoal.classList.remove('hidden');
}

async function handleSavingsGoalSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('savings-goal-id').value;
    const name = document.getElementById('savings-name').value.trim();
    const target = parseFloat(document.getElementById('savings-target').value) || 0;
    const color = document.getElementById('savings-color').value;

    // Logic: New goals start at 0. Edits preserve existing current amount.
    let current = 0;
    if (id) {
        const existingGoal = state.savingsGoals.find(g => g.id === id);
        if (existingGoal) current = existingGoal.current;
    }

    if (!name || target <= 0) {
        showToast('Completa los campos obligatorios', 'error');
        return;
    }

    try {
        showLoading();
        // Ensure proper imports
        const { collection, doc, addDoc, updateDoc } = window.firestore;

        if (id) {
            await updateDoc(doc(window.db, 'savingsGoals', id), {
                name, target, current, color,
                updatedAt: new Date().toISOString()
            });
            showToast('Meta actualizada', 'success');
        } else {
            await addDoc(collection(window.db, 'savingsGoals'), {
                name, target, current, color,
                createdAt: new Date().toISOString()
            });
            showToast('Meta creada', 'success');
        }

        closeAllModals();
        await loadSavingsGoals();
        renderSavings();
    } catch (error) {
        console.error('Error saving goal:', error);
        showToast('Error al guardar', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteSavingsGoal(goalId) {
    try {
        showLoading();
        const { doc, deleteDoc } = window.firestore;
        await deleteDoc(doc(window.db, 'savingsGoals', goalId));

        showToast('Meta eliminada', 'success');
        await loadSavingsGoals();
        renderSavings();
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Error al eliminar', 'error');
    } finally {
        hideLoading();
    }
}

function openContributionModal(goal) {
    elements.formSavingsContribution.reset();
    elements.contributionGoalId.value = goal.id;
    elements.contributionGoalName.textContent = `Meta: ${goal.name}`;
    elements.modalSavingsContribution.classList.remove('hidden');
}

async function handleContributionSubmit(e) {
    e.preventDefault();

    const goalId = elements.contributionGoalId.value;
    const amountToAdd = parseFloat(elements.contributionAmount.value) || 0;

    if (amountToAdd <= 0) {
        showToast('Introduce un importe válido', 'error');
        return;
    }

    try {
        showLoading();
        const { doc, getDoc, updateDoc } = window.firestore;

        const goalRef = doc(window.db, 'savingsGoals', goalId);
        const goalSnap = await getDoc(goalRef);

        if (!goalSnap.exists()) {
            throw new Error('Meta no encontrada');
        }

        const currentAmount = goalSnap.data().current || 0;
        const newAmount = currentAmount + amountToAdd;

        await updateDoc(goalRef, {
            current: newAmount
        });

        showToast('Aportación añadida', 'success');
        closeAllModals();
        await loadSavingsGoals();
        renderSavings();
    } catch (error) {
        console.error('Error adding contribution:', error);
        showToast('Error al añadir aportación', 'error');
    } finally {
        hideLoading();
    }
}


// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseApp);
} else {
    initializeFirebaseApp();
}

function initializeFirebaseApp() {
    // Wait for Firebase to be ready (handle race condition)
    if (window.firebaseReady) {
        initApp();
    } else {
        window.addEventListener('firebase-ready', initApp);

        // Fallback safety timeout: if firebase-ready never fires, hide loading after 3s
        setTimeout(() => {
            if (state.isLoading) {
                console.warn('Firebase init timeout - unblocking UI');
                hideLoading();
            }
        }, 5000);
    }
}
