const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function renderUsers(list) {
    usersList.textContent = "";

    for (const user of list) {
        const item = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        item.append(name, email, city, company);
        usersList.append(item);
    }
}

async function loadUsers() {
    loadButton.disabled = true;
    statusMessage.textContent = "Loading users...";

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        users = await response.json();
        filterInput.value = "";
        renderUsers(users);

        statusMessage.textContent = `Loaded ${users.length} users.`;
    } catch (error) {
        statusMessage.textContent = `Could not load users: ${error.message}`;
    } finally {
        loadButton.disabled = false;
    }
}

loadButton.addEventListener("click", loadUsers)

filterInput.addEventListener("input", () => {
    const searchText = filterInput.value.trim().toLowerCase();

    const matchingUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchText)
    );

    renderUsers(matchingUsers);

    statusMessage.textContent = matchingUsers.length === 0
        ? "No users match your filter."
        : `Showing ${matchingUsers.length} of ${users.length} users.`;
});