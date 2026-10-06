from pathlib import Path
from zipfile import ZipFile

import pandas as pd
import pyreadstat


UPLOAD_DIR = Path("uploads")

SUPPORTED_EXTENSIONS = {
    ".sas7bdat",
    ".xpt",
    ".csv",
    ".xlsx",
}


def extract_archive(filename: str, content: bytes) -> list[str]:
    UPLOAD_DIR.mkdir(exist_ok=True)

    zip_path = UPLOAD_DIR / filename
    zip_path.write_bytes(content)

    extract_dir = UPLOAD_DIR / zip_path.stem
    extract_dir.mkdir(exist_ok=True)

    with ZipFile(zip_path, "r") as zip_file:
        zip_file.extractall(extract_dir)

    files = [
        str(path.relative_to(extract_dir))
        for path in extract_dir.rglob("*")
        if path.is_file()
    ]

    return files


def get_files() -> list[str]:
    files = []

    for path in UPLOAD_DIR.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(str(path.relative_to(UPLOAD_DIR)))

    return sorted(files)


def find_file(file_name: str) -> Path | None:
    files = list(UPLOAD_DIR.rglob(file_name))

    if not files:
        return None

    return files[0]


def get_excel_sheets(file_name: str):
    file_path = find_file(file_name)

    if not file_path:
        return None

    if file_path.suffix.lower() != ".xlsx":
        return None

    excel_file = pd.ExcelFile(file_path)

    return excel_file.sheet_names


def read_file(file_path: Path, sheet_name=None):
    extension = file_path.suffix.lower()

    if extension == ".sas7bdat":
        df, metadata = pyreadstat.read_sas7bdat(file_path)
        return df

    if extension == ".xpt":
        df, metadata = pyreadstat.read_xport(file_path)
        return df

    if extension == ".csv":
        return pd.read_csv(file_path, sep="$")

    if extension == ".xlsx":
        if sheet_name is None:
            sheet_name = 0

        return pd.read_excel(
            file_path,
            sheet_name=sheet_name
        )

    return None


def get_file_page(
    file_name: str,
    page: int,
    page_size: int,
    sheet_name=None
):
    file_path = find_file(file_name)

    if not file_path:
        return None

    df = read_file(file_path, sheet_name)

    total_rows = len(df)

    start = (page - 1) * page_size
    end = start + page_size

    rows = df.iloc[start:end].fillna("").to_dict(orient="records")

    return {
        "name": file_name,
        "columns": df.columns.tolist(),
        "rows": rows,
        "total_rows": total_rows,
        "page": page,
        "page_size": page_size,
    }