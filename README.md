# ScottyConnect Web App

# UPDATE NOTE
Sigrid is now enabled for this repo.
You have new GitHub Actions workflow files.
Accept your Sigrid invitation and review the analysis of your repo. 
Visit Sigrid at https://sigrid-says.com/cmusvfse

## About

### [Production Link](https://scottyconnect-1.onrender.com/)
### [API Documentation](https://scottyconnect.onrender.com/docs)

## Getting Started


### [`.env` credentials](https://docs.google.com/document/d/1I8QGCt-lDkfaWxP5T4JB0hLBJrnG9gvZf_Dyj7ToN5c/edit?usp=sharing) 

### Backend

Dependency Installation

```
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r ../requirements.txt
```

Running the server

```
cd backend
source venv/bin/activate

python3 run.py
```

### Frontend

```
npm install

npm run dev
```

## Documentation

### Login Workflow

```mermaid
stateDiagram-v2
    login_page --> register_page: wants to register, redirect
    register_page --> verification_page: successful registration, redirect
    login_page --> verification_page: valid credentials but not verified, redirect
    verification_page --> main_page: successful verification, redirect
    login_page --> main_page: successful login, redirect
```



