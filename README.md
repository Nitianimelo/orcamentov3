# Sistema de Orçamentos e Recibos

Sistema completo e profissional para criação de orçamentos e recibos com geração de PDF e compartilhamento direto via WhatsApp. Totalmente responsivo e mobile-friendly.

## Características Principais

- **Geração de Orçamentos Profissionais**: Crie orçamentos detalhados com múltiplos itens, valores, descontos e condições
- **Emissão de Recibos**: Gere recibos de pagamento completos e profissionais
- **PDF de Alta Qualidade**: PDFs profissionais com todas as informações da empresa e formatação elegante
- **Compartilhamento WhatsApp**: Envie orçamentos e recibos diretamente via WhatsApp com um clique
- **Painel Administrativo**: Configure todos os dados da empresa, logo, endereço e informações padrão
- **Histórico de Documentos**: Visualize, regenere e gerencie todos os documentos criados
- **100% Offline**: Funciona completamente offline, dados salvos no navegador (localStorage)
- **Design Responsivo**: Interface moderna e totalmente adaptável a mobile, tablet e desktop
- **Sem Banco de Dados**: Todas as configurações são salvas localmente no navegador

## Funcionalidades Detalhadas

### Painel Administrativo
Configure uma vez e use sempre:
- Nome e slogan da empresa
- Logo (upload de imagem)
- CNPJ/CPF e Inscrição Estadual
- Endereço completo
- Telefones, email e website
- Garantia padrão
- Condições de pagamento padrão
- Observações padrão
- Descrição de serviços

### Orçamentos
- Dados completos do cliente
- Múltiplos itens com descrição, quantidade e valor
- Cálculo automático de totais
- Sistema de descontos
- Garantia e condições de pagamento
- Observações personalizadas
- Numeração automática
- Data de validade
- PDF profissional com logo e dados da empresa

### Recibos
- Dados do pagador
- Valor por extenso automático
- Múltiplas formas de pagamento
- Descrição detalhada do serviço/produto
- Observações personalizadas
- Numeração automática
- PDF com formatação profissional

### Histórico
- Visualização de todos os documentos
- Filtros por tipo (orçamento/recibo)
- Busca por cliente ou número
- Regenerar PDF de qualquer documento
- Reenviar via WhatsApp
- Visualizar detalhes
- Excluir documentos

## Estrutura de Arquivos

```
/
├── index.html              # Página principal
├── admin.html              # Painel administrativo
├── orcamento.html          # Criação de orçamentos
├── recibo.html             # Criação de recibos
├── historico.html          # Histórico de documentos
├── css/
│   └── style.css           # Estilos responsivos e modernos
├── js/
│   ├── app.js              # Funções compartilhadas e utilitários
│   ├── admin.js            # Lógica do painel administrativo
│   ├── orcamento.js        # Lógica de orçamentos e PDF
│   ├── recibo.js           # Lógica de recibos e PDF
│   └── historico.js        # Lógica do histórico
└── README.md               # Esta documentação
```

## Como Usar

### 1. Primeiro Acesso - Configure sua Empresa

1. Abra o sistema no navegador
2. Clique em "Configurações"
3. Preencha todos os dados da sua empresa
4. Faça upload da logo (opcional, mas recomendado)
5. Clique em "Salvar Configurações"

**Importante**: Essas configurações são salvas no navegador. Se limpar o cache ou usar outro dispositivo, precisará configurar novamente.

### 2. Criar um Orçamento

1. Na página inicial, clique em "Novo Orçamento"
2. Preencha os dados do cliente
3. Adicione itens clicando em "+ Adicionar Item"
4. Para cada item, informe:
   - Descrição do serviço/produto
   - Quantidade
   - Valor unitário
5. Configure desconto se necessário
6. Adicione garantia, condições de pagamento e observações
7. Clique em "Gerar PDF" para baixar o orçamento
8. Ou clique em "Enviar via WhatsApp" para compartilhar

### 3. Criar um Recibo

