
document.getElementById('advanceForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Gather form data
    const formData = {
        userId: document.getElementById('selectUser') ? document.getElementById('selectUser').value : null,
        amount: document.getElementById('amount').value,
        currency: document.querySelector('select[name="currency"]').value,
        date: document.getElementById('date').value,
        paidThrough: document.getElementById('paidThrough').value,
        reference: document.getElementById('reference').value,
        notes: document.getElementById('notes').value,
        tripId: document.getElementById('applyToTrip').value
    };

    // Send AJAX request to record the advance
    fetch('/ajax/advances', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Advance recorded successfully!');
            // Optionally redirect or reset the form
            window.location.href = '/advances'; // Redirect to the advances page
        } else {
            alert('Error recording advance: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// User and trip select handling
document.getElementById('selectUser').addEventListener('change', function() {
    const userId = this.value;
    
    if (userId) {
        // Make an AJAX request to fetch trips for the selected user
        fetch(`/trips/${userId}`)
            .then(response => response.json())
            .then(trips => {
                const tripSelect = document.getElementById('applyToTrip');
                tripSelect.innerHTML = '<option selected>Select</option>';
                trips.forEach(trip => {
                    const option = document.createElement('option');
                    option.value = trip.id;
                    option.textContent = trip.tripName;
                    tripSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching trips:', error));
    }
});

