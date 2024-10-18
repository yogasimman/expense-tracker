document.querySelector('.expense-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = new FormData(this);
    const files = document.getElementById('file-upload').files;
    const receipts = [];

    // Convert files to base64
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(e) {
            receipts.push({
                data: e.target.result.split(',')[1], // Base64 string
                contentType: file.type
            });
        };
        reader.readAsDataURL(file);
    }

    // Wait for all files to be read
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Collect form data
    const data = {
        userId: 'yourUserIdHere', // Replace this with the actual user ID
        tripId: form.get('trips'),
        categoryId: form.get('category'),
        expenseTitle: form.get('expense-title'),
        amount: form.get('amount'),
        currency: form.get('currency'),
        description: form.get('description'),
        date: form.get('date'),
        receipts
    };

    // Send the form data to the server using AJAX
    fetch('/ajax/add-expense', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            showModal(result.message, 'success'); // Show success modal
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showModal('Failed to add expense.', 'danger'); // Show error modal
    });
});

// Function to show modal
function showModal(message, type) {
    const modalHTML = `
        <div class="modal fade" id="responseModal" tabindex="-1" aria-labelledby="responseModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="responseModalLabel">${type === 'success' ? 'Success' : 'Error'}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                ${message}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-${type}" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('responseModal'));
    modal.show();
}
