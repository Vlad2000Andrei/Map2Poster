FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    FINDPYTHON_GET_VERSION_TIMEOUT=60

# Set work directory
WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry==2.4.1

# Copy only dependency files to cache them
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-root --no-directory

# Copy application code
COPY src ./src

# Run the application
CMD ["python", "src/map_handler/map_controller.py"]
