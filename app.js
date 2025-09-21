// Telegram WebApp API
let tg = window.Telegram.WebApp;

// Инициализация Telegram WebApp
tg.ready();
tg.expand();

// Получение данных пользователя из URL параметров
function getUserDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        userId: urlParams.get('user_id'),
        name: urlParams.get('name'),
        phone: urlParams.get('phone')
    };
}

// Обновление профиля пользователя
function updateUserProfile() {
    const userData = getUserDataFromURL();
    
    if (userData.name) {
        document.getElementById('profile-name').textContent = userData.name;
    }
    
    if (userData.phone) {
        document.getElementById('profile-phone').textContent = userData.phone;
    }
}

// PWA функциональность
let deferredPrompt;
let isInstalled = false;

// Проверка, установлено ли приложение
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isInstalled = true;
}

// Обработка события beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

// Показ кнопки установки
function showInstallButton() {
    if (!isInstalled && deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.textContent = '📱 Установить приложение';
        installButton.className = 'install-btn';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #000;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        installButton.addEventListener('click', installApp);
        document.body.appendChild(installButton);
    }
}

// Установка приложения
async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Пользователь установил приложение');
            isInstalled = true;
            document.querySelector('.install-btn')?.remove();
        }
        
        deferredPrompt = null;
    }
}

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW зарегистрирован: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW регистрация не удалась: ', registrationError);
            });
    });
}

// Основная логика приложения
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем профиль пользователя
    updateUserProfile();
    
    // Показываем кнопку установки если нужно
    showInstallButton();
    
    // Обработчики событий
    setupEventListeners();
    
    // Инициализация приложения
    initializeApp();
});

function setupEventListeners() {
    // Кнопка профиля
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfile);
    }
    
    // Кнопка возврата из профиля
    const backBtn = document.querySelector('.back-to-main-btn');
    if (backBtn) {
        backBtn.addEventListener('click', hideProfile);
    }
    
    // Кнопка изменения способа оплаты
    const paymentBtn = document.getElementById('payment-btn');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', showPaymentModal);
    }
    
    // Кнопка закрытия модального окна
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hidePaymentModal);
    }
    
    // Выбор способа оплаты
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', selectPaymentMethod);
    });
    
    // Выбор тарифа
    const tariffOptions = document.querySelectorAll('.tariff-option');
    tariffOptions.forEach(option => {
        option.addEventListener('click', selectTariff);
    });
    
    // Кнопка заказа
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', placeOrder);
    }
    
    // Промокод
    const promoBtn = document.getElementById('promo-btn');
    if (promoBtn) {
        promoBtn.addEventListener('click', applyPromoCode);
    }
    
    // Кнопки действий в профиле
    const editProfileBtn = document.getElementById('edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', editProfile);
    }
    
    const supportBtn = document.getElementById('support-btn');
    if (supportBtn) {
        supportBtn.addEventListener('click', openSupport);
    }
    
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
}

function initializeApp() {
    // Устанавливаем начальный тариф
    selectTariff({ target: document.querySelector('.tariff-option.active') });
    
    // Инициализируем Telegram WebApp
    if (tg) {
        tg.MainButton.setText('Заказать такси');
        tg.MainButton.show();
        tg.MainButton.onClick(placeOrder);
    }
}

function showProfile() {
    document.getElementById('profile-page').style.display = 'block';
    document.querySelector('.order-panel').style.display = 'none';
    document.querySelector('.map-container').style.display = 'none';
}

function hideProfile() {
    document.getElementById('profile-page').style.display = 'none';
    document.querySelector('.order-panel').style.display = 'block';
    document.querySelector('.map-container').style.display = 'flex';
}

function showPaymentModal() {
    document.getElementById('payment-modal').classList.add('show');
}

function hidePaymentModal() {
    document.getElementById('payment-modal').classList.remove('show');
}

