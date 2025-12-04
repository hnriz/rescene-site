// ✅ Envolva todo o código em uma função global
window.initLists = function() {
    // Verificar se já foi inicializado
    if (window.listsInitialized) {
        console.log('⚠️ Lists já foi inicializado, pulando inicialização duplicada');
        return;
    }
    
    // Marcar como inicializado
    window.listsInitialized = true;
    
    console.log('🎬 Inicializando Lists...');
    
    // Importar toast dinamicamente
    const { toast } = window.ReactToastify || {};
    
    if (!toast) {
        console.warn('⚠️ react-toastify não disponível, usando alerts como fallback');
    }
    
    // Verificar se elementos existem
    const createListCard = document.getElementById('createListCard');
    const createListModal = document.getElementById('createListModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelButton = document.querySelector('.cancelButton');
    const listForm = document.querySelector('.listForm');
    const viewButtons = document.querySelectorAll('.viewButton');
    const sortSelect = document.getElementById('sortLists');
    const listCards = document.querySelectorAll('.listCard:not(.createCard)');
    const searchInput = document.querySelector('.listsControls .searchBox input');
    const contentGrid = document.querySelector('.contentGrid');
    
    // Modal deve existir para funcionar
    if (!createListModal) {
        console.error('❌ Modal não encontrado!');
        return;
    }
    
    // createListBtn pode não existir, então procuramos alternativas
    let createListBtn = document.getElementById('createListBtn');
    if (!createListBtn) {
        // Criar um pseudo-elemento para facilitar
        createListBtn = {
            addEventListener: () => {} // Dummy listener
        };
    }
    
    // Flag para evitar múltiplas criações
    let isCreatingList = false;
    
    // ===== MODAL DE CRIAÇÃO =====
    function openCreateModal() {
        createListModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeCreateModal() {
        createListModal.classList.remove('active');
        document.body.style.overflow = '';
        hideCoverNotification(); // Limpar notificação ao fechar
        
        // Limpar todos os campos do formulário
        if (listForm) {
            listForm.reset();
        }
        
        // Limpar preview da imagem
        if (coverUploadPreview) {
            coverUploadPreview.style.backgroundImage = '';
            coverUploadPreview.style.backgroundSize = '';
            coverUploadPreview.style.backgroundPosition = '';
            const placeholder = coverUploadPreview.querySelector('.uploadPlaceholder');
            if (placeholder) {
                placeholder.style.display = '';
            }
        }
        
        // Limpar arquivo de capa
        if (coverInput) {
            coverInput.value = '';
        }
        
        selectedCoverFile = null; // Limpar referência do arquivo
    }
    
    createListBtn.addEventListener('click', openCreateModal);
    if (createListCard) {
        createListCard.addEventListener('click', openCreateModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeCreateModal);
    }
    if (cancelButton) {
        cancelButton.addEventListener('click', closeCreateModal);
    }
    
    // Fechar modal ao clicar fora
    if (createListModal) {
        createListModal.addEventListener('click', function(e) {
            if (e.target === createListModal) {
                closeCreateModal();
            }
        });
    }
    
    // ===== UPLOAD DE CAPA =====
    const coverUploadPreview = document.querySelector('.coverUploadPreview');
    const coverInput = document.getElementById('listCover');
    let selectedCoverFile = null; // Armazenar arquivo selecionado
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes
    
    // Detectar idioma
    const isEnglish = window.location.pathname.includes('/list/') || 
                      window.location.pathname.includes('/profile') ||
                      window.location.pathname.includes('/settings');
    
    const messages = {
        fileTooLarge: isEnglish 
            ? 'File too large! ({size}MB) Maximum: {max}MB'
            : 'Arquivo muito grande! ({size}MB) Máximo: {max}MB'
    };
    
    // Criar elemento de notificação
    let coverNotification = document.querySelector('.cover-size-notification');
    if (!coverNotification && coverUploadPreview) {
        coverNotification = document.createElement('div');
        coverNotification.className = 'cover-size-notification';
        coverNotification.style.display = 'none';
        coverUploadPreview.parentElement.appendChild(coverNotification);
    }
    
    function showCoverNotification(message, isError = false) {
        if (!coverNotification) return;
        
        // Criar HTML com ícone FontAwesome
        const iconClass = isError ? 'fa-circle-xmark' : 'fa-circle-check';
        coverNotification.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
        coverNotification.style.display = 'flex';
        coverNotification.className = isError ? 'cover-size-notification error' : 'cover-size-notification success';
    }
    
    function hideCoverNotification() {
        if (!coverNotification) return;
        coverNotification.style.display = 'none';
    }
    
    if (coverUploadPreview && coverInput) {
        // coverUploadPreview.addEventListener('click', function() {
        //     coverInput.click();
        // });
        
        coverInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                // Validar tamanho
                if (file.size > MAX_FILE_SIZE) {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
                    const errorMsg = messages.fileTooLarge
                        .replace('{size}', sizeMB)
                        .replace('{max}', maxMB);
                    showCoverNotification(errorMsg, true);
                    selectedCoverFile = null;
                    return;
                }
                
                selectedCoverFile = file; // Armazenar arquivo
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    coverUploadPreview.style.backgroundImage = `url(${event.target.result})`; 
                    coverUploadPreview.style.backgroundSize = 'cover';
                    coverUploadPreview.style.backgroundPosition = 'center';
                    const placeholder = coverUploadPreview.querySelector('.uploadPlaceholder');
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }
    
    // ===== ENVIO DO FORMULÁRIO =====
    if (listForm) {
        listForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Evitar múltiplas criações
            if (isCreatingList) {
                console.warn('⏳ Já existe uma criação em andamento...');
                if (toast) {
                    toast.warning('Por favor, aguarde a conclusão da operação anterior');
                }
                return;
            }
            
            // Buscar elementos com validação
            const listNameInput = document.getElementById('listName');
            const listDescInput = document.getElementById('listDescription');
            const submitButton = listForm.querySelector('button[type="submit"]');
            
            if (!listNameInput || !listDescInput) {
                console.error('❌ Elementos do formulário não encontrados');
                if (toast) {
                    toast.error('Erro: Elementos do formulário não encontrados');
                }
                return;
            }
            
            const listName = listNameInput.value.trim();
            const listDescription = listDescInput.value.trim();
            
            console.log('📝 Valores do formulário:', { listName, listDescription });
            
            // Validação
            if (!listName || listName.length === 0) {
                if (toast) {
                    toast.warning('Por favor, insira um nome para a lista');
                }
                return;
            }
            
            try {
                isCreatingList = true;
                console.log('🔄 Iniciando criação de lista...');
                
                // Desabilitar botão durante requisição
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Criando...';
                }
                
                // Buscar token
                const token = localStorage.getItem('token');
                if (!token) {
                    if (toast) {
                        toast.info('Você precisa estar logado para criar uma lista');
                    }
                    return;
                }
                
                console.log('🔄 Enviando para API...');
                
                // Criar FormData para enviar arquivo
                const formData = new FormData();
                formData.append('name', listName);
                formData.append('description', listDescription);
                if (selectedCoverFile) {
                    formData.append('cover', selectedCoverFile);
                }
                
                // Fazer chamada à API
                const API_URL = window.API_URL || 'https://rescene-site.vercel.app/api';
                const response = await fetch(`${API_URL}/lists`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                console.log(`API Response Status: ${response.status}`);
                
                if (!response.ok) {
                    const error = await response.json();
                    console.error('❌ API Error:', error);
                    throw new Error(error.message || `Erro HTTP ${response.status}`);
                }
                
                const result = await response.json();
                console.log('✅ Lista criada com sucesso:', result);
                
                // Fechar modal e resetar formulário
                closeCreateModal();
                listForm.reset();
                selectedCoverFile = null; // Limpar arquivo selecionado
                hideCoverNotification(); // Limpar notificação
                if (coverUploadPreview) {
                    coverUploadPreview.style.backgroundImage = '';
                    const placeholder = coverUploadPreview.querySelector('.uploadPlaceholder');
                    if (placeholder) {
                        placeholder.style.display = 'block';
                    }
                }
                
                // Mostrar mensagem de sucesso
                if (toast) {
                    toast.success(`Lista "${listName}" criada com sucesso!`);
                }
                
                // Redirecionar para página de lista com o ID
                const listId = result.list.id;
                const username = localStorage.getItem('username');
                const isPTBR = window.location.pathname.includes('/PTBR/') || 
                              window.location.pathname.startsWith('/perfil') ||
                              window.location.pathname.startsWith('/configuracoes');
                
                const listUrl = isPTBR ? `/${username}/lista/${listId}` : `/${username}/list/${listId}`;
                console.log('🔗 Redirecionando para:', listUrl);
                
                // Aguardar um pouco para o toast ser visível, depois redirecionar
                setTimeout(() => {
                    window.location.href = listUrl;
                }, 1500);
            } catch (err) {
                console.error('❌ Erro ao criar lista:', err);
                if (toast) {
                    toast.error('Erro ao criar lista: ' + err.message);
                }
            } finally {
                isCreatingList = false;
                // Reabilitar botão
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Criar Lista';
                }
            }
        });
    }
    
    // ===== ALTERNAR VISUALIZAÇÃO =====
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            
            // Atualizar botões ativos
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Alternar visualização
            if (contentGrid) {
                if (viewType === 'list') {
                    contentGrid.classList.add('list-view');
                } else {
                    contentGrid.classList.remove('list-view');
                }
            }
        });
    });
    
    // ===== ORDENAÇÃO =====
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            
            const sortedCards = Array.from(listCards).sort((a, b) => {
                if (sortBy === 'name') {
                    const titleA = a.querySelector('.cardTitle')?.textContent || '';
                    const titleB = b.querySelector('.cardTitle')?.textContent || '';
                    return titleA.localeCompare(titleB);
                } else if (sortBy === 'recent') {
                    const dateA = a.getAttribute('data-date') || '';
                    const dateB = b.getAttribute('data-date') || '';
                    return new Date(dateB) - new Date(dateA);
                } else if (sortBy === 'popular') {
                    const viewsA = parseInt(a.getAttribute('data-views')) || 0;
                    const viewsB = parseInt(b.getAttribute('data-views')) || 0;
                    return viewsB - viewsA;
                } else if (sortBy === 'items') {
                    const itemsA = parseInt(a.getAttribute('data-items')) || 0;
                    const itemsB = parseInt(b.getAttribute('data-items')) || 0;
                    return itemsB - itemsA;
                }
                return 0;
            });
            
            // Reordenar no DOM
            if (contentGrid) {
                const createCard = document.querySelector('.createCard');
                
                // Remover cards (mantendo createCard)
                listCards.forEach(card => {
                    if (card.parentNode) {
                        card.parentNode.removeChild(card);
                    }
                });
                
                // Adicionar cards ordenados
                sortedCards.forEach(card => {
                    contentGrid.appendChild(card);
                });
            }
        });
    }
    
    // ===== BUSCA =====
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            listCards.forEach(card => {
                const title = card.querySelector('.cardTitle')?.textContent.toLowerCase() || '';
                
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // ===== TOOLTIPS =====
    // const tooltipElements = document.querySelectorAll('[data-tooltip]');
    // tooltipElements.forEach(element => {
    //     element.addEventListener('mouseenter', showTooltip);
    //     element.addEventListener('mouseleave', hideTooltip);
    // });
    
    // function showTooltip(e) {
    //     const tooltipText = this.getAttribute('data-tooltip');
    //     const tooltip = document.createElement('div');
    //     tooltip.className = 'custom-tooltip';
    //     tooltip.textContent = tooltipText;
    //     tooltip.style.position = 'fixed';
    //     tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    //     tooltip.style.color = '#fff';
    //     tooltip.style.padding = '8px 12px';
    //     tooltip.style.borderRadius = '4px';
    //     tooltip.style.fontSize = '0.85rem';
    //     tooltip.style.zIndex = '1000';
    //     tooltip.style.pointerEvents = 'none';
    //     tooltip.style.whiteSpace = 'nowrap';
        
    //     document.body.appendChild(tooltip);
        
    //     const rect = this.getBoundingClientRect();
    //     tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    //     tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        
    //     this._tooltip = tooltip;
    // }
    
    // function hideTooltip() {
    //     if (this._tooltip) {
    //         this._tooltip.remove();
    //         this._tooltip = null;
    //     }
    // }
    
    // ===== PAGINAÇÃO =====
    const paginationButtons = document.querySelectorAll('.paginationButton:not(:disabled)');
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            const activeButton = document.querySelector('.paginationButton.active');
            if (activeButton) {
                activeButton.classList.remove('active');
            }
            this.classList.add('active');
            
            // Simular carregamento de nova página
            if (contentGrid) {
                contentGrid.style.opacity = '0.5';
                
                setTimeout(() => {
                    contentGrid.style.opacity = '1';
                }, 800);
            }
        });
    });
    
    // ===== DELETAR LISTA =====
    // Atualizar evento de deletar quando novas listas forem carregadas
    function attachDeleteListeners() {
        const deleteButtons = document.querySelectorAll('.actionButton[data-action="delete"]');
        deleteButtons.forEach(button => {
            button.removeEventListener('click', deleteListHandler);
            button.addEventListener('click', deleteListHandler);
        });
    }
    
    async function deleteListHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const listCard = this.closest('.listCard');
        const listId = listCard?.getAttribute('data-list-id');
        const listName = listCard?.querySelector('.cardTitle')?.textContent;
        
        if (!listId) {
            console.error('❌ ID da lista não encontrado');
            if (toast) {
                toast.error('Erro: ID da lista não encontrado');
            } else {
                alert('Erro: ID da lista não encontrado');
            }
            return;
        }
        
        // Usar confirm dialog - se usuário cancelar, retorna sem fazer nada
        const confirmed = confirm(`Tem certeza que deseja deletar a lista "${listName}"? Esta ação não pode ser desfeita.`);
        
        if (!confirmed) {
            console.log('❌ Deleção cancelada pelo usuário');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                if (toast) {
                    toast.info('Você precisa estar logado');
                } else {
                    alert('Você precisa estar logado');
                }
                return;
            }
            
            console.log('🗑️ Deletando lista:', listId);
            
            // Mostrar loading
            if (toast) {
                toast.loading('Deletando lista...');
            }
            
            const API_URL = window.API_URL || 'https://rescene-site.vercel.app/api';
            const response = await fetch(`${API_URL}/lists/${listId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao deletar lista');
            }
            
            console.log('✅ Lista deletada com sucesso');
            if (toast) {
                toast.success(`Lista "${listName}" deletada com sucesso!`);
            }
            
            // Remover do DOM
            const cardWrapper = listCard.closest('a') || listCard;
            if (cardWrapper.parentNode) {
                cardWrapper.parentNode.removeChild(cardWrapper);
            } else if (listCard.parentNode) {
                listCard.parentNode.removeChild(listCard);
            }
            
            // Atualizar página após 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error('❌ Erro ao deletar:', err);
            if (toast) {
                toast.error('Erro ao deletar lista: ' + err.message);
            }
        }
    }
    
    // Anexar listeners iniciais
    attachDeleteListeners();
    
    console.log('✅ Lists inicializado com sucesso!');
};

// Nota: Este script é carregado dinamicamente pelo componente React
// A função window.initLists() é chamada manualmente no onload do script