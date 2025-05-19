const token = localStorage.getItem("access_token");
let updateing_task_id = 0;

const taskDetailsSection = document.getElementById("taskDetailsSection");
const manageUsersSection = document.getElementById("manageUsersSection");

document.getElementById("manageUsersBtn")?.addEventListener("click", () => {
  taskDetailsSection.style.display = "none";
  singleUserTaskSection.style.display = "none";
  dashboardpage.style.display = "block";
  manageUsersSection.style.display = "block";
});

document.getElementById("viewTasksBtn")?.addEventListener("click", () => {
  if (manageUsersSection) {
     manageUsersSection.style.display = "none";
  }
  taskDetailsSection.style.display = "block";
  dashboardpage.style.display = "block";
  singleUserTaskSection.style.display = "none";
});

document.querySelectorAll(".delete-user-btn")?.forEach((btn) => {
  btn?.addEventListener("click", async () => {
    const userId = btn.getAttribute("data-user-id");
    await fetch(`/api/users/manage/${userId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (response.status === 204) {
        console.log("User deleted successfully");
      } else {
        return response.json().then((data) => {
          console.error("Error:", data);
        });
      }
    });
    window.location.href = "/dashboard/";
  });
});

const form = document.getElementById("createUserForm");

form?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form); // ✅ Fix: Ensure `form` is an HTMLFormElement
  const payload = {
    username: formData.get("username"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: Array.from(form.querySelector("#role").selectedOptions).map(
      (opt) => opt.value
    ),
    reporting_head: formData.get("reporting_head")
  };

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
    alert("User created successfully!");
    form.reset();
  } else {
    alert("Error: " + JSON.stringify(result));
  }
  window.location.href = "/dashboard/";
  manageUsersSection.style.display = "none";
  taskDetailsSection.style.display = "block";
});

const dashboardpage = document.getElementById("dashboardpage");
const singleUserTaskSection = document.getElementById("singleUserTaskSection");
const backBtn = document.getElementById("backToDashboard");
const userTaskTableBody = document.getElementById("userTaskTableBody");
const selectedUserName = document.getElementById("selectedUserName");

document.querySelectorAll(".view-user-tasks")?.forEach((btn) => {
  btn?.addEventListener("click", async () => {
    const userId = btn.getAttribute("data-user-id");

    const row = btn.closest("tr");
    const name = row.children[0].textContent;
    selectedUserName.textContent = name;

    const response = await fetch(`/api/user-tasks/${userId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      userTaskTableBody.innerHTML = ""; // Clear old

      if (data.tasks.length > 0) {
        data.tasks.forEach((task) => {
          userTaskTableBody.innerHTML += `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.description}</td>
                  <td>${task.status}</td>
                  <td>
                    ${
                      task.status !== "Completed"
                        ? `
                      <button
                        type="button"
                        class="btn btn-sm btn-success change-task-status"
                        data-user-id="${task.id}"
                        id="makeasCompleted"
                        data-bs-toggle="modal"
                        data-bs-target="#makeasCompletedModal"
                        style="cursor: pointer"
                      >
                        Mark as completed
                      </button>
                    `
                        : ""
                    }
                  </td>
                </tr>
              `;
        });

        document.querySelectorAll(".change-task-status")?.forEach((btn) => {
          btn?.addEventListener("click", () => {
            updateing_task_id = btn.getAttribute("data-user-id");
          });
        });
      } else {
        userTaskTableBody.innerHTML = `
              <tr><td colspan="3" class="text-center">No tasks found</td></tr>
          `;
      }

      // Show the section
      dashboardpage.style.display = "none";
      singleUserTaskSection.style.display = "block";
    } else {
      alert("Failed to load user tasks.");
    }
  });
});

const task_form = document.getElementById("createTaskForm");

task_form?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(task_form);
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
    assigned_to: formData.get("assigned_to"),
    due_date: formData.get("due_date"),
    status: "ToDo",
  };

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
    alert("User created successfully!");
    task_form.reset();
    window.location.href = "/dashboard/";
    manageUsersSection.style.display = "none";
    taskDetailsSection.style.display = "block";
  } else {
    alert("Error: " + JSON.stringify(result?.Error));
  }
});

const taskcompleteForm = document.getElementById("makeasCompletedForm");
taskcompleteForm?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const taskData = new FormData(taskcompleteForm);
  const data = {
    completion_report: taskData.get("completion_report"),
    worked_hours: taskData.get("worked_hours"),
  };

  const response = await fetch(`/api/task/manage/${updateing_task_id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    alert("Marked as completed.");
    form.reset();
    window.location.href = "/dashboard/";
  } else {
    alert(
      "Completion report and Worked hours are required when task is completed."
    );
  }
  
});

const roleSelect = document.getElementById("role");
roleSelect?.addEventListener("change", () => {
  const selectedRoles = Array.from(roleSelect.selectedOptions).map(
    option => option.textContent.trim()
  );
  
  // Show if "User" is selected (change this logic as needed)
  const shouldShow = selectedRoles.includes("User");
  
  const reportingHeadDiv = document.getElementById("reportingHeadContainer");
  reportingHeadDiv.style.display = shouldShow ? "block" : "none";
  
})
