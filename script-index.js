// public/script.js

document.getElementById('fetchUsersBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const usersData = await response.json();

        const userListDiv = document.getElementById('userList');
        userListDiv.innerHTML = ''; // Clear existing user list

        for (const user of usersData) {
            const { name, email, phone, website, address, company, id: api_user_id } = user;
            const city = address.city;
            const company_name = company.name;
            const catch_phrase = company.catchPhrase;
            const bs = company.bs;

            const existsInDatabase = await checkUserExistsInDatabase(api_user_id);

            displayUser(name, email, phone, website, city, company_name, catch_phrase, bs, existsInDatabase, api_user_id);
        }

        userListDiv.style.display = 'block';
    } catch (error) {
        console.error('Error fetching users:', error);
    }
});

async function checkUserExistsInDatabase(api_user_id) {
    try {
        const response = await fetch(`/checkUser?api_user_id=${api_user_id}`);
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error('Error checking user existence in database:', error);
        return false;
    }
}

function displayUser(name, email, phone, website, city, company_name, catch_phrase, bs, existsInDatabase, userId) {
    const userListDiv = document.getElementById('userList');
    const userDiv = document.createElement('div');
    userDiv.innerHTML = `
        <h2>${name}</h2>
        <p>Email: ${email}</p>
        <p>Phone: ${phone}</p>
        <p>Website: ${website}</p>
        <p>City: ${city}</p>
        <p>Company: ${company_name}</p>
        ${existsInDatabase ? '' : '<button class="add-btn">Add</button>'}
        <hr>
    `;
    userListDiv.appendChild(userDiv);

    const addButton = userDiv.querySelector('.add-btn');
    if (addButton) {
        addButton.setAttribute('data-user-id', userId);
        addButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/addUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, phone, website, city, company_name, catch_phrase, bs, api_user_id: userId }),
                });
                if(response.ok) {
                    console.log('User added successfully');
                    addButton.remove(); // Remove "Add" button after successful addition
                    const openButton = document.createElement('button');
                    openButton.textContent = 'Open';
                    openButton.className = 'open-btn';
                    openButton.addEventListener('click', () => window.location.href = `post.html?userId=${userId}`);
                    userDiv.appendChild(openButton); // Add "Open" button
                } else {
                    console.error('Failed to add user');
                }
            } catch (error) {
                console.error('Error adding user:', error);
            }
        });
    } else if (existsInDatabase) {
        const openButton = document.createElement('button');
        openButton.textContent = 'Open';
        openButton.className = 'open-btn';
        openButton.addEventListener('click', () => window.location.href = `post.html?userId=${userId}`);
        userDiv.appendChild(openButton); // Ensure "Open" button is added for existing users
    }
}
