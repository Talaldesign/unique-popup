
document.getElementById('openPopup').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'flex';
});

document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target.id === 'popup') {
        document.getElementById('popup').style.display = 'none';
    }
});
