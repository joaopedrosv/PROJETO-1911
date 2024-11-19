


// Mostrar o banner de cookies após 2 segundos
setTimeout(function () {
    document.getElementById('cookie-banner').style.display = 'flex';
}, 2000); // Aparece após 2 segundos

// Fechar o banner de cookies ao clicar no botão "X"
document.getElementById('close-banner').addEventListener('click', function () {
    document.getElementById('cookie-banner').classList.add('closed');
});

// Fechar o banner de cookies ao clicar no botão "Prosseguir"
document.getElementById('accept-cookies').addEventListener('click', function () {
    document.getElementById('cookie-banner').classList.add('closed');
    // Ação após aceitar os cookies, por exemplo, redirecionar ou armazenar o consentimento
    alert("Você aceitou os cookies!"); // Alerta de confirmação
});


let count = 1;
document.getElementById("radio1").checked = true;

setInterval(nextImage, 5000); // Chama a função nextImage a cada 5 segundos

function nextImage() {
    count++;
    if (count > 3) {
        count = 1;
    }
    document.getElementById("radio" + count).checked = true;
}