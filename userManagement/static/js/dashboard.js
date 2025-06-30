const token = localStorage.getItem("access_token");
let updating_task_id = 0;

const taskDetailsSection = document.getElementById("taskDetailsSection");
const manageUsersSection = document.getElementById("manageUsersSection");
const singleUserTaskSection = document.getElementById("singleUserTaskSection");
const userDashboardSection = document.getElementById("userDashboardSection"); // Added for user role

const userTaskTableBody = document.getElementById("userTaskTableBody");
const selectedUserName = document.getElementById("selectedUserName");
const alertContainer = document.getElementById("alertContainer");

/**
 * Helper function to display alert messages.
 * @param {string} message The message to display.
 * @param {'success' | 'danger' | 'warning' | 'info'} type The type of alert.
 */
function showAlert(message, type = 'info') {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    // Optionally, hide after a few seconds
    setTimeout(() => {
        const currentAlert = alertContainer.querySelector('.alert');
        if (currentAlert) {
            new bootstrap.Alert(currentAlert).close();
        }
    }, 5000);
}

/**
 * Manages the visibility of dashboard sections and active nav link.
 * @param {HTMLElement} showSection The section to show.
 * @param {HTMLElement | null} activeNavLink The nav link to set as active.
 */
function showSection(showSection, activeNavLink = null) {
    // Hide all main sections
    [dashboardpage, manageUsersSection, taskDetailsSection, singleUserTaskSection, userDashboardSection].forEach(section => {
        if (section) section.style.display = "none";
    });

    // Remove active class from all nav links
    document.querySelectorAll(".sidebar .nav-link").forEach(link => {
        link.classList.remove("active");
    });

    // Show the desired section
    if (showSection) {
        showSection.style.display = "block";
    }

    // Set active class on the chosen nav link
    if (activeNavLink) {
        activeNavLink.classList.add("active");
    }
}

// --- Navigation Event Listeners ---

document.getElementById("dashboardOverviewBtn")?.addEventListener("click", () => {
    showSection(dashboardpage, document.getElementById("dashboardOverviewBtn"));
    if(userDashboardSection) {
      userDashboardSection.style.display = "block";
    }
});

document.getElementById("manageUsersBtn")?.addEventListener("click", () => {
    showSection(manageUsersSection, document.getElementById("manageUsersBtn"));
});

document.getElementById("viewTasksBtn")?.addEventListener("click", () => {
    showSection(taskDetailsSection, document.getElementById("viewTasksBtn"));
});

document.getElementById("backToTaskDetailsBtn")?.addEventListener("click", () => {
    showSection(taskDetailsSection, document.getElementById("viewTasksBtn")); // Go back to task details
});


// --- User Management (Super Admin) ---

