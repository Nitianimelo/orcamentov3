// ==================== STORAGE UTILITIES ====================
const Storage = {
    // Get company data
    getCompanyData() {
        const data = localStorage.getItem('companyData');
        return data ? JSON.parse(data) : this.getDefaultCompanyData();
    },

    // Default company data
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

    // Save company data
    saveCompanyData(data) {
        localStorage.setItem('companyData', JSON.stringify(data));
    },

    // Get all documents (budgets and receipts)
    getDocuments() {
        const data = localStorage.getItem('documents');
        return data ? JSON.parse(data) : [];
    },

    // Save document
    saveDocument(document) {
        const documents = this.getDocuments();
        document.id = Date.now().toString();
        document.createdAt = new Date().toISOString();
        documents.unshift(document);
        localStorage.setItem('documents', JSON.stringify(documents));
        return document.id;
    },

    // Get document by ID
    getDocument(id) {
        const documents = this.getDocuments();
        return documents.find(doc => doc.id === id);
    },

    // Delete document
    deleteDocument(id) {
        const documents = this.getDocuments();
        const filtered = documents.filter(doc => doc.id !== id);
        localStorage.setItem('documents', JSON.stringify(filtered));
    }
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
    // Format currency
    formatCurrency(value) {
        if (!value && value !== 0) return 'R$ 0,00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Parse currency string to number
    parseCurrency(value) {
        if (!value) return 0;
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    },

    // Format phone
    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    // Format CPF/CNPJ
    formatCPFCNPJ(value) {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cleaned.length === 14) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return value;
    },

    // Format CEP
    formatCEP(cep) {
        if (!cep) return '';
        const cleaned = cep.replace(/\D/g, '');
        if (cleaned.length === 8) {
            return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        return cep;
    },

    // Generate document number
    generateDocumentNumber(type) {
        const documents = Storage.getDocuments();
        const filtered = documents.filter(doc => doc.type === type);
        const year = new Date().getFullYear();
        const number = filtered.length + 1;
        return `${year}${String(number).padStart(4, '0')}`;
    },

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Add days to date
    addDays(dateString, days) {
        const date = new Date(dateString + 'T00:00:00');
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// ==================== LOAD HEADER ====================
function loadHeader() {
    const companyData = Storage.getCompanyData();
    const headerLogo = document.getElementById('headerLogo');
    const headerCompanyName = document.getElementById('headerCompanyName');

    if (headerLogo && companyData.companyLogo) {
        headerLogo.src = companyData.companyLogo;
        headerLogo.style.display = 'block';
    }

    if (headerCompanyName) {
        headerCompanyName.textContent = companyData.companyName || 'Sistema de Orçamentos';
    }
}

// ==================== INPUT MASKS ====================
function applyInputMasks() {
    // Phone mask
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length === 11) {
                    e.target.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                } else if (value.length === 10) {
                    e.target.value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                } else {
                    e.target.value = value;
                }
            }
        });
    });

    // Money mask
    document.querySelectorAll('.money-input').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = (parseInt(value) / 100).toFixed(2);
            e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        });
    });
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    applyInputMasks();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, Utils };
}
