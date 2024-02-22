document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    // Initially hide both buttons until we know the state of the posts
    const bulkAddBtn = document.getElementById('bulkAddBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    bulkAddBtn.style.display = 'none';
    downloadExcelBtn.style.display = 'none';

    try {
        // Fetch user posts
        const postData = await fetchUserPosts(userId);
        if (!postData || postData.length === 0) {
            console.log('No posts found for user. Showing Bulk Add button.');
            bulkAddBtn.style.display = 'block';
        } else {
            console.log('Posts found for user.');
            const userData = await fetchUserData(userId);
            if (!userData) {
                console.log('User data not found.');
                return;
            }
            displayUserDataAndPosts(userData, postData);

            // Check if posts exist in the database
            const postsExist = await checkPostsExistInDatabase(postData);
            if (postsExist) {
                console.log('Posts exist in database. Showing Download in Excel button.');
                downloadExcelBtn.style.display = 'block';
            } else {
                console.log('Posts not found in database. Showing Bulk Add button.');
                bulkAddBtn.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error fetching user data/posts:', error);
    }

    // Add event listener for Bulk Add button
    bulkAddBtn.addEventListener('click', async () => {
        try {
            // Fetch user posts
            const postData = await fetchUserPosts(userId);
            if (!postData || postData.length === 0) {
                console.log('No posts to add.');
                return;
            }

            // Add posts to the database
            await addPostsToDatabase(postData);

            // Reload the page to reflect the changes
            location.reload();
        } catch (error) {
            console.error('Error performing bulk add:', error);
        }
    });

    // Add event listener for Download in Excel button
    downloadExcelBtn.addEventListener('click', async () => {
        console.log('Download in Excel button clicked');
        await downloadPostsExcel(userId);
    });
});

async function fetchUserPosts(userId) {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`);
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

async function fetchUserData(userId) {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
    if (!response.ok) throw new Error('Network response was not ok.');
    return response.json();
}

async function checkPostsExistInDatabase(postData) {
    try {
        const response = await fetch(`/checkPostsExist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ posts: postData })
        });
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error('Error checking posts existence in database:', error);
        return false;
    }
}

function displayUserDataAndPosts(userData, postData) {
    postData.forEach(post => {
        const { title, body } = post;
        displayPost(userData.name, title, body, userData.company.name);
    });
}

async function addPostsToDatabase(postData) {
    try {
        const response = await fetch(`/bulkAddPosts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ posts: postData })
        });
        const data = await response.json();
        console.log('Response from bulk add:', data);
    } catch (error) {
        console.error('Error adding posts to database:', error);
    }
}

function displayPost(userName, title, body, companyName) {
    const postListDiv = document.getElementById('postList');
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');
    postDiv.innerHTML = `
        <h2>${userName}</h2>
        <p>Title: ${title}</p>
        <p>Body: ${body}</p>
        <p>Company: ${companyName}</p>
    `;
    postListDiv.appendChild(postDiv);
}

async function downloadPostsExcel(userId) {
    try {
        const response = await fetch(`/downloadPostsExcel?userId=${userId}`);
        if (!response.ok) throw new Error('Error downloading posts in Excel');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posts.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading posts in Excel:', error);
    }
}
