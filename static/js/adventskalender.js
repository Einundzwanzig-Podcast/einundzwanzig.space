const prepareBlockHeight = height => {
    return height.toString().replace(/(\d{3}$)/, `<br>$1`);
}

const buildBlockTree = height => {
    let html = '';

    for (let i = height; i > height - 21; i--) {
        html += `
<ul class="cube">
    <li></li>
    <li></li>
    <li>${prepareBlockHeight(height)}</li>
    <li></li>
    <li></li>
    <li></li>
</ul>
        `;
    }

    document.getElementById('tree').innerHTML = html;

    document.querySelector('main').style.opacity = '1';
}

fetch('https://api.blockcypher.com/v1/btc/main')
    .then(response => response.json())
    .then(data => buildBlockTree(data.height))
    .catch(console.error);
