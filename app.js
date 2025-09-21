// Проверяем, открыто ли приложение в Telegram WebApp
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// Получение данных пользователя из URL параметров или localStorage
function getUserDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Сначала проверяем URL параметры
    let userData = {
        userId: urlParams.get('user_id'),
        name: urlParams.get('name'),
        phone: urlParams.get('phone'),
        orderId: urlParams.get('order_id')
    };
    
    // Если данные есть в URL, сохраняем их в localStorage
    if (userData.userId && userData.name && userData.phone) {
        const dataToSave = {
            userId: userData.userId,
            name: decodeURIComponent(userData.name),
            phone: decodeURIComponent(userData.phone)
        };
        localStorage.setItem('userData', JSON.stringify(dataToSave));
        console.log('✅ Данные из URL сохранены в localStorage:', dataToSave);
        
        // Обновляем userData с декодированными значениями
        userData.name = dataToSave.name;
        userData.phone = dataToSave.phone;
    }
    // Если в URL нет данных, проверяем localStorage
    else if (!userData.userId) {
        try {
            const savedData = localStorage.getItem('userData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                userData = { ...userData, ...parsedData };
                console.log('✅ Данные пользователя загружены из localStorage:', userData);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных из localStorage:', error);
            localStorage.removeItem('userData');
        }
    }
    
    return userData;
}

// Состояния заказов
const OrderStates = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Текущий заказ
let currentOrder = null;
let orderCheckInterval = null;

// API URL - настройте под ваш сервер
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://your-api-domain.com'; // Замените на ваш API домен

// Push уведомления
let notificationPermission = 'default';
let pushSubscription = null;

// Обновление профиля пользователя
function updateUserProfile() {
    const userData = getUserDataFromURL();
    
    console.log('🔄 Обновление профиля пользователя:', userData);
    
    // Обновляем имя пользователя
    const nameElement = document.getElementById('profile-name');
    if (nameElement) {
        if (userData.name && userData.name !== 'undefined') {
            nameElement.textContent = userData.name;
            console.log('✅ Имя пользователя обновлено:', userData.name);
        } else {
            nameElement.textContent = 'Пользователь';
            console.log('⚠️ Имя пользователя не найдено, используется по умолчанию');
        }
    }
    
    // Обновляем телефон пользователя
    const phoneElement = document.getElementById('profile-phone');
    if (phoneElement) {
        if (userData.phone && userData.phone !== 'undefined') {
            phoneElement.textContent = userData.phone;
            console.log('✅ Телефон пользователя обновлен:', userData.phone);
        } else {
            phoneElement.textContent = 'Телефон не указан';
            console.log('⚠️ Телефон пользователя не найден');
        }
    }
    
    // Сохраняем данные пользователя в localStorage для PWA
    if (userData.userId && userData.userId !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ Данные пользователя сохранены в localStorage:', userData);
    } else {
        console.log('❌ Нет данных пользователя для сохранения');
    }
    
    // Дополнительная проверка для PWA режима
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        console.log('🔍 PWA режим: дополнительная проверка данных');
        
        // Если данные все еще не загружены, пытаемся восстановить
        if (!userData.name || !userData.phone) {
            console.log('🔄 PWA: пытаемся восстановить данные из localStorage');
            const savedData = localStorage.getItem('userData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.name && parsedData.phone) {
                        console.log('✅ PWA: данные восстановлены из localStorage:', parsedData);
                        
                        if (nameElement) nameElement.textContent = parsedData.name;
                        if (phoneElement) phoneElement.textContent = parsedData.phone;
                    }
                } catch (error) {
                    console.error('❌ PWA: ошибка восстановления данных:', error);
                }
            }
        }
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
    showInstallBanner();
});

// Показ баннера установки
function showInstallBanner() {
    if (!isInstalled && deferredPrompt) {
        const banner = document.getElementById('install-banner');
        if (banner) {
            // Обновляем текст баннера с информацией о сохранении данных
            const userData = getUserDataFromURL();
            if (userData.userId) {
                const installText = banner.querySelector('.install-text p');
                if (installText) {
                    installText.textContent = `Добавьте на главный экран для быстрого доступа\nВаши данные будут сохранены: ${userData.name}`;
                }
            }
            
            banner.style.display = 'block';
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        }
    }
}