function selectPaymentMethod(event) {
    const option = event.currentTarget;
    const paymentMethod = option.dataset.payment;
    
    // Убираем выделение с других опций
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Выделяем выбранную опцию
    option.classList.add('selected');
    
    // Обновляем отображение способа оплаты
    const paymentMethodElement = document.getElementById('payment-method');
    if (paymentMethodElement) {
        const methodNames = {
            'cash': 'Наличными',
            'card': 'Перевод',
            'free': 'Бесплатная поездка'
        };
        paymentMethodElement.textContent = methodNames[paymentMethod] || 'Наличными';
    }
    
    // Скрываем модальное окно
    hidePaymentModal();
}

function selectTariff(event) {
    const option = event.currentTarget;
    const tariff = option.dataset.tariff;
    
    // Убираем активный класс с других тарифов
    document.querySelectorAll('.tariff-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранному тарифу
    option.classList.add('active');
    
    // Обновляем кнопку заказа
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        const tariffNames = {
            'econom': 'ПОДТВЕРДИТЬ ЭКОНОМ',
            'student': 'ПОДТВЕРДИТЬ СТУДЕНТ',
            'kids': 'ПОДТВЕРДИТЬ С ДЕТЬМИ',
            'business': 'ПОДТВЕРДИТЬ БИЗНЕС'
        };
        orderBtn.textContent = tariffNames[tariff] || 'ПОДТВЕРДИТЬ ЗАКАЗ';
    }
}

function placeOrder() {
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');
    const activeTariff = document.querySelector('.tariff-option.active');
    const paymentMethod = document.getElementById('payment-method').textContent;
    
    if (!fromInput.value.trim() || !toInput.value.trim()) {
        alert('Пожалуйста, укажите адреса отправления и назначения');
        return;
    }
    
    // Показываем экран успеха
    document.getElementById('success-overlay').style.display = 'flex';
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        document.getElementById('success-overlay').style.display = 'none';
    }, 3000);
    
    // Отправляем данные в Telegram (если нужно)
    if (tg) {
        const orderData = {
            from: fromInput.value,
            to: toInput.value,
            tariff: activeTariff.dataset.tariff,
            payment: paymentMethod,
            user: getUserDataFromURL()
        };
        
        tg.sendData(JSON.stringify(orderData));
    }
}

function applyPromoCode() {
    const promoInput = document.getElementById('promo-input');
    const promoCode = promoInput.value.trim();
    
    if (!promoCode) {
        alert('Введите промокод');
        return;
    }
    
    // Проверяем промокод
    if (promoCode.toLowerCase() === 'welcome' || promoCode.toLowerCase() === 'привет') {
        // Показываем бесплатную поездку
        document.getElementById('free-option').style.display = 'block';
        alert('Промокод применен! Доступна бесплатная поездка!');
    } else {
        alert('Неверный промокод');
    }
    
    promoInput.value = '';
}

function editProfile() {
    const nameElement = document.getElementById('profile-name');
    const phoneElement = document.getElementById('profile-phone');
    
    // Делаем поля редактируемыми
    nameElement.contentEditable = true;
    phoneElement.contentEditable = true;
    
    nameElement.style.border = '1px solid #333';
    phoneElement.style.border = '1px solid #333';
    phoneElement.style.padding = '4px 8px';
    nameElement.style.padding = '4px 8px';
}

function saveProfile() {
    const nameElement = document.getElementById('profile-name');
    const phoneElement = document.getElementById('profile-phone');
    
    // Убираем редактирование
    nameElement.contentEditable = false;
    phoneElement.contentEditable = false;
    
    nameElement.style.border = 'none';
    phoneElement.style.border = 'none';
    phoneElement.style.padding = '0';
    nameElement.style.padding = '0';
    
    alert('Профиль сохранен!');
}

function openSupport() {
    if (tg) {
        tg.openTelegramLink('https://t.me/your_support_bot');
    } else {
        alert('Обратитесь в поддержку: @your_support_bot');
    }
}

// Обработка изменения размера экрана
window.addEventListener('resize', function() {
    // Адаптация под разные размеры экрана
    if (window.innerWidth < 768) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});

// Инициализация при загрузке
if (window.innerWidth < 768) {
    document.body.classList.add('mobile');
}
