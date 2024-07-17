# FastAPI Backend

This is a backend application built using the FastAPI framework.

## Getting Started

To run the application locally, you'll need to have Python 3.6 or higher installed on your system. You can install the required Python packages by running:

```shell
pip install -r requirements.txt
```

Once the packages are installed, you can start the application by running:

```shell
uvicorn main:app --reload
```

This will start the application on `http://localhost:8000`.

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the application is running. You can use this documentation to explore the available endpoints and test the API.

## Running Tests

To run the tests for the application, you can use the following command:

```shell
pytest
```

This will run all the tests in the `tests` directory.
