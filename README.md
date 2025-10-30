# Project Setup Instructions

Follow the steps below to set up and run this Node.js project on your local machine.

## Prerequisites

- Install the **latest version of Node.js** from [https://nodejs.org/](https://nodejs.org/).  
  Installing Node.js will also install **npm** (Node Package Manager) automatically.

- **Check installation**:
```bash
node -v
npm -v
```

**Steps to Run the Project**
1. Open Command Prompt (Windows) or Terminal (Mac/Linux).

2. Navigate to your project folder using the cd command. For example:
  ```bash
  cd path/to/your/project/folder
  ```
3. Initialize the project (if not already initialized):
   ```bash
   npm init -y
   ```
4. Install project dependencies:
   ```bash
   npm install
   ```

5. Start the server:
   ```bash
   node server.js
   ```
   
6. After running the server, you should see:
   ✅ Local API running at http://localhost:4000

7.Configure Environment Variables
  In the same path as server.js, create a file named .env and add the following lines:
  
  REPLIT_API_KEY=pJSIY8QbOpMISM+WD32evE/pmvxLKqDjRKzqSdzj5p2ip1a1oeJEB71hf7g3W0VmpNDxwraOOyIoJVHjJnuigA==
  REPLIT_USERNAME=John
  REPLIT_PASSWORD=123456
  OPENAI_API_KEY=sk-******gg4A
