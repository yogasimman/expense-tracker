document.querySelector('.expense-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent default form submission

  // Gather form data
  console.log(document.cookie);
  const expenseTitle = document.getElementById('expense-title').value;
  const amount = document.getElementById('amount').value;
  const currency = document.getElementById('currency').value
  const date = document.getElementById('date').value;
  const categoryId = document.getElementById('category').value;
  const tripId = document.getElementById('applyToTrip').value;
  const description = document.getElementById('description').value;
  const receipts = []; // Add logic for capturing receipts here if necessary

  // Make the AJAX POST request to add the expense
  fetch('/ajax/add-expense', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          expenseTitle,
          currency,
          amount,
          date,
          categoryId:categoryId,
          tripId,
          description,
          receipts,
          userId: '<%= req.session.user.id %>' // Pass the user ID from the session
      })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          document.getElementById('expense_response').innerText = data.message;
      } else {
          document.getElementById('expense_response').innerText = 'Error adding expense.';
      }
  })
  .catch(error => console.error('Error:', error));
});