// Конфигурация - ЗДЕСЬ НУЖНО УКАЗАТЬ ССЫЛКУ НА САЙТ И ТОКЕН БОТА
const CONFIG = {
    // ЗАМЕНИТЕ НА ВАШУ ССЫЛКУ НА САЙТ
    SITE_URL: 'https://morygrey.github.io/driver/',
    // Имя бота (без @)
    BOT_USERNAME: 'genichesk_keratinbot'
};

// Состояние приложения
let appState = {
    selectedTariff: 'econom',
    selectedPayment: 'cash',
    userData: null,
    isRegistered: false
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkUserRegistration();
    setupPWA();
});

function initializeApp() {
    // Загружаем сохраненные данные пользователя
    const savedUserData = localStorage.getItem('prestigeUserData');
    if (savedUserData) {
        appState.userData = JSON.parse(savedUserData);
        appState.isRegistered = true;
        updateProfilePage();
    }
}

function setupEventListeners() {
    // Кнопки тарифов
    document.querySelectorAll('.tariff-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectTariff(this.dataset.tariff);
        });
    });

    // Кнопки способов оплаты
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPayment(this.dataset.payment);
        });
    });

    // Основные кнопки
    document.getElementById('registerBtn').addEventListener('click', handleRegistration);
    document.getElementById('profileBtn').addEventListener('click', showProfilePage);
    document.getElementById('confirmBtn').addEventListener('click', confirmOrder);
    document.getElementById('backToMain').addEventListener('click', showMainPage);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('editProfileBtn').addEventListener('click', editProfile);
    document.getElementById('supportBtn').addEventListener('click', openSupport);
    document.getElementById('paymentMethodsBtn').addEventListener('click', showPaymentMethods);
    document.getElementById('historyBtn').addEventListener('click', showHistory);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
}

function selectTariff(tariff) {
    appState.selectedTariff = tariff;
    
    // Обновляем UI
    document.querySelectorAll('.tariff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tariff="${tariff}"]`).classList.add('active');
    
    // Обновляем текст кнопки подтверждения
    const tariffNames = {
        'econom': 'ЭКОНОМ',
        'student': 'СТУДЕНТ', 
        'family': 'С ДЕТЬМИ',
        'business': 'БИЗНЕС'
    };
    
    document.getElementById('confirmBtn').textContent = `ПОДТВЕРДИТЬ ${tariffNames[tariff]}`;
}

function selectPayment(payment) {
    appState.selectedPayment = payment;
    
    // Обновляем UI
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-payment="${payment}"]`).classList.add('active');
}

function handleRegistration() {
    if (appState.isRegistered) {
        // Если пользователь уже зарегистрирован, переходим на страницу заказов такси
        showMainPage();
        return;
    }
    
    // Создаем ссылку для регистрации в Telegram боте
    const registrationUrl = `https://t.me/${CONFIG.BOT_USERNAME}?start=register`;
    
    // Открываем бота в Telegram
    window.open(registrationUrl, '_blank');
    
    // Показываем инструкцию
    showRegistrationInstructions();
}

function showRegistrationInstructions() {
    const instructions = `
        <div style="background: #2d2d2d; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h3 style="color: #4CAF50; margin-bottom: 15px;">📱 Инструкция по регистрации</h3>
            <p style="color: #fff; margin-bottom: 10px;">1. Откройте Telegram бота</p>
            <p style="color: #fff; margin-bottom: 10px;">2. Введите ваше имя</p>
            <p style="color: #fff; margin-bottom: 15px;">3. Введите номер телефона</p>
            <p style="color: #4CAF50; font-weight: bold;">После регистрации вернитесь на этот сайт!</p>
            <button onclick="checkRegistration()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 10px; cursor: pointer;">
                Проверить регистрацию
            </button>
        </div>
    `;
    
    // Добавляем инструкции на страницу
    const content = document.querySelector('.content');
    const existingInstructions = content.querySelector('.registration-instructions');
    if (existingInstructions) {
        existingInstructions.remove();
    }
    
    const instructionsDiv = document.createElement('div');
    instructionsDiv.className = 'registration-instructions';
    instructionsDiv.innerHTML = instructions;
    content.appendChild(instructionsDiv);
}

function checkRegistration() {
    // Проверяем URL на наличие параметров регистрации
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const phone = urlParams.get('phone');
    
    if (name && phone) {
        // Пользователь зарегистрирован
        appState.userData = { name, phone };
        appState.isRegistered = true;
        
        // Сохраняем данные
        localStorage.setItem('prestigeUserData', JSON.stringify(appState.userData));
        
        // Обновляем URL без параметров
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Показываем страницу заказов такси (как Uber)
        showMainPage();
        
        // Убираем инструкции
        const instructions = document.querySelector('.registration-instructions');
        if (instructions) {
            instructions.remove();
        }
        
        showNotification('Регистрация успешна! Добро пожаловать в ТАКСИ ПРЕСТИЖ!', 'success');
    } else {
        showNotification('Регистрация не найдена. Попробуйте еще раз.', 'error');
    }
}

