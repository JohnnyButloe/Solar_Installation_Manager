document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('installation-form');
    const locationInput = document.getElementById('location');
    const capacityInput = document.getElementById('capacity');
    const installationsList = document.getElementById('installations-list');
    const searchInput = document.getElementById('search');
    const capacityChartCanvas = document.getElementById('capacityChart');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    let installations = JSON.parse(localStorage.getItem('installations')) || [];

    const capacityChart = new Chart(capacityChartCanvas, {
        type: 'bar',
        data: {
            labels: installations.map(installation => installation.location),
            datasets: [{
                label: 'Capacity (kW)',
                data: installations.map(installation => installation.capacity),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const location = locationInput.value;
        const capacity = parseInt(capacityInput.value);

        if (location && capacity > 0) {
            console.log('Adding installation:', { location, capacity });
            const weatherData = await fetchWeather(location);
            const installation = {
                id: Date.now(),
                location: location,
                capacity: capacity,
                weather: weatherData ? `${weatherData.weather[0].description}, ${weatherData.main.temp}K` : 'N/A'
            };

            console.log('Installation to add:', installation);

            installations.push(installation);
            addInstallationToDOM(installation);
            updateChart();
            saveInstallations();

            locationInput.value = '';
            capacityInput.value = '';
        } else {
            alert('Please enter a valid location and a positive capacity.');
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderInstallations(searchTerm);
    });

    exportBtn.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + installations.map(i => `${i.location},${i.capacity},${i.weather}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "installations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const rows = text.split("\n").map(row => row.split(","));
            installations = rows.map(row => ({
                id: Date.now(),
                location: row[0],
                capacity: parseInt(row[1]),
                weather: row[2]
            }));
            saveInstallations();
            renderInstallations();
            updateChart();
        };
        reader.readAsText(file);
    });

    function addInstallationToDOM(installation) {
        const li = document.createElement('li');
        li.innerHTML = `${installation.location} - ${installation.capacity} kW<br>Weather: ${installation.weather}`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            editInstallation(installation);
        });

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            removeInstallation(installation.id);
        });

        li.appendChild(editButton);
        li.appendChild(removeButton);
        installationsList.appendChild(li);
    }

    function removeInstallation(id) {
        installations = installations.filter(installation => installation.id !== id);
        saveInstallations();
        updateChart();
        renderInstallations();
    }

    function editInstallation(installation) {
        locationInput.value = installation.location;
        capacityInput.value = installation.capacity;
        removeInstallation(installation.id);
    }

    function renderInstallations(searchTerm = '') {
        installationsList.innerHTML = '';
        installations
            .filter(installation => installation.location.toLowerCase().includes(searchTerm))
            .forEach(addInstallationToDOM);
    }

    function updateChart() {
        capacityChart.data.labels = installations.map(installation => installation.location);
        capacityChart.data.datasets[0].data = installations.map(installation => installation.capacity);
        capacityChart.update();
    }

    function saveInstallations() {
        localStorage.setItem('installations', JSON.stringify(installations));
    }

    async function fetchWeather(location) {
        const apiKey = 'aae19d8e448a49c0cb1f09f0abf07fe0';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching weather data', error);
            return null;
        }
    }

    renderInstallations();
    updateChart();
});
