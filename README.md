# Data Viewer

A simple web application for uploading and viewing tabular datasets together with their metadata.

## Features

- Upload a ZIP archive containing datasets and metadata.
- Automatically extract uploaded archives.
- Detect available datasets.
- View dataset columns and data rows.
- Navigate through dataset pages.
- View metadata for the selected dataset.
- Support for SAS7BDAT (`.sas7bdat`) and SAS Transport (`.xpt`) datasets.
- REST API built with FastAPI.
- Simple browser-based frontend using HTML and JavaScript.

## Project Structure

```text
data-viewer/
├── static/
│   ├── index.html
│   └── script.js
├── main.py
├── requirements.txt
├── README.md
└── .gitignore
```

The `uploads/` directory contains uploaded data and is excluded from Git.

The `venv/` directory contains the local Python virtual environment and is also excluded from Git.

## Requirements

- Python 3.13+
- pip

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd data-viewer
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
venv\Scripts\activate
```

Install the dependencies:

```powershell
pip install -r requirements.txt
```

## Running the Application

Start the application:

```powershell
python -m uvicorn main:app --reload
```

Open the application in a browser:

```text
http://127.0.0.1:8000/
```

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Usage

1. Upload a ZIP archive containing datasets and metadata.
2. The application extracts the archive.
3. Available datasets are displayed in the application.
4. Select a dataset to view its data.
5. Use the pagination buttons to navigate through the rows.
6. View metadata for the selected dataset.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload and extract a ZIP archive |
| GET | `/datasets` | Get the list of available datasets |
| GET | `/datasets/{dataset_name}` | Get paginated dataset data |
| GET | `/datasets/{dataset_name}/metadata` | Get metadata for a dataset |

## Supported Formats

### Dataset formats

- `.sas7bdat`
- `.xpt`

### Metadata

The application reads variable metadata from the provided `SDTM_spec_Variables.csv` file.

## Technologies

- Python
- FastAPI
- Pandas
- Pyreadstat
- OpenPyXL
- HTML
- JavaScript