// Скрытие баннера установки
function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 300);
    }
}

// Установка приложения
async function installApp() {
    if (deferredPrompt) {
        // Сохраняем данные пользователя перед установкой
        const userData = getUserDataFromURL();
        if (userData.userId) {
            console.log('🚀 Начинаем установку PWA с данными:', userData);
            
            // Принудительно сохраняем данные в localStorage в нескольких местах
            const dataToSave = {
                userId: userData.userId,
                name: userData.name,
                phone: userData.phone
            };
            
            // Сохраняем в основных ключах
            localStorage.setItem('userData', JSON.stringify(dataToSave));
            localStorage.setItem('pwaUserData', JSON.stringify(dataToSave));
            localStorage.setItem('pwaInstallData', JSON.stringify({
                ...dataToSave,
                installTime: Date.now()
            }));
            
            // Дополнительные ключи для надежности
            localStorage.setItem('userProfile', JSON.stringify(dataToSave));
            localStorage.setItem('appUserData', JSON.stringify(dataToSave));
            
            console.log('✅ Данные сохранены в localStorage в 5 местах:', dataToSave);
            
            // Обновляем manifest.json с персональными данными
            const manifestURL = await updateManifestWithUserData(userData);
            
            if (manifestURL) {
                console.log('✅ Manifest обновлен успешно');
                
                // Большая задержка для обновления manifest
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Теперь показываем диалог установки
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('🎉 PWA установлен с данными пользователя:', userData);
                    isInstalled = true;
                    hideInstallBanner();
                    
                    // Показываем уведомление об успешной установке
                    showNotification('🎉 PWA установлен!', `Приложение установлено с вашими данными: ${userData.name}`);
                    
                    // Дополнительно сохраняем данные после установки
                    localStorage.setItem('pwaInstalled', 'true');
                    localStorage.setItem('pwaInstalledTime', Date.now().toString());
                    
                    // Еще раз сохраняем данные для надежности
                    localStorage.setItem('userData', JSON.stringify(dataToSave));
                    localStorage.setItem('pwaUserData', JSON.stringify(dataToSave));
                    
                    console.log('✅ PWA установлен, данные сохранены повторно');
                } else {
                    console.log('❌ Пользователь отменил установку PWA');
                }
            } else {
                console.error('❌ Не удалось обновить manifest');
                alert('Ошибка при подготовке к установке PWA');
            }
        } else {
            console.log('❌ Нет данных пользователя для установки PWA');
            alert('Сначала войдите через ссылку из Telegram бота');
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
    console.log('🚀 Загрузка приложения...');
    
    // Проверяем режим PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    console.log('🔍 Режим приложения:', isPWA ? 'PWA' : 'Браузер');
    
    // Сначала проверяем и восстанавливаем данные пользователя
    const restoredData = restoreUserData();
    
    // Проверяем, открыто ли приложение как PWA без данных пользователя
    checkPWAUserData();
    
    // Принудительно обновляем профиль пользователя
    updateUserProfile();
    
    // Если это PWA, делаем дополнительные проверки
    if (isPWA) {
        console.log('🔄 PWA режим: дополнительные проверки данных');
        
        // Проверяем все источники данных
        const userData = localStorage.getItem('userData');
        const pwaUserData = localStorage.getItem('pwaUserData');
        const pwaInstallData = localStorage.getItem('pwaInstallData');
        
        console.log('🔍 PWA: проверка источников данных:');
        console.log('  userData:', userData ? 'есть' : 'нет');
        console.log('  pwaUserData:', pwaUserData ? 'есть' : 'нет');
        console.log('  pwaInstallData:', pwaInstallData ? 'есть' : 'нет');
        
        // Если нет данных, пытаемся восстановить
        if (!userData && !pwaUserData && !pwaInstallData) {
            console.log('❌ PWA: нет данных в localStorage, пытаемся восстановить из URL');
            
            // Проверяем URL параметры
            const urlParams = new URLSearchParams(window.location.search);
            const urlData = {
                userId: urlParams.get('user_id'),
                name: urlParams.get('name'),
                phone: urlParams.get('phone')
            };
            
            if (urlData.userId && urlData.name && urlData.phone) {
                console.log('✅ PWA: данные найдены в URL, сохраняем');
                const dataToSave = {
                    userId: urlData.userId,
                    name: decodeURIComponent(urlData.name),
                    phone: decodeURIComponent(urlData.phone)
                };
                
                localStorage.setItem('userData', JSON.stringify(dataToSave));
                localStorage.setItem('pwaUserData', JSON.stringify(dataToSave));
                
                // Обновляем профиль
                updateUserProfile();
            } else {
                console.log('❌ PWA: нет данных ни в URL, ни в localStorage');
            }
        }
        
        // Множественные обновления профиля для PWA
        setTimeout(() => {
            console.log('🔄 PWA: обновление профиля через 100мс');
            updateUserProfile();
        }, 100);
        
        setTimeout(() => {
            console.log('🔄 PWA: обновление профиля через 500мс');
            updateUserProfile();
        }, 500);
        
        setTimeout(() => {
            console.log('🔄 PWA: обновление профиля через 1000мс');
            updateUserProfile();
        }, 1000);
    }
    
    // Показываем баннер установки если нужно
    showInstallBanner();
    
    // Обработчики событий
    setupEventListeners();
    
    // Инициализация приложения
    initializeApp();
    
    // Проверяем API и активный заказ
    checkAPIHealth();
    checkActiveOrder();
    
    // Инициализируем уведомления
    initNotifications();
    
    // Создаем персональный manifest
    createPersonalManifest();
    
    console.log('✅ Приложение загружено');
});

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ API сервер работает');
        } else {
            console.error('❌ API сервер не отвечает');
        }
    } catch (error) {
        console.error('❌ Ошибка подключения к API:', error);
        console.log('API URL:', API_BASE_URL);
        
        // Показываем предупреждение пользователю
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            text-align: center;
            font-size: 14px;
        `;
        warningDiv.textContent = '⚠️ API сервер недоступен. Заказы могут не работать.';
        document.body.appendChild(warningDiv);
        
        // Скрываем предупреждение через 5 секунд
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.parentNode.removeChild(warningDiv);
            }
        }, 5000);
    }
}

async function checkActiveOrder() {
    const userData = getUserDataFromURL();
    if (!userData.userId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/user_orders/${userData.userId}`);
        const result = await response.json();
        
        if (result.success && result.orders.length > 0) {
            // Ищем активный заказ (не завершенный и не отмененный)
            const activeOrder = result.orders.find(order => 
                order.state === OrderStates.PENDING || 
                order.state === OrderStates.ASSIGNED || 
                order.state === OrderStates.IN_PROGRESS
            );
            
            if (activeOrder) {
                currentOrder = activeOrder.id;
                startOrderTracking(activeOrder.id);
                
                // Показываем соответствующий экран
                switch (activeOrder.state) {
                    case OrderStates.PENDING:
                        showOrderWaiting(activeOrder.id);
                        break;
                    case OrderStates.ASSIGNED:
                        showDriverAssigned(activeOrder);
                        break;
                    case OrderStates.IN_PROGRESS:
                        showDriverAssigned(activeOrder);
                        break;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка проверки активного заказа:', error);
    }
}

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
    
    // Кнопки установки PWA
    const installAppBtn = document.getElementById('install-app-btn');
    if (installAppBtn) {
        installAppBtn.addEventListener('click', installApp);
    }
    
    const closeInstallBtn = document.getElementById('close-install-btn');
    if (closeInstallBtn) {
        closeInstallBtn.addEventListener('click', hideInstallBanner);
    }
}