document.querySelectorAll(".delete-user-btn")?.forEach((btn) => {
    btn?.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return; // User cancelled
        }

        const userId = btn.getAttribute("data-user-id");
        try {
            const response = await fetch(`/api/users/manage/${userId}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 204) {
                showAlert("User deleted successfully!", "success");
                btn.closest("tr").remove(); // Remove row from table
            } else {
                const data = await response.json();
                showAlert(`Error deleting user: ${data.detail || JSON.stringify(data)}`, "danger");
            }
        } catch (error) {
            showAlert(`Network error: ${error.message}`, "danger");
        }
    });
});

const createUserForm = document.getElementById("createUserForm");
createUserForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(createUserForm);
    const payload = {
        username: formData.get("username"),
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: Array.from(createUserForm.querySelector("#role").selectedOptions).map(
            (opt) => opt.value
        ),
        reporting_head: formData.get("reporting_head") || null // Handle empty selection
    };

    try {
        const response = await fetch("/api/users/create/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (response.ok) {
            showAlert("User created successfully!", "success");
            createUserForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide(); // Close modal
            // Optionally, reload or update table
            window.location.reload(); // Simple reload for demonstration
        } else {
            showAlert(`Error creating user: ${result.detail || JSON.stringify(result)}`, "danger");
        }
    } catch (error) {
        showAlert(`Network error: ${error.message}`, "danger");
    }
});

const roleSelect = document.getElementById("role");
roleSelect?.addEventListener("change", () => {
    const selectedRoleLabels = Array.from(roleSelect.selectedOptions).map(
        option => option.textContent.trim()
    );

    const reportingHeadDiv = document.getElementById("reportingHeadContainer");
    // Show reporting head if 'User' role is selected
    const shouldShow = selectedRoleLabels.includes("User");
    reportingHeadDiv.style.display = shouldShow ? "block" : "none";

    // If 'User' is not selected, clear the reporting head selection
    if (!shouldShow) {
        const reportingHeadSelect = reportingHeadDiv.querySelector('select[name="reporting_head"]');
        if (reportingHeadSelect) {
            reportingHeadSelect.value = "";
        }
    }
});


// --- Task Management (Super Admin & Admin) ---

document.querySelectorAll(".view-user-tasks")?.forEach((btn) => {
    btn?.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-user-id");
        const row = btn.closest("tr");
        const name = row.children[0].textContent;
        selectedUserName.textContent = name;

        try {
            const response = await fetch(`/api/user-tasks/${userId}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                userTaskTableBody.innerHTML = ""; // Clear old tasks

                if (data.tasks.length > 0) {
                    data.tasks.forEach((task) => {
                        userTaskTableBody.innerHTML += `
                            <tr>
                                <td>${task.title}</td>
                                <td>${task.description || 'N/A'}</td>
                                <td><span class="badge ${task.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${task.status}</span></td>
                                <td>
                                    ${
                                        task.status !== "Completed"
                                            ? `
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-success change-task-status"
                                                data-task-id="${task.id}"
                                                data-bs-toggle="modal"
                                                data-bs-target="#makeasCompletedModal"
                                            >
                                                <i class="fas fa-check"></i> Mark as Completed
                                            </button>
                                            `
                                            : `<span class="text-muted">Completed</span>`
                                    }
                                </td>
                            </tr>
                        `;
                    });

                    // Attach event listeners to newly created "Mark as Completed" buttons
                    document.querySelectorAll(".change-task-status")?.forEach((taskBtn) => {
                        taskBtn?.addEventListener("click", () => {
                            updating_task_id = taskBtn.getAttribute("data-task-id");
                            // Clear form fields when opening the modal
                            document.getElementById("completion_report").value = "";
                            document.getElementById("worked_hours").value = "";
                        });
                    });
                } else {
                    userTaskTableBody.innerHTML = `
                        <tr><td colspan="4" class="text-center">No tasks found for this user.</td></tr>
                    `;
                }
                showSection(singleUserTaskSection); // Show this section
            } else {
                const errorData = await response.json();
                showAlert(`Failed to load user tasks: ${errorData.detail || JSON.stringify(errorData)}`, "danger");
            }
        } catch (error) {
            showAlert(`Network error: ${error.message}`, "danger");
        }
    });
});

const createTaskForm = document.getElementById("createTaskForm");
createTaskForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(createTaskForm);
    const data = {
        title: formData.get("title"),
        description: formData.get("description"),
        assigned_to: formData.get("assigned_to"),
        due_date: formData.get("due_date"),
        status: "ToDo",
    };

    try {
        const response = await fetch("/api/task/create/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
            showAlert("Task created successfully!", "success");
            createTaskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('createTaskModal')).hide(); // Close modal
            window.location.reload(); // Simple reload for demonstration
        } else {
            showAlert(`Error creating task: ${result.detail || JSON.stringify(result)}`, "danger");
        }
    } catch (error) {
        showAlert(`Network error: ${error.message}`, "danger");
    }
});

