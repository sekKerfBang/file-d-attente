clinic-queue/
├── backend-django6/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   └── clinic/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── consumers.py
│       └── management/
│           └── commands/
│               └── seed_data.py
├── frontend-react/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── QueueDisplay.tsx
│       │   ├── PatientForm.tsx
│       │   ├── DoctorCard.tsx
│       │   └── Statistics.tsx
│       ├── hooks/
│       │   └── useWebSocket.ts
│       ├── types/
│       │   └── index.ts
│       └── services/
│           └── api.ts
└── docker-compose.yml