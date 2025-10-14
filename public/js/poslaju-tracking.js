// Poslaju Tracking - Frontend JavaScript
(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('tracking-form');
    const trackingNumberInput = document.getElementById('tracking-number');
    const submitBtn = document.getElementById('submit-btn');
    const buttonText = document.getElementById('button-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const resultsContainer = document.getElementById('results-container');

    // Result containers
    const parcelInfo = document.getElementById('parcel-info');
    const trackingEvents = document.getElementById('tracking-events');
    const deliveryInfo = document.getElementById('delivery-info');
    const deliveryContainer = document.getElementById('delivery-container');

    // Status elements
    const statusText = document.getElementById('status-text');
    const statusBadge = document.getElementById('status-badge');
    const statusLocation = document.getElementById('status-location');
    const statusTimestamp = document.getElementById('status-timestamp');

    // Sample tracking numbers
    const sampleItems = document.querySelectorAll('.sample-item');

    // Initialize
    init();

    function init() {
        // Add form event listener
        form.addEventListener('submit', handleFormSubmit);
        
        // Add input validation and formatting
        trackingNumberInput.addEventListener('input', validateTrackingNumber);
        
        // Add sample item click handlers
        sampleItems.forEach(item => {
            item.addEventListener('click', () => {
                const trackingNumber = item.getAttribute('data-tracking');
                trackingNumberInput.value = trackingNumber;
                validateTrackingNumber();
            });
        });
        
        // Add visual effects
        addVisualEffects();
    }

    function addVisualEffects() {
        // Add hover effects to form elements
        const formInput = document.querySelector('.form-input');
        formInput.addEventListener('focus', () => {
            formInput.style.transform = 'scale(1.02)';
        });
        
        formInput.addEventListener('blur', () => {
            formInput.style.transform = 'scale(1)';
        });

        // Add pulse effect to sample items
        sampleItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = '0 10px 25px rgba(255, 149, 0, 0.3)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = 'none';
            });
        });
    }

    function validateTrackingNumber() {
        const value = trackingNumberInput.value.trim().toUpperCase();
        
        // Set the formatted value back to input
        trackingNumberInput.value = value;
        
        // Basic validation for common tracking number formats
        const isValid = validateFormat(value);
        
        if (isValid && value.length >= 5) {
            trackingNumberInput.style.borderColor = '#00ff00';
            trackingNumberInput.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
        } else if (value.length > 0) {
            trackingNumberInput.style.borderColor = '#ffff00';
            trackingNumberInput.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.3)';
        } else {
            trackingNumberInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            trackingNumberInput.style.boxShadow = 'none';
        }
    }

    function validateFormat(trackingNumber) {
        // Common Poslaju tracking number patterns
        const patterns = [
            /^[A-Z]{2}[0-9]{9}MY$/i,  // EP123456789MY (Express/EMS)
            /^[A-Z]{2}[0-9]{8,11}MY$/i, // Various formats ending with MY
            /^[0-9]{10,15}$/,           // Numeric only
            /^[A-Z]{1,3}[0-9]{6,12}$/i  // Letter prefix with numbers
        ];
        
        return patterns.some(pattern => pattern.test(trackingNumber));
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const trackingNumber = trackingNumberInput.value.trim().toUpperCase();
        
        // Validate input
        if (!trackingNumber) {
            showError('Please enter a tracking number');
            return;
        }
        
        if (trackingNumber.length < 5) {
            showError('Tracking number must be at least 5 characters');
            return;
        }

        if (!validateFormat(trackingNumber)) {
            showError('Please enter a valid Poslaju tracking number format');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        hideMessages();
        hideResults();
        
        try {
            // Make API request
            const response = await fetch('/api/poslaju/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trackingNumber: trackingNumber })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle different types of errors
                if (response.status === 404) {
                    throw new Error('Tracking number not found in Poslaju system');
                } else if (response.status === 401) {
                    throw new Error('Authentication error with Poslaju API');
                } else if (response.status === 503) {
                    throw new Error('Poslaju tracking service is temporarily unavailable');
                } else {
                    throw new Error(data.error || 'Failed to track parcel');
                }
            }
            
            // Display results
            displayResults(data, trackingNumber);
            showSuccess('Tracking information retrieved successfully!');
            
        } catch (error) {
            console.error('Error tracking parcel:', error);
            
            // Show mock data for development/testing
            if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
                showMockResults(trackingNumber);
                showSuccess('Showing sample tracking data (API development mode)');
            } else {
                showError(error.message || 'Failed to retrieve tracking information. Please try again.');
            }
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            buttonText.textContent = 'Tracking...';
            submitBtn.style.opacity = '0.7';
        } else {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            buttonText.textContent = '🚀 Track My Parcel';
            submitBtn.style.opacity = '1';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    function hideResults() {
        resultsContainer.style.display = 'none';
    }

    function showResults() {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function displayResults(data, trackingNumber) {
        // Clear previous results
        parcelInfo.innerHTML = '';
        trackingEvents.innerHTML = '';
        deliveryInfo.innerHTML = '';
        
        if (!data.trackingInfo) {
            showError('No tracking information found for this parcel');
            return;
        }
        
        const info = data.trackingInfo;
        
        // Update current status
        updateCurrentStatus(info);
        
        // Display parcel information
        displayParcelInfo(info, trackingNumber);
        
        // Display tracking events/history
        displayTrackingEvents(info.events || []);
        
        // Display delivery information
        displayDeliveryInfo(info.delivery || {});
        
        // Show results container
        showResults();
    }

    function updateCurrentStatus(info) {
        const currentStatus = info.currentStatus || 'Unknown';
        const location = info.currentLocation || 'Location not available';
        const timestamp = info.lastUpdate || new Date().toISOString();
        
        // Update status badge
        statusText.textContent = currentStatus;
        statusLocation.textContent = location;
        statusTimestamp.textContent = `Updated: ${formatTimestamp(timestamp)}`;
        
        // Update badge color based on status
        updateStatusBadgeColor(currentStatus);
    }

    function updateStatusBadgeColor(status) {
        const statusLower = status.toLowerCase();
        
        // Reset classes
        statusBadge.className = 'status-badge';
        
        if (statusLower.includes('delivered')) {
            statusBadge.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        } else if (statusLower.includes('out for delivery')) {
            statusBadge.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
        } else if (statusLower.includes('in transit') || statusLower.includes('processing')) {
            statusBadge.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
        } else if (statusLower.includes('exception') || statusLower.includes('failed')) {
            statusBadge.style.background = 'linear-gradient(135deg, #F44336, #D32F2F)';
        } else {
            statusBadge.style.background = 'linear-gradient(135deg, #ff9500, #ff7b00)';
        }
    }

    function displayParcelInfo(info, trackingNumber) {
        const parcelData = [
            { label: 'Tracking Number', value: trackingNumber },
            { label: 'Service Type', value: info.serviceType || 'Standard Post' },
            { label: 'Weight', value: info.weight || 'Not specified' },
            { label: 'Dimensions', value: info.dimensions || 'Not specified' },
            { label: 'Origin', value: info.origin || 'Malaysia' },
            { label: 'Destination', value: info.destination || 'Not specified' },
            { label: 'Estimated Delivery', value: formatDate(info.estimatedDelivery) || 'Not available' },
            { label: 'Status', value: info.currentStatus || 'Unknown' }
        ];
        
        parcelData.forEach(item => {
            if (item.value && item.value !== 'Not specified') {
                const infoItem = createInfoItem(item.label, item.value);
                parcelInfo.appendChild(infoItem);
            }
        });
    }

    function displayTrackingEvents(events) {
        if (!events || events.length === 0) {
            trackingEvents.innerHTML = '<p style="color: #888; text-align: center;">No tracking events available</p>';
            return;
        }
        
        // Sort events by timestamp (newest first)
        const sortedEvents = events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sortedEvents.forEach((event, index) => {
            const eventElement = createTimelineEvent(event, index === 0);
            trackingEvents.appendChild(eventElement);
        });
    }

    function displayDeliveryInfo(delivery) {
        if (!delivery || Object.keys(delivery).length === 0) {
            deliveryContainer.style.display = 'none';
            return;
        }
        
        deliveryContainer.style.display = 'block';
        
        const deliveryData = [
            { label: 'Recipient Name', value: delivery.recipientName },
            { label: 'Delivery Address', value: delivery.address },
            { label: 'Delivery Date', value: formatDate(delivery.deliveryDate) },
            { label: 'Delivered To', value: delivery.deliveredTo },
            { label: 'Signature Required', value: delivery.signatureRequired ? 'Yes' : 'No' },
            { label: 'Special Instructions', value: delivery.instructions }
        ];
        
        deliveryData.forEach(item => {
            if (item.value) {
                const infoItem = createInfoItem(item.label, item.value);
                deliveryInfo.appendChild(infoItem);
            }
        });
    }

    function createInfoItem(label, value) {
        const item = document.createElement('div');
        item.className = 'info-item';
        
        const labelEl = document.createElement('div');
        labelEl.className = 'info-label';
        labelEl.textContent = label;
        
        const valueEl = document.createElement('div');
        valueEl.className = 'info-value';
        valueEl.textContent = value;
        
        item.appendChild(labelEl);
        item.appendChild(valueEl);
        
        return item;
    }

    function createTimelineEvent(event, isLatest) {
        const eventEl = document.createElement('div');
        eventEl.className = 'timeline-event';
        
        if (isLatest) {
            eventEl.style.borderLeftColor = '#00ff00';
            eventEl.style.background = 'rgba(0, 255, 0, 0.05)';
        }
        
        const header = document.createElement('div');
        header.className = 'event-header';
        
        const status = document.createElement('div');
        status.className = 'event-status';
        status.textContent = event.status || 'Status Update';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'event-timestamp';
        timestamp.textContent = formatTimestamp(event.timestamp);
        
        header.appendChild(status);
        header.appendChild(timestamp);
        
        const location = document.createElement('div');
        location.className = 'event-location';
        location.textContent = event.location || 'Location not specified';
        
        const description = document.createElement('div');
        description.className = 'event-description';
        description.textContent = event.description || 'No additional details';
        
        eventEl.appendChild(header);
        eventEl.appendChild(location);
        eventEl.appendChild(description);
        
        return eventEl;
    }

    function formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp || 'Unknown time';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Mock results for development/testing
    function showMockResults(trackingNumber) {
        const mockData = {
            trackingInfo: {
                currentStatus: 'In Transit',
                currentLocation: 'Kuala Lumpur Processing Center',
                lastUpdate: new Date().toISOString(),
                serviceType: 'Poslaju Express',
                weight: '1.2 kg',
                dimensions: '25 x 15 x 10 cm',
                origin: 'Kuala Lumpur',
                destination: 'Johor Bahru',
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                events: [
                    {
                        status: 'Parcel collected',
                        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'Kuala Lumpur Collection Point',
                        description: 'Parcel collected from sender and in preparation for delivery'
                    },
                    {
                        status: 'In processing',
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'Kuala Lumpur Processing Center',
                        description: 'Parcel being processed at sorting facility'
                    },
                    {
                        status: 'In transit',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        location: 'On route to destination',
                        description: 'Parcel is on its way to delivery destination'
                    }
                ],
                delivery: {
                    estimatedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    signatureRequired: true,
                    instructions: 'Please deliver between 9 AM - 5 PM'
                }
            }
        };
        
        displayResults(mockData, trackingNumber);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Enter key anywhere to focus on tracking input
        if (e.key === 'Enter' && document.activeElement !== trackingNumberInput && !e.target.closest('form')) {
            trackingNumberInput.focus();
        }
    });

    // Auto-resize input based on content
    trackingNumberInput.addEventListener('input', () => {
        const value = trackingNumberInput.value;
        if (value.length > 20) {
            trackingNumberInput.style.fontSize = '0.9rem';
        } else {
            trackingNumberInput.style.fontSize = '1rem';
        }
    });

    // Add copy tracking number functionality
    parcelInfo.addEventListener('click', (e) => {
        if (e.target.textContent && e.target.textContent.match(/^[A-Z]{2}[0-9]{9}MY$/i)) {
            navigator.clipboard.writeText(e.target.textContent).then(() => {
                e.target.style.background = 'rgba(0, 255, 0, 0.2)';
                setTimeout(() => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }, 1000);
            });
        }
    });

})();