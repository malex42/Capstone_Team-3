# Capstone_Team-3

## Group Members

| Name           | Role          | Secondary Role  |
|----------------|---------------|-----------------|
| Madeline Alex  | Team Lead     | Security Lead   |
| Reece Myatt    | Security Lead | Testing Lead    |
| William Bigger | Coding Lead   | Team Lead       |
| Zachary Wilson | Testing Lead  | Coding Lead     |

## Project Overview

This repository contains the Good Work project, a schedule management tool.

[Development Checkpoint](https://drive.google.com/file/d/1QzeCOtltIzfKdbi686uevLsWuRAjR_bg/view?usp=drive_link)

Follow the instructions below to set up and run the application.

## Setup Instructions

### Prerequisites

- Python 3.x installed
- Node.js and npm installed
- Recommended: virtual environment for Python

### Required Files

Before running the server, you need the following files:

1. **SSL Certificates**  
   - Download `cert.pem` and `key.pem` from [Certificates](https://drive.google.com/drive/folders/1RKkBxh67aZyGFwKvNGnjiMXVdD6O38rH?usp=drive_link).  
   - Place both files in the `server/ssl/` directory.

2. **Configuration File**  
   - Download `config.yaml` from [Config](https://drive.google.com/drive/folders/1vAzhHIWwTRvVttLytVIh7NcPakKj1LVX?usp=drive_link).  
   - Place it in the `server/configurations/` directory.

---

### Running the Server
1. Open a terminal and navigate to the server directory:
``cd server``
2. Install the required Python packages:
``pip install -r requirements.txt``
3. Start the server:
``python3 main.py``

Optional Virtual Enivronment (do this before step 2):
python3 -m venv venv
source venv/bin/activate


The server will start running on the default port (3333).

### Running the Client

1. Open a second terminal at the root of the repository.
2. Navigate to the frontend directory:
``cd frontend``
3. Install the required npm packages:
``npm install``
4. Start the development server:
``npm run dev``

The frontend application will be available at `http://localhost:5173` 

## Testing

### Frontend Tests

Frontend test files are located in: 
``/frontend/tests``

### Backend Tests

Backend test files are located in:
``/server/tests``

Run tests from the root directory, using `python -m pytest server/tests`:
