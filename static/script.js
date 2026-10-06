let currentFile = null;
let currentPage = 1;
let currentSheet = null;

const pageSize = 10;


// Загружаем список файлов
async function loadFiles() {
    const response = await fetch("/files");
    const data = await response.json();

    const list = document.getElementById("files");

    list.innerHTML = "";

    data.files.forEach(file => {
        const item = document.createElement("li");

        item.textContent = file;
        item.style.cursor = "pointer";

        item.addEventListener("click", () => {
            loadFile(file);
        });

        list.appendChild(item);
    });
}


// Загружаем выбранный файл
async function loadFile(file) {
    currentFile = file;
    currentPage = 1;
    currentSheet = null;

    await loadSheets();
    await loadData();
}


// Загружаем листы Excel
async function loadSheets() {
    const sheetsContainer = document.getElementById("sheets");

    sheetsContainer.innerHTML = "";

    if (!currentFile.toLowerCase().endsWith(".xlsx")) {
        return;
    }

    const response = await fetch(
        `/files/${encodeURIComponent(currentFile)}/sheets`
    );

    const data = await response.json();

    data.sheets.forEach(sheet => {
        const button = document.createElement("button");

        button.textContent = sheet;

        button.addEventListener("click", () => {
            currentSheet = sheet;
            currentPage = 1;

            loadData();
        });

        sheetsContainer.appendChild(button);
    });

    if (data.sheets.length > 0) {
        currentSheet = data.sheets[0];
    }
}


// Загружаем данные файла
async function loadData() {

    let url =
        `/files/${encodeURIComponent(currentFile)}` +
        `?page=${currentPage}` +
        `&page_size=${pageSize}`;

    if (currentSheet) {
        url += `&sheet_name=${encodeURIComponent(currentSheet)}`;
    }

    const response = await fetch(url);

    const data = await response.json();

    document.getElementById("file-title").textContent =
        currentFile +
        (currentSheet ? ` — ${currentSheet}` : "");

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
    const totalPages = Math.ceil(
        data.total_rows / data.page_size
    );

    document.getElementById("page-info").textContent =
        `Page ${data.page} of ${totalPages}`;

    document.getElementById("previous").disabled =
        currentPage === 1;

    document.getElementById("next").disabled =
        currentPage >= totalPages;
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


// Загружаем файлы при открытии страницы
loadFiles();