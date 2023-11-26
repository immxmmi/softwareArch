const color = d3.scaleOrdinal(d3.schemeCategory10);
let width;
let height;

function setDiagramSize(visualizationType) {
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight;
    let sizeMultiplier;

    switch (visualizationType) {
        case 'networkDiagram':
            sizeMultiplier = 2;
            break;
        case 'chordDiagram':
            sizeMultiplier = 4.5;
            break;
        default:
            sizeMultiplier = 0.1;
    }

    width = baseWidth * sizeMultiplier;
    height = baseHeight * sizeMultiplier;
}

document.addEventListener('DOMContentLoaded', function () {
    loadAvailableDataFolders();
    addVisualizationListeners();
});

function loadAvailableDataFolders() {
    fetch('http://localhost:3000/getDataFolders')
        .then(response => response.json())
        .then(updateDataFolderOptions)
        .catch(error => console.error('Error fetching data folders:', error));
}

function updateDataFolderOptions(folders) {
    const folderSelect = document.getElementById('dataFolderSelect');
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);
    });
}

function addVisualizationListeners() {
    document.getElementById('visualize').addEventListener('click', () => {
        const selectedFolder = document.getElementById('dataFolderSelect').value;
        const visualizationType = document.getElementById('visualizationTypeSelect').value;
        if (selectedFolder) {
            fetchVisualizationData(selectedFolder, visualizationType);
        }
    });
}

function fetchVisualizationData(folder, visualizationType) {
    fetch(`http://localhost:3000/getVisualizationData?folder=${folder}`)
        .then(response => response.json())
        .then(data => visualizeData(data, visualizationType))
        .catch(error => console.error('Error fetching visualization data:', error));
}

function clearVisualization() {
    const visualization = document.getElementById('visualization');
    while (visualization.firstChild) {
        visualization.removeChild(visualization.firstChild);
    }
}

