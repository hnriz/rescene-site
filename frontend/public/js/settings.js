// ✅ Envolva todo o código em uma função global
window.initSettings = function () {
  console.log('🎬 Inicializando Settings...');

  // ===== VARIÁVEIS GLOBAIS =====
  let currentSection = 'profile';
  let avatarFile = null;
  let selectedPresetAvatar = null;
  let favoriteItems = [];

  // ===== DETECÇÃO DE IDIOMA =====
  const detectLanguage = () => {
    // Verificar se há data-language no body
    const bodyLang = document.body.getAttribute('data-language');
    if (bodyLang) return bodyLang;

    // Verificar URL (se contém /PTBR/ ou /settings-ptbr)
    const url = window.location.pathname;
    if (url.includes('PTBR') || url.includes('ptbr') || url.includes('pt-BR')) {
      return 'pt-BR';
    }

    // Fallback para English
    return 'en-US';
  };

  const currentLanguage = detectLanguage();

  // ===== DICIONÁRIO DE NOTIFICAÇÕES =====
  const notifications = {
    'pt-BR': {
      settingsSaved: 'Configurações salvas com sucesso!',
      requiredFields: 'Por favor, preencha todos os campos obrigatórios.',
      passwordMismatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 8 caracteres',
      imageNotValid: 'Por favor, selecione um arquivo de imagem.',
      imageTooBig: 'A imagem deve ter menos de 5MB.',
      imageLoaded: 'Imagem carregada com sucesso! Clique em "Aplicar avatar" para salvar.',
      avatarReset: 'Avatar redefinido para a imagem padrão.',
      avatarRemoved: 'Avatar removido. Uma imagem padrão será exibida.',
      avatarPresetSelected: 'Avatar pré-definido selecionado! Clique em "Aplicar avatar" para salvar.',
      selectAvatar: 'Por favor, selecione um avatar para upload ou escolha um pré-definido.',
      avatarUpdated: 'Avatar atualizado com sucesso!',
      avatarError: 'Erro ao atualizar avatar. Tente novamente.',
      favoriteAdded: (type) => {
        const types = { 'movie': 'Filme', 'series': 'Série', 'director': 'Diretor' };
        return `${types[type]} adicionado aos favoritos!`;
      },
      twoFactorInitiated: 'Iniciando configuração da autenticação de dois fatores...',
      twoFactorEnabled: 'Autenticação de dois fatores ativada com sucesso!',
      sessionTerminating: 'Encerrando...',
      sessionTerminated: (device) => `Sessão do ${device} encerrada com sucesso.`,
      formError: 'Erro ao salvar configurações. Tente novamente.',
      accountDeactivated: 'Sua conta foi desativada com sucesso.',
      accountDeleting: 'Sua conta está sendo excluída...',
      accountDeleted: 'Conta excluída permanentemente.',
      confirm2fa: 'Autenticação de dois fatores ativada com sucesso!',
      twoFactorInfo: 'Iniciando configuração da autenticação de dois fatores...',
      languagePreferences: (lang) => `Preferências de idioma salvas: ${lang}`
    },
    'en-US': {
      settingsSaved: 'Settings saved successfully!',
      requiredFields: 'Please fill in all required fields.',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 8 characters long',
      imageNotValid: 'Please select a valid image file.',
      imageTooBig: 'Image must be less than 5MB.',
      imageLoaded: 'Image loaded successfully! Click "Apply Avatar" to save.',
      avatarReset: 'Avatar reset to default image.',
      avatarRemoved: 'Avatar removed. A default image will be displayed.',
      avatarPresetSelected: 'Preset avatar selected! Click "Apply Avatar" to save.',
      selectAvatar: 'Please select an avatar to upload or choose a preset.',
      avatarUpdated: 'Avatar updated successfully!',
      avatarError: 'Error updating avatar. Please try again.',
      favoriteAdded: (type) => {
        const types = { 'movie': 'Movie', 'series': 'Series', 'director': 'Director' };
        return `${types[type]} added to favorites!`;
      },
      twoFactorInitiated: 'Starting two-factor authentication setup...',
      twoFactorEnabled: 'Two-factor authentication enabled successfully!',
      sessionTerminating: 'Terminating...',
      sessionTerminated: (device) => `Session for ${device} terminated successfully.`,
      formError: 'Error saving settings. Please try again.',
      accountDeactivated: 'Your account has been deactivated successfully.',
      accountDeleting: 'Your account is being deleted...',
      accountDeleted: 'Account permanently deleted.',
      confirm2fa: 'Two-factor authentication enabled successfully!',
      twoFactorInfo: 'Starting two-factor authentication setup...',
      languagePreferences: (lang) => `Language preferences saved: ${lang}`
    }
  };

  // ===== FUNÇÃO PARA OBTER MENSAGENS =====
  const getMessage = (key, ...args) => {
    const messages = notifications[currentLanguage] || notifications['en-US'];
    const message = messages[key];
    
    if (typeof message === 'function') {
      return message(...args);
    }
    return message || key;
  };

  // ===== INICIALIZAÇÃO =====
  initNavigation();
  initForms();
  initAvatarUpload();
  initModals();
  initFavoriteItems();
  initTwoFactorAuth();
  initSessions();
  loadUserData();
  updateCharacterCount();

  // Mostrar a seção ativa inicialmente
  showSection(currentSection);

  // ===== NAVEGAÇÃO =====
  function initNavigation() {
    console.log('📋 Inicializando navegação...');
    const navItems = document.querySelectorAll('.nav-item');
    console.log('🔍 Encontrados', navItems.length, 'nav-items');

    navItems.forEach((item, index) => {
      console.log(`  [${index}] nav-item com data-section="${item.getAttribute('data-section')}"`);
      item.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('✅ Click detectado em nav-item');

        const section = this.getAttribute('data-section');
        console.log('📍 Seção selecionada:', section, 'Seção atual:', currentSection);
        
        if (section && section !== currentSection) {
          // Atualizar navegação
          navItems.forEach(nav => nav.classList.remove('active'));
          this.classList.add('active');

          // Mostrar seção
          showSection(section);
          currentSection = section;
          console.log('✨ Seção alterada para:', section);
        }
      });
    });
  }

  function showSection(sectionId) {
    console.log('🎯 Mostrando seção:', sectionId);
    
    // Esconder todas as seções
    const sections = document.querySelectorAll('.content-section');
    console.log('📦 Total de seções encontradas:', sections.length);
    
    sections.forEach(section => {
      console.log(`  Removendo .active de #${section.id}`);
      section.classList.remove('active');
    });

    // Mostrar a seção selecionada
    const targetSection = document.getElementById(`${sectionId}-section`);
    console.log(`🔎 Procurando #${sectionId}-section:`, targetSection ? 'Encontrado!' : 'NÃO ENCONTRADO');
    
    if (targetSection) {
      console.log(`✅ Adicionando .active a #${sectionId}-section`);
      targetSection.classList.add('active');
    } else {
      console.error(`❌ Seção #${sectionId}-section não encontrada!`);
    }
  }

  // ===== FORMULÁRIOS =====
  function initForms() {
    // Configurar todos os formulários
    const forms = document.querySelectorAll('.settings-form');
    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
      form.addEventListener('reset', handleFormReset);
    });

    // Configurar inputs especiais
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      input.addEventListener('input', updateRangeValue);
      // Definir valor inicial
      updateRangeValue({ target: input });
    });

    // Configurar contador de caracteres da bio
    const bioTextarea = document.getElementById('bio');
    if (bioTextarea) {
      bioTextarea.addEventListener('input', updateCharacterCount);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formId = form.id;
    const formData = new FormData(form);

    // Validação básica
    if (!validateForm(form)) {
      showNotification(getMessage('requiredFields'), 'error');
      return;
    }

    // Validações específicas por formulário
    if (formId === 'password-form' && !validatePasswordForm()) {
      return;
    }

    // Simular envio (substituir por API real)
    simulateFormSubmit(form)
      .then(() => {
        showNotification(getMessage('settingsSaved'), 'success');
        // Atualizar UI conforme necessário
        updateUIAfterSave(formId);
      })
      .catch(error => {
        showNotification(getMessage('formError'), 'error');
        console.error('Form submission error:', error);
      });
  }

  function handleFormReset(e) {
    const form = e.target;
    const confirmReset = confirm('Tem certeza que deseja descartar todas as alterações?');

    if (!confirmReset) {
      e.preventDefault();
    } else {
      // Recarregar dados do usuário após reset
      setTimeout(() => loadUserData(), 100);
    }
  }

  function validateForm(form) {
    let isValid = true;
    const requiredInputs = form.querySelectorAll('[required]');

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        highlightError(input);
      } else {
        clearError(input);
      }
    });

    return isValid;
  }

  function validatePasswordForm() {
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    let isValid = true;

    // Verificar se as senhas coincidem
    if (newPassword.value !== confirmPassword.value) {
      isValid = false;
      highlightError(confirmPassword, getMessage('passwordMismatch'));
    } else {
      clearError(confirmPassword);
    }

    // Verificar força da senha
    if (newPassword.value.length > 0 && newPassword.value.length < 8) {
      isValid = false;
      highlightError(newPassword, getMessage('passwordTooShort'));
    }

    return isValid;
  }

  function highlightError(input, message = 'Este campo é obrigatório') {
    input.classList.add('error');

    // Adicionar mensagem de erro se não existir
    let errorMsg = input.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
      errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = message;
      input.parentNode.insertBefore(errorMsg, input.nextSibling);
    } else {
      errorMsg.textContent = message;
    }
  }

  function clearError(input) {
    input.classList.remove('error');

    // Remover mensagem de erro se existir
    const errorMsg = input.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('error-message')) {
      errorMsg.remove();
    }
  }

  function simulateFormSubmit(form) {
    const formId = form.id;

    return new Promise((resolve, reject) => {
      // Simular delay de rede
      setTimeout(() => {
        // Simular sucesso (90% das vezes)
        if (Math.random() > 0.1) {
          // Processamentos específicos por formulário
          if (formId === 'avatar-form' && (avatarFile || selectedPresetAvatar)) {
            processAvatarUpload();
          }

          resolve({ success: true, form: formId });
        } else {
          reject(new Error('Falha na rede'));
        }
      }, 1000);
    });
  }

  function updateUIAfterSave(formId) {
    // Atualizações específicas para cada formulário
    switch (formId) {
      case 'profile-form':
        // Atualizar dados do usuário na UI
        const usernameElement = document.getElementById('username');
        const displayNameElement = document.getElementById('displayname');
        if (usernameElement && displayNameElement) {
          const username = usernameElement.value;
          const displayName = displayNameElement.value;
          updateProfileInfo(username, displayName);
        }
        break;

      case 'password-form':
        // Limpar campos de senha
        const currentPasswordElement = document.getElementById('current-password');
        const newPasswordElement = document.getElementById('new-password');
        const confirmPasswordElement = document.getElementById('confirm-password');
        
        if (currentPasswordElement) currentPasswordElement.value = '';
        if (newPasswordElement) newPasswordElement.value = '';
        if (confirmPasswordElement) confirmPasswordElement.value = '';
        break;

      case 'avatar-form':
        // Resetar estados do avatar
        avatarFile = null;
        selectedPresetAvatar = null;
        break;

      case 'language-form':
        // Aplicar preferências de idioma
        applyLanguagePreferences();
        break;
    }
  }

  // Adicione esta função melhorada ao seu settings.js

  function updateProfileInfo(username, displayName) {
    console.log('🔄 Atualizando perfil na UI...', { username, displayName });

    // ===== ATUALIZAR ELEMENTOS GERAIS =====
    const usernameElements = document.querySelectorAll('.username');
    const displayNameElements = document.querySelectorAll('.display-name');

    usernameElements.forEach(el => {
      el.textContent = displayName || username;
    });

    displayNameElements.forEach(el => {
      el.textContent = displayName;
    });

    // ===== ATUALIZAR HEADER - DROPDOWN DO USUÁRIO =====

    // 1. Username no botão principal do header (aparece quando dropdown fechado)
    const headerUsername = document.querySelector('.user-btn .username');
    if (headerUsername) {
      headerUsername.textContent = displayName || username;
      console.log('✅ Header username atualizado');
    }

    // 2. Nome completo dentro do dropdown (user-details h3)
    const dropdownUsername = document.querySelector('.user-details h3');
    if (dropdownUsername) {
      dropdownUsername.textContent = displayName || username;
      console.log('✅ Dropdown username (h3) atualizado');
    }

    // 3. @handle dentro do dropdown (primeiro <p> do user-details)
    const dropdownHandle = document.querySelector('.user-details p:first-of-type');
    if (dropdownHandle) {
      dropdownHandle.textContent = `@${username}`;
      console.log('✅ Dropdown @handle atualizado');
    }

    // ===== ATUALIZAR MOBILE MENU =====

    // 4. Username no mobile menu
    const mobileUsername = document.querySelector('.mobile-user-details h3');
    if (mobileUsername) {
      mobileUsername.textContent = displayName || username;
      console.log('✅ Mobile menu username atualizado');
    }

    // 5. Email no mobile menu (se necessário)
    const mobileEmail = document.querySelector('.mobile-user-details p');
    const emailInput = document.getElementById('email');
    if (mobileEmail && emailInput) {
      mobileEmail.textContent = emailInput.value;
      console.log('✅ Mobile menu email atualizado');
    }

    // ===== ATUALIZAR EMAIL NO HEADER =====

    // 6. Email no botão do header
    const headerEmail = document.querySelector('.user-btn .user-email');
    if (headerEmail && emailInput) {
      headerEmail.textContent = emailInput.value;
      console.log('✅ Header email atualizado');
    }

    // 7. Email dentro do dropdown
    const dropdownEmail = document.querySelector('.user-details .user-email');
    if (dropdownEmail && emailInput) {
      dropdownEmail.textContent = emailInput.value;
      console.log('✅ Dropdown email atualizado');
    }

    // console.log('✅ Perfil completamente atualizado em toda a interface!');
  }

  function applyLanguagePreferences() {
    const interfaceLangElement = document.getElementById('interface-language');
    const dateFormatElement = document.getElementById('date-format');
    
    if (!interfaceLangElement || !dateFormatElement) {
      console.warn('⚠️ Elementos de preferências de idioma não encontrados');
      return;
    }
    
    const interfaceLang = interfaceLangElement.value;
    const dateFormat = dateFormatElement.value;

    showNotification(getMessage('languagePreferences', interfaceLang), 'success');

    // Aqui você aplicaria as mudanças de idioma e formato na interface
    // Isso seria implementado com uma biblioteca de i18n em um projeto real
  }

  function updateRangeValue(e) {
    const input = e.target;
    const valueDisplay = input.nextElementSibling;

    if (valueDisplay && valueDisplay.classList.contains('range-value')) {
      valueDisplay.textContent = input.value;
    }
  }

  function updateCharacterCount() {
    const bioTextarea = document.getElementById('bio');
    const charCount = document.getElementById('bio-chars');

    if (bioTextarea && charCount) {
      const count = bioTextarea.value.length;
      charCount.textContent = count;

      // Alerta se estiver perto do limite
      if (count > 450) {
        charCount.style.color = '#e74c3c';
      } else {
        charCount.style.color = 'rgba(255, 255, 255, 0.6)';
      }
    }
  }

  // ===== AVATAR =====
  function initAvatarUpload() {
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const resetAvatarBtn = document.getElementById('reset-avatar');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    const avatarForm = document.getElementById('avatar-form');

    if (avatarUpload) {
      avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    if (resetAvatarBtn) {
      resetAvatarBtn.addEventListener('click', resetAvatar);
    }

    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener('click', removeAvatar);
    }

    if (avatarForm) {
      avatarForm.addEventListener('submit', handleAvatarSubmit);
    }

    // Configurar avatares pré-definidos
    const presetAvatars = document.querySelectorAll('.preset-avatar');
    presetAvatars.forEach(avatar => {
      avatar.addEventListener('click', selectPresetAvatar);
    });
  }

  function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
      showNotification(getMessage('imageNotValid'), 'error');
      return;
    }

    // Verificar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification(getMessage('imageTooBig'), 'error');
      return;
    }

    avatarFile = file;
    selectedPresetAvatar = null; // Resetar avatar pré-definido se houver

    // Pré-visualizar imagem
    const reader = new FileReader();
    reader.onload = function (e) {
      const avatarPreview = document.getElementById('avatar-preview');
      if (avatarPreview) {
        avatarPreview.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);

    showNotification(getMessage('imageLoaded'), 'success');
  }

  function resetAvatar() {
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUpload = document.getElementById('avatar-upload');

    if (avatarPreview) {
      avatarPreview.src = '../src/img/icon.jpg'; // Avatar padrão
    }

    if (avatarUpload) {
      avatarUpload.value = '';
    }

    avatarFile = null;
    selectedPresetAvatar = null;
    showNotification(getMessage('avatarReset'), 'info');
  }

  function removeAvatar() {
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUpload = document.getElementById('avatar-upload');

    if (avatarPreview) {
      avatarPreview.src = '../src/img/avatar-placeholder.jpg'; // Imagem placeholder
    }

    if (avatarUpload) {
      avatarUpload.value = '';
    }

    avatarFile = null;
    selectedPresetAvatar = null;
    showNotification(getMessage('avatarRemoved'), 'info');
  }

  function selectPresetAvatar() {
    const avatarId = this.getAttribute('data-avatar');
    const avatarImg = this.querySelector('img');
    if (!avatarImg) return;

    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
      avatarPreview.src = avatarImg.src;
    }

    avatarFile = null; // Reset do arquivo
    selectedPresetAvatar = avatarId;
    showNotification(getMessage('avatarPresetSelected'), 'success');
  }

  function handleAvatarSubmit(e) {
    e.preventDefault();

    if (!avatarFile && !selectedPresetAvatar) {
      showNotification(getMessage('selectAvatar'), 'error');
      return;
    }

    // Simular upload do avatar
    const form = e.target;
    simulateFormSubmit(form)
      .then(() => {
        showNotification(getMessage('avatarUpdated'), 'success');
      })
      .catch(error => {
        showNotification(getMessage('avatarError'), 'error');
      });
  }

  function processAvatarUpload() {
    // Em uma aplicação real, aqui enviaríamos o arquivo para o servidor
    console.log('Processando upload do avatar...');

    if (avatarFile) {
      console.log('Upload de arquivo:', avatarFile.name);
    } else if (selectedPresetAvatar) {
      console.log('Avatar pré-definido selecionado:', selectedPresetAvatar);
    }
  }

  // ===== FAVORITOS =====
  function initFavoriteItems() {
    const favoriteButtons = document.querySelectorAll('.add-favorite');
    favoriteButtons.forEach(button => {
      button.addEventListener('click', addFavoriteItem);
    });
  }

  function addFavoriteItem() {
    const type = this.getAttribute('data-type');
    let title = '';

    switch (type) {
      case 'movie':
        title = prompt(currentLanguage === 'pt-BR' ? 'Digite o nome do filme favorito:' : 'Enter your favorite movie name:');
        break;
      case 'series':
        title = prompt(currentLanguage === 'pt-BR' ? 'Digite o nome da série favorita:' : 'Enter your favorite series name:');
        break;
      case 'director':
        title = prompt(currentLanguage === 'pt-BR' ? 'Digite o nome do diretor favorito:' : 'Enter your favorite director name:');
        break;
    }

    if (title && title.trim() !== '') {
      favoriteItems.push({
        type: type,
        title: title.trim(),
        id: Date.now() // ID único
      });

      updateFavoritesDisplay();
      showNotification(getMessage('favoriteAdded', type), 'success');
    }
  }

  function updateFavoritesDisplay() {
    // Esta função atualizaria a exibição dos favoritos
    // Em uma aplicação real, você criaria elementos para cada favorito
    console.log('Favoritos atualizados:', favoriteItems);
  }

  // ===== AUTENTICAÇÃO DE DOIS FATORES =====
  function initTwoFactorAuth() {
    const enable2faBtn = document.getElementById('enable-2fa');
    if (enable2faBtn) {
      enable2faBtn.addEventListener('click', enableTwoFactorAuth);
    }
  }

  function enableTwoFactorAuth() {
    showNotification(getMessage('twoFactorInfo'), 'info');

    // Simular processo de configuração
    setTimeout(() => {
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.two-factor-status span');
      const enableBtn = document.getElementById('enable-2fa');

      if (statusIndicator && statusText && enableBtn) {
        statusIndicator.classList.remove('inactive');
        statusIndicator.classList.add('active');
        statusText.textContent = currentLanguage === 'pt-BR' ? 'Autenticação de dois fatores ativada' : 'Two-factor authentication enabled';
        enableBtn.textContent = currentLanguage === 'pt-BR' ? 'Gerenciar autenticação de dois fatores' : 'Manage two-factor authentication';

        showNotification(getMessage('twoFactorEnabled'), 'success');
      }
    }, 2000);
  }

  // ===== SESSÕES =====
  function initSessions() {
    const terminateButtons = document.querySelectorAll('.session-terminate');
    terminateButtons.forEach(button => {
      button.addEventListener('click', terminateSession);
    });
  }

  function terminateSession() {
    const sessionItem = this.closest('.session-item');
    const deviceName = sessionItem.querySelector('h4').textContent;

    if (confirm(currentLanguage === 'pt-BR' ? `Tem certeza que deseja encerrar a sessão do ${deviceName}?` : `Are you sure you want to terminate the session for ${deviceName}?`)) {
      // Simular encerramento de sessão
      sessionItem.style.opacity = '0.5';
      this.textContent = getMessage('sessionTerminating');
      this.disabled = true;

      setTimeout(() => {
        sessionItem.remove();
        showNotification(getMessage('sessionTerminated', deviceName), 'success');
      }, 1500);
    }
  }

  // ===== MODAIS =====
  function initModals() {
    const modal = document.getElementById('confirmation-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.getElementById('modal-cancel');

    // Fechar modal
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    if (modalCancel) {
      modalCancel.addEventListener('click', closeModal);
    }

    // Confirmar ação no modal
    const modalConfirm = document.getElementById('modal-confirm');
    if (modalConfirm) {
      modalConfirm.addEventListener('click', handleModalConfirm);
    }
  }

  function openModal(action) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');

    if (!modal || !modalTitle || !modalMessage) return;

    // Configurar mensagem baseada na ação
    if (currentLanguage === 'pt-BR') {
      switch (action) {
        case 'deactivate':
          modalTitle.textContent = 'Desativar Conta';
          modalMessage.textContent = 'Tem certeza que deseja desativar sua conta? Você poderá reativá-la fazendo login novamente.';
          modalConfirm.textContent = 'Desativar';
          break;
        case 'delete':
          modalTitle.textContent = 'Excluir Conta Permanentemente';
          modalMessage.textContent = 'Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita e todos os seus dados serão perdidos.';
          modalConfirm.textContent = 'Excluir';
          break;
        default:
          modalTitle.textContent = 'Confirmar Ação';
          modalMessage.textContent = 'Tem certeza que deseja realizar esta ação?';
          modalConfirm.textContent = 'Confirmar';
      }
    } else {
      switch (action) {
        case 'deactivate':
          modalTitle.textContent = 'Deactivate Account';
          modalMessage.textContent = 'Are you sure you want to deactivate your account? You can reactivate it by logging in again.';
          modalConfirm.textContent = 'Deactivate';
          break;
        case 'delete':
          modalTitle.textContent = 'Delete Account Permanently';
          modalMessage.textContent = 'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.';
          modalConfirm.textContent = 'Delete';
          break;
        default:
          modalTitle.textContent = 'Confirm Action';
          modalMessage.textContent = 'Are you sure you want to perform this action?';
          modalConfirm.textContent = 'Confirm';
      }
    }

    // Armazenar ação atual
    modal.setAttribute('data-action', action);

    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restaurar scroll
    }
  }

  function handleModalConfirm() {
    const modal = document.getElementById('confirmation-modal');
    const action = modal.getAttribute('data-action');

    closeModal();

    // Executar ação baseada no tipo
    switch (action) {
      case 'deactivate':
        deactivateAccount();
        break;

      case 'delete':
        deleteAccount();
        break;
    }
  }

  function deactivateAccount() {
    // Simular desativação de conta
    showNotification(getMessage('accountDeactivated'), 'success');

    // Redirecionar após um delay
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 2000);
  }

  function deleteAccount() {
    // Simular exclusão de conta (em um caso real, isso faria uma requisição à API)
    showNotification(getMessage('accountDeleting'), 'info');

    // Simular processo de exclusão
    setTimeout(() => {
      showNotification(getMessage('accountDeleted'), 'success');

      // Redirecionar para a página inicial
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1500);
    }, 3000);
  }

  // ===== NOTIFICAÇÕES =====
  function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="notification-icon ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    // Estilos da notificação
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1001';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = '#fff';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    notification.style.animation = 'slideIn 0.3s ease';

    // Cores baseadas no tipo
    switch (type) {
      case 'success':
        notification.style.background = '#27ae60';
        break;
      case 'error':
        notification.style.background = '#e74c3c';
        break;
      case 'warning':
        notification.style.background = '#f39c12';
        break;
      default:
        notification.style.background = '#3498db';
    }

    document.body.appendChild(notification);

    // Remover após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  }

  // ===== CARREGAMENTO DE DADOS =====
  function loadUserData() {
    // Os dados do usuário são carregados do React/AuthContext
    // Este script apenas preenche os formulários com os dados já disponíveis no HTML

    // Preencher formulário de perfil a partir dos inputs existentes
    const usernameInput = document.getElementById('username');
    const displaynameInput = document.getElementById('displayname');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');

    // Obter valores dos inputs (que já foram preenchidos pelo React)
    const userData = {
      username: usernameInput?.value || '',
      displayName: displaynameInput?.value || '',
      email: emailInput?.value || '',
      bio: bioInput?.value || '',
      avatar: document.getElementById('avatar-preview')?.src || '../src/img/icon.jpg',
      language: 'pt-BR',
      contentLanguage: 'pt-BR',
      subtitleLanguage: 'pt-BR'
    };

    console.log('📋 Dados do usuário carregados:', userData);

    // Preencher preferências de idioma
    const interfaceLangInput = document.getElementById('interface-language');
    const contentLangInput = document.getElementById('content-language');
    const subtitleLangInput = document.getElementById('subtitle-language');

    if (interfaceLangInput) interfaceLangInput.value = userData.language;
    if (contentLangInput) contentLangInput.value = userData.contentLanguage;
    if (subtitleLangInput) subtitleLangInput.value = userData.subtitleLanguage;

    // Atualizar avatar
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
      avatarPreview.src = userData.avatar;
    }

    // Atualizar contador de caracteres
    updateCharacterCount();

    // Atualizar informações do usuário na UI
    if (userData.username) {
      updateProfileInfo(userData.username, userData.displayName);
    }
  }

  // Adicionar estilos de animação para notificações
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-icon {
      margin-right: 10px;
    }
    
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .status-indicator.active {
      background-color: #27ae60;
    }
    
    .status-indicator.inactive {
      background-color: #e74c3c;
    }
  `;
  document.head.appendChild(style);

  console.log('✅ Settings inicializado com sucesso!');
};

// ❌ DESATIVADO - O React agora gerencia as configurações
// O script legado não deve auto-executar pois causa conflito com React
// Se já estiver carregado, executa imediatamente
// if (document.readyState === 'complete' || document.readyState === 'interactive') {
//   window.initSettings();
// } else {
//   document.addEventListener('DOMContentLoaded', window.initSettings);
// }