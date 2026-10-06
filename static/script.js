let currentDataset = null;
let currentPage = 1;
const pageSize = 10;


// Загружаем список datasets
async function loadDatasets() {
    const response = await fetch("/datasets");
    const data = await response.json();

    const list = document.getElementById("datasets");

    list.innerHTML = "";

    data.datasets.forEach(dataset => {
        const item = document.createElement("li");

        item.textContent = dataset;

        item.style.cursor = "pointer";

        item.addEventListener("click", () => {
            loadDataset(dataset);
        });

        list.appendChild(item);
    });
}


// Загружаем выбранный dataset
async function loadDataset(dataset) {
    currentDataset = dataset;
    currentPage = 1;

    await loadData();
    await loadMetadata();
}


// Загружаем данные таблицы
async function loadData() {
    const response = await fetch(
        `/datasets/${currentDataset}?page=${currentPage}&page_size=${pageSize}`
    );

    const data = await response.json();

    document.getElementById("dataset-title").textContent = currentDataset;

    const tableHead = document.querySelector("#data-table thead");
    const tableBody = document.querySelector("#data-table tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Создаём заголовки таблицы
    const headerRow = document.createElement("tr");

    data.columns.forEach(column => {
        const th = document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);


    // Создаём строки таблицы
    data.rows.forEach(row => {
        const tableRow = document.createElement("tr");

        data.columns.forEach(column => {
            const td = document.createElement("td");

            td.textContent = row[column] ?? "";

            tableRow.appendChild(td);
        });

        tableBody.appendChild(tableRow);
    });


    // Информация о странице
    const totalPages = Math.ceil(data.total_rows / data.page_size);

    document.getElementById("page-info").textContent =
        `Page ${data.page} of ${totalPages}`;

    document.getElementById("previous").disabled =
        currentPage === 1;

    document.getElementById("next").disabled =
        currentPage >= totalPages;
}


// Загружаем metadata
async function loadMetadata() {
    const response = await fetch(
        `/datasets/${currentDataset}/metadata`
    );

    const data = await response.json();

    const tableHead = document.querySelector("#metadata-table thead");
    const tableBody = document.querySelector("#metadata-table tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";


    const columns = [
        "Variable",
        "Label",
        "Data Type",
        "Mandatory",
        "Codelist",
        "Role",
        "Core"
    ];


    // Заголовки metadata
    const headerRow = document.createElement("tr");

    columns.forEach(column => {
        const th = document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);
    });

    tableHead.appendChild(headerRow);


    // Строки metadata
    data.metadata.forEach(item => {
        const row = document.createElement("tr");

        columns.forEach(column => {
            const td = document.createElement("td");

            td.textContent = item[column] ?? "";

            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });
}


// Кнопка Previous
document.getElementById("previous").addEventListener("click", async () => {
    if (currentPage > 1) {
        currentPage--;

        await loadData();
    }
});


// Кнопка Next
document.getElementById("next").addEventListener("click", async () => {
    currentPage++;

    await loadData();
});


// Загружаем datasets при открытии страницы
loadDatasets();