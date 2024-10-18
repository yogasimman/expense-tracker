document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('saveButton').addEventListener('click', function (event) {
   

        // Collect trip details
        const tripName = document.getElementById('tripName').value;
        const travelType = document.querySelector('input[name="travelType"]:checked').value;

        // Collect flight entries
        const flightEntries = Array.from(document.querySelectorAll('#flightContainer .transport-entry')).map(entry => {
            const departFrom = entry.querySelector('.depart-from-flight')?.value || '';
            const arriveAt = entry.querySelector('.arrive-at-flight')?.value || '';
            const departureDate = entry.querySelector('.depart-date-flight')?.value || '';
            const returnDate = entry.querySelector('.return-date-flight')?.value || '';
            const description = entry.querySelector('.flight-description')?.value || '';

            // Only return if at least one field is filled
            if (departFrom || arriveAt || departureDate || returnDate || description) {
                return {
                    departFrom,
                    arriveAt,
                    departureDate,
                    returnDate,
                    description
                };
            }
            return null;
        }).filter(entry => entry !== null); // Remove null entries

        // Collect bus entries
        const busEntries = Array.from(document.querySelectorAll('#busContainer .transport-entry')).map(entry => {
            const departFrom = entry.querySelector('.depart-from-bus')?.value || '';
            const arriveAt = entry.querySelector('.arrive-at-bus')?.value || '';
            const departureDate = entry.querySelector('.depart-date-bus')?.value || '';
            const description = entry.querySelector('.bus-description')?.value || '';

            // Only return if at least one field is filled
            if (departFrom || arriveAt || departureDate || description) {
                return {
                    departFrom,
                    arriveAt,
                    departureDate,
                    description
                };
            }
            return null;
        }).filter(entry => entry !== null); // Remove null entries

        // Collect train entries
        const trainEntries = Array.from(document.querySelectorAll('#trainContainer .transport-entry')).map(entry => {
            const departFrom = entry.querySelector('.depart-from-train')?.value || '';
            const arriveAt = entry.querySelector('.arrive-at-train')?.value || '';
            const departureDate = entry.querySelector('.depart-date-train')?.value || '';
            const description = entry.querySelector('.train-description')?.value || '';

            // Only return if at least one field is filled
            if (departFrom || arriveAt || departureDate || description) {
                return {
                    departFrom,
                    arriveAt,
                    departureDate,
                    description
                };
            }
            return null;
        }).filter(entry => entry !== null); // Remove null entries

        // Collect cab entries
        const cabEntries = Array.from(document.querySelectorAll('#cabContainer .transport-entry')).map(entry => {
            const pickUpLocation = entry.querySelector('.depart-from-cab')?.value || '';
            const dropOffLocation = entry.querySelector('.arrive-at-cab')?.value || '';
            const pickUpDate = entry.querySelector('.depart-date-cab')?.value || '';
            const description = entry.querySelector('.cab-description')?.value || '';

            // Only return if at least one field is filled
            if (pickUpLocation || dropOffLocation || pickUpDate || description) {
                return {
                    pickUpLocation,
                    dropOffLocation,
                    pickUpDate,
                    description
                };
            }
            return null;
        }).filter(entry => entry !== null); // Remove null entries

        // Create the JSON object to send
        const tripData = {
            tripName: tripName,
            travelType: travelType,
            itinerary: {
                flights: flightEntries,
                buses: busEntries,
                trains: trainEntries,
                cabs: cabEntries
            }
        };

        console.log(tripData); // Log the trip data for debugging
        const p = document.getElementById('result');
        // Send the data using AJAX
        fetch('/ajax/add-trip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tripData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error, status = ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.message === 'Trip added successfully') {
                p.innerHTML =  `<span style="color:green"> ${data.message} </span>`;
                console.log('Success:', data);
                // Optionally redirect or show success message
            } else {
                p.innerHTML = `<span style="color:red"> ${data.message} </span>`;
                throw new Error('Error: ' + (data.message || 'Unknown error'));
            }
        })
        .catch((error) => {
            p.innerHTML = `<span style="color:red">Error: ${error} </span>`;
            console.error('Error:', error);
        });
    });
});
