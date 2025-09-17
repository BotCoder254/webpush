@echo off
set DEBUG=True
set SECRET_KEY=django-insecure-@v-e^o1p6l6*f93*!h3yi)=le@r4@!_thu-fva^^^!h-jv2n8h
set WEBHOOK_SECRET_KEY=dGhpcyBpcyBhIDMyIGJ5dGUga2V5IGZvciBGZXJuZXQh
set WEBHOOK_URL_BASE=http://localhost:8000
echo Environment variables set for development
echo Running Django migrations...
python manage.py makemigrations
python manage.py migrate
echo Django setup complete!
