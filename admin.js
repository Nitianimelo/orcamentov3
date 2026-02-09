// ==================== ADMIN PANEL ====================

// Load storage utilities
const Storage = {
    getCompanyData() {
        const data = localStorage.getItem('companyData');
        return data ? JSON.parse(data) : null;
    },

    saveCompanyData(data) {
        localStorage.setItem('companyData', JSON.stringify(data));
    }
};

// ==================== FORM MANAGEMENT ====================
class AdminPanel {
    constructor() {
        this.form = document.getElementById('adminForm');
        this.logoInput = document.getElementById('companyLogo');
        this.logoPreview = document.getElementById('logoPreview');
        this.logoPreviewImg = document.getElementById('logoPreviewImg');
        this.removeLogo = document.getElementById('removeLogo');
        this.successMessage = document.getElementById('successMessage');
        this.resetBtn = document.getElementById('resetBtn');

        this.currentLogoData = '';

        this.init();
    }

    init() {
        this.loadData();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Form submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveData();
        });

        // Logo upload
        this.logoInput.addEventListener('change', (e) => {
            this.handleLogoUpload(e);
        });

        // Remove logo
        this.removeLogo.addEventListener('click', () => {
            this.removeLogoImage();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
                this.clearData();
            }
        });

        // Auto-format inputs
        this.applyInputMasks();
    }

    loadData() {
        const data = Storage.getCompanyData();
        if (!data) return;

        // Load all fields
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input && key !== 'companyLogo') {
                input.value = data[key] || '';
            }
        });

        // Load logo
        if (data.companyLogo) {
            this.currentLogoData = data.companyLogo;
            this.showLogoPreview(data.companyLogo);
        }
    }

    saveData() {
        const formData = new FormData(this.form);
        const data = {};

        // Get all text inputs
        this.form.querySelectorAll('input:not([type="file"]), textarea, select').forEach(input => {
            data[input.id] = input.value;
        });

        // Add logo
        data.companyLogo = this.currentLogoData;

        // Save to localStorage
        Storage.saveCompanyData(data);

        // Show success message
        this.showSuccessMessage();
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB.');
            return;
        }

        // Read and convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentLogoData = e.target.result;
            this.showLogoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showLogoPreview(imageSrc) {
        this.logoPreviewImg.src = imageSrc;
        this.logoPreview.style.display = 'block';
    }

    removeLogoImage() {
        this.currentLogoData = '';
        this.logoPreview.style.display = 'none';
        this.logoInput.value = '';
    }

    showSuccessMessage() {
        this.successMessage.style.display = 'block';
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 3000);
    }

    clearData() {
        localStorage.removeItem('companyData');
        this.form.reset();
        this.removeLogoImage();
        alert('Dados limpos com sucesso!');
    }

    applyInputMasks() {
        // Phone mask
        const phoneInputs = document.querySelectorAll('#companyPhone, #companyWhatsapp');
        phoneInputs.forEach(input => {
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

        // CNPJ mask
        const cnpjInput = document.getElementById('companyCNPJ');
        cnpjInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 14) {
                if (value.length === 14) {
                    e.target.value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                } else if (value.length === 11) {
                    e.target.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                } else {
                    e.target.value = value;
                }
            }
        });

        // CEP mask
        const cepInput = document.getElementById('companyCEP');
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                if (value.length === 8) {
                    e.target.value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                } else {
                    e.target.value = value;
                }
            }
        });

        // State uppercase
        const stateInput = document.getElementById('companyState');
        stateInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
