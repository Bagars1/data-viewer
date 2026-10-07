let currentFile = null;
let currentPage = 1;
let currentSheet = null;

const pageSize = 10;


// Показываем сообщение об ошибке
function showError(message) {
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = message;
    errorMessage.style.color = "red";
}


// Очищаем сообщение об ошибке
function clearError() {
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = "";
}


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

    clearError();

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

    if (!response.ok) {
        const data = await response.json();

        showError(
            data.detail || "Excel file not found."
        );

        return;
    }

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

    clearError();

    let url =
        `/files/${encodeURIComponent(currentFile)}` +
        `?page=${currentPage}` +
        `&page_size=${pageSize}`;

    if (currentSheet) {
        url += `&sheet_name=${encodeURIComponent(currentSheet)}`;
    }

    const response = await fetch(url);

    // Проверяем, успешно ли загрузился файл
    if (!response.ok) {
        const data = await response.json();

        showError(
            data.detail || "File not found."
        );

        return;
    }

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


// Кнопка Open
document.getElementById("open-file").addEventListener("click", async () => {

    const fileInput = document.getElementById("file-input");
    const fileName = fileInput.value.trim();

    if (!fileName) {
        showError("Please enter a file name.");
        return;
    }

    await loadFile(fileName);
});


// Загружаем файлы при открытии страницы
loadFiles();
