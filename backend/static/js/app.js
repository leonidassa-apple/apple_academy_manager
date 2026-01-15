// Funções globais do sistema
class AppleAcademyManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.initTooltips();
        this.initDatePickers();
        this.initSearchFunctionality();
    }
    
    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    initDatePickers() {
        // Inicializar datepickers se necessário
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = new Date().toISOString().split('T')[0];
            }
        });
    }
    
    initSearchFunctionality() {
        // Implementar busca em tempo real
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce(this.handleSearch, 300));
        });
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const tableId = event.target.getAttribute('data-table');
        const table = document.getElementById(tableId);
        
        if (table) {
            const rows = table.getElementsByTagName('tr');
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const text = row.textContent.toLowerCase();
                
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }
    }
    
    // Função para mostrar loading
    showLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="spinner-border text-apple-blue" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }
    
    // Função para esconder loading
    hideLoading() {
        const loadingEl = document.querySelector('.loading-overlay');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    // Função para mostrar notificação
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.appManager = new AppleAcademyManager();
});

// Funções específicas para forms
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Manipulação de modais
function clearForm(form) {
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

// Event listeners para modais
document.addEventListener('show.bs.modal', function(e) {
    // Apenas limpar se for aberto via botão (relatedTarget existe)
    // Se for aberto via JS (editar), não limpar
    if (e.relatedTarget) {
        const modal = e.target;
        const form = modal.querySelector('form');
        if (form) {
            clearForm(form);
        }
    }
});// Updated at Thu Nov 27 15:36:33 -03 2025
