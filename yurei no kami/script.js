function showSection(section) {
    document.querySelectorAll('.section').forEach(div => div.style.display = 'none');
    document.getElementById(section).style.display = 'flex';
}

window.onload = function () {
    document.querySelectorAll('.section').forEach(div => div.style.display = 'none');
    let home = document.getElementById('home');
    if (home) {
        home.style.display = 'flex';
    }
};