function visualizeChordDiagramCaller(data) {

    const height = 13000;
    const width = 13000;
    const diagramSize = Math.max(height, width);
    const outerRadius = diagramSize / 3;
    const innerRadius = outerRadius - 300;

    const services = data['serviceList.json'].map(service => service.Service);
    const matrix = createMatrix(services.length);
    data['callerCallee.json'].forEach(call => {
        const rowIndex = services.indexOf(call.Caller);
        const colIndex = services.indexOf(call.Callee);
        if (rowIndex >= 0 && colIndex >= 0) {
            matrix[rowIndex][colIndex] += call.NumberOfCallsLastYear;
        }
    });

    const chord = d3.chord()
        .padAngle(0.5)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
        .radius(innerRadius);


    const svg = d3.select("#visualization").append("svg")
        .attr("viewBox", [-6000, -800, outerRadius * 6, outerRadius * 4])
        .append("g")
        .attr("transform", `translate(${height / 2},${width / 2})`);

    svg.append("text")
        .attr("class", "diagram-title")
        .attr("x", 0)
        .attr("y", -5000)
        .attr("text-anchor", "middle")
        .text("Chord Diagram: Caller");


    const chords = chord(matrix);


    const group = svg.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter().append("g");

    group.append("path")
        .style("fill", d => color(d.index))
        .style("stroke", d => d3.rgb(color(d.index)).darker())
        .attr("d", arc);

    group.append("text")
        .each(d => {
            d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("dy", ".35em")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .style("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => services[d.index]);

    svg.append("g")
        .attr("fill-opacity", 0.67)
        .selectAll("path")
        .data(chords)
        .enter().append("path")
        .attr("d", ribbon)
        .style("fill", d => color(d.target.index))
        .style("stroke", d => d3.rgb(color(d.target.index)).darker());
}

function visualizeChordDiagramCommon(data) {
    const height = 13000;
    const width = 13000;
    const diagramSize = Math.max(height, width);
    const outerRadius = diagramSize / 3;
    const innerRadius = outerRadius - 300;

    const services = data['serviceList.json'].map(service => service.Service);
    const matrix = createMatrix(services.length);

    data['commonChanges.json'].forEach(change => {
        const sourceIndex = services.indexOf(change.Service1);
        const targetIndex = services.indexOf(change.Service2);
        if (sourceIndex >= 0 && targetIndex >= 0) {
            matrix[sourceIndex][targetIndex] += change.NumberOfCommonChanges;
            matrix[targetIndex][sourceIndex] += change.NumberOfCommonChanges;
        }
    });

    const chord = d3.chord()
        .padAngle(0.5)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
        .radius(innerRadius);

    const svg = d3.select("#visualization").append("svg")
        .attr("viewBox", [-6000, -800, outerRadius * 6, outerRadius * 4])
        .append("g")
        .attr("transform", `translate(${height / 2},${width / 2})`);

    const chords = chord(matrix);

    const group = svg.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter().append("g");

    svg.append("text")
        .attr("class", "diagram-title")
        .attr("x", 0)
        .attr("y", -5000)
        .attr("text-anchor", "middle")
        .text("Chord Diagram: Common");

    group.append("path")
        .style("fill", d => color(d.index))
        .style("stroke", d => d3.rgb(color(d.index)).darker())
        .attr("d", arc);

    group.append("text")
        .each(d => {
            d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("dy", ".35em")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .style("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => services[d.index]);


    svg.append("g")
        .attr("fill-opacity", 0.67)
        .selectAll("path")
        .data(chords)
        .enter().append("path")
        .attr("d", ribbon)
        .style("fill", d => color(d.target.index))
        .style("stroke", d => d3.rgb(color(d.target.index)).darker());
}

function createMatrix(size) {
    return Array.from({length: size}, () => new Array(size).fill(0));
}


function visualizeNetworkDiagramCommon(data) {
    const width = 1900;
    const height = 2000;

    const nodes = data['serviceList.json'].map(service => ({id: service.Service}));
    const links = data['commonChanges.json'].map(change => ({
        source: change.Service1,
        target: change.Service2,
        value: change.NumberOfCommonChanges
    }));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select("#visualization").append("svg")
        .attr("viewBox", [-6000, -3000, 15000, 20000])
        .call(d3.zoom().on("zoom", ({transform}) => {
            svg.attr("transform", transform);
        }))
        .append("g");

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", color)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(d => d.id);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function visualizeNetworkDiagramCaller(data) {
    width = 5000;
    height = 5000;
    const callerCallee = data['callerCallee.json'];
    const networkData = transformDataToNetwork(callerCallee);

    const svg = d3.select("#visualization").append("svg")
        .attr("viewBox", [-6000, -1000, 15000, 20000])
        .call(d3.zoom().on("zoom", ({transform}) => {
            svg.attr("transform", transform);
        }))
        .append("g");

    const simulation = d3.forceSimulation(networkData.nodes)
        .force("link", d3.forceLink(networkData.links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    const link = svg.append("g")
        .attr("stroke", "#999")
        .selectAll("line")
        .data(networkData.links)
        .enter().append("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(networkData.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", "#69b3a2")
        .call(drag);

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });
}


function visualizeWordCloudFromCallerCallee(data) {
    width = 1000;
    height = 3000;
    const margin = {top: 20, right: 20, bottom: 20, left: 20};

    const callerCallee = data['callerCallee.json'];
    const calleeFrequency = {};
    callerCallee.forEach(entry => {
        const callee = entry.Callee;
        const calls = entry.NumberOfCallsLastYear;
        if (calleeFrequency[callee]) {
            calleeFrequency[callee] += calls;
        } else {
            calleeFrequency[callee] = calls;
        }
    });
    const wordCloudData = Object.keys(calleeFrequency).map(callee => {
        return {
            word: callee,
            frequency: calleeFrequency[callee]
        };
    });

    const maxFontSize = 20;
    const padding = 1;

    const svg = d3.select("#visualization")
        .append("svg")
        .attr("id", "diagram")
        .attr("width", width)
        .attr("height", height);

    const fontSizeScale = d3.scaleLinear()
        .domain([0, d3.max(wordCloudData, d => d.frequency)])
        .range([padding, maxFontSize]);

    const randomX = () => Math.random() * ((width - maxFontSize - padding) / 10);
    const randomY = () => Math.random() * ((height - maxFontSize - padding) / 10);

    const wordGroups = svg.selectAll("g")
        .data(wordCloudData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${randomX()}, ${randomY()})`);

    wordGroups.append("text")
        .text(d => d.word)
        .attr("font-size", d => fontSizeScale(d.frequency))
        .attr("fill", "steelblue");
}

function transformDataToNetwork(callerCallee) {
    const nodes = [], links = [];
    const nodeMap = new Map();

    callerCallee.forEach(call => {
        if (!nodeMap.has(call.Caller)) {
            nodeMap.set(call.Caller, {id: call.Caller});
            nodes.push({id: call.Caller});
        }
        if (!nodeMap.has(call.Callee)) {
            nodeMap.set(call.Callee, {id: call.Callee});
            nodes.push({id: call.Callee});
        }
        links.push({source: call.Caller, target: call.Callee, value: call.NumberOfCallsLastYear});
    });

    return {nodes, links};
}


var modal = document.getElementById("visualizationModal");
var span = document.getElementsByClassName("close")[0];

span.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function showModal() {
    modal.style.display = "block";
}

function addZoomListener() {
    const visualization = document.getElementById('visualization');
    let scale = 1;
    visualization.addEventListener('wheel', function (event) {
        event.preventDefault();
        const zoomIntensity = 0.0005;
        const delta = -event.deltaY * zoomIntensity;
        scale += delta;
        scale = Math.min(Math.max(.125, scale), 4);
        visualization.style.transform = `scale(${scale})`;
    });
}


function visualizeData(data, visualizationType) {
    setDiagramSize(visualizationType);
    clearVisualization();
    switch (visualizationType) {
        case 'chordDiagramCaller':
            visualizeChordDiagramCaller(data);
            break;
        case 'chordDiagramCommon':
            visualizeChordDiagramCommon(data);
            break;
        case 'networkDiagramCaller':
            visualizeNetworkDiagramCaller(data);
            break;
        case 'networkDiagramCommon':
            visualizeNetworkDiagramCommon(data);
            break;
        case 'wordCloudCaller':
            visualizeWordCloudFromCallerCallee(data);
            break;
    }
    showModal();
    addZoomListener();
}