const makeasCompletedForm = document.getElementById("makeasCompletedForm");
makeasCompletedForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const taskData = new FormData(makeasCompletedForm);
    const payload = {
        completion_report: taskData.get("completion_report"),
        worked_hours: parseInt(taskData.get("worked_hours"), 10), // Parse to integer
        status: "Completed" // Set status to Completed
    };

    if (!payload.completion_report || isNaN(payload.worked_hours) || payload.worked_hours < 0) {
        showAlert("Please provide a completion report and valid worked hours.", "warning");
        return;
    }

    try {
        const response = await fetch(`/api/task/manage/${updating_task_id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            showAlert("Task marked as completed successfully!", "success");
            makeasCompletedForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('makeasCompletedModal')).hide(); // Close modal
            window.location.reload(); // Simple reload for demonstration
        } else {
            const errorData = await response.json();
            showAlert(`Error marking task complete: ${errorData.detail || JSON.stringify(errorData)}`, "danger");
        }
    } catch (error) {
        showAlert(`Network error: ${error.message}`, "danger");
    }
});


// --- User Role Task Completion ---
document.querySelectorAll(".complete-task-btn")?.forEach((btn) => {
    btn?.addEventListener("click", () => {
        updating_task_id = btn.getAttribute("data-task-id");
        // Clear form fields when opening the modal
        document.getElementById("completion_report").value = "";
        document.getElementById("worked_hours").value = "";
    });
});


// Initial display logic based on user roles
document.addEventListener('DOMContentLoaded', () => {
    const userRolesElement = document.querySelector('body'); // or a more specific element if user_roles is passed differently
    const userRoles = userRolesElement ? userRolesElement.dataset.userRoles?.split(',') : []; // Assuming user_roles is passed as a data attribute

    const superAdminRoles = ['Super Admin', 'Admin'];
    const hasAdminOrSuperAdmin = userRoles?.some(role => superAdminRoles.includes(role));
    const isUserOnly = userRoles?.includes('User') && userRoles.length === 1; // Check if only 'User' role

    if (hasAdminOrSuperAdmin) {
        showSection(dashboardpage, document.getElementById("dashboardOverviewBtn"));
    } else if (isUserOnly) {
        showSection(userDashboardSection); // User's own dashboard
    } else {
        // Fallback or default view if no specific role matches
        // You might want to redirect to a login page or display a generic message
        console.warn("No specific dashboard view for current user roles.");
    }
});

// --- Modal Specific Live Validation Functions ---

// Helper to manage validation states
function validateInput(inputElement, feedbackElement, validationFn, errorMessage) {
  if (validationFn(inputElement.value.trim())) {
      inputElement.classList.remove('is-invalid');
      inputElement.classList.add('is-valid'); // Optional: green border for valid
      feedbackElement.textContent = '';
      feedbackElement.classList.remove('active');
      return true;
  } else {
      inputElement.classList.remove('is-valid');
      inputElement.classList.add('is-invalid');
      feedbackElement.textContent = errorMessage;
      feedbackElement.classList.add('active');
      return false;
  }
}

// Validation rules for Create User Modal
const validateCreateUsername = (username) => username.length >= 3 && username.length <= 30;
const validateCreateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateCreatePassword = (password) => password.length >= 6;
const validateCreateRole = (selectElement) => selectElement.selectedOptions.length > 0;

// Validation rules for Create Task Modal
const validateCreateTaskTitle = (title) => title.length > 0;
const validateCreateTaskAssignedTo = (userId) => userId !== "";
const validateCreateTaskDueDate = (date) => {
  const inputDate = new Date(date);
  return !isNaN(inputDate) && inputDate >= new Date(); // Must be a valid date and not in the past
};


// Function to attach validation listeners for a given form
function attachModalValidation(formId, fields) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Reset form and validation state when modal is hidden
  const modalElement = form.closest('.modal');
  if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
          form.reset();
          form.querySelectorAll('.form-control, .form-select').forEach(input => {
              input.classList.remove('is-invalid', 'is-valid');
          });
          form.querySelectorAll('.invalid-feedback').forEach(feedback => {
              feedback.classList.remove('active');
              feedback.textContent = '';
          });
          // Reset reporting head display if it's the create user form
          if (formId === 'createUserForm') {
              document.getElementById('reportingHeadContainer').style.display = 'none';
          }
      });
  }


  fields.forEach(field => {
      const input = form.querySelector(`#${field.id}`);
      const feedback = form.querySelector(`#${field.feedbackId}`);

      if (input && feedback) {
          input.addEventListener('input', () => {
              // Special handling for select-multiple, it doesn't have .value like others
              if (input.tagName === 'SELECT' && input.multiple) {
                   validateInput(input, feedback, () => field.validationFn(input), field.errorMessage);
              } else {
                   validateInput(input, feedback, field.validationFn, field.errorMessage);
              }
          });
      }
  });

  form.addEventListener('submit', function(event) {
      let formIsValid = true;
      fields.forEach(field => {
          const input = form.querySelector(`#${field.id}`);
          const feedback = form.querySelector(`#${field.feedbackId}`);
          if (input && feedback) {
              let currentFieldIsValid;
              if (input.tagName === 'SELECT' && input.multiple) {
                  currentFieldIsValid = validateInput(input, feedback, () => field.validationFn(input), field.errorMessage);
              } else {
                  currentFieldIsValid = validateInput(input, feedback, field.validationFn, field.errorMessage);
              }

              if (!currentFieldIsValid) {
                  formIsValid = false;
              }
          }
      });

      if (!formIsValid) {
          event.preventDefault(); // Stop submission if any field is invalid
          // Optionally, scroll to the first invalid field
          form.querySelector('.is-invalid')?.focus();
      } else {
          // Disable button and show spinner on actual submission
          const submitBtn = form.querySelector('.modal-submit-btn');
          if (submitBtn) {
              // If you have a spinner/loading state on the button:
              // submitBtn.querySelector('.button-text').style.display = 'none';
              // submitBtn.querySelector('.spinner-border').style.display = 'inline-block';
              // submitBtn.disabled = true;
          }
      }
  });
}


