// KWAP Pension Inquiry - Frontend JavaScript
(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('kwap-form');
    const nokpInput = document.getElementById('nokp');
    const submitBtn = document.getElementById('submit-btn');
    const buttonText = document.getElementById('button-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const resultsContainer = document.getElementById('results-container');

    // Result containers
    const personalInfo = document.getElementById('personal-info');
    const serviceInfo = document.getElementById('service-info');
    const pensionInfo = document.getElementById('pension-info');
    const dependentsList = document.getElementById('dependents-list');
    const dependentsContainer = document.getElementById('dependents-container');

    // Initialize
    init();

    function init() {
        // Add form event listener
        form.addEventListener('submit', handleFormSubmit);
        
        // Add input validation
        nokpInput.addEventListener('input', validateNokp);
        
        // Add some visual effects
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
    }

    function validateNokp() {
        const value = nokpInput.value;
        
        // Remove non-numeric characters
        const numericValue = value.replace(/\D/g, '');
        nokpInput.value = numericValue;
        
        // Validate length and format
        if (numericValue.length === 12) {
            nokpInput.style.borderColor = '#00ff00';
            nokpInput.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
        } else if (numericValue.length > 0) {
            nokpInput.style.borderColor = '#ffff00';
            nokpInput.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.3)';
        } else {
            nokpInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            nokpInput.style.boxShadow = 'none';
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const nokp = nokpInput.value.trim();
        
        // Validate input
        if (!nokp) {
            showError('Please enter your IC number');
            return;
        }
        
        if (nokp.length !== 12) {
            showError('IC number must be exactly 12 digits');
            return;
        }
        
        if (!/^\d{12}$/.test(nokp)) {
            showError('IC number must contain only numbers');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        hideMessages();
        hideResults();
        
        try {
            // Make API request
            const response = await fetch('/api/kwap/inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nokp: nokp })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch pension information');
            }
            
            // Display results
            displayResults(data);
            showSuccess('Pension information retrieved successfully!');
            
        } catch (error) {
            console.error('Error fetching pension info:', error);
            showError(error.message || 'Failed to retrieve pension information. Please try again.');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            buttonText.textContent = 'Processing...';
            submitBtn.style.opacity = '0.7';
        } else {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            buttonText.textContent = '🚀 Inquiry Pension Details';
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

    function displayResults(data) {
        // Clear previous results
        personalInfo.innerHTML = '';
        serviceInfo.innerHTML = '';
        pensionInfo.innerHTML = '';
        dependentsList.innerHTML = '';
        
        if (!data.pensionerInfo) {
            showError('No pension information found for this IC number');
            return;
        }
        
        const info = data.pensionerInfo;
        
        // Display personal information
        displayPersonalInfo(info);
        
        // Display service information
        displayServiceInfo(info);
        
        // Display pension information
        displayPensionInfo(info);
        
        // Display dependents
        displayDependents(info.dependents || []);
        
        // Show results container
        showResults();
    }

    function displayPersonalInfo(info) {
        const personalData = [
            { label: 'Full Name', value: info.name || 'N/A', highlight: true },
            { label: 'IC Number', value: info.currentIdNo || 'N/A' },
            { label: 'Old IC Number', value: info.oldIdNo || 'N/A' },
            { label: 'Birth Date', value: formatDate(info.birthDate) || 'N/A' },
            { label: 'Gender', value: formatGender(info.gender) || 'N/A' },
            { label: 'Race', value: formatRace(info.raceCode) || 'N/A' },
            { label: 'Religion', value: formatReligion(info.religionCode) || 'N/A' },
            { label: 'Death Status', value: info.deathSts === '0' ? 'Alive' : 'Deceased', highlight: info.deathSts !== '0' }
        ];
        
        personalData.forEach(item => {
            personalInfo.appendChild(createInfoItem(item.label, item.value, item.highlight));
        });
    }

    function displayServiceInfo(info) {
        const serviceData = [
            { label: 'Service Type', value: info.serviceTypeDesc || 'N/A', highlight: true },
            { label: 'Department', value: info.deptName || info.deptDesc || 'N/A' },
            { label: 'First Appointment', value: formatDate(info.firstAppointDate) || 'N/A' },
            { label: 'Last Designation', value: info.lastDesignation || 'N/A' },
            { label: 'Last Salary', value: info.lastSalary ? `RM ${info.lastSalary}` : 'N/A' },
            { label: 'Total Service Period', value: info.tpTotal || 'N/A' },
            { label: 'Retirement Date', value: formatDate(info.pensionDate) || 'N/A' },
            { label: 'Retirement Type', value: info.retireTypeDesc || 'N/A' }
        ];
        
        serviceData.forEach(item => {
            serviceInfo.appendChild(createInfoItem(item.label, item.value, item.highlight));
        });
    }

    function displayPensionInfo(info) {
        const pensionData = [
            { label: 'Pension Account', value: info.pensionAccNo || 'N/A', highlight: true },
            { label: 'File Number', value: info.fileNo || 'N/A' },
            { label: 'Payment Start Date', value: formatDate(info.paymentStartDate) || 'N/A' },
            { label: 'Payment Stop Date', value: formatDate(info.paymentStopDate) || 'Active' },
            { label: 'Payment Method', value: formatPaymentMethod(info.currentPaymentMethod) || 'N/A' },
            { label: 'Record Status', value: info.recordSts === '1' ? 'Active' : 'Inactive', highlight: true },
            { label: 'Pensioner Type', value: formatPensionerType(info.pensionerType) || 'N/A' },
            { label: 'Managing Department', value: info.managingDeptCode || 'N/A' }
        ];
        
        pensionData.forEach(item => {
            pensionInfo.appendChild(createInfoItem(item.label, item.value, item.highlight));
        });
    }

    function displayDependents(dependents) {
        if (!dependents || dependents.length === 0) {
            dependentsContainer.style.display = 'none';
            return;
        }
        
        dependentsContainer.style.display = 'block';
        
        dependents.forEach((dependent, index) => {
            const dependentCard = createDependentCard(dependent, index + 1);
            dependentsList.appendChild(dependentCard);
        });
    }

    function createInfoItem(label, value, highlight = false) {
        const item = document.createElement('div');
        item.className = 'info-item';
        
        const labelElement = document.createElement('div');
        labelElement.className = 'info-label';
        labelElement.textContent = label;
        
        const valueElement = document.createElement('div');
        valueElement.className = highlight ? 'info-value highlight' : 'info-value';
        valueElement.textContent = value;
        
        item.appendChild(labelElement);
        item.appendChild(valueElement);
        
        return item;
    }

    function createDependentCard(dependent, index) {
        const card = document.createElement('div');
        card.className = 'dependent-card';
        
        const name = document.createElement('div');
        name.className = 'dependent-name';
        name.textContent = `${index}. ${dependent.name || 'N/A'}`;
        card.appendChild(name);
        
        const infoGrid = document.createElement('div');
        infoGrid.className = 'info-grid';
        
        const dependentData = [
            { label: 'Relationship', value: dependent.relationShipDesc || 'N/A' },
            { label: 'IC Number', value: dependent.currentIdNo || 'N/A' },
            { label: 'Birth Date', value: formatDate(dependent.birthDate) || 'N/A' },
            { label: 'Gender', value: formatGender(dependent.gender) || 'N/A' },
            { label: 'Marriage Date', value: formatDate(dependent.marriageDate) || 'N/A' },
            { label: 'Pension Account', value: dependent.pensionAccNo || 'N/A' }
        ];
        
        dependentData.forEach(item => {
            infoGrid.appendChild(createInfoItem(item.label, item.value));
        });
        
        card.appendChild(infoGrid);
        return card;
    }

    // Utility functions for formatting data
    function formatDate(dateString) {
        if (!dateString || dateString === '00000000' || dateString === '        ') return null;
        
        if (dateString.length === 8) {
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            return `${day}/${month}/${year}`;
        }
        
        return dateString;
    }

    function formatGender(gender) {
        if (!gender) return null;
        return gender === 'L' ? 'Male' : gender === 'P' ? 'Female' : gender;
    }

    function formatRace(raceCode) {
        const raceCodes = {
            '0100': 'Malay',
            '0200': 'Chinese',
            '0300': 'Indian',
            '0400': 'Other'
        };
        return raceCodes[raceCode] || raceCode;
    }

    function formatReligion(religionCode) {
        const religionCodes = {
            '01': 'Islam',
            '02': 'Christianity',
            '03': 'Buddhism',
            '04': 'Hinduism',
            '05': 'Others'
        };
        return religionCodes[religionCode] || religionCode;
    }

    function formatPaymentMethod(methodCode) {
        const paymentMethods = {
            '101': 'Bank Transfer',
            '102': 'Check',
            '103': 'Cash'
        };
        return paymentMethods[methodCode] || methodCode;
    }

    function formatPensionerType(typeCode) {
        const pensionerTypes = {
            '1': 'Main Pensioner',
            '2': 'Dependent',
            '3': 'Survivor'
        };
        return pensionerTypes[typeCode] || typeCode;
    }

})();