1. Na página inicial, clique em "Novo Recibo"
2. Preencha os dados do pagamento
3. Informe o valor recebido e por extenso
4. Selecione a forma de pagamento
5. Preencha os dados do pagador
6. Descreva o serviço/produto
7. Clique em "Gerar PDF" ou "Enviar via WhatsApp"

### 4. Visualizar Histórico

1. Na página inicial, clique em "Histórico"
2. Use os filtros para ver apenas orçamentos ou recibos
3. Use a busca para encontrar documentos específicos
4. Clique nas ações para:
   - **Gerar PDF**: Baixar o documento novamente
   - **WhatsApp**: Reenviar via WhatsApp
   - **Detalhes**: Ver todas as informações
   - **Excluir**: Remover o documento

## Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e moderna
- **CSS3**: Design responsivo com flexbox e grid
- **JavaScript**: Lógica de negócio e interatividade
- **jsPDF**: Geração de PDFs profissionais
- **LocalStorage**: Persistência de dados no navegador
- **WhatsApp API**: Compartilhamento direto

## Design Responsivo

O sistema se adapta automaticamente a diferentes tamanhos de tela:

- **Desktop**: Layout amplo com cards em grid
- **Tablet**: Layout otimizado para telas médias
- **Mobile**: Design vertical otimizado para toque

## Armazenamento de Dados

Os dados são armazenados localmente no navegador usando localStorage:

- **companyData**: Configurações da empresa
- **documents**: Histórico de orçamentos e recibos

### Importante sobre Dados

- Os dados são armazenados **apenas no navegador atual**
- Se limpar o cache do navegador, os dados serão perdidos
- Cada dispositivo terá seus próprios dados
- Não há sincronização entre dispositivos
- Não há backup automático

### Como Fazer Backup

Os dados estão no localStorage do navegador. Para backup manual:

1. Abra o Console do navegador (F12)
2. Vá para Application > Local Storage
3. Copie os valores de `companyData` e `documents`
4. Salve em um arquivo de texto

Para restaurar:
1. Cole os valores de volta no localStorage
2. Atualize a página

## Personalização

### Cores e Estilos

Edite o arquivo `css/style.css` e modifique as variáveis CSS no início:

```css
:root {
    --primary: #2563eb;        /* Cor principal */
    --primary-dark: #1e40af;   /* Cor principal escura */
    --success: #10b981;         /* Cor de sucesso */
    /* ... outras cores ... */
}
```

### Logo da Empresa

A logo é carregada via upload no painel administrativo e convertida para base64 para ser armazenada no localStorage.

Formatos aceitos: JPG, PNG, GIF
Tamanho máximo: 2MB

## Compatibilidade

O sistema funciona em todos os navegadores modernos:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

**Não compatível** com Internet Explorer.

## Limitações

- Dados armazenados apenas localmente (localStorage)
- Limite de 5-10MB de armazenamento (depende do navegador)
- Sem sincronização entre dispositivos
- Sem backup automático
- Sem autenticação ou multi-usuário

## Melhorias Futuras

Possíveis expansões do sistema:

- [ ] Exportar/Importar dados
- [ ] Backup na nuvem
- [ ] Templates de orçamento personalizáveis
- [ ] Múltiplas empresas
- [ ] Assinatura digital
- [ ] Envio por email
- [ ] Dashboard com estatísticas
- [ ] Gráficos de faturamento
- [ ] Integração com sistemas de pagamento
- [ ] Modo escuro

## Suporte

Para dúvidas ou problemas:

1. Verifique se está usando um navegador moderno
2. Limpe o cache se houver problemas
3. Verifique o console do navegador para erros
4. Teste em outro navegador

## Licença

Este sistema foi desenvolvido para uso livre e pode ser modificado conforme necessário.

## Desenvolvido com

- Amor e dedicação
- Foco em simplicidade e usabilidade
- Design moderno e profissional
- Código limpo e bem estruturado

---

**Versão**: 1.0.0
**Data**: 2025
**Status**: Pronto para produção
