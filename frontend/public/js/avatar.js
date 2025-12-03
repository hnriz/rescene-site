// ✅ Envolva todo o código em uma função global
window.initAvatarUpload = function() {
    console.log('🎬 Inicializando Avatar Upload...');
    
    const avatarInput = document.getElementById('avatarInput');
    const newAvatar = document.getElementById('newAvatar');
    
    // Verificar se elementos existem
    if (!avatarInput || !newAvatar) {
        console.error('❌ Elementos de avatar não encontrados!');
        console.log('avatarInput:', avatarInput);
        console.log('newAvatar:', newAvatar);
        return;
    }

    function triggerFileInput() {
        avatarInput.value = ""; // limpa o valor anterior pra garantir que o evento dispare sempre
        avatarInput.click();
    }

    newAvatar.onclick = triggerFileInput;

    avatarInput.addEventListener('change', function () {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                newAvatar.style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    console.log('✅ Avatar Upload inicializado com sucesso!');
};

// ❌ DESATIVADO - O React agora gerencia os avatares
// O script legado não deve auto-executar pois causa conflito com React
// Se já estiver carregado, executa imediatamente
// if (document.readyState === 'complete' || document.readyState === 'interactive') {
//     window.initAvatarUpload();
// } else {
//     document.addEventListener('DOMContentLoaded', window.initAvatarUpload);
// }