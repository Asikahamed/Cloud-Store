/**
 * 3-Tier Application - Presentation Tier Controller
 * Handles client-side state, DOM rendering, and REST API communication with Spring Boot backend
 */

(function () {
  'use strict';

  // API endpoints
  const API_BASE = '/api/v1/products';
  const API_PING = '/api/v1/products/ping';

  // Application State
  const state = {
    products: [],
    loading: false,
    searchQuery: '',
    stockFilter: 'all',
    sortBy: 'id-asc',
    backendOnline: false,
    pendingDeleteId: null,
    editingId: null
  };

  // DOM Elements
  const elements = {
    // Nav & Architecture
    statusBadge: document.getElementById('backend-status-badge'),
    archToggleBtn: document.getElementById('architecture-toggle-btn'),
    archPanel: document.getElementById('architecture-panel'),

    // KPIs
    kpiTotalProducts: document.getElementById('kpi-total-products'),
    kpiTotalValue: document.getElementById('kpi-total-value'),
    kpiLowStock: document.getElementById('kpi-low-stock'),
    kpiHealthStatus: document.getElementById('kpi-health-status'),

    // Toolbar
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    stockFilter: document.getElementById('stock-filter'),
    sortSelect: document.getElementById('sort-select'),
    refreshBtn: document.getElementById('refresh-btn'),
    openCreateModalBtn: document.getElementById('open-create-modal-btn'),

    // Table & States
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    productsTable: document.getElementById('products-table'),
    productsTbody: document.getElementById('products-tbody'),
    retryBtn: document.getElementById('retry-btn'),

    // Product Modal
    productModal: document.getElementById('product-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    productForm: document.getElementById('product-form'),
    productIdInput: document.getElementById('product-id'),
    formName: document.getElementById('form-name'),
    formDescription: document.getElementById('form-description'),
    formPrice: document.getElementById('form-price'),
    formStock: document.getElementById('form-stock'),
    formAlert: document.getElementById('form-alert'),
    saveProductBtn: document.getElementById('save-product-btn'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteProductName: document.getElementById('delete-product-name'),
    closeDeleteModalBtn: document.getElementById('close-delete-modal-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),

    // Toasts
    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // Initializer
  // =========================================================================
  function init() {
    bindEvents();
    checkBackendHealth();
    loadProducts();

    // Poll health status every 20 seconds
    setInterval(checkBackendHealth, 20000);
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  function bindEvents() {
    // Architecture banner toggle
    elements.archToggleBtn.addEventListener('click', () => {
      elements.archPanel.classList.toggle('hidden');
    });

    // Refresh & Retry
    elements.refreshBtn.addEventListener('click', () => loadProducts());
    elements.retryBtn.addEventListener('click', () => {
      checkBackendHealth();
      loadProducts();
    });

    // Debounced search
    let searchDebounce;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const query = e.target.value.trim();
      elements.clearSearchBtn.classList.toggle('hidden', query.length === 0);

      searchDebounce = setTimeout(() => {
        state.searchQuery = query;
        loadProducts();
      }, 300);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      loadProducts();
    });

    // Filter & Sort
    elements.stockFilter.addEventListener('change', (e) => {
      state.stockFilter = e.target.value;
      renderProducts();
    });

    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });

    // Create Modal
    elements.openCreateModalBtn.addEventListener('click', () => openCreateModal());
    elements.closeModalBtn.addEventListener('click', () => closeProductModal());
    elements.cancelModalBtn.addEventListener('click', () => closeProductModal());
    elements.productForm.addEventListener('submit', handleFormSubmit);

    // Delete Modal
    elements.closeDeleteModalBtn.addEventListener('click', () => closeDeleteModal());
    elements.cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
    elements.confirmDeleteBtn.addEventListener('click', executeDelete);

    // Close modals on escape key or outside click
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductModal();
        closeDeleteModal();
      }
    });

    [elements.productModal, elements.deleteModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeProductModal();
          closeDeleteModal();
        }
      });
    });
  }

  // =========================================================================
  // Health & API Communication
  // =========================================================================
  async function checkBackendHealth() {
    try {
      const res = await fetch(API_PING, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        state.backendOnline = true;
        updateHealthUI(true);
      } else {
        throw new Error('Non-200 ping response');
      }
    } catch (err) {
      state.backendOnline = false;
      updateHealthUI(false);
    }
  }

  function updateHealthUI(online) {
    if (online) {
      elements.statusBadge.className = 'status-indicator connected';
      elements.statusBadge.innerHTML = '<span class="dot"></span><span class="label">Backend Connected</span>';
      elements.kpiHealthStatus.textContent = 'ONLINE (UP)';
      elements.kpiHealthStatus.style.color = 'var(--color-success)';
    } else {
      elements.statusBadge.className = 'status-indicator error';
      elements.statusBadge.innerHTML = '<span class="dot"></span><span class="label">Backend Offline</span>';
      elements.kpiHealthStatus.textContent = 'UNAVAILABLE';
      elements.kpiHealthStatus.style.color = 'var(--color-danger)';
    }
  }

  async function loadProducts() {
    showLoading();
    try {
      let url = API_BASE;
      if (state.searchQuery) {
        url += `?search=${encodeURIComponent(state.searchQuery)}`;
      }

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch products from backend.`);
      }

      const data = await res.json();
      state.products = Array.isArray(data) ? data : [];
      updateKPIs();
      renderProducts();
    } catch (err) {
      showError(err.message || 'Error communicating with backend service.');
    }
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  function renderProducts() {
    let filtered = [...state.products];

    // Apply stock filter
    if (state.stockFilter === 'in-stock') {
      filtered = filtered.filter((p) => p.stockQuantity > 20);
    } else if (state.stockFilter === 'low-stock') {
      filtered = filtered.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 20);
    } else if (state.stockFilter === 'out-of-stock') {
      filtered = filtered.filter((p) => p.stockQuantity === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'id-asc': return a.id - b.id;
        case 'id-desc': return b.id - a.id;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'price-asc': return parseFloat(a.price) - parseFloat(b.price);
        case 'price-desc': return parseFloat(b.price) - parseFloat(a.price);
        case 'stock-desc': return b.stockQuantity - a.stockQuantity;
        default: return a.id - b.id;
      }
    });

    if (filtered.length === 0) {
      showEmpty();
      return;
    }

    elements.productsTbody.innerHTML = '';
    filtered.forEach((p) => {
      const tr = document.createElement('tr');

      // Stock status badge
      let stockBadgeClass = 'stock-in';
      let stockLabel = `${p.stockQuantity} in stock`;
      if (p.stockQuantity === 0) {
        stockBadgeClass = 'stock-out';
        stockLabel = 'Out of stock';
      } else if (p.stockQuantity <= 20) {
        stockBadgeClass = 'stock-low';
        stockLabel = `Low: ${p.stockQuantity} left`;
      }

      // Format date
      const dateStr = p.updatedAt ? formatDate(p.updatedAt) : 'N/A';
      const formattedPrice = formatCurrency(p.price);

      tr.innerHTML = `
        <td><span class="id-pill">#${escapeHtml(String(p.id))}</span></td>
        <td class="product-name-cell">${escapeHtml(p.name)}</td>
        <td class="product-desc-cell" title="${escapeHtml(p.description || '')}">${escapeHtml(p.description || '—')}</td>
        <td class="product-price-cell">${formattedPrice}</td>
        <td><span class="stock-badge ${stockBadgeClass}">${stockLabel}</span></td>
        <td class="product-date-cell">${dateStr}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn edit-btn" title="Edit Product" data-id="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" title="Delete Product" data-id="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      // Event listeners for action buttons
      tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(p));
      tr.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(p));

      elements.productsTbody.appendChild(tr);
    });

    showTable();
  }

  function updateKPIs() {
    const total = state.products.length;
    elements.kpiTotalProducts.textContent = total;

    let totalVal = 0;
    let lowCount = 0;

    state.products.forEach((p) => {
      const price = parseFloat(p.price) || 0;
      const stock = parseInt(p.stockQuantity, 10) || 0;
      totalVal += price * stock;
      if (stock > 0 && stock <= 20) {
        lowCount++;
      }
    });

    elements.kpiTotalValue.textContent = formatCurrency(totalVal);
    elements.kpiLowStock.textContent = lowCount;
  }

  // =========================================================================
  // View State Helpers
  // =========================================================================
  function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.productsTable.classList.add('hidden');
  }

  function showError(msg) {
    elements.errorMessage.textContent = msg;
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.productsTable.classList.add('hidden');
  }

  function showEmpty() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    elements.productsTable.classList.add('hidden');
  }

  function showTable() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.productsTable.classList.remove('hidden');
  }

  // =========================================================================
  // Modal & Form Handlers
  // =========================================================================
  function resetForm() {
    elements.productForm.reset();
    elements.productIdInput.value = '';
    state.editingId = null;
    clearFieldErrors();
    elements.formAlert.classList.add('hidden');
    elements.formAlert.textContent = '';
  }

  function clearFieldErrors() {
    ['name', 'description', 'price', 'stock'].forEach((field) => {
      const err = document.getElementById(`${field}-error`);
      if (err) err.textContent = '';
      const input = document.getElementById(`form-${field}`);
      if (input) input.classList.remove('is-invalid');
    });
  }

  function openCreateModal() {
    resetForm();
    elements.modalTitle.textContent = 'Add New Product';
    elements.saveProductBtn.querySelector('.btn-text').textContent = 'Create Product';
    elements.productModal.classList.remove('hidden');
    setTimeout(() => elements.formName.focus(), 50);
  }

  function openEditModal(product) {
    resetForm();
    state.editingId = product.id;
    elements.productIdInput.value = product.id;
    elements.formName.value = product.name || '';
    elements.formDescription.value = product.description || '';
    elements.formPrice.value = product.price || '';
    elements.formStock.value = product.stockQuantity || '0';

    elements.modalTitle.textContent = `Edit Product #${product.id}`;
    elements.saveProductBtn.querySelector('.btn-text').textContent = 'Save Changes';
    elements.productModal.classList.remove('hidden');
    setTimeout(() => elements.formName.focus(), 50);
  }

  function closeProductModal() {
    elements.productModal.classList.add('hidden');
    resetForm();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    clearFieldErrors();
    elements.formAlert.classList.add('hidden');

    const name = elements.formName.value.trim();
    const description = elements.formDescription.value.trim();
    const priceStr = elements.formPrice.value;
    const stockStr = elements.formStock.value;

    // Client-side validation matching Spring Boot DTO constraints
    let hasError = false;
    if (!name) {
      showFieldError('name', 'Product name is required');
      hasError = true;
    } else if (name.length > 100) {
      showFieldError('name', 'Product name cannot exceed 100 characters');
      hasError = true;
    }

    if (description.length > 500) {
      showFieldError('description', 'Description cannot exceed 500 characters');
      hasError = true;
    }

    const price = parseFloat(priceStr);
    if (!priceStr || isNaN(price) || price <= 0) {
      showFieldError('price', 'Price must be strictly positive');
      hasError = true;
    }

    const stock = parseInt(stockStr, 10);
    if (stockStr === '' || isNaN(stock) || stock < 0) {
      showFieldError('stock', 'Stock quantity cannot be negative');
      hasError = true;
    }

    if (hasError) return;

    const payload = {
      name,
      description: description || null,
      price: price,
      stockQuantity: stock
    };

    setButtonLoading(elements.saveProductBtn, true);

    try {
      let res;
      if (state.editingId) {
        // PUT update
        res = await fetch(`${API_BASE}/${state.editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // POST create
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        handleServerErrors(res.status, errorData);
        return;
      }

      const saved = await res.json();
      closeProductModal();
      showToast(state.editingId ? `Product "${saved.name}" updated successfully.` : `Product "${saved.name}" created successfully.`, 'success');
      loadProducts();
    } catch (err) {
      elements.formAlert.textContent = err.message || 'Network error while contacting the backend service.';
      elements.formAlert.classList.remove('hidden');
    } finally {
      setButtonLoading(elements.saveProductBtn, false);
    }
  }

  function handleServerErrors(status, data) {
    const fieldErrors = data ? (data.validationErrors || data.errors) : null;
    if (fieldErrors && typeof fieldErrors === 'object') {
      // Map of field -> error message from GlobalExceptionHandler
      Object.keys(fieldErrors).forEach((field) => {
        const formField = field === 'stockQuantity' ? 'stock' : field;
        showFieldError(formField, fieldErrors[field]);
      });
      elements.formAlert.textContent = 'Please correct the validation errors above.';
    } else if (data && data.message) {
      elements.formAlert.textContent = data.message;
    } else {
      elements.formAlert.textContent = `Server responded with HTTP ${status}.`;
    }
    elements.formAlert.classList.remove('hidden');
  }

  function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) errorEl.textContent = message;
    const inputEl = document.getElementById(`form-${field}`);
    if (inputEl) inputEl.classList.add('is-invalid');
  }

  // =========================================================================
  // Delete Confirmation Handlers
  // =========================================================================
  function openDeleteModal(product) {
    state.pendingDeleteId = product.id;
    elements.deleteProductName.textContent = `"${product.name}" (#${product.id})`;
    elements.deleteModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
    state.pendingDeleteId = null;
  }

  async function executeDelete() {
    if (!state.pendingDeleteId) return;

    setButtonLoading(elements.confirmDeleteBtn, true);
    try {
      const res = await fetch(`${API_BASE}/${state.pendingDeleteId}`, {
        method: 'DELETE'
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete (HTTP ${res.status})`);
      }

      closeDeleteModal();
      showToast('Product successfully deleted.', 'info');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Error deleting product.', 'error');
    } finally {
      setButtonLoading(elements.confirmDeleteBtn, false);
    }
  }

  // =========================================================================
  // Utilities
  // =========================================================================
  function setButtonLoading(btn, isLoading) {
    btn.disabled = isLoading;
    const spinner = btn.querySelector('.btn-spinner');
    if (spinner) {
      spinner.classList.toggle('hidden', !isLoading);
    }
  }

  function formatCurrency(val) {
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  function formatDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();