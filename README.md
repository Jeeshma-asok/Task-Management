# Django Role-Based Task Management System

A Django-based task management system with:

- JWT Authentication (via HTTP-only cookies)
- Role-Based Access Control (Super Admin, Admin, User)
- REST API + Swagger Docs
- Bootstrap UI (served locally for offline access)

---

## Features

- User login with JWT issued and stored in a secure cookie
- Dashboard with data filtered by user role
- Role-based permissions to create, assign, and complete tasks
- RESTful APIs protected via token authentication
- Swagger/OpenAPI for documentation and testing

---

## Getting Started

### 1. Clone the repository

```bash

git clone https://github.com/Jeeshma-asok/Task-Management.git
cd Task-Management/

python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate


python manage.py createsuperuser
python manage.py initial_database # Create user roles(Super Admin, Admin, User) and a user as Super Admin

python manage.py runserver


## Access the application

- Visit http://localhost:8000
- login as super admin
    Username: superadmin
    Password: superadmin123
