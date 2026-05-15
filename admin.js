// ==================== ADMIN PANEL ====================

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
        this.successMessage = document.getElementById('successMessage');
        this.resetBtn = document.getElementById('resetBtn');

        this.currentLogoData = '';

        this.init();
    }

    init() {
        this.loadData();
        this.attachEventListeners();

        if (typeof ux !== 'undefined') {
            ux.initLiveValidation('adminForm');
            ux.initTooltips();
        }
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveData();
        });

        this.logoInput.addEventListener('change', (e) => {
            this.handleLogoUpload(e);
        });

        const dropzone = document.querySelector('.ux-dropzone, .logo-preview');
        if (dropzone) {
            ['dragenter', 'dragover'].forEach(event => {
                dropzone.addEventListener(event, (e) => {
                    e.preventDefault();
                    dropzone.classList.add('ux-dropzone--dragover');
                });
            });
            ['dragleave', 'drop'].forEach(event => {
                dropzone.addEventListener(event, (e) => {
                    e.preventDefault();
                    dropzone.classList.remove('ux-dropzone--dragover');
                });
            });
            dropzone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) this.processLogoFile(files[0]);
            });
        }

        this.resetBtn.addEventListener('click', async () => {
            const shouldReset = typeof ux !== 'undefined'
                ? await ux.confirm(
                    'Tem certeza que deseja limpar todos os dados da empresa? Esta ação não pode ser desfeita.',
                    { danger: true, title: 'Limpar Dados', confirmText: 'Sim, Limpar', cancelText: 'Cancelar' }
                )
                : confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.');

            if (shouldReset) {
                this.clearData();
            }
        });

        this.applyInputMasks();
    }

    loadData() {
        const data = Storage.getCompanyData();
        if (!data) return;

        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input && key !== 'companyLogo') {
                input.value = data[key] || '';
            }
        });

        if (data.companyLogo) {
            this.currentLogoData = data.companyLogo;
            this.showLogoPreview(data.companyLogo);
        }
    }

    saveData() {
        const data = {};

        this.form.querySelectorAll('input:not([type="file"]), textarea, select').forEach(input => {
            data[input.id] = input.value;
        });

        data.companyLogo = this.currentLogoData;
        Storage.saveCompanyData(data);

        if (typeof ux !== 'undefined') {
            ux.success('Configurações salvas com sucesso!');
        } else {
            this.showSuccessMessage();
        }
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.processLogoFile(file);
    }

    processLogoFile(file) {
        if (!file.type.startsWith('image/')) {
            if (typeof ux !== 'undefined') {
                ux.error('Por favor, selecione uma imagem válida (JPG, PNG, GIF).');
            } else {
                alert('Por favor, selecione uma imagem válida.');
            }
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            if (typeof ux !== 'undefined') {
                ux.warning('A imagem deve ter no máximo 2MB.');
            } else {
                alert('A imagem deve ter no máximo 2MB.');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentLogoData = e.target.result;
            this.showLogoPreview(e.target.result);
            if (typeof ux !== 'undefined') {
                ux.success('Logo carregada com sucesso!');
            }
        };
        reader.readAsDataURL(file);
    }

    showLogoPreview(imageSrc) {
        this.logoPreviewImg.src = imageSrc;
        this.logoPreview.style.display = 'block';
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
        this.currentLogoData = '';
        this.logoPreview.style.display = 'none';
        this.logoInput.value = '';
        if (typeof ux !== 'undefined') {
            ux.success('Dados limpos com sucesso!');
        } else {
            alert('Dados limpos com sucesso!');
        }
    }

    applyInputMasks() {
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
