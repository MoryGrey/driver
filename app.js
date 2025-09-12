(() => {
  const qs = new URLSearchParams(location.search);
  const name = qs.get('name') || '';
  const phone = qs.get('phone') || '';
  const car = qs.get('car') || '';
  const plate = qs.get('plate') || '';

  document.getElementById('name').textContent = name;
  document.getElementById('phone').textContent = phone;
  document.getElementById('car').textContent = car;
  document.getElementById('plate').textContent = plate;

  const callBtn = document.getElementById('call-client');
  const completeBtn = document.getElementById('complete');

  // Placeholder: кнопки активируются, когда бот пришлёт актуальный заказ
  callBtn.disabled = true;
  completeBtn.disabled = true;
})();


