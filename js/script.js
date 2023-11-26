document.querySelector('a[href="#upload"]').addEventListener('click', function () {
    document.getElementById('upload').style.display = 'block';
    document.getElementById('visualization').style.display = 'none';
});

document.querySelector('a[href="#visualization"]').addEventListener('click', function () {
    document.getElementById('upload').style.display = 'none';
    document.getElementById('visualization').style.display = 'block';
});


let isDragging = false;
let dragStartX, dragStartY;

const visualization = document.getElementById('visualization');

visualization.addEventListener('mousedown', function(event) {
    isDragging = true;
    dragStartX = event.clientX - visualization.offsetLeft;
    dragStartY = event.clientY - visualization.offsetTop;
    visualization.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', function(event) {
    if (isDragging) {
        const x = event.clientX - dragStartX;
        const y = event.clientY - dragStartY;
        visualization.style.left = `${x}px`;
        visualization.style.top = `${y}px`;
    }
});

window.addEventListener('mouseup', function() {
    isDragging = false;
    visualization.style.cursor = 'grab';
});
