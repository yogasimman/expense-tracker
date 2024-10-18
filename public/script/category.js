function fetchCategories() {
    fetch('/ajax/category')
        .then(response => response.json())
        .then(data => {
            // Populate the expense category select box
            const expenseCategorySelect = document.getElementById('category');
            expenseCategorySelect.innerHTML = '<option value="">Select a Category</option>';
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id; // Using _id as the identifier
                option.textContent = category.name;
                expenseCategorySelect.appendChild(option);
            });

            // Check if the remove-category select box exists
            const removeCategorySelect = document.getElementById('remove-category');
            if (removeCategorySelect) {
                removeCategorySelect.innerHTML = '<option value="">Select a Category to Remove</option>';
                data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category._id; // Using _id as the identifier
                    option.textContent = category.name;
                    removeCategorySelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error fetching categories:', error));
}


// Call fetchCategories on page load
document.addEventListener('DOMContentLoaded', fetchCategories);

// Function to add a new category
function addCategory() {
    const newCategory = document.getElementById('new-category').value;

    fetch('/ajax/category', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategory })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Category added:', data);
        fetchCategories(); // Refresh the category list
        document.getElementById('new-category').value = ''; // Clear input
    })
    .catch(error => console.error('Error adding category:', error));
}

// Function to remove a category
function removeCategory() {
    const removeCategoryId = document.getElementById('remove-category').value;

    if (!removeCategoryId) {
        alert('Please select a category to remove.');
        return;
    }

    fetch(`/ajax/category`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: removeCategoryId })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Category removed:', data);
        fetchCategories(); // Refresh the category list
    })
    .catch(error => console.error('Error removing category:', error));
}