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
        this.loadedScripts = new Set();

        this.init();
    }

    init() {
        this.loadDocuments();
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.loadDocuments();
            });
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.loadDocuments();
        });
    }

    loadDocuments() {
        let documents = Storage.getDocuments();

        if (this.currentFilter !== 'all') {
            documents = documents.filter(doc => doc.type === this.currentFilter);
        }

        if (this.searchTerm) {
            documents = documents.filter(doc => {
                const clientName = (doc.clientName || doc.payerName || '').toLowerCase();
                const number = (doc.budgetNumber || doc.receiptNumber || '').toLowerCase();
                return clientName.includes(this.searchTerm) || number.includes(this.searchTerm);
            });
        }

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
                <button class="btn btn-primary" onclick="historyPage.viewPDF('${doc.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Visualizar
                </button>
                <button class="btn btn-whatsapp" onclick="historyPage.sendWhatsApp('${doc.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                </button>
                <button class="btn btn-secondary" onclick="historyPage.downloadPDF('${doc.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Baixar
                </button>
                <button class="btn btn-remove" onclick="historyPage.deleteDocument('${doc.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Excluir
                </button>
            </div>
        `;

        return div;
    }

    async _loadScriptAndBuild(doc) {
        const isBudget = doc.type === 'budget';
        const scriptName = isBudget ? 'orcamento.js' : 'recibo.js';

        if (!this.loadedScripts.has(scriptName)) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = scriptName;
                script.onload = () => {
                    this.loadedScripts.add(scriptName);
                    resolve();
                };
                script.onerror = () => reject(new Error(`Erro ao carregar ${scriptName}`));
                document.head.appendChild(script);
            });
        }

        // Small delay to ensure jsPDF is also loaded
        await new Promise(r => setTimeout(r, 100));

        if (isBudget) {
            const form = new BudgetForm();
            const pdfDoc = form.buildPDF(doc);
            const filename = `Orcamento_${doc.budgetNumber}_${(doc.clientName || '').replace(/\s/g, '_')}.pdf`;
            return { form, pdfDoc, filename };
        } else {
            const form = new ReceiptForm();
            const pdfDoc = form.buildPDF(doc);
            const filename = `Recibo_${doc.receiptNumber}_${(doc.payerName || '').replace(/\s/g, '_')}.pdf`;
            return { form, pdfDoc, filename };
        }
    }

    async viewPDF(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        try {
            const { pdfDoc, filename } = await this._loadScriptAndBuild(doc);
            if (typeof ux !== 'undefined') {
                ux.previewPDF(pdfDoc, {
                    filename,
                    title: isBudget(doc) ? 'Visualizar Orçamento' : 'Visualizar Recibo',
                    onDownload: () => pdfDoc.save(filename)
                });
            } else {
                pdfDoc.save(filename);
            }
        } catch (e) {
            console.error(e);
            if (typeof ux !== 'undefined') ux.error('Erro ao gerar visualização do PDF.');
            else alert('Erro ao gerar PDF.');
        }
    }

    async downloadPDF(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        try {
            const { pdfDoc, filename } = await this._loadScriptAndBuild(doc);
            pdfDoc.save(filename);
            if (typeof ux !== 'undefined') ux.success('PDF baixado com sucesso!');
        } catch (e) {
            console.error(e);
            if (typeof ux !== 'undefined') ux.error('Erro ao baixar o PDF.');
        }
    }

    async sendWhatsApp(id) {
        const doc = Storage.getDocuments().find(d => d.id === id);
        if (!doc) return;

        try {
            const { form, pdfDoc, filename } = await this._loadScriptAndBuild(doc);
            // Use the instance's sharePDF if available, otherwise fallback
            if (form && typeof form.sharePDF === 'function') {
                await form.sharePDF(pdfDoc, doc, filename);
            } else {
                // Manual fallback
                const pdfBlob = pdfDoc.output('blob');
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: filename,
                        text: `Segue o ${doc.type === 'budget' ? 'orçamento' : 'recibo'}.`
                    });
                    if (typeof ux !== 'undefined') ux.success('PDF enviado!');
                } else {
                    pdfDoc.save(filename);
                    this._sendWhatsAppText(doc);
                }
            }
        } catch (e) {
            console.error(e);
            if (typeof ux !== 'undefined') ux.error('Erro ao enviar PDF.');
        }
    }

    _sendWhatsAppText(doc) {
        const companyData = Storage.getCompanyData();
        let message = '';

        if (doc.type === 'budget') {
            message = `*ORÇAMENTO - ${companyData.companyName || 'Minha Empresa'}*%0A%0A`;
            message += `📋 *Número:* ${doc.budgetNumber}%0A`;
            message += `📅 *Data:* ${Utils.formatDate(doc.budgetDate)}%0A`;
            if (doc.validUntil) message += `⏰ *Validade:* ${Utils.formatDate(doc.validUntil)}%0A`;
            message += `%0A👤 *Cliente:* ${doc.clientName}%0A%0A*ITENS:*%0A`;
            doc.items.forEach((item, i) => {
                message += `%0A${i + 1}. ${item.description}%0A`;
                message += `   Qtd: ${item.quantity} | Unit: ${Utils.formatCurrency(item.unitPrice)} | Total: ${Utils.formatCurrency(item.total)}%0A`;
            });
            message += `%0A💰 *Subtotal:* ${Utils.formatCurrency(doc.subtotal)}%0A`;
            if (doc.discount > 0) message += `💸 *Desconto:* ${doc.discount}%0A`;
            message += `✅ *TOTAL: ${Utils.formatCurrency(doc.total)}*%0A`;
            if (doc.warranty) message += `%0A🛡️ *Garantia:* ${doc.warranty}%0A`;
        } else {
            message = `*RECIBO - ${companyData.companyName || 'Minha Empresa'}*%0A%0A`;
            message += `📋 *Número:* ${doc.receiptNumber}%0A`;
            message += `📅 *Data:* ${Utils.formatDate(doc.receiptDate)}%0A%0A`;
            message += `💰 *Valor:* ${Utils.formatCurrency(doc.amountReceived)}%0A`;
            message += `📝 _(${doc.amountText})_%0A%0A`;
            message += `💳 *Forma:* ${doc.paymentMethod}%0A%0A`;
            message += `👤 *Pagador:* ${doc.payerName}%0A`;
            if (doc.payerCPFCNPJ) message += `📄 *CPF/CNPJ:* ${doc.payerCPFCNPJ}%0A`;
            message += `%0A📌 *Referente a:*%0A${doc.referringTo}%0A`;
        }

        message += `%0A📎 *O PDF foi baixado. Anexe-o nesta conversa.*`;

        const phone = doc.clientPhone || doc.payerPhone || '';
        const phoneNumber = phone.replace(/\D/g, '');
        const whatsappUrl = phoneNumber
            ? `https://wa.me/55${phoneNumber}?text=${message}`
            : `https://wa.me/?text=${message}`;

        window.open(whatsappUrl, '_blank');
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

function isBudget(doc) {
    return doc.type === 'budget';
}

// ==================== INITIALIZE ====================
let historyPage;
document.addEventListener('DOMContentLoaded', () => {
    historyPage = new HistoryPage();
});
