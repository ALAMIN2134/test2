document.addEventListener('DOMContentLoaded', () => {
    // ---- CONFIGURATION ----
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTmF9mp4gTuuGZpwKIXtn8kIlsvUxcuR_uR4Z72G22o6QDwUz1ts6gCr5nuKkOBbfQ/exec'; // *** IMPORTANT: REPLACE WITH YOUR DEPLOYED WEB APP URL ***

    // ---- HTML ELEMENTS ----
    const authForm = document.getElementById('auth-form');
    const todoApp = document.getElementById('todo-app');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task');
    const todoList = document.getElementById('todo-list');

    // ---- STATE VARIABLES ----
    let currentUserId = null;
    let currentUsername = null;

    // ---- VIEW MANAGEMENT FUNCTIONS ----

    // Shows the login/signup form and hides the to-do app
    function showAuthForm() {
        authForm.style.display = 'block';
        todoApp.style.display = 'none';
        currentUserId = null;
        currentUsername = null;
        todoList.innerHTML = ''; // Clear the task list on logout
        toggleAuthMode(false); // Reset to login form
    }

    // Shows the to-do app and hides the login/signup form
    async function showTodoApp(username, userId) {
        authForm.style.display = 'none';
        todoApp.style.display = 'block';
        userDisplay.textContent = username;
        currentUserId = userId;
        currentUsername = username;
        await fetchAndRenderTasks();
    }

    // Toggles between the login and signup forms
    function toggleAuthMode(isSignup = false) {
        if (isSignup) {
            authForm.innerHTML = `
                <h2>Sign Up</h2>
                <form id="signup-form">
                    <input type="text" id="signup-username" placeholder="Username" required>
                    <input type="password" id="signup-password" placeholder="Password" required>
                    <button type="submit">Sign Up</button>
                </form>
                <p>Already have an account? <a href="#" id="show-login">Login</a></p>
            `;
            document.getElementById('signup-form').addEventListener('submit', handleSignup);
            document.getElementById('show-login').addEventListener('click', (e) => {
                e.preventDefault();
                toggleAuthMode(false);
            });
        } else {
            authForm.innerHTML = `
                <h2>Login</h2>
                <form id="login-form">
                    <input type="text" id="username" placeholder="Username" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
                <p>Don't have an account? <a href="#" id="show-signup">Sign up</a></p>
            `;
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('show-signup').addEventListener('click', (e) => {
                e.preventDefault();
                toggleAuthMode(true);
            });
        }
    }

    // ---- TASK RENDERING AND MANAGEMENT ----

    // Fetches tasks from the Apps Script and renders them
    async function fetchAndRenderTasks() {
        const formData = new FormData();
        formData.append('action', 'getTasks');
        formData.append('userId', currentUserId);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                todoList.innerHTML = ''; // Clear existing tasks
                data.tasks.forEach(task => {
                    renderTask(task);
                });
            } else {
                alert(data.error || 'Failed to fetch tasks.');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            alert('An error occurred while fetching tasks.');
        }
    }

    // Renders a single task item to the list
    function renderTask(task) {
        const listItem = document.createElement('li');
        listItem.classList.add('todo-list-item');
        listItem.setAttribute('data-task-id', task.taskId);

        if (task.completed) {
            listItem.classList.add('completed');
        }

        listItem.innerHTML = `
            <span class="task-text">${task.task}</span>
            <div>
                <button class="toggle-complete-btn">${task.completed ? 'Uncomplete' : 'Complete'}</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners for the new buttons
        listItem.querySelector('.toggle-complete-btn').addEventListener('click', async () => {
            await toggleTaskCompletion(task.taskId, !task.completed);
        });

        listItem.querySelector('.delete-btn').addEventListener('click', async () => {
            await deleteTask(task.taskId);
        });

        todoList.appendChild(listItem);
    }

    // Toggles the completion status of a task
    async function toggleTaskCompletion(taskId, completedStatus) {
        const formData = new FormData();
        formData.append('action', 'updateTask');
        formData.append('taskId', taskId);
        formData.append('completed', completedStatus);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                // Re-fetch and re-render all tasks to update the list
                fetchAndRenderTasks();
            } else {
                alert(data.error || 'Failed to update task.');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('An error occurred while updating the task.');
        }
    }

    // Deletes a task
    async function deleteTask(taskId) {
        const formData = new FormData();
        formData.append('action', 'deleteTask');
        formData.append('taskId', taskId);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                // Re-fetch and re-render all tasks to update the list
                fetchAndRenderTasks();
            } else {
                alert(data.error || 'Failed to delete task.');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('An error occurred while deleting the task.');
        }
    }

    // ---- API CALLS (EXISTING AND NEW) ----

    // Handles the login form submission
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                showTodoApp(data.username, data.userId);
            } else {
                alert(data.error || 'Login failed.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login. Please try again.');
        }
    }

    // Handles the signup form submission
    async function handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;

        const formData = new FormData();
        formData.append('action', 'signup');
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                alert('Signup successful! You can now log in.');
                toggleAuthMode(false); // Switch back to login view
            } else {
                alert(data.error || 'Signup failed.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during signup. Please try again.');
        }
    }

    // Handles adding a new task
    async function handleAddTask(e) {
        e.preventDefault();
        const taskText = newTaskInput.value;
        if (!taskText) return;

        const formData = new FormData();
        formData.append('action', 'addTask');
        formData.append('userId', currentUserId);
        formData.append('task', taskText);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                newTaskInput.value = ''; // Clear the input field
                // Add the new task to the list without re-fetching all tasks
                renderTask(data.task); 
            } else {
                alert(data.error || 'Failed to add task.');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('An error occurred while adding the task.');
        }
    }

    // Handles the logout button click
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm();
    });
    
    // Add event listener for the add task form
    addTaskForm.addEventListener('submit', handleAddTask);

    // ---- INITIALIZATION ----
    showAuthForm(); // Start with the login form
});