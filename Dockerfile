FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Install uv by copying it from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy only dependency files to cache them
COPY pyproject.toml poetry.lock README.md ./

# Install dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY src ./src

# Run the application
CMD ["python", "src/map_handler/map_controller.py"]

