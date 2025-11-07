
document.getElementById('openPopup').addEventListener('click', () => {
  document.getElementById('popup').style.display = 'flex';
});

document.getElementById('closePopup').addEventListener('click', () => {
  document.getElementById('popup').style.display = 'none';
});

document.getElementById('applyChanges').addEventListener('click', () => {
  const title = document.getElementById('titleInput').value;
  const msg = document.getElementById('messageInput').value;
  const theme = document.getElementById('themeSelect').value;
  const box = document.getElementById('popupContent');

  if (title) document.getElementById('popupTitle').textContent = title;
  if (msg) document.getElementById('popupMessage').textContent = msg;

  box.className = 'popup-content';
  if (theme !== 'default') box.classList.add('theme-' + theme);
});

window.addEventListener('click', (e) => {
  if (e.target.id === 'popup') {
    document.getElementById('popup').style.display = 'none';
  }
});