function checkUserRegistration() {
    // Проверяем URL при загрузке страницы
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const phone = urlParams.get('phone');
    
    if (name && phone) {
        checkRegistration();
    } else if (appState.isRegistered) {
        // Если пользователь уже зарегистрирован, показываем страницу заказов такси
        showMainPage();
    }
}

function showProfilePage() {
    document.getElementById('welcomePage').classList.remove('active');
    document.getElementById('mainPage').classList.remove('active');
    document.getElementById('profilePage').classList.add('active');
    updateProfilePage();
}

function showMainPage() {
    document.getElementById('welcomePage').classList.remove('active');
    document.getElementById('profilePage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
}

function showWelcomePage() {
    document.getElementById('mainPage').classList.remove('active');
    document.getElementById('profilePage').classList.remove('active');
    document.getElementById('welcomePage').classList.add('active');
}

function updateProfilePage() {
    if (appState.userData) {
        document.getElementById('userName').textContent = appState.userData.name;
        document.getElementById('userPhone').textContent = appState.userData.phone;
        
        // Обновляем инициалы
        const initials = appState.userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('userInitials').textContent = initials;
        
        // Обновляем статистику (можно добавить реальные данные)
        updateUserStats();
    }
}

function updateUserStats() {
    // Здесь можно добавить реальную статистику пользователя
    const totalRides = localStorage.getItem('totalRides') || '0';
    const totalSpent = localStorage.getItem('totalSpent') || '0';
    
    document.getElementById('totalRides').textContent = totalRides;
    document.getElementById('totalSpent').textContent = totalSpent + '₽';
    
    // Обновляем прогресс лояльности
    const rides = parseInt(totalRides);
    const progress = (rides % 10) * 10;
    document.getElementById('loyaltyProgress').style.width = progress + '%';
    document.getElementById('loyaltyText').textContent = `${rides % 10}/10 поездок`;
}

function confirmOrder() {
    if (!appState.isRegistered) {
        showNotification('Сначала зарегистрируйтесь!', 'error');
        return;
    }
    
    const fromLocation = document.getElementById('fromLocation').value;
    const toLocation = document.getElementById('toLocation').value;
    
    if (!fromLocation || !toLocation) {
        showNotification('Укажите адреса отправления и назначения', 'error');
        return;
    }
    
    // Показываем модальное окно подтверждения
    document.getElementById('orderModal').style.display = 'block';
    
    // Обновляем статистику пользователя
    updateRideStats();
    
    // Здесь можно добавить отправку заказа на сервер
    console.log('Заказ создан:', {
        from: fromLocation,
        to: toLocation,
        tariff: appState.selectedTariff,
        payment: appState.selectedPayment,
        user: appState.userData
    });
}

function updateRideStats() {
    // Увеличиваем количество поездок
    const currentRides = parseInt(localStorage.getItem('totalRides') || '0');
    const newRides = currentRides + 1;
    localStorage.setItem('totalRides', newRides.toString());
    
    // Добавляем стоимость поездки (примерная)
    const tariffPrices = {
        'econom': 150,
        'student': 100,
        'family': 200,
        'business': 225
    };
    
    const ridePrice = tariffPrices[appState.selectedTariff] || 150;
    const currentSpent = parseInt(localStorage.getItem('totalSpent') || '0');
    const newSpent = currentSpent + ridePrice;
    localStorage.setItem('totalSpent', newSpent.toString());
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function editProfile() {
    const newName = prompt('Введите новое имя:', appState.userData.name);
    if (newName && newName.trim()) {
        appState.userData.name = newName.trim();
        localStorage.setItem('prestigeUserData', JSON.stringify(appState.userData));
        updateProfilePage();
        showNotification('Профиль обновлен!', 'success');
    }
}

function openSupport() {
    // Открываем поддержку в Telegram
    const supportUrl = `https://t.me/${CONFIG.BOT_USERNAME}?start=support`;
    window.open(supportUrl, '_blank');
}

function saveProfile() {
    showNotification('Изменения сохранены!', 'success');
}

function showPaymentMethods() {
    showNotification('Раздел "Способы оплаты" в разработке', 'info');
}

function showHistory() {
    showNotification('Раздел "История поездок" в разработке', 'info');
}

function showSettings() {
    showNotification('Раздел "Настройки" в разработке', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// PWA функциональность
function setupPWA() {
    // Регистрируем Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
    
    // Обработка установки PWA
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    function showInstallPrompt() {
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <p>Установить приложение ПРЕСТИЖ?</p>
            <button onclick="installApp()">Установить</button>
            <button onclick="this.parentElement.remove()">Позже</button>
        `;
        installPrompt.style.display = 'block';
        document.body.appendChild(installPrompt);
    }
    
    window.installApp = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Пользователь установил приложение');
                }
                deferredPrompt = null;
            });
        }
    };
}

// Глобальные функции для вызова из HTML
window.checkRegistration = checkRegistration;
window.installApp = function() {
    // Функция будет определена в setupPWA
};
