import pandas as pd
from pathlib import Path
from zipfile import ZipFile

import pyreadstat
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI()


UPLOAD_DIR = Path("uploads")
STATIC_DIR = Path("static")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    return FileResponse("static/index.html")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Создаём папку uploads, если её ещё нет
    UPLOAD_DIR.mkdir(exist_ok=True)

    # Создаём путь для ZIP-файла
    zip_path = UPLOAD_DIR / file.filename

    # Читаем загруженный файл
    content = await file.read()

    # Сохраняем ZIP на диск
    zip_path.write_bytes(content)

    # Создаём папку для распакованных файлов
    extract_dir = UPLOAD_DIR / zip_path.stem
    extract_dir.mkdir(exist_ok=True)

    # Распаковываем ZIP
    with ZipFile(zip_path, "r") as zip_file:
        zip_file.extractall(extract_dir)

    # Находим все файлы внутри распакованного архива
    files = [
        str(path.relative_to(extract_dir))
        for path in extract_dir.rglob("*")
        if path.is_file()
    ]

    return {
        "filename": file.filename,
        "files": files,
    }


DATA_EXTENSIONS = {".sas7bdat", ".xpt"}


@app.get("/datasets")
def get_datasets():
    datasets = []

    for path in UPLOAD_DIR.rglob("*"):
        if path.is_file() and path.suffix.lower() in DATA_EXTENSIONS:
            datasets.append(path.stem)

    return {
        "datasets": sorted(datasets)
    }


@app.get("/datasets/{dataset_name}")
def get_dataset(
    dataset_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    # Ищем файл dataset
    files = list(UPLOAD_DIR.rglob(f"{dataset_name}.*"))

    if not files:
        return {"error": "Dataset not found"}

    file_path = files[0]

    # Читаем SAS7BDAT
    if file_path.suffix.lower() == ".sas7bdat":
        df, metadata = pyreadstat.read_sas7bdat(file_path)

    # Читаем XPT
    elif file_path.suffix.lower() == ".xpt":
        df, metadata = pyreadstat.read_xport(file_path)

    else:
        return {"error": "Unsupported file format"}

    # Общее количество строк
    total_rows = len(df)

    # Определяем диапазон строк
    start = (page - 1) * page_size
    end = start + page_size

    # Берём только нужные строки
    rows = df.iloc[start:end].to_dict(orient="records")

    return {
        "name": dataset_name,
        "columns": df.columns.tolist(),
        "rows": rows,
        "total_rows": total_rows,
        "page": page,
        "page_size": page_size
    }


@app.get("/datasets/{dataset_name}/metadata")
def get_dataset_metadata(dataset_name: str):
    # Ищем файл с metadata
    metadata_files = list(UPLOAD_DIR.rglob("SDTM_spec_Variables.csv"))

    if not metadata_files:
        return {"error": "Metadata file not found"}

    metadata_file = metadata_files[0]

    # Читаем CSV
    df = pd.read_csv(metadata_file, sep="$")

    # Оставляем metadata только для нужного dataset
    result = df[
        df["Dataset"].str.upper() == dataset_name.upper()
    ]

    # Оставляем только нужные поля
    result = result[
        [
            "Variable",
            "Label",
            "Data Type",
            "Mandatory",
            "Codelist",
            "Role",
            "Core",
        ]
    ]

    return {
        "dataset": dataset_name,
        "metadata": result.fillna("").to_dict(orient="records")
    }