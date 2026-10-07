from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from services import (
    extract_archive,
    get_files,
    get_file_page,
    get_excel_sheets,
    SheetNotFoundError,
)


app = FastAPI()


STATIC_DIR = "static"


app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)


@app.get("/")
def root():
    return FileResponse("static/index.html")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()

    files = extract_archive(
        file.filename,
        content
    )

    return {
        "filename": file.filename,
        "files": files,
    }


@app.get("/files")
def files():
    return {
        "files": get_files()
    }


@app.get("/files/{file_name:path}/sheets")
def excel_sheets(file_name: str):
    sheets = get_excel_sheets(file_name)

    if sheets is None:
        raise HTTPException(
            status_code=404,
            detail=f"Excel file '{file_name}' not found"
        )

    return {
        "name": file_name,
        "sheets": sheets,
    }


@app.get("/files/{file_name:path}")
def file(
    file_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sheet_name: str | None = None
):
    try:
        result = get_file_page(
            file_name,
            page,
            page_size,
            sheet_name
        )

    except SheetNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=f"Sheet '{error.args[0]}' not found in file '{file_name}'"
        )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"File '{file_name}' not found or unsupported format"
        )

    return result