/**
 * UX.js - Sistema de melhorias de experiência do usuário
 * Toast, Modal, Auto-save, Scroll-to-error, Tooltips, Progress bar, etc.
 */

class UX {
    constructor() {
        this.toastContainer = null;
        this.modalOverlay = null;
        this.autoSaveIntervals = new Map();
        this.init();
    }

    init() {
        this.createToastContainer();
        this.createModalOverlay();
        this.setupKeyboardShortcuts();
    }

    // ==================== TOAST NOTIFICATIONS ====================
    createToastContainer() {
        if (document.getElementById('ux-toast-container')) return;
        const container = document.createElement('div');
        container.id = 'ux-toast-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-label', 'Notificações');
        document.body.appendChild(container);
        this.toastContainer = container;
    }

    toast(message, options = {}) {
        const {
            type = 'info',
            duration = 4000,
            icon = null
        } = options;

        const toast = document.createElement('div');
        toast.className = `ux-toast ux-toast--${type}`;
        toast.setAttribute('role', 'alert');

        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        };

        toast.innerHTML = `
            <div class="ux-toast__icon">${icon || icons[type] || icons.info}</div>
            <div class="ux-toast__content">${message}</div>
            <button class="ux-toast__close" aria-label="Fechar notificação">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('ux-toast--visible');
        });

        // Close button
        toast.querySelector('.ux-toast__close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove
        const timeout = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        toast._timeout = timeout;
    }

    removeToast(toast) {
        toast.classList.remove('ux-toast--visible');
        toast.classList.add('ux-toast--hiding');
        clearTimeout(toast._timeout);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }

    success(message, options = {}) {
        this.toast(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        this.toast(message, { ...options, type: 'error', duration: 6000 });
    }

    warning(message, options = {}) {
        this.toast(message, { ...options, type: 'warning' });
    }

    info(message, options = {}) {
        this.toast(message, { ...options, type: 'info' });
    }

    // ==================== MODAL ====================
    createModalOverlay() {
        if (document.getElementById('ux-modal-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'ux-modal-overlay';
        overlay.className = 'ux-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="ux-modal">
                <div class="ux-modal__header">
                    <h3 class="ux-modal__title"></h3>
                    <button class="ux-modal__close" aria-label="Fechar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="ux-modal__body"></div>
                <div class="ux-modal__footer"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.modalOverlay = overlay;

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        // Close button
        overlay.querySelector('.ux-modal__close').addEventListener('click', () => this.closeModal());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    openModal(options = {}) {
        const {
            title = 'Confirmação',
            body = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            confirmClass = 'btn-primary',
            cancelClass = 'btn-secondary',
            onConfirm = null,
            onCancel = null,
            danger = false
        } = options;

        const modal = this.modalOverlay;
        modal.querySelector('.ux-modal__title').textContent = title;
        modal.querySelector('.ux-modal__body').innerHTML = body;

        const footer = modal.querySelector('.ux-modal__footer');
        const confirmBtnClass = danger ? 'btn-remove' : confirmClass;
        footer.innerHTML = `
            <button class="btn ${cancelClass} ux-modal__cancel">${cancelText}</button>
            <button class="btn ${confirmBtnClass} ux-modal__confirm">${confirmText}</button>
        `;

        // Event listeners
        footer.querySelector('.ux-modal__cancel').addEventListener('click', () => {
            this.closeModal();
            if (onCancel) onCancel();
        });

        footer.querySelector('.ux-modal__confirm').addEventListener('click', () => {
            this.closeModal();
            if (onConfirm) onConfirm();
        });

        // Show modal
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('ux-modal-overlay--visible');
        });

        // Focus trap and focus first button
        this.trapFocus(modal);
        setTimeout(() => {
            const confirmBtn = modal.querySelector('.ux-modal__confirm');
            if (confirmBtn) confirmBtn.focus();
        }, 100);
    }

    closeModal() {
        this.modalOverlay.classList.remove('ux-modal-overlay--visible');
        setTimeout(() => {
            this.modalOverlay.style.display = 'none';
        }, 300);
    }

    confirm(message, options = {}) {
        return new Promise((resolve) => {
            this.openModal({
                title: options.title || 'Confirmação',
                body: `<p>${message}</p>`,
                confirmText: options.confirmText || 'Confirmar',
                cancelText: options.cancelText || 'Cancelar',
                danger: options.danger || false,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    // ==================== AUTO SAVE ====================
    enableAutoSave(formId, storageKey, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        const {
            interval = 3000,
            excludeFields = [],
            onRestore = null
        } = options;

        const key = `autosave_${storageKey}`;

        // Restore saved data
        this.restoreAutoSave(form, key, onRestore);

        // Auto save on input
        const saveHandler = () => {
            const data = {};
            form.querySelectorAll('input, textarea, select').forEach(input => {
                if (excludeFields.includes(input.id)) return;
                if (input.type === 'file') return;
                if (input.type === 'password') return;
                data[input.id] = input.value;
            });
            localStorage.setItem(key, JSON.stringify(data));
        };

        form.addEventListener('input', this.debounce(saveHandler, interval));
        form.addEventListener('change', saveHandler);

        // Clear on successful submit
        form.addEventListener('submit', () => {
            localStorage.removeItem(key);
        });
    }

    restoreAutoSave(form, key, onRestore) {
        const saved = localStorage.getItem(key);
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            let restored = false;
            Object.keys(data).forEach(id => {
                const input = form.querySelector(`#${id}`);
                if (input && !input.value && data[id]) {
                    input.value = data[id];
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    restored = true;
                }
            });
            if (restored && onRestore) onRestore();
        } catch (e) {
            console.error('Error restoring autosave:', e);
        }
    }

    clearAutoSave(storageKey) {
        localStorage.removeItem(`autosave_${storageKey}`);
    }

    // ==================== FORM PROGRESS ====================
    createProgressBar(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        const container = document.createElement('div');
        container.className = 'ux-form-progress';
        container.innerHTML = `
            <div class="ux-form-progress__bar">
                <div class="ux-form-progress__fill"></div>
            </div>
            <span class="ux-form-progress__text">0% preenchido</span>
        `;

        const insertAfter = options.insertAfter || form;
        insertAfter.insertAdjacentElement('beforebegin', container);

        const updateProgress = () => {
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            const total = inputs.length;
            if (total === 0) return;

            let filled = 0;
            inputs.forEach(input => {
                if (input.value.trim()) filled++;
            });

            const percent = Math.round((filled / total) * 100);
            const fill = container.querySelector('.ux-form-progress__fill');
            const text = container.querySelector('.ux-form-progress__text');

            fill.style.width = `${percent}%`;
            text.textContent = `${percent}% preenchido`;

            container.classList.toggle('ux-form-progress--complete', percent === 100);
        };

        form.addEventListener('input', this.debounce(updateProgress, 200));
        form.addEventListener('change', updateProgress);
        updateProgress();
    }

    // ==================== SCROLL TO ERROR ====================
    scrollToFirstError(form) {
        const firstInvalid = form.querySelector(':invalid');
        if (!firstInvalid) return;

        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            firstInvalid.focus({ preventScroll: true });
            firstInvalid.classList.add('ux-input--error');
            setTimeout(() => firstInvalid.classList.remove('ux-input--error'), 3000);
        }, 500);
    }

    // ==================== LOADING BUTTON ====================
    setButtonLoading(button, loading = true, text = null) {
        if (loading) {
            button._originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `
                <span class="ux-spinner"></span>
                <span>${text || 'Carregando...'}</span>
            `;
            button.classList.add('ux-btn--loading');
        } else {
            button.disabled = false;
            button.innerHTML = button._originalText || text || button.innerHTML;
            button.classList.remove('ux-btn--loading');
        }
    }

    // ==================== CHARACTER COUNTER ====================
    addCharacterCounter(textareaId, maxLength, options = {}) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;

        const counter = document.createElement('div');
        counter.className = 'ux-char-counter';
        counter.setAttribute('aria-live', 'polite');
        textarea.parentNode.appendChild(counter);

        const update = () => {
            const length = textarea.value.length;
            const remaining = maxLength - length;
            counter.textContent = `${length} / ${maxLength} caracteres`;
            counter.classList.toggle('ux-char-counter--warning', remaining < maxLength * 0.1);
            counter.classList.toggle('ux-char-counter--error', remaining < 0);
        };

        textarea.addEventListener('input', update);
        update();
    }

    // ==================== TOOLTIPS ====================
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => this.showTooltip(e, element.dataset.tooltip));
            element.addEventListener('mouseleave', () => this.hideTooltip());
            element.addEventListener('focus', (e) => this.showTooltip(e, element.dataset.tooltip));
            element.addEventListener('blur', () => this.hideTooltip());
        });
    }

    showTooltip(event, text) {
        this.hideTooltip();
        const tooltip = document.createElement('div');
        tooltip.className = 'ux-tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltip);

        const rect = event.target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        if (top < 8) top = rect.bottom + 8;
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        tooltip.style.top = `${top + window.scrollY}px`;
        tooltip.style.left = `${left + window.scrollX}px`;
        tooltip.classList.add('ux-tooltip--visible');
        this._currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this._currentTooltip) {
            this._currentTooltip.remove();
            this._currentTooltip = null;
        }
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S = Save/Submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const activeForm = document.querySelector('form');
                if (activeForm) {
                    const submitBtn = activeForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                }
            }

            // Ctrl/Cmd + / = Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
        });
    }

    // ==================== INPUT VALIDATION ====================
    initLiveValidation(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = options.fields || form.querySelectorAll('input[required], textarea[required], select[required]');

        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });

            field.addEventListener('input', () => {
                if (field.classList.contains('ux-input--invalid')) {
                    this.validateField(field);
                }
            });
        });
    }

    validateField(field) {
        const isValid = field.checkValidity();
        const parent = field.closest('.form-group');

        if (parent) {
            parent.classList.toggle('ux-form-group--valid', isValid && field.value);
            parent.classList.toggle('ux-form-group--invalid', !isValid);
        }

        field.classList.toggle('ux-input--invalid', !isValid);

        // Remove/add error message
        let errorMsg = parent?.querySelector('.ux-field-error');
        if (!isValid) {
            if (!errorMsg) {
                errorMsg = document.createElement('span');
                errorMsg.className = 'ux-field-error';
                parent.appendChild(errorMsg);
            }
            errorMsg.textContent = field.validationMessage || 'Campo inválido';
        } else if (errorMsg) {
            errorMsg.remove();
        }

        return isValid;
    }

    // ==================== DEBOUNCE ====================
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

    // ==================== SMOOTH SCROLL TO TOP ====================
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==================== PDF PREVIEW ====================
    previewPDF(doc, options = {}) {
        const {
            filename = 'documento.pdf',
            onDownload = null,
            onWhatsApp = null,
            title = 'Pré-visualização do Documento'
        } = options;

        // Generate blob URL for preview
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        this._lastPdfUrl = pdfUrl;
        this._lastPdfBlob = pdfBlob;
        this._lastPdfDoc = doc;
        this._lastPdfFilename = filename;

        // Create a dedicated preview overlay if it doesn't exist
        let previewOverlay = document.getElementById('ux-pdf-preview-overlay');
        if (!previewOverlay) {
            previewOverlay = document.createElement('div');
            previewOverlay.id = 'ux-pdf-preview-overlay';
            previewOverlay.className = 'ux-pdf-preview-overlay';
            previewOverlay.setAttribute('role', 'dialog');
            previewOverlay.setAttribute('aria-modal', 'true');
            previewOverlay.style.display = 'none';
            document.body.appendChild(previewOverlay);
        }

        previewOverlay.innerHTML = `
            <div class="ux-pdf-preview">
                <div class="ux-pdf-preview__header">
                    <h3 class="ux-pdf-preview__title">${title}</h3>
                    <button class="ux-pdf-preview__close" aria-label="Fechar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="ux-pdf-preview__body">
                    <iframe src="${pdfUrl}" class="ux-pdf-preview__iframe" title="Pré-visualização PDF"></iframe>
                </div>
                <div class="ux-pdf-preview__footer">
                    <button class="btn btn-secondary ux-pdf-preview__cancel">Fechar</button>
                    <button class="btn btn-primary ux-pdf-preview__download">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Baixar PDF
                    </button>
                    ${onWhatsApp ? `
                    <button class="btn btn-whatsapp ux-pdf-preview__whatsapp">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Enviar WhatsApp
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Close handlers
        const closeFn = () => {
            previewOverlay.classList.remove('ux-pdf-preview-overlay--visible');
            setTimeout(() => {
                previewOverlay.style.display = 'none';
                if (this._lastPdfUrl) {
                    URL.revokeObjectURL(this._lastPdfUrl);
                    this._lastPdfUrl = null;
                }
            }, 300);
        };

        previewOverlay.querySelector('.ux-pdf-preview__close').addEventListener('click', closeFn);
        previewOverlay.querySelector('.ux-pdf-preview__cancel').addEventListener('click', closeFn);
        previewOverlay.addEventListener('click', (e) => {
            if (e.target === previewOverlay) closeFn();
        });

        // Download handler
        previewOverlay.querySelector('.ux-pdf-preview__download').addEventListener('click', () => {
            if (this._lastPdfDoc) {
                this._lastPdfDoc.save(this._lastPdfFilename);
            }
            if (onDownload) onDownload();
        });

        // WhatsApp handler
        const whatsappBtn = previewOverlay.querySelector('.ux-pdf-preview__whatsapp');
        if (whatsappBtn && onWhatsApp) {
            whatsappBtn.addEventListener('click', () => {
                closeFn();
                onWhatsApp();
            });
        }

        // Show
        previewOverlay.style.display = 'flex';
        requestAnimationFrame(() => {
            previewOverlay.classList.add('ux-pdf-preview-overlay--visible');
        });

        // Focus trap
        this.trapFocus(previewOverlay);
        setTimeout(() => {
            previewOverlay.querySelector('.ux-pdf-preview__download')?.focus();
        }, 100);
    }

    // ==================== FORMAT HELPERS ====================
    formatMoney(value) {
        const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : value;
        if (isNaN(num)) return '';
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }
}

// ==================== INSTANTIATE GLOBAL UX ====================
const ux = new UX();

// ==================== DOM READY INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    ux.initTooltips();

    // Add data-tooltip to common elements
    document.querySelectorAll('input[required]').forEach(input => {
        if (!input.dataset.tooltip) {
            const label = input.closest('.form-group')?.querySelector('label');
            if (label && !label.dataset.tooltip) {
                label.dataset.tooltip = 'Campo obrigatório';
            }
        }
    });
});

// Make available globally
window.UX = UX;
window.ux = ux;
