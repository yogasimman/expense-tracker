document.querySelector('.expense-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const form = new FormData(this);
  const files = document.getElementById('file-upload').files;
  
  // First, upload receipts to GridFS
  const receiptUpload = await fetch('/upload-receipts', {
      method: 'POST',
      body: new FormData(document.getElementById('file-upload-form')) // Assuming you have a form element for file uploads
  });
  const { fileIds } = await receiptUpload.json();  // Get back the file IDs from GridFS

  // Then, collect the rest of the expense form data and include the file IDs
  const data = {
      userId: form.get('selectUser'),
      tripId: form.get('trips'),
      categoryId: form.get('category'),
      expenseTitle: form.get('expense-title'),
      amount: form.get('amount'),
      currency: form.get('currency'),
      description: form.get('description'),
      date: form.get('date'),
      receipts: fileIds  // Include the array of file IDs
  };

  // Send the expense data to your server
  fetch('/ajax/add-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
      if (result.message) {
          showModal(result.message, 'success');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showModal('Failed to add expense.', 'danger');
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
