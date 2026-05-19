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

    generateDocumentNumber(type) {
        const documents = Storage.getDocuments();
        const filtered = documents.filter(doc => doc.type === type);
        const year = new Date().getFullYear();
        const number = filtered.length + 1;
        return `${year}${String(number).padStart(4, '0')}`;
    }
};

// ==================== RECEIPT FORM ====================
class ReceiptForm {
    constructor() {
        this.form = document.getElementById('receiptForm');
        this.amountInput = document.getElementById('amountReceived');
        this.whatsappBtn = document.getElementById('whatsappBtnReceipt');
        this.clearBtn = document.getElementById('clearBtnReceipt');

        this.init();
    }

    init() {
        this.loadDefaults();
        this.attachEventListeners();

        // UX enhancements
        if (typeof ux !== 'undefined') {
            ux.enableAutoSave('receiptForm', 'receipt', {
                onRestore: () => ux.info('Dados anteriores restaurados automaticamente')
            });
            ux.createProgressBar('receiptForm');
            ux.initLiveValidation('receiptForm');
        }
    }

    loadDefaults() {
        // Set today's date
        document.getElementById('receiptDate').value = Utils.getTodayDate();

        // Generate receipt number
        document.getElementById('receiptNumber').value = Utils.generateDocumentNumber('receipt');

        // Load default observations
        const companyData = Storage.getCompanyData();
        if (companyData.defaultNotes) {
            document.getElementById('receiptObservations').value = companyData.defaultNotes;
        }
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.whatsappBtn.addEventListener('click', () => this.sendViaWhatsApp());
        this.clearBtn.addEventListener('click', () => this.clearForm());

        // Money input formatting
        this.amountInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = (parseInt(value || 0) / 100).toFixed(2);
            e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        });
    }

    getFormData() {
        const amount = Utils.parseCurrency(document.getElementById('amountReceived').value);

        return {
            type: 'receipt',
            receiptNumber: document.getElementById('receiptNumber').value,
            receiptDate: document.getElementById('receiptDate').value,
            amountReceived: amount,
            amountText: document.getElementById('amountText').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            payerName: document.getElementById('payerName').value,
            payerCPFCNPJ: document.getElementById('payerCPFCNPJ').value,
            payerPhone: document.getElementById('payerPhone').value,
            payerAddress: document.getElementById('payerAddress').value,
            referringTo: document.getElementById('referringTo').value,
            observations: document.getElementById('receiptObservations').value
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
            const filename = `Recibo_${data.receiptNumber}_${data.payerName.replace(/\s/g, '_')}.pdf`;

            // Sempre salvar no histórico antes de preview/compartilhar
            Storage.saveDocument(data);
            if (typeof ux !== 'undefined') ux.clearAutoSave('receipt');

            if (typeof ux !== 'undefined') {
                ux.previewPDF(doc, {
                    filename,
                    title: 'Pré-visualização do Recibo',
                    onDownload: () => {
                        ux.success('Recibo salvo no histórico!');
                    },
                    onWhatsApp: () => this.sharePDF(doc, data, filename)
                });
            } else {
                doc.save(filename);
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
        yPos += 15;

        // ========== TITLE ==========
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 150);
        doc.text('RECIBO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // ========== RECEIPT INFO ==========
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        doc.text(`Nº ${data.receiptNumber || 'N/A'}`, margin, yPos);
        doc.text(`Data: ${Utils.formatDate(data.receiptDate)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 15;

        // ========== MAIN CONTENT BOX ==========
        const boxStartY = yPos;
        doc.setDrawColor(100, 100, 255);
        doc.setLineWidth(0.3);
        doc.rect(margin, boxStartY, contentWidth, 80);

        yPos += 10;

        // Amount received
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('Recebi de:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(data.payerName, margin + 30, yPos);
        yPos += 10;

        // Payer info
        if (data.payerCPFCNPJ) {
            doc.setFont(undefined, 'bold');
            doc.text('CPF/CNPJ:', margin + 5, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(data.payerCPFCNPJ, margin + 30, yPos);
            yPos += 7;
        }

        if (data.payerAddress) {
            doc.setFont(undefined, 'bold');
            doc.text('Endereço:', margin + 5, yPos);
            doc.setFont(undefined, 'normal');
            const addressLines = doc.splitTextToSize(data.payerAddress, contentWidth - 35);
            doc.text(addressLines, margin + 30, yPos);
            yPos += (addressLines.length * 5) + 3;
        }

        yPos += 3;

        // Amount
        doc.setFont(undefined, 'bold');
        doc.text('A quantia de:', margin + 5, yPos);
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text(Utils.formatCurrency(data.amountReceived), margin + 35, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        const amountTextLines = doc.splitTextToSize(`(${data.amountText})`, contentWidth - 10);
        doc.text(amountTextLines, margin + 5, yPos);
        yPos += (amountTextLines.length * 5) + 5;

        // Payment method
        doc.setFont(undefined, 'bold');
        doc.text('Forma de Pagamento:', margin + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(data.paymentMethod, margin + 50, yPos);

        yPos = boxStartY + 90;

        // ========== REFERRING TO ==========
        doc.setFillColor(240, 240, 255);
        doc.rect(margin, yPos, contentWidth, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('REFERENTE A:', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        const referringLines = doc.splitTextToSize(data.referringTo, contentWidth - 4);
        doc.text(referringLines, margin + 2, yPos);
        yPos += (referringLines.length * 5) + 10;

        // ========== OBSERVATIONS ==========
        if (data.observations) {
            doc.setFillColor(240, 240, 255);
            doc.rect(margin, yPos, contentWidth, 8, 'F');
            doc.setFont(undefined, 'bold');
            doc.text('OBSERVAÇÕES:', margin + 2, yPos + 5);
            yPos += 12;

            doc.setFont(undefined, 'normal');
            const obsLines = doc.splitTextToSize(data.observations, contentWidth - 4);
            doc.text(obsLines, margin + 2, yPos);
            yPos += (obsLines.length * 5) + 15;
        }

        // ========== SIGNATURE ==========
        yPos += 20;
        doc.setDrawColor(0, 0, 0);
        doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos);
        yPos += 5;
        doc.setFontSize(10);
        doc.text(companyData.companyName || 'Assinatura', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        if (companyData.companyCNPJ) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`CNPJ: ${companyData.companyCNPJ}`, pageWidth / 2, yPos, { align: 'center' });
        }

        // ========== FOOTER ==========
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em ${Utils.formatDate(Utils.getTodayDate())}`, pageWidth / 2, 285, { align: 'center' });

        return doc;
    }

    async generatePDF(data) {
        const doc = this.buildPDF(data);
        const filename = `Recibo_${data.receiptNumber}_${data.payerName.replace(/\s/g, '_')}.pdf`;
        doc.save(filename);

        if (typeof ux !== 'undefined') {
            ux.success('Recibo gerado e baixado com sucesso!');
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

        // Sempre salvar no histórico antes de compartilhar
        Storage.saveDocument(data);
        if (typeof ux !== 'undefined') ux.clearAutoSave('receipt');

        try {
            const doc = this.buildPDF(data);
            const filename = `Recibo_${data.receiptNumber}_${data.payerName.replace(/\s/g, '_')}.pdf`;
            await this.sharePDF(doc, data, filename);
        } catch (e) {
            if (typeof ux !== 'undefined') ux.error('Erro ao gerar PDF para envio.');
        }
    }

    async sharePDF(doc, data, filename) {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Recibo ${data.receiptNumber}`,
                    text: `Segue o recibo de ${data.payerName}.`
                });
                if (typeof ux !== 'undefined') ux.success('PDF enviado para o WhatsApp!');
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', err);
                }
            }
        }

        // Fallback: baixar PDF + abrir WhatsApp com mensagem
        doc.save(filename);
        this.sendWhatsAppText(data);
    }

    sendWhatsAppText(data) {
        const companyData = Storage.getCompanyData();

        let message = `*RECIBO - ${companyData.companyName}*%0A%0A`;
        message += `📋 *Número:* ${data.receiptNumber}%0A`;
        message += `📅 *Data:* ${Utils.formatDate(data.receiptDate)}%0A`;
        message += `%0A`;
        message += `💰 *Valor Recebido:* ${Utils.formatCurrency(data.amountReceived)}%0A`;
        message += `📝 _(${data.amountText})_%0A`;
        message += `%0A`;
        message += `💳 *Forma de Pagamento:* ${data.paymentMethod}%0A`;
        message += `%0A`;
        message += `👤 *Pagador:* ${data.payerName}%0A`;
        if (data.payerCPFCNPJ) {
            message += `📄 *CPF/CNPJ:* ${data.payerCPFCNPJ}%0A`;
        }
        message += `%0A`;
        message += `📌 *Referente a:*%0A${data.referringTo}%0A`;

        if (data.observations) {
            message += `%0A💬 *Observações:* ${data.observations}%0A`;
        }

        message += `%0A📎 *O PDF do recibo foi baixado. Anexe-o nesta conversa.*`;

        const phoneNumber = data.payerPhone ? data.payerPhone.replace(/\D/g, '') : '';
        const whatsappUrl = phoneNumber
            ? `https://wa.me/55${phoneNumber}?text=${message}`
            : `https://wa.me/?text=${message}`;

        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    async clearForm() {
        const shouldClear = typeof ux !== 'undefined'
            ? await ux.confirm('Tem certeza que deseja limpar o formulário? Os dados não salvos serão perdidos.', { danger: true })
            : confirm('Tem certeza que deseja limpar o formulário?');

        if (shouldClear) {
            this.form.reset();
            this.loadDefaults();
            if (typeof ux !== 'undefined') {
                ux.clearAutoSave('receipt');
                ux.info('Formulário limpo');
            }
        }
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    new ReceiptForm();
});
