// ==================== STORAGE & UTILITIES ====================
const Storage = {
    getCompanyData() {
        const data = localStorage.getItem('companyData');
        return data ? JSON.parse(data) : {};
    },

    getDocuments() {
        const data = localStorage.getItem('documents');
        return data ? JSON.parse(data) : [];
    },

    deleteDocument(id) {
        const documents = this.getDocuments();
        const filtered = documents.filter(doc => doc.id !== id);
        localStorage.setItem('documents', JSON.stringify(filtered));
    }
};

const Utils = {
    formatCurrency(value) {
        if (!value && value !== 0) return 'R$ 0,00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }
};

// ==================== HISTORY PAGE ====================
class HistoryPage {
    constructor() {
        this.documentsList = document.getElementById('documentsList');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.filterTabs = document.querySelectorAll('.filter-tab');

        this.currentFilter = 'all';
        this.searchTerm = '';

        this.init();
    }

    init() {
        this.loadDocuments();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.loadDocuments();
            });
        });

        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.loadDocuments();
        });
    }

    loadDocuments() {
        let documents = Storage.getDocuments();

        // Apply filter
        if (this.currentFilter !== 'all') {
            documents = documents.filter(doc => doc.type === this.currentFilter);
        }

        // Apply search
        if (this.searchTerm) {
            documents = documents.filter(doc => {
                const clientName = (doc.clientName || doc.payerName || '').toLowerCase();
                const number = (doc.budgetNumber || doc.receiptNumber || '').toLowerCase();
                return clientName.includes(this.searchTerm) || number.includes(this.searchTerm);
            });
        }

        // Display
        if (documents.length === 0) {
            this.documentsList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.documentsList.style.display = 'grid';
            this.emptyState.style.display = 'none';
            this.renderDocuments(documents);
        }
    }

    renderDocuments(documents) {
        this.documentsList.innerHTML = '';

        documents.forEach(doc => {
            const docElement = this.createDocumentElement(doc);
            this.documentsList.appendChild(docElement);
        });
    }

    createDocumentElement(doc) {
        const div = document.createElement('div');
        div.className = 'document-item';

        const isBudget = doc.type === 'budget';
        const badgeClass = isBudget ? 'badge-budget' : 'badge-receipt';
        const badgeText = isBudget ? 'Orçamento' : 'Recibo';

        const clientName = isBudget ? doc.clientName : doc.payerName;
        const docNumber = isBudget ? doc.budgetNumber : doc.receiptNumber;
        const docDate = isBudget ? doc.budgetDate : doc.receiptDate;
        const amount = isBudget ? doc.total : doc.amountReceived;

        let metaHTML = `
            <div class="meta-item">
                <div class="meta-label">Data</div>
                <div class="meta-value">${Utils.formatDate(docDate)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Valor</div>
                <div class="meta-value">${Utils.formatCurrency(amount)}</div>
            </div>
        `;

        if (isBudget && doc.validUntil) {
            metaHTML += `
                <div class="meta-item">
                    <div class="meta-label">Validade</div>
                    <div class="meta-value">${Utils.formatDate(doc.validUntil)}</div>
                </div>
            `;
        }

        if (!isBudget && doc.paymentMethod) {
            metaHTML += `
                <div class="meta-item">
                    <div class="meta-label">Pagamento</div>
                    <div class="meta-value">${doc.paymentMethod}</div>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="document-header">
                <div class="document-info">
                    <h3>${clientName}</h3>
                    <p>Nº ${docNumber} - Criado em ${Utils.formatDateTime(doc.createdAt)}</p>
                </div>
                <div class="document-badge ${badgeClass}">${badgeText}</div>
            </div>
            <div class="document-meta">
                ${metaHTML}
            </div>
            <div class="document-actions">
                <button class="btn btn-primary" onclick="historyPage.regeneratePDF('${doc.id}')">
                    Gerar PDF
                </button>
                <button class="btn btn-whatsapp" onclick="historyPage.sendWhatsApp('${doc.id}')">
                    WhatsApp
                </button>
                <button class="btn btn-secondary" onclick="historyPage.viewDetails('${doc.id}')">
                    Detalhes
                </button>
                <button class="btn btn-remove" onclick="historyPage.deleteDocument('${doc.id}')">
                    Excluir
                </button>
            </div>
        `;

        return div;
    }

    async regeneratePDF(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        if (doc.type === 'budget') {
            // Load budget PDF generator
            const script = document.createElement('script');
            script.src = 'js/orcamento.js';
            script.onload = () => {
                const budgetForm = new BudgetForm();
                budgetForm.generatePDF(doc);
            };
            document.head.appendChild(script);
        } else {
            // Load receipt PDF generator
            const script = document.createElement('script');
            script.src = 'js/recibo.js';
            script.onload = () => {
                const receiptForm = new ReceiptForm();
                receiptForm.generatePDF(doc);
            };
            document.head.appendChild(script);
        }
    }

    sendWhatsApp(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        const companyData = Storage.getCompanyData();
        let message = '';

        if (doc.type === 'budget') {
            message = `*ORÇAMENTO - ${companyData.companyName || 'Minha Empresa'}*%0A%0A`;
            message += `📋 *Número:* ${doc.budgetNumber}%0A`;
            message += `📅 *Data:* ${Utils.formatDate(doc.budgetDate)}%0A`;
            if (doc.validUntil) {
                message += `⏰ *Validade:* ${Utils.formatDate(doc.validUntil)}%0A`;
            }
            message += `%0A`;
            message += `👤 *Cliente:* ${doc.clientName}%0A`;
            message += `%0A`;
            message += `*ITENS:*%0A`;

            doc.items.forEach((item, index) => {
                message += `%0A${index + 1}. ${item.description}%0A`;
                message += `   Qtd: ${item.quantity} | Unit: ${Utils.formatCurrency(item.unitPrice)} | Total: ${Utils.formatCurrency(item.total)}%0A`;
            });

            message += `%0A`;
            message += `💰 *Subtotal:* ${Utils.formatCurrency(doc.subtotal)}%0A`;
            if (doc.discount > 0) {
                message += `💸 *Desconto:* ${doc.discount}%0A`;
            }
            message += `✅ *TOTAL: ${Utils.formatCurrency(doc.total)}*%0A`;

            if (doc.warranty) {
                message += `%0A🛡️ *Garantia:* ${doc.warranty}%0A`;
            }

            const phoneNumber = doc.clientPhone ? doc.clientPhone.replace(/\D/g, '') : '';
            const whatsappUrl = phoneNumber
                ? `https://wa.me/55${phoneNumber}?text=${message}`
                : `https://wa.me/?text=${message}`;

            window.open(whatsappUrl, '_blank');
        } else {
            message = `*RECIBO - ${companyData.companyName || 'Minha Empresa'}*%0A%0A`;
            message += `📋 *Número:* ${doc.receiptNumber}%0A`;
            message += `📅 *Data:* ${Utils.formatDate(doc.receiptDate)}%0A`;
            message += `%0A`;
            message += `💰 *Valor Recebido:* ${Utils.formatCurrency(doc.amountReceived)}%0A`;
            message += `📝 _(${doc.amountText})_%0A`;
            message += `%0A`;
            message += `💳 *Forma de Pagamento:* ${doc.paymentMethod}%0A`;
            message += `%0A`;
            message += `👤 *Pagador:* ${doc.payerName}%0A`;
            if (doc.payerCPFCNPJ) {
                message += `📄 *CPF/CNPJ:* ${doc.payerCPFCNPJ}%0A`;
            }
            message += `%0A`;
            message += `📌 *Referente a:*%0A${doc.referringTo}%0A`;

            const phoneNumber = doc.payerPhone ? doc.payerPhone.replace(/\D/g, '') : '';
            const whatsappUrl = phoneNumber
                ? `https://wa.me/55${phoneNumber}?text=${message}`
                : `https://wa.me/?text=${message}`;

            window.open(whatsappUrl, '_blank');
        }
    }

    viewDetails(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        let details = '';

        if (doc.type === 'budget') {
            details = `
ORÇAMENTO Nº ${doc.budgetNumber}

CLIENTE:
${doc.clientName}
${doc.clientCPFCNPJ ? 'CPF/CNPJ: ' + doc.clientCPFCNPJ : ''}
${doc.clientPhone ? 'Tel: ' + doc.clientPhone : ''}
${doc.clientEmail ? 'Email: ' + doc.clientEmail : ''}
${doc.clientAddress ? 'End: ' + doc.clientAddress : ''}

DATA: ${Utils.formatDate(doc.budgetDate)}
${doc.validUntil ? 'VALIDADE: ' + Utils.formatDate(doc.validUntil) : ''}

ITENS:
${doc.items.map((item, i) => `${i + 1}. ${item.description}\n   Qtd: ${item.quantity} x ${Utils.formatCurrency(item.unitPrice)} = ${Utils.formatCurrency(item.total)}`).join('\n')}

SUBTOTAL: ${Utils.formatCurrency(doc.subtotal)}
${doc.discount > 0 ? 'DESCONTO: ' + doc.discount + '%' : ''}
TOTAL: ${Utils.formatCurrency(doc.total)}

${doc.warranty ? 'GARANTIA: ' + doc.warranty : ''}
${doc.paymentConditions ? 'PAGAMENTO: ' + doc.paymentConditions : ''}
${doc.observations ? 'OBSERVAÇÕES: ' + doc.observations : ''}
            `;
        } else {
            details = `
RECIBO Nº ${doc.receiptNumber}

PAGADOR:
${doc.payerName}
${doc.payerCPFCNPJ ? 'CPF/CNPJ: ' + doc.payerCPFCNPJ : ''}
${doc.payerPhone ? 'Tel: ' + doc.payerPhone : ''}
${doc.payerAddress ? 'End: ' + doc.payerAddress : ''}

DATA: ${Utils.formatDate(doc.receiptDate)}
VALOR: ${Utils.formatCurrency(doc.amountReceived)}
POR EXTENSO: ${doc.amountText}
PAGAMENTO: ${doc.paymentMethod}

REFERENTE A:
${doc.referringTo}

${doc.observations ? 'OBSERVAÇÕES:\n' + doc.observations : ''}
            `;
        }

        alert(details.trim());
    }

    async deleteDocument(id) {
        const shouldDelete = typeof ux !== 'undefined'
            ? await ux.confirm(
                'Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.',
                { danger: true, title: 'Excluir Documento', confirmText: 'Excluir', cancelText: 'Cancelar' }
            )
            : confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.');

        if (shouldDelete) {
            Storage.deleteDocument(id);
            this.loadDocuments();
            if (typeof ux !== 'undefined') {
                ux.success('Documento excluído com sucesso!');
            }
        }
    }
}

// ==================== INITIALIZE ====================
let historyPage;
document.addEventListener('DOMContentLoaded', () => {
    historyPage = new HistoryPage();
});
