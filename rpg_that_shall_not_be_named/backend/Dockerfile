# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Run migrations, collectstatic, and start gunicorn
# In production, migrations should typically be run separately,
# but for simplicity in this setup, we'll run them here.
CMD python manage.py migrate \
    && python populate_drops.py \
    && python manage.py collectstatic --noinput \
    && gunicorn rpg_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
