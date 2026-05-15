// ==================== STORAGE & UTILITIES ====================
const Storage = {
    getCompanyData() {
        const data = localStorage.getItem('companyData');
        return data ? JSON.parse(data) : this.getDefaultCompanyData();
    },

    getDefaultCompanyData() {
        return {
            companyName: 'Minha Empresa',
            companySlogan: '',
            companyCNPJ: '',
            companyIE: '',
            companyPhone: '',
            companyWhatsapp: '',
            companyEmail: '',
            companyWebsite: '',
            companyAddress: '',
            companyNumber: '',
            companyComplement: '',
            companyNeighborhood: '',
            companyCity: '',
            companyState: '',
            companyCEP: '',
            companyLogo: '',
            companyServices: '',
            defaultWarranty: '90 dias',
            paymentTerms: '',
            defaultNotes: ''
        };
    },

    saveDocument(document) {
        const documents = this.getDocuments();
        document.id = Date.now().toString();
        document.createdAt = new Date().toISOString();
        documents.unshift(document);
        localStorage.setItem('documents', JSON.stringify(documents));
        return document.id;
    },

    getDocuments() {
        const data = localStorage.getItem('documents');
        return data ? JSON.parse(data) : [];
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

    parseCurrency(value) {
        if (!value) return 0;
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    },

    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    addDays(dateString, days) {
        const date = new Date(dateString + 'T00:00:00');
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    generateDocumentNumber(type) {
        const documents = Storage.getDocuments();
        const filtered = documents.filter(doc => doc.type === type);
        const year = new Date().getFullYear();
        const number = filtered.length + 1;
        return `${year}${String(number).padStart(4, '0')}`;
    }
};

// ==================== BUDGET FORM ====================
class BudgetForm {
    constructor() {
        this.form = document.getElementById('budgetForm');
        this.itemsContainer = document.getElementById('itemsContainer');
        this.addItemBtn = document.getElementById('addItemBtn');
        this.whatsappBtn = document.getElementById('whatsappBtn');
        this.clearBtn = document.getElementById('clearBtn');

        this.items = [];
        this.itemCounter = 0;

        this.init();
    }

    init() {
        this.loadDefaults();
        this.addItem(); // Add first item
        this.attachEventListeners();

        // UX enhancements
        if (typeof ux !== 'undefined') {
            ux.enableAutoSave('budgetForm', 'budget', {
                excludeFields: ['discount'],
                onRestore: () => ux.info('Dados anteriores restaurados automaticamente')
            });
            ux.createProgressBar('budgetForm');
            ux.initLiveValidation('budgetForm');
        }
    }

    loadDefaults() {
        const companyData = Storage.getCompanyData();

        // Set today's date
        document.getElementById('budgetDate').value = Utils.getTodayDate();

        // Set validity (30 days from today)
        document.getElementById('validUntil').value = Utils.addDays(Utils.getTodayDate(), 30);

        // Generate budget number
        document.getElementById('budgetNumber').value = Utils.generateDocumentNumber('budget');

        // Load default values
        if (companyData.defaultWarranty) {
            document.getElementById('warranty').value = companyData.defaultWarranty;
        }
        if (companyData.paymentTerms) {
            document.getElementById('paymentConditions').value = companyData.paymentTerms;
        }
        if (companyData.defaultNotes) {
            document.getElementById('observations').value = companyData.defaultNotes;
        }
    }

    attachEventListeners() {
        this.addItemBtn.addEventListener('click', () => this.addItem());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.whatsappBtn.addEventListener('click', () => this.sendViaWhatsApp());
        this.clearBtn.addEventListener('click', () => this.clearForm());

        // Discount calculation
        document.getElementById('discount').addEventListener('input', () => this.calculateTotal());
    }

    addItem() {
        this.itemCounter++;
        const itemId = `item-${this.itemCounter}`;

        const itemHTML = `
            <div class="item-card" data-item-id="${itemId}">
                <div class="item-header">
                    <h3>Item ${this.itemCounter}</h3>
                    <button type="button" class="item-remove" onclick="budgetForm.removeItem('${itemId}')">Remover</button>
                </div>
                <div class="form-group">
                    <label>Descrição do Serviço/Produto *</label>
                    <textarea class="item-description" required rows="2" placeholder="Descreva o item"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Quantidade *</label>
                        <input type="number" class="item-quantity" required min="1" step="0.01" value="1">
                    </div>
                    <div class="form-group">
                        <label>Valor Unitário *</label>
                        <input type="text" class="item-price money-input" required placeholder="R$ 0,00">
                    </div>
                    <div class="form-group">
                        <label>Total</label>
                        <input type="text" class="item-total" readonly placeholder="R$ 0,00">
                    </div>
                </div>
            </div>
        `;

        this.itemsContainer.insertAdjacentHTML('beforeend', itemHTML);

        // Attach listeners to new item
        const itemCard = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        const quantity = itemCard.querySelector('.item-quantity');
        const price = itemCard.querySelector('.item-price');

        quantity.addEventListener('input', () => this.calculateItemTotal(itemId));
        price.addEventListener('input', (e) => {
            this.formatMoneyInput(e);
            this.calculateItemTotal(itemId);
        });
    }

    removeItem(itemId) {
        const item = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        if (item) {
            item.remove();
            this.calculateTotal();
            this.renumberItems();
        }
    }

    renumberItems() {
        const items = this.itemsContainer.querySelectorAll('.item-card');
        items.forEach((item, index) => {
            const header = item.querySelector('h3');
            header.textContent = `Item ${index + 1}`;
        });
    }

    formatMoneyInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseInt(value || 0) / 100).toFixed(2);
        e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    calculateItemTotal(itemId) {
        const itemCard = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
        const quantity = parseFloat(itemCard.querySelector('.item-quantity').value) || 0;
        const priceStr = itemCard.querySelector('.item-price').value;
        const price = Utils.parseCurrency(priceStr);

        const total = quantity * price;
        itemCard.querySelector('.item-total').value = Utils.formatCurrency(total);

        this.calculateTotal();
    }

    calculateTotal() {
        let subtotal = 0;

        this.itemsContainer.querySelectorAll('.item-card').forEach(item => {
            const totalStr = item.querySelector('.item-total').value;
            subtotal += Utils.parseCurrency(totalStr);
        });

        const discountPercent = parseFloat(document.getElementById('discount').value) || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const total = subtotal - discountAmount;

        document.getElementById('subtotalDisplay').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('discountDisplay').textContent = Utils.formatCurrency(discountAmount);
        document.getElementById('totalDisplay').textContent = Utils.formatCurrency(total);
    }

    getFormData() {
        const items = [];
        this.itemsContainer.querySelectorAll('.item-card').forEach(item => {
            items.push({
                description: item.querySelector('.item-description').value,
                quantity: parseFloat(item.querySelector('.item-quantity').value),
                unitPrice: Utils.parseCurrency(item.querySelector('.item-price').value),
                total: Utils.parseCurrency(item.querySelector('.item-total').value)
            });
        });

        const subtotal = Utils.parseCurrency(document.getElementById('subtotalDisplay').textContent);
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = Utils.parseCurrency(document.getElementById('totalDisplay').textContent);

        return {
            type: 'budget',
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            clientEmail: document.getElementById('clientEmail').value,
            clientAddress: document.getElementById('clientAddress').value,
            clientCPFCNPJ: document.getElementById('clientCPFCNPJ').value,
            budgetDate: document.getElementById('budgetDate').value,
            budgetNumber: document.getElementById('budgetNumber').value,
            validUntil: document.getElementById('validUntil').value,
            items: items,
            subtotal: subtotal,
            discount: discount,
            total: total,
            warranty: document.getElementById('warranty').value,
            paymentConditions: document.getElementById('paymentConditions').value,
            observations: document.getElementById('observations').value
        };
    }

    async handleSubmit(e) {
        e.preventDefault();
        const submitBtn = this.form.querySelector('button[type="submit"]');

        if (!this.form.checkValidity()) {
            if (typeof ux !== 'undefined') {
                ux.warning('Por favor, preencha todos os campos obrigatórios.');
                ux.scrollToFirstError(this.form);
            }
            return;
        }

        if (typeof ux !== 'undefined') {
            ux.setButtonLoading(submitBtn, true, 'Gerando pré-visualização...');
        }

        try {
            const data = this.getFormData();
            const doc = this.buildPDF(data);
            const filename = `Orcamento_${data.budgetNumber}_${data.clientName.replace(/\s/g, '_')}.pdf`;

            if (typeof ux !== 'undefined') {
                ux.previewPDF(doc, {
                    filename,
                    title: 'Pré-visualização do Orçamento',
                    onDownload: () => {
                        Storage.saveDocument(data);
                        ux.clearAutoSave('budget');
                        ux.success('Orçamento salvo no histórico!');
                    },
                    onWhatsApp: () => this.sendWhatsAppFromData(data)
                });
            } else {
                doc.save(filename);
                Storage.saveDocument(data);
            }
        } catch (err) {
            if (typeof ux !== 'undefined') {
                ux.error('Erro ao gerar o PDF. Tente novamente.');
            }
            console.error(err);
        } finally {
            if (typeof ux !== 'undefined') {
                ux.setButtonLoading(submitBtn, false);
            }
        }
    }

    buildPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const companyData = Storage.getCompanyData();

        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // ========== HEADER - COMPANY INFO ==========
        // Logo
        if (companyData.companyLogo) {
            try {
                doc.addImage(companyData.companyLogo, 'PNG', margin, yPos, 40, 20);
            } catch (e) {
                console.error('Error adding logo:', e);
            }
        }

        // Company name and info
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(companyData.companyName || 'Minha Empresa', pageWidth / 2, yPos + 5, { align: 'center' });

        yPos += 12;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (companyData.companySlogan) {
            doc.text(companyData.companySlogan, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
        }

        // Company address
        let addressLine = '';
        if (companyData.companyAddress) {
            addressLine += companyData.companyAddress;
            if (companyData.companyNumber) addressLine += ', ' + companyData.companyNumber;
            if (companyData.companyNeighborhood) addressLine += ' - ' + companyData.companyNeighborhood;
        }
        if (companyData.companyCity) {
            addressLine += ' - ' + companyData.companyCity;
            if (companyData.companyState) addressLine += '/' + companyData.companyState;
        }
        if (addressLine) {
            doc.text(addressLine, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
        }

        // Contact info
        let contactLine = '';
        if (companyData.companyPhone) contactLine += 'Tel: ' + companyData.companyPhone + '  ';
        if (companyData.companyEmail) contactLine += 'Email: ' + companyData.companyEmail;
        if (contactLine) {
            doc.text(contactLine, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
        }

        if (companyData.companyCNPJ) {
            doc.text('CNPJ: ' + companyData.companyCNPJ, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
        }

        yPos += 5;
        doc.setDrawColor(100, 100, 255);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        // ========== TITLE ==========
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 150);
        doc.text('ORÇAMENTO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // ========== DOCUMENT INFO ==========
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        doc.text(`Número: ${data.budgetNumber || 'N/A'}`, margin, yPos);
        doc.text(`Data: ${Utils.formatDate(data.budgetDate)}`, pageWidth / 2, yPos);
        if (data.validUntil) {
            doc.text(`Validade: ${Utils.formatDate(data.validUntil)}`, pageWidth - margin, yPos, { align: 'right' });
        }
        yPos += 10;

        // ========== CLIENT INFO ==========
        doc.setFillColor(240, 240, 255);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('DADOS DO CLIENTE', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Nome: ${data.clientName}`, margin, yPos);
        yPos += 5;

        if (data.clientCPFCNPJ) {
            doc.text(`CPF/CNPJ: ${data.clientCPFCNPJ}`, margin, yPos);
            yPos += 5;
        }

        if (data.clientPhone || data.clientEmail) {
            let contactInfo = '';
            if (data.clientPhone) contactInfo += `Tel: ${data.clientPhone}  `;
            if (data.clientEmail) contactInfo += `Email: ${data.clientEmail}`;
            doc.text(contactInfo, margin, yPos);
            yPos += 5;
        }

        if (data.clientAddress) {
            const addressLines = doc.splitTextToSize(`Endereço: ${data.clientAddress}`, contentWidth);
            doc.text(addressLines, margin, yPos);
            yPos += (addressLines.length * 5) + 3;
        }

        yPos += 5;

        // ========== ITEMS TABLE ==========
        doc.setFillColor(240, 240, 255);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('ITENS DO ORÇAMENTO', margin + 2, yPos + 5);
        yPos += 12;

        // Table header
        doc.setFillColor(200, 200, 230);
        doc.rect(margin, yPos, contentWidth, 7, 'F');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Descrição', margin + 2, yPos + 5);
        doc.text('Qtd', pageWidth - margin - 70, yPos + 5, { align: 'center' });
        doc.text('Valor Unit.', pageWidth - margin - 45, yPos + 5, { align: 'center' });
        doc.text('Total', pageWidth - margin - 10, yPos + 5, { align: 'right' });
        yPos += 10;

        // Table items
        doc.setFont(undefined, 'normal');
        data.items.forEach((item, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            const descLines = doc.splitTextToSize(item.description, 100);
            const itemHeight = Math.max(descLines.length * 5, 7);

            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 255);
                doc.rect(margin, yPos - 3, contentWidth, itemHeight, 'F');
            }

            doc.text(descLines, margin + 2, yPos);
            doc.text(item.quantity.toString(), pageWidth - margin - 70, yPos, { align: 'center' });
            doc.text(Utils.formatCurrency(item.unitPrice), pageWidth - margin - 45, yPos, { align: 'center' });
            doc.text(Utils.formatCurrency(item.total), pageWidth - margin - 2, yPos, { align: 'right' });

            yPos += itemHeight + 2;
        });

        yPos += 3;

        // ========== TOTALS ==========
        doc.setDrawColor(200, 200, 230);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;

        doc.setFont(undefined, 'normal');
        doc.text('Subtotal:', pageWidth - margin - 50, yPos);
        doc.text(Utils.formatCurrency(data.subtotal), pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 6;

        if (data.discount > 0) {
            doc.text(`Desconto (${data.discount}%):`, pageWidth - margin - 50, yPos);
            doc.text(Utils.formatCurrency(data.subtotal * data.discount / 100), pageWidth - margin - 2, yPos, { align: 'right' });
            yPos += 6;
        }

        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', pageWidth - margin - 50, yPos);
        doc.text(Utils.formatCurrency(data.total), pageWidth - margin - 2, yPos, { align: 'right' });
        yPos += 10;

        // ========== ADDITIONAL INFO ==========
        if (data.warranty) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Garantia:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(data.warranty, margin + 20, yPos);
            yPos += 7;
        }

        if (data.paymentConditions) {
            doc.setFont(undefined, 'bold');
            doc.text('Condições de Pagamento:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const paymentLines = doc.splitTextToSize(data.paymentConditions, contentWidth);
            doc.text(paymentLines, margin, yPos);
            yPos += (paymentLines.length * 5) + 5;
        }

        if (data.observations) {
            doc.setFont(undefined, 'bold');
            doc.text('Observações:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const obsLines = doc.splitTextToSize(data.observations, contentWidth);
            doc.text(obsLines, margin, yPos);
            yPos += (obsLines.length * 5) + 10;
        }

        // ========== FOOTER ==========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
            doc.text(`Gerado em ${Utils.formatDate(Utils.getTodayDate())}`, pageWidth - margin, 285, { align: 'right' });
        }

        return doc;
    }

    async generatePDF(data) {
        const doc = this.buildPDF(data);
        const filename = `Orcamento_${data.budgetNumber}_${data.clientName.replace(/\s/g, '_')}.pdf`;
        doc.save(filename);

        if (typeof ux !== 'undefined') {
            ux.success('PDF gerado e baixado com sucesso!');
        }
    }

    async sendViaWhatsApp() {
        if (!this.form.checkValidity()) {
            if (typeof ux !== 'undefined') {
                ux.warning('Por favor, preencha todos os campos obrigatórios antes de enviar.');
                ux.scrollToFirstError(this.form);
            }
            return;
        }

        const data = this.getFormData();

        try {
            const doc = this.buildPDF(data);
            const filename = `Orcamento_${data.budgetNumber}_${data.clientName.replace(/\s/g, '_')}.pdf`;
            if (typeof ux !== 'undefined') {
                ux.previewPDF(doc, {
                    filename,
                    title: 'Pré-visualização do Orçamento',
                    onDownload: () => {
                        Storage.saveDocument(data);
                        ux.clearAutoSave('budget');
                        ux.success('Orçamento salvo no histórico!');
                    },
                    onWhatsApp: () => this.sendWhatsAppFromData(data)
                });
            } else {
                doc.save(filename);
                this.sendWhatsAppFromData(data);
            }
        } catch (e) {
            if (typeof ux !== 'undefined') ux.error('Erro ao gerar PDF para envio.');
        }
    }

    sendWhatsAppFromData(data) {
        const companyData = Storage.getCompanyData();

        let message = `*ORÇAMENTO - ${companyData.companyName}*%0A%0A`;
        message += `📋 *Número:* ${data.budgetNumber}%0A`;
        message += `📅 *Data:* ${Utils.formatDate(data.budgetDate)}%0A`;
        if (data.validUntil) {
            message += `⏰ *Validade:* ${Utils.formatDate(data.validUntil)}%0A`;
        }
        message += `%0A`;
        message += `👤 *Cliente:* ${data.clientName}%0A`;
        message += `%0A`;
        message += `*ITENS:*%0A`;

        data.items.forEach((item, index) => {
            message += `%0A${index + 1}. ${item.description}%0A`;
            message += `   Qtd: ${item.quantity} | Unit: ${Utils.formatCurrency(item.unitPrice)} | Total: ${Utils.formatCurrency(item.total)}%0A`;
        });

        message += `%0A`;
        message += `💰 *Subtotal:* ${Utils.formatCurrency(data.subtotal)}%0A`;
        if (data.discount > 0) {
            message += `💸 *Desconto:* ${data.discount}%0A`;
        }
        message += `✅ *TOTAL: ${Utils.formatCurrency(data.total)}*%0A`;

        if (data.warranty) {
            message += `%0A🛡️ *Garantia:* ${data.warranty}%0A`;
        }

        if (data.paymentConditions) {
            message += `%0A💳 *Pagamento:* ${data.paymentConditions}%0A`;
        }

        const phoneNumber = data.clientPhone ? data.clientPhone.replace(/\D/g, '') : '';
        const whatsappUrl = phoneNumber
            ? `https://wa.me/55${phoneNumber}?text=${message}`
            : `https://wa.me/?text=${message}`;

        // Salvar dados no histórico
        Storage.saveDocument(data);

        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    async clearForm() {
        const shouldClear = typeof ux !== 'undefined'
            ? await ux.confirm('Tem certeza que deseja limpar o formulário? Os dados não salvos serão perdidos.', { danger: true })
            : confirm('Tem certeza que deseja limpar o formulário?');

        if (shouldClear) {
            this.form.reset();
            this.itemsContainer.innerHTML = '';
            this.itemCounter = 0;
            this.loadDefaults();
            this.addItem();
            if (typeof ux !== 'undefined') {
                ux.clearAutoSave('budget');
                ux.info('Formulário limpo');
            }
        }
    }
}

// ==================== INITIALIZE ====================
let budgetForm;
document.addEventListener('DOMContentLoaded', () => {
    budgetForm = new BudgetForm();
});
