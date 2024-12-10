let tableCreated = false;

document.addEventListener("DOMContentLoaded", function () {
    loadTableFromLocalStorage();
});

function sendData() {
    const x = document.getElementById('x').value;
    const y = document.getElementById('y').value;
    const r = document.getElementById('r').value;
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = "";

    if (!validateInput(x, y, r)) {
        errorMessage.textContent = 'Invalid input values. Please ensure X is between -4 and 4, Y is between -5 and 3, and R is between 1 and 4.';
        return;
    }

    const data = JSON.stringify({ x: parseFloat(x), y: parseFloat(y), r: parseFloat(r) });

    fetch('/fcgi-bin/server-1.0.jar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
    })
    .then(response => response.json())
    .then(json => {
        if (!tableCreated) {
            createTable();
            tableCreated = true;
        }
        addRow(json);
        saveRowToLocalStorage(json);
    })
    .catch(error => console.error('Error:', error));

    drawPoints(x, y, r);
}

function createTable() {
    const resultContainer = document.getElementById('results');
    const table = document.createElement('table');
    resultContainer.style.display = "block";
    table.setAttribute('id', 'resultTable');
    table.innerHTML = `
        <tr>
            <th>X</th>
            <th>Y</th>
            <th>R</th>
            <th>Result</th>
            <th>Current Time</th>
            <th>Execution Time</th>
        </tr>
    `;
    resultContainer.appendChild(table);
}

function addRow(json) {
    const resultTable = document.getElementById('resultTable');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${json.x}</td>
        <td>${json.y}</td>
        <td>${json.r}</td>
        <td>${json.result}</td>
        <td>${json.currentTime}</td>
        <td>${json.executionTime}</td>
    `;
    resultTable.appendChild(newRow);
}

function validateInput(x, y, r) {
    if (isNaN(x) || x < -4 || x > 4 || x === "") {
        return false;
    }
    if (isNaN(y) || y < -5 || y > 3 || y === "") {
        return false;
    }
    if (isNaN(r) || r < 1 || r > 4 || r === "") {
        return false;
    }
    return true;
}

document.getElementById('graph').addEventListener('click', function(event) {
    const svg = document.getElementById('graph');
    const pt = svg.createSVGPoint();
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = "";

    pt.x = event.clientX;
    pt.y = event.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());

    const rValue = parseFloat(document.getElementById('r').value);

    if (isNaN(rValue) || rValue < 1 || rValue > 4) {
        errorMessage.textContent = 'Please enter a valid R value between 1 and 4.';
        return;
    }

    const scaledX = (cursorPt.x / 100) * rValue;
    const scaledY = -(cursorPt.y / 100) * rValue;

    document.getElementById('x').value = scaledX.toFixed(2);
    document.getElementById('y').value = scaledY.toFixed(2);

    const xValue = parseFloat(document.getElementById('x').value);
    const yValue = parseFloat(document.getElementById('y').value);

    if (!validateInput(xValue, yValue, rValue)) {
        errorMessage.textContent = 'Invalid input values. Please ensure X is between -4 and 4, Y is between -5 and 3, and R is between 1 and 4.';
        return;
    }
});

function drawPoints(x, y, r) {
    const targetDot = document.getElementById('target-dot');
    const svg = document.getElementById('graph');
    
    const svgWidth = svg.viewBox.baseVal.width;
    const svgHeight = svg.viewBox.baseVal.height;
    
    const graphX = (x / r) * (svgWidth / 2);
    const graphY = -(y / r) * (svgHeight / 2);

    if (targetDot) {
        targetDot.setAttribute("cx", graphX);
        targetDot.setAttribute("cy", graphY);
        targetDot.setAttribute("r", 3);
    }
}

function saveRowToLocalStorage(json) {
    let savedResults = localStorage.getItem('savedResults');
    if (!savedResults) {
        savedResults = [];
    } else {
        savedResults = JSON.parse(savedResults);
    }
    savedResults.push(json);
    localStorage.setItem('savedResults', JSON.stringify(savedResults));
}

function loadTableFromLocalStorage() {
    const savedResults = JSON.parse(localStorage.getItem('savedResults'));
    if (savedResults && savedResults.length > 0) {
        createTable();
        tableCreated = true;
        savedResults.forEach(json => addRow(json));
    }
}