attachModalValidation('createUserForm', [
  { id: 'username', feedbackId: 'createUsernameFeedback', validationFn: validateCreateUsername, errorMessage: 'Username must be 3-30 characters.' },
  { id: 'email', feedbackId: 'createEmailFeedback', validationFn: validateCreateEmail, errorMessage: 'Please enter a valid email address.' },
  { id: 'password', feedbackId: 'createPasswordFeedback', validationFn: validateCreatePassword, errorMessage: 'Password must be at least 6 characters.' },
  { id: 'role', feedbackId: 'createRoleFeedback', validationFn: (select) => select.selectedOptions.length > 0, errorMessage: 'Please select at least one role.' }
]);

attachModalValidation('createTaskForm', [
  { id: 'title', feedbackId: 'createTaskTitleFeedback', validationFn: validateCreateTaskTitle, errorMessage: 'Task title cannot be empty.' },
  { id: 'assigned_to', feedbackId: 'createTaskAssignedToFeedback', validationFn: validateCreateTaskAssignedTo, errorMessage: 'Please assign the task to a user.' },
  { id: 'due_date', feedbackId: 'createTaskDueDateFeedback', validationFn: validateCreateTaskDueDate, errorMessage: 'Please select a valid future due date.' }
]);


document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const passwordField = document.getElementById(targetId);
      const toggleIcon = this.querySelector('i');

      if (passwordField.type === 'password') {
          passwordField.type = 'text';
          toggleIcon.classList.remove('fa-eye');
          toggleIcon.classList.add('fa-eye-slash');
      } else {
          passwordField.type = 'password';
          toggleIcon.classList.remove('fa-eye-slash');
          toggleIcon.classList.add('fa-eye');
      }
  });
});