function initializeApp() {
    // Устанавливаем начальный тариф
    selectTariff({ target: document.querySelector('.tariff-option.active') });
    
    // Инициализируем Telegram WebApp (если открыто в Telegram)
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

async function placeOrder() {
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');
    const activeTariff = document.querySelector('.tariff-option.active');
    const paymentMethod = document.getElementById('payment-method').textContent;
    
    if (!fromInput.value.trim() || !toInput.value.trim()) {
        alert('Пожалуйста, укажите адреса отправления и назначения');
        return;
    }
    
    const userData = getUserDataFromURL();
    if (!userData.userId) {
        alert('Ошибка: не удалось определить пользователя');
        return;
    }
    
    // Показываем экран загрузки
    showOrderLoading();
    
    try {
        // Создаем заказ через API
        const response = await fetch(`${API_BASE_URL}/api/create_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: parseInt(userData.userId),
                from: fromInput.value,
                to: toInput.value,
                tariff: activeTariff.dataset.tariff,
                payment: paymentMethod
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentOrder = result.order_id;
            // Начинаем отслеживание статуса заказа
            startOrderTracking(result.order_id);
            // Показываем экран ожидания назначения водителя
            showOrderWaiting(result.order_id);
        } else {
            throw new Error(result.error || 'Ошибка создания заказа');
        }
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        hideOrderLoading();
        
        // Более детальная информация об ошибке
        let errorMessage = 'Ошибка создания заказа: ';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Не удается подключиться к серверу. Проверьте, что API сервер запущен.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        console.log('API URL:', API_BASE_URL);
        console.log('User data:', userData);
    }
}

function showOrderLoading() {
    const successOverlay = document.getElementById('success-overlay');
    const successContent = successOverlay.querySelector('.success-content');
    
    successContent.innerHTML = `
        <div class="success-icon">🔄</div>
        <h2>Создание заказа...</h2>
        <p>Пожалуйста, подождите</p>
    `;
    
    successOverlay.style.display = 'flex';
}

function hideOrderLoading() {
    document.getElementById('success-overlay').style.display = 'none';
}

function showOrderWaiting(orderId) {
    const successOverlay = document.getElementById('success-overlay');
    const successContent = successOverlay.querySelector('.success-content');
    
    successContent.innerHTML = `
        <div class="success-icon">⏳</div>
        <h2>Заказ принят!</h2>
        <p>Ожидайте назначения водителя</p>
        <p class="notification-text">📱 Оповестим PUSH-УВЕДОМЛЕНИЕМ</p>
        <div class="order-info">
            <p>Номер заказа: #${orderId}</p>
            <p>Статус: Поиск водителя</p>
        </div>
        <button class="cancel-order-btn" onclick="cancelOrder()">Отменить заказ</button>
    `;
    
    successOverlay.style.display = 'flex';
    
    // Скрываем кнопку заказа
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.style.display = 'none';
    }
    
    // Запрашиваем разрешение на уведомления
    requestNotificationPermission();
}

function showDriverAssigned(order) {
    const successOverlay = document.getElementById('success-overlay');
    const successContent = successOverlay.querySelector('.success-content');
    
    const driverInfo = order.driver_info;
    
    successContent.innerHTML = `
        <div class="success-icon">🚗</div>
        <h2>Вам назначен водитель!</h2>
        <div class="driver-info">
            <p><strong>Автомобиль:</strong> ${driverInfo.car_model}</p>
            <p><strong>Гос. номер:</strong> ${driverInfo.car_number}</p>
            <p><strong>Машина будет в течении:</strong> 5-7 минут</p>
        </div>
        <button class="cancel-order-btn" onclick="cancelOrder()">Отменить заказ</button>
    `;
    
    successOverlay.style.display = 'flex';
    
    // Показываем push-уведомление
    showDriverNotification(order);
}

function showOrderCompleted() {
    const successOverlay = document.getElementById('success-overlay');
    const successContent = successOverlay.querySelector('.success-content');
    
    successContent.innerHTML = `
        <div class="success-icon">✅</div>
        <h2>Поездка завершена!</h2>
        <p>Спасибо за использование наших услуг</p>
        <button class="new-order-btn" onclick="startNewOrder()">Новый заказ</button>
    `;
    
    successOverlay.style.display = 'flex';
}

async function cancelOrder() {
    if (!currentOrder) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cancel_order/${currentOrder}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Заказ отменен');
            startNewOrder();
        } else {
            alert(result.error || 'Ошибка отмены заказа');
        }
    } catch (error) {
        console.error('Ошибка отмены заказа:', error);
        alert('Ошибка отмены заказа: ' + error.message);
    }
}

function startNewOrder() {
    // Скрываем все экраны
    document.getElementById('success-overlay').style.display = 'none';
    
    // Очищаем поля
    document.getElementById('from-input').value = '';
    document.getElementById('to-input').value = '';
    
    // Показываем кнопку заказа
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.style.display = 'block';
    }
    
    // Останавливаем отслеживание заказа
    if (orderCheckInterval) {
        clearInterval(orderCheckInterval);
        orderCheckInterval = null;
    }
    
    currentOrder = null;
}

function startOrderTracking(orderId) {
    // Проверяем статус заказа каждые 3 секунды
    orderCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/order_status/${orderId}`);
            const result = await response.json();
            
            if (result.success) {
                const order = result.order;
                
                switch (order.state) {
                    case OrderStates.ASSIGNED:
                        showDriverAssigned(order);
                        break;
                    case OrderStates.COMPLETED:
                        showOrderCompleted();
                        if (orderCheckInterval) {
                            clearInterval(orderCheckInterval);
                            orderCheckInterval = null;
                        }
                        break;
                    case OrderStates.CANCELLED:
                        alert('Заказ отменен');
                        startNewOrder();
                        break;
                }
            }
        } catch (error) {
            console.error('Ошибка проверки статуса заказа:', error);
        }
    }, 3000);
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

// Функции для работы с уведомлениями
async function initNotifications() {
    if ('Notification' in window) {
        notificationPermission = Notification.permission;
        console.log('Уведомления поддерживаются, статус:', notificationPermission);
    } else {
        console.log('Уведомления не поддерживаются в этом браузере');
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Уведомления не поддерживаются');
        return false;
    }
    
    if (notificationPermission === 'granted') {
        return true;
    }
    
    if (notificationPermission === 'denied') {
        console.log('Уведомления заблокированы');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            console.log('Разрешение на уведомления получено');
            return true;
        } else {
            console.log('Разрешение на уведомления отклонено');
            return false;
        }
    } catch (error) {
        console.error('Ошибка запроса разрешения на уведомления:', error);
        return false;
    }
}

function showNotification(title, body, icon = '/icon-192x192.png') {
    if (notificationPermission !== 'granted') {
        console.log('Уведомления не разрешены');
        return;
    }
    
    try {
        const notification = new Notification(title, {
            body: body,
            icon: icon,
            badge: '/icon-192x192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'Открыть приложение'
                },
                {
                    action: 'close',
                    title: 'Закрыть'
                }
            ]
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        // Автоматически закрываем через 10 секунд
        setTimeout(() => {
            notification.close();
        }, 10000);
        
        console.log('Уведомление отправлено:', title);
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

function showDriverNotification(order) {
    const driverInfo = order.driver_info;
    const title = '🚗 Вам назначен водитель!';
    const body = `${driverInfo.car_model} ${driverInfo.car_number}\nМашина будет в течении 5-7 минут`;
    
    showNotification(title, body);
}

// Обновление manifest с данными пользователя
async function updateManifestWithUserData(userData) {
    try {
        // Создаем URL с данными пользователя
        const userUrl = `/driver/?user_id=${userData.userId}&name=${encodeURIComponent(userData.name)}&phone=${encodeURIComponent(userData.phone)}`;
        
        // Получаем текущий manifest
        const response = await fetch('/driver/manifest.json');
        const manifest = await response.json();
        
        // Обновляем start_url с данными пользователя
        manifest.start_url = userUrl;
        
        // Создаем новый manifest с данными пользователя
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        // Обновляем ссылку на manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            manifestLink.href = manifestURL;
            console.log('Manifest ссылка обновлена:', manifestURL);
        }
        
        // Также обновляем данные в localStorage для надежности
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('pwaManifestUrl', manifestURL);
        
        console.log('Manifest обновлен с данными пользователя:', userUrl);
        console.log('Данные сохранены в localStorage:', userData);
        
        return manifestURL;
    } catch (error) {
        console.error('Ошибка обновления manifest:', error);
        return null;
    }
}

// Создание персонального manifest при загрузке
async function createPersonalManifest() {
    const userData = getUserDataFromURL();
    if (userData.userId) {
        await updateManifestWithUserData(userData);
    }
}

// Восстановление данных пользователя
function restoreUserData() {
    console.log('🔄 Восстановление данных пользователя...');
    
    // Проверяем URL параметры
    const urlData = getUserDataFromURL();
    
    // Проверяем все возможные источники данных
    const savedData = localStorage.getItem('userData');
    const pwaInstallData = localStorage.getItem('pwaInstallData');
    const pwaUserData = localStorage.getItem('pwaUserData');
    const userProfile = localStorage.getItem('userProfile');
    const appUserData = localStorage.getItem('appUserData');
    
    console.log('🔍 Проверка источников данных:');
    console.log('  URL данные:', urlData);
    console.log('  localStorage userData:', savedData ? 'есть' : 'нет');
    console.log('  PWA install данные:', pwaInstallData ? 'есть' : 'нет');
    console.log('  PWA user данные:', pwaUserData ? 'есть' : 'нет');
    console.log('  userProfile:', userProfile ? 'есть' : 'нет');
    console.log('  appUserData:', appUserData ? 'есть' : 'нет');
    
    // Если есть данные в URL, сохраняем их
    if (urlData.userId) {
        const dataToSave = {
            userId: urlData.userId,
            name: urlData.name,
            phone: urlData.phone
        };
        
        // Сохраняем во всех местах
        localStorage.setItem('userData', JSON.stringify(dataToSave));
        localStorage.setItem('pwaUserData', JSON.stringify(dataToSave));
        localStorage.setItem('userProfile', JSON.stringify(dataToSave));
        localStorage.setItem('appUserData', JSON.stringify(dataToSave));
        
        console.log('✅ Данные из URL сохранены в localStorage во всех местах');
        return dataToSave;
    }
    
    // Если нет данных в URL, ищем в localStorage
    let userData = null;
    
    // Проверяем все источники по порядку приоритета
    const sources = [
        { key: 'userData', data: savedData },
        { key: 'pwaUserData', data: pwaUserData },
        { key: 'userProfile', data: userProfile },
        { key: 'appUserData', data: appUserData },
        { key: 'pwaInstallData', data: pwaInstallData }
    ];
    
    for (const source of sources) {
        if (source.data) {
            try {
                const parsedData = JSON.parse(source.data);
                if (parsedData.userId && parsedData.name && parsedData.phone) {
                    userData = {
                        userId: parsedData.userId,
                        name: parsedData.name,
                        phone: parsedData.phone
                    };
                    console.log(`✅ Данные найдены в ${source.key}:`, userData);
                    break;
                }
            } catch (error) {
                console.error(`❌ Ошибка парсинга ${source.key}:`, error);
            }
        }
    }
    
    // Если нашли данные, обновляем URL и сохраняем
    if (userData && userData.userId) {
        console.log('🎯 Восстанавливаем данные пользователя:', userData);
        
        // Обновляем URL с данными пользователя
        const userUrl = `/driver/?user_id=${userData.userId}&name=${encodeURIComponent(userData.name)}&phone=${encodeURIComponent(userData.phone)}`;
        
        // Обновляем URL без перезагрузки страницы
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', userUrl);
            console.log('✅ URL обновлен с данными пользователя:', userUrl);
        }
        
        // Сохраняем данные во всех местах для надежности
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('pwaUserData', JSON.stringify(userData));
        localStorage.setItem('userProfile', JSON.stringify(userData));
        localStorage.setItem('appUserData', JSON.stringify(userData));
        
        console.log('✅ Данные сохранены во всех местах localStorage');
        
        return userData;
    }
    
    console.log('❌ Нет данных пользователя для восстановления');
    return null;
}

// Проверка данных пользователя в PWA
function checkPWAUserData() {
    const userData = getUserDataFromURL();
    
    console.log('Проверка PWA данных:', {
        urlData: userData,
        isPWA: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
        hasLocalStorage: !!localStorage.getItem('userData')
    });
    
    // Если это PWA и нет данных в URL
    if ((window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) && !userData.userId) {
        console.log('🔄 PWA открыт без данных пользователя, пытаемся восстановить...');
        
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                console.log('✅ Данные восстановлены для PWA:', parsedData);
                
                // Обновляем профиль пользователя
                updateUserProfile();
            } catch (error) {
                console.error('❌ Ошибка восстановления данных PWA:', error);
            }
        } else {
            console.log('❌ Нет сохраненных данных для PWA');
        }
    } else if (userData.userId) {
        console.log('✅ Данные пользователя найдены в URL:', userData);
    }
}
