// HOMEPAGE JS


let bucket = [];
        let totalAmount = 0;
        let productData = null;
        let currentCurrency = 'USD';
        const currencySymbols = { USD: '$', GBP: '£', EUR: '€' };
        const API_BASE = 'api.php?endpoint';

        // State for Top-Level Checkboxes
        let lensControlState = { 'TILTA Nucleus-M kit': false, 'PD Movies LCS': false, 'TITLA LCS': false, 'FUJJI LCS': false, 'CANON LCS': false };
        let softwareState = { 'Slideye 2.0 Software': false, 'Dragonframe Compatibility': false };

        // --- LOCAL STORAGE HANDLING ---
        function saveStateToLocalStorage() {
            localStorage.setItem('splitCameraBucket', JSON.stringify(bucket));
            localStorage.setItem('splitCameraCurrency', currentCurrency);
            localStorage.setItem('splitCameraLensControl', JSON.stringify(lensControlState));
            localStorage.setItem('splitCameraSoftware', JSON.stringify(softwareState));
        }

        function loadStateFromLocalStorage() {
            const savedBucket = localStorage.getItem('splitCameraBucket');
            const savedCurrency = localStorage.getItem('splitCameraCurrency');
            const savedLens = localStorage.getItem('splitCameraLensControl');
            const savedSoftware = localStorage.getItem('splitCameraSoftware');

            if (savedBucket) { bucket = JSON.parse(savedBucket); }
            if (savedCurrency) { currentCurrency = savedCurrency; }
            if (savedLens) { lensControlState = JSON.parse(savedLens); }
            if (savedSoftware) { softwareState = JSON.parse(savedSoftware); }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadStateFromLocalStorage();
            loadProduct();
        });

        // --- CORE FUNCTIONS ---

        function changeCurrency(newCurrency) {
            currentCurrency = newCurrency;
            renderProduct();
            updateBucketDisplay();
            saveStateToLocalStorage();
        }

        async function loadProduct() {
            try {
                const response = await fetch(`${API_BASE}=/products/1`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                productData = await response.json();
                enforceConfigurationRules();
                renderProduct();
                updateBucketDisplay();
            } catch (error) {
                console.error('Failed to load product:', error);
                document.getElementById('productContent').innerHTML = `<div class="error">Failed to load configuration options. Please try again.</div>`;
            }
        }

        // --- EVENT HANDLERS ---

        window.handleLensControlChange = function (optionName, isChecked) {
            lensControlState[optionName] = isChecked;
            enforceConfigurationRules(); 
            renderProduct();            
            updateBucketDisplay();      
            saveStateToLocalStorage();
        }

        window.handleSoftwareChange = function (optionName, isChecked) {
            softwareState[optionName] = isChecked;
            enforceConfigurationRules(); 
            renderProduct();            
            updateBucketDisplay();      
            saveStateToLocalStorage();
        }

        function handleSelectionChange(selectElement, property) {
            if (productData && property) {
                productData[property] = selectElement.value;
            }
            enforceConfigurationRules();
            renderProduct();
            updateBucketDisplay();
            saveStateToLocalStorage();
        }

        // --- RENDERING ---

        function renderProduct() {
            if (!productData) {
                document.getElementById('productContent').innerHTML = '<div class="error">No configuration options available.</div>';
                return;
            }

            const imageContainer = document.getElementById('productImageContainer');
            if (productData.image_url) { imageContainer.innerHTML = `<img src="${productData.image_url}" alt="${productData.name}">`; }
            else { imageContainer.innerHTML = `<span class="no-image">No product image available.</span>`; }

            const detailsContainer = document.getElementById('productDetailsSection');
            if (detailsContainer) {
                const isYes = (val) => val && (val.toString().toLowerCase() === 'yes' || val == '1');
                const displayVal = (val) => { if (String(val) === '1') return 'Yes'; if (String(val) === '0') return 'No'; return val || ''; };

                let lensCheckboxesHtml = '';
                ['TILTA Nucleus-M kit', 'PD Movies LCS', 'TITLA LCS', 'FUJJI LCS', 'CANON LCS'].forEach(opt => {
                    const isChecked = lensControlState[opt] ? 'checked' : '';
                    lensCheckboxesHtml += `<label class="checkbox-label"><input type="checkbox" ${isChecked} onchange="window.handleLensControlChange('${opt}', this.checked)">${opt}</label>`;
                });

                let softwareCheckboxesHtml = '';
                ['Slideye 2.0 Software', 'Dragonframe Compatibility'].forEach(opt => {
                    const isChecked = softwareState[opt] ? 'checked' : '';
                    softwareCheckboxesHtml += `<label class="checkbox-label"><input type="checkbox" ${isChecked} onchange="window.handleSoftwareChange('${opt}', this.checked)">${opt}</label>`;
                });

                // Ensure a default is set if data is missing
                const currentCameraType = productData.camera_type || 'PTZ';

                detailsContainer.innerHTML = `
                        <div class="product-details-container">
                            <div class="config-section-title">Camera Information</div>
                            <div class="product-details">
                                <div class="detail-item">
                                    <span class="detail-label">Camera Type</span>
                                    <select class="detail-select" onchange="handleSelectionChange(this, 'camera_type')">
                                        <option value="PTZ" ${currentCameraType === 'PTZ' ? 'selected' : ''}>PTZ</option>
                                        <option value="Cine/Broadcast" ${currentCameraType === 'Cine/Broadcast' ? 'selected' : ''}>Cine/Broadcast</option>
                                    </select>
                                </div>
                                <div class="detail-item"><span class="detail-label">Make / Model</span><input class="detail-input" type="text" value="${displayVal(productData.make_model)}" onchange="handleSelectionChange(this, 'make_model')"></div>
                                <div class="detail-item"><span class="detail-label">Lens</span><input class="detail-input" type="text" value="${displayVal(productData.lens)}" onchange="handleSelectionChange(this, 'lens')"></div>
                                <div class="detail-item"><span class="detail-label">Lens Configuration</span><input class="detail-input" type="text" value="${productData.lens_configuration || ''}" onchange="handleSelectionChange(this, 'lens_configuration')"></div>
                                <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Lens Control</span><div class="checkbox-group-container">${lensCheckboxesHtml}</div></div>
                                <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Software Option</span><div class="checkbox-group-container">${softwareCheckboxesHtml}</div></div>
                            </div>
                            <div class="config-section-title">Atlas Configuration</div>
                            <div class="product-details">
                                <div class="detail-item"><span class="detail-label">Power Option</span><select class="detail-select" onchange="handleSelectionChange(this, 'power_option')"><option value="" ${!productData.power_option ? 'selected' : ''}>Select...</option><option value="PSU" ${productData.power_option === 'PSU' ? 'selected' : ''}>PSU</option><option value="Battery PPU" ${productData.power_option === 'Battery PPU' ? 'selected' : ''}>Battery PPU</option><option value="None" ${productData.power_option === 'None' ? 'selected' : ''}>None</option></select></div>
                                <div class="detail-item"><span class="detail-label">Cable Management System?</span><select class="detail-select" onchange="handleSelectionChange(this, 'cable_management')"><option value="Yes" ${isYes(productData.cable_management) ? 'selected' : ''}>Yes</option><option value="No" ${!isYes(productData.cable_management) ? 'selected' : ''}>No</option></select></div>
                                <div class="detail-item"><span class="detail-label">External Lens Motors Required</span><select class="detail-select" onchange="handleSelectionChange(this, 'external_lens_motors')"><option value="Yes" ${isYes(productData.external_lens_motors) ? 'selected' : ''}>Yes</option><option value="No" ${!isYes(productData.external_lens_motors) ? 'selected' : ''}>No</option></select></div>
                                <div class="detail-item"><span class="detail-label">Motorised Rail?</span><select class="detail-select" onchange="handleSelectionChange(this, 'powered_rail')"><option value="Yes" ${isYes(productData.powered_rail) ? 'selected' : ''}>Yes</option><option value="No" ${!isYes(productData.powered_rail) ? 'selected' : ''}>No</option></select></div>
                                <div class="detail-item"><span class="detail-label">Robotic Pan and Tilt Head?</span><select class="detail-select" onchange="handleSelectionChange(this, 'remote_pan_tilt_head')"><option value="Yes" ${isYes(productData.remote_pan_tilt_head) ? 'selected' : ''}>Yes</option><option value="No" ${!isYes(productData.remote_pan_tilt_head) ? 'selected' : ''}>No</option></select></div>
                                <div class="detail-item"><span class="detail-label">Currency</span><select class="detail-select" onchange="changeCurrency(this.value)"><option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option><option value="GBP" ${currentCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option><option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option></select></div>
                            </div>
                        </div>`;
            }

            let html = '';
            const isYes = (val) => val && (val.toString().toLowerCase() === 'yes' || val == '1');

            if (productData.categories && productData.categories.length > 0) {
                const categoriesByStep = {};
                productData.categories.forEach(category => {
                    const step = parseInt(category.assigned_step) || 1;
                    if (!categoriesByStep[step]) categoriesByStep[step] = [];
                    categoriesByStep[step].push(category);
                });

                for (let step = 1; step <= 9; step++) {
                    const categoriesInStep = categoriesByStep[step];
                    if (categoriesInStep && categoriesInStep.length > 0) {
                        if (step === 1) html += `<div class="step-header">Step 1: ATLAS RAIL, DOLLY, MOTOR, POWER SUPPLY & BRACKETS</div>`;
                        else if (step === 2) html += `<div class="step-header step-2">Step 2: ROBOTIC HEAD & LENS CONTROL</div>`;
                        else if (step === 3) html += `<div class="step-header step-3">Step 3: CONTROLLERS, SOFTWARE & LICENSES</div>`;
                        else if (step === 4) html += `<div class="step-header step-4">Step 4: ADDITIONAL CABLE PACKAGES</div>`;
                        else if (step === 5) html += `<div class="step-header step-5">Step 5: ADDITIONAL ACCESSORIES</div>`;
                        else if (step === 6) html += `<div class="step-header step-6">Step 6: ADDITIONAL ACCESSORIES</div>`;
                        else if (step === 7) html += `<div class="step-header step-7">Step 7: LENS CONTROL</div>`;
                        else if (step === 8) html += `<div class="step-header step-8">Step 8: PACKAGES</div>`;
                        else if (step === 9) html += `<div class="step-header step-8">Step 9: OTHER</div>`;

                        let railTotalsRendered = false; 

                        categoriesInStep.forEach(category => {
                            if (category.options && category.options.length > 0) {
                                html += `<div class="option-category" data-category-step="${step}" data-category-name="${category.name}">`;
                                html += `<div class="category-title">${category.name}</div>${category.description ? `<div class="category-description">${category.description}</div>` : ''}<div class="sub-options">`;

                                category.options.forEach(option => {
                                    const priceKey = `price_${currentCurrency.toLowerCase()}`;
                                    const currentPrice = option[priceKey] || option.price_usd;
                                    const symbol = currencySymbols[currentCurrency];
                                    const inBucket = bucket.some(item => item.optionId === option.id);
                                    const imageUrl = option.image_url ? option.image_url : 'https://via.placeholder.com/60?text=Opt';
                                    const productCodeDisplay = option.product_code ? `<div class="sub-option-code">${option.product_code}</div>` : '';
                                    const recQty = parseInt(option.recommended_quantity) || 0;

                                    const noteHtml = option.note ? `<div class="sub-option-note"><i class="info-icon">ℹ</i> ${option.note}</div>` : '';

                                    html += `<div class="sub-option" data-option-id="${option.id}" data-option-name="${option.name}">
                                                <div class="sub-option-info">
                                                    <div class="sub-option-image-container" onclick="openLightbox('${imageUrl}')"><img src="${imageUrl}" alt="${option.name}" class="sub-option-image"></div>
                                                    <div>
                                                        <div class="sub-option-name">${option.name}</div>
                                                        ${productCodeDisplay}
                                                        ${option.description ? `<div class="sub-option-description">${option.description}</div>` : ''}
                                                        ${noteHtml}
                                                    </div>
                                                </div>
                                                <div class="sub-option-price">${symbol}${currentPrice.toFixed(2)}</div>
                                                <div class="sub-option-controls">`;

                                    // --- 1. MOTORS ---
                                    if (step === 1 && category.name.toLowerCase().includes('motor')) {
                                        const isStepper = option.name.toLowerCase().includes('stepper');
                                        const isMotorisedRail = isYes(productData.powered_rail);
                                        if (isMotorisedRail) {
                                            if (isStepper) { html += `<select class="yes-no-select" disabled><option value="no" selected>No</option></select>`; }
                                            else { html += `<select class="yes-no-select" disabled><option value="yes" selected>Yes</option></select>`; }
                                        } else {
                                            html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`;
                                        }
                                    }
                                    // --- 2. DOLLY ---
                                    else if (step === 1 && category.name.toLowerCase().includes('dolly')) {
                                        html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`;
                                    }
                                    // --- 3. POWER SUPPLY ---
                                    else if (step === 1 && category.name.toLowerCase().includes('power')) {
                                        const powerOpt = productData.power_option;
                                        const name = option.name.toLowerCase();
                                        const isPSU = name.includes('psu320e');
                                        const isVMount = name.includes('v-mount') && name.includes('ppu');
                                        const isBMount = name.includes('b-mount') && name.includes('ppu');

                                        if (powerOpt === 'PSU' && isPSU) { html += `<select class="yes-no-select" disabled><option value="yes" selected>Yes</option></select>`; }
                                        else if (powerOpt === 'Battery PPU' && (isVMount || isBMount)) { html += `<select class="yes-no-select" disabled><option value="yes" selected>Yes</option></select>`; }
                                        else if ((powerOpt === 'PSU' && (isVMount || isBMount)) || (powerOpt === 'Battery PPU' && isPSU) || (powerOpt === 'None' && (isPSU || isVMount || isBMount))) { html += `<select class="yes-no-select" disabled><option value="no" selected>No</option></select>`; }
                                        else { html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`; }
                                    }
                                    // --- 4. BRACKETS ---
                                    else if (step === 1 && category.name.toLowerCase().includes('bracket')) {
                                        const isMotorisedRail = isYes(productData.powered_rail);
                                        const isPneumatic = option.name.toLowerCase().includes('pneumatic');
                                        const isStandard = option.name.toLowerCase().includes('standard');
                                        if (isMotorisedRail) {
                                            if (isPneumatic) { html += `<select class="yes-no-select" disabled><option value="yes" selected>Yes</option></select>`; }
                                            else if (isStandard) { html += `<select class="yes-no-select" disabled><option value="no" selected>No</option></select>`; }
                                            else { html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`; }
                                        } else {
                                            html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`;
                                        }
                                    }
                                    // --- 5. CABLE MANAGEMENT & STEP 2 CHECKBOXES ---
                                    else if ((step === 1 && category.name.toLowerCase().includes('cable management')) || step === 2) {
                                        const isChecked = inBucket ? 'checked' : '';
                                        html += `<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; color: var(--color-primary);"><input type="checkbox" onchange="handleCheckboxSelection(this, ${option.id})" ${isChecked} style="width: 20px; height: 20px; accent-color: var(--color-success);"> Select</label>`;
                                    }
                                    // --- 6. DEFAULT ---
                                    else if (step !== 1) {
                                        const isManagedSoftwareItem =
                                            option.name.toLowerCase().includes('slideye 2.0 software') ||
                                            option.name.toLowerCase().includes('ptz license code') ||
                                            option.name.toLowerCase().includes('dragonframe license code');

                                        const slideyeChecked = softwareState['Slideye 2.0 Software'];
                                        const dragonframeChecked = softwareState['Dragonframe Compatibility'];

                                        let isLocked = false;
                                        if (isManagedSoftwareItem && (slideyeChecked || dragonframeChecked)) {
                                            if (option.name.toLowerCase().includes('dragonframe') && !dragonframeChecked) {
                                                isLocked = false;
                                            } else {
                                                isLocked = true;
                                            }
                                        }

                                        if (isLocked) {
                                            html += `<select class="yes-no-select" disabled><option value="yes" selected>Yes</option></select>`;
                                        } else {
                                            html += `<select class="yes-no-select" onchange="handleYesNoSelection(this, ${option.id})"><option value="no" ${!inBucket ? 'selected' : ''}>No</option><option value="yes" ${inBucket ? 'selected' : ''}>Yes</option></select>`;
                                        }
                                    } else {
                                        if (recQty > 0) { html += `<div class="recommended-qty-badge"><span>Rec.</span>${recQty}</div>`; }
                                        let qtyOptions = '';
                                        let qty = inBucket ? bucket.find(b => b.optionId === option.id).quantity : 0;
                                        for (let i = 0; i <= 10; i++) { qtyOptions += `<option value="${i}" ${i === qty ? 'selected' : ''}>${i}</option>`; }

                                        if (inBucket) html += `<select class="quantity-select">${qtyOptions}</select><button class="remove-btn">Remove</button>`;
                                        else html += `<select class="quantity-select">${qtyOptions}</select><button class="add-btn">Add</button>`;
                                    }
                                    html += `</div></div>`;
                                });
                                html += `</div></div>`;
                                if (step === 1 && category.name.toLowerCase().includes('rail') && !railTotalsRendered) {
                                    html += `<div class="rail-totals-main-display rail-totals-main"></div>`;
                                    railTotalsRendered = true;
                                }
                            }
                        });
                    }
                }
            } else { html = '<div class="error">No configuration options available for this product.</div>'; }

            document.getElementById('productContent').innerHTML = html;
            updateAllSubOptionDisplays();
            addEventListenersToOptions();
            updateMainRailTotals();
        }

        // --- RULES ENFORCEMENT ---

       function enforceConfigurationRules() {
            if (!productData || !productData.categories) return;

            // --- 1. PREPARE DATA ---
            const isMotorisedRail = (val) => val && (val.toString().toLowerCase() === 'yes' || val == '1');
            const motorized = isMotorisedRail(productData.powered_rail);
            const slideyeChecked = softwareState['Slideye 2.0 Software'];
            const dragonframeChecked = softwareState['Dragonframe Compatibility'];
            
            const lensMapping = {
                'TILTA Nucleus-M kit': 'Tilta Nucleus-M Lens Control Kit',
                'PD Movies LCS': 'PDMovie Lens Control Cable',
                'TITLA LCS': 'Tilta Nucleus-M Control Cable', 
                'FUJJI LCS': 'Fujinon Lens Control Cable',
                'CANON LCS': 'Canon Lens Control Cable'
            };

            // IDs for Dolly Logic
            let standardDollyId = null;
            let extendedDollyId = null;

            // Find specific Option IDs for Dollies
            productData.categories.forEach(cat => {
                cat.options.forEach(opt => {
                    const n = opt.name.toLowerCase();
                    if (n.includes('atlas') && n.includes('extended dolly')) extendedDollyId = opt.id;
                    if (n.includes('atlas') && n.includes('rail dolly') && !n.includes('extended')) standardDollyId = opt.id;
                });
            });

            // --- 2. CALCULATE RAIL LENGTH ---
            let totalRailLength = 0;
            bucket.forEach(item => {
                const opt = findOptionById(item.optionId);
                if (opt) {
                    const name = opt.name.toLowerCase();
                    if (name.includes('atlas rail') && !name.includes('dolly') && !name.includes('adapter') && !name.includes('cable') && !name.includes('bracket')) {
                        const match = name.match(/(\d+(\.\d+)?)\s*m/);
                        if (match) totalRailLength += parseFloat(match[1]) * item.quantity;
                    }
                }
            });

         
            // A. CASE: Length > 6m 
            if (totalRailLength > 6) {
                if (extendedDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === extendedDollyId);
                    if (idx === -1) bucket.push({ optionId: extendedDollyId, quantity: 1 });
                }
                if (standardDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === standardDollyId);
                    if (idx > -1) bucket.splice(idx, 1);
                }
            } 
            // B. CASE: Length > 0m but <= 6m 
            else if (totalRailLength > 0) {
                if (standardDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === standardDollyId);
                    if (idx === -1) bucket.push({ optionId: standardDollyId, quantity: 1 });
                }
                if (extendedDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === extendedDollyId);
                    if (idx > -1) bucket.splice(idx, 1);
                }
            }
            // C. CASE: No Rail 
            else {
                if (standardDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === standardDollyId);
                    if (idx > -1) bucket.splice(idx, 1);
                }
                if (extendedDollyId) {
                    const idx = bucket.findIndex(b => b.optionId === extendedDollyId);
                    if (idx > -1) bucket.splice(idx, 1);
                }
            }

            // --- 4. APPLY OTHER RULES ---
            productData.categories.forEach(cat => {
                cat.options.forEach(opt => {
                    const nameLower = opt.name.toLowerCase();
                    const idx = bucket.findIndex(b => b.optionId === opt.id);

                    // Lens Control
                    for (const [ctrlKey, targetPhrase] of Object.entries(lensMapping)) {
                        if (nameLower.includes(targetPhrase.toLowerCase())) {
                            if (ctrlKey === 'TITLA LCS' && nameLower.includes('kit')) continue; 
                            if (ctrlKey === 'TILTA Nucleus-M kit' && !nameLower.includes('kit')) continue;

                            if (lensControlState[ctrlKey]) {
                                if (idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                            } else {
                                if (idx > -1) bucket.splice(idx, 1);
                            }
                        }
                    }

                    // Software
                    if (nameLower.includes('slideye 2.0 software')) {
                        if ((slideyeChecked || dragonframeChecked) && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                        if (!(slideyeChecked || dragonframeChecked) && idx > -1) bucket.splice(idx, 1);
                    }
                    if (nameLower.includes('ptz license code')) {
                        if ((slideyeChecked || dragonframeChecked) && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                        if (!(slideyeChecked || dragonframeChecked) && idx > -1) bucket.splice(idx, 1);
                    }
                    if (nameLower.includes('dragonframe license code')) {
                        if (dragonframeChecked && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                        if (!dragonframeChecked && idx > -1) bucket.splice(idx, 1);
                    }

                    // Motor
                    if (cat.name.toLowerCase().includes('motor')) {
                        const isServo = nameLower.includes('servo');
                        const isStepper = nameLower.includes('stepper');
                        if (motorized) {
                            if (isServo && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                            if (isStepper && idx > -1) bucket.splice(idx, 1);
                        } else {
                            if (idx > -1) bucket.splice(idx, 1);
                        }
                    }

                    // Power
                    const pOpt = productData.power_option;
                    if (cat.name.toLowerCase().includes('power')) {
                        if (pOpt === 'PSU') {
                            if (nameLower.includes('psu320e') && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                            if (nameLower.includes('ppu') && idx > -1) bucket.splice(idx, 1);
                        } else if (pOpt === 'Battery PPU') {
                            if (nameLower.includes('ppu') && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                            if (nameLower.includes('psu320e') && idx > -1) bucket.splice(idx, 1);
                        } else if (pOpt === 'None') {
                            if ((nameLower.includes('psu320e') || nameLower.includes('ppu')) && idx > -1) bucket.splice(idx, 1);
                        }
                    }

                    // Bracket
                    if (cat.name.toLowerCase().includes('bracket')) {
                        const isPneumatic = nameLower.includes('pneumatic');
                        if (motorized) {
                            if (isPneumatic && idx === -1) bucket.push({ optionId: opt.id, quantity: 1 });
                        } else {
                            if (isPneumatic && idx > -1) bucket.splice(idx, 1);
                        }
                    }
                });
            });
        }
        // --- UTILS ---

  function addEventListenersToOptions() {
            document.querySelectorAll('.add-btn, .remove-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const div = e.target.closest('.sub-option');
                    const id = parseInt(div.dataset.optionId);
                    
                    let qty = parseInt(div.querySelector('.quantity-select').value);
                    if (qty === 0) qty = 1;

                    const idx = bucket.findIndex(b => b.optionId === id);
                    
                    if (idx > -1) {
                        bucket.splice(idx, 1); 
                    } else {
                        bucket.push({optionId: id, quantity: qty});
                    }
                    enforceConfigurationRules(); 
                    
                    updateBucketDisplay(); 
                    saveStateToLocalStorage(); 
                    updateMainRailTotals();
                    renderProduct(); 
                });
            });

            // 2. Handle Live Quantity Changes
            document.querySelectorAll('.quantity-select').forEach(sel => {
                sel.addEventListener('change', e => {
                    const div = e.target.closest('.sub-option');
                    const id = parseInt(div.dataset.optionId);
                    const qty = parseInt(e.target.value);
                    const idx = bucket.findIndex(b => b.optionId === id);

                    // Update the Bucket immediately
                    if (qty === 0) {
                        if (idx > -1) bucket.splice(idx, 1);
                    } else {
                        if (idx > -1) bucket[idx].quantity = qty;
                        else bucket.push({optionId: id, quantity: qty});
                    }
                    enforceConfigurationRules(); 
                    updateBucketDisplay(); 
                    saveStateToLocalStorage(); 
                    updateMainRailTotals(); 
                    renderProduct(); 
                });
            });
        }

        function handleYesNoSelection(selectElement, optionId) {
            const isInBucket = bucket.some(item => item.optionId === optionId);
            if (selectElement.value === 'yes' && !isInBucket) { bucket.push({ optionId: optionId, quantity: 1 }); }
            else if (selectElement.value === 'no' && isInBucket) { const itemIndex = bucket.findIndex(item => item.optionId === optionId); if (itemIndex > -1) bucket.splice(itemIndex, 1); }
            updateBucketDisplay(); saveStateToLocalStorage();
        }

        function handleCheckboxSelection(checkbox, optionId) {
            if (checkbox.checked) {
                if (!bucket.some(item => item.optionId === optionId)) { bucket.push({ optionId: optionId, quantity: 1 }); }
            } else {
                const index = bucket.findIndex(item => item.optionId === optionId);
                if (index > -1) bucket.splice(index, 1);
            }
            updateBucketDisplay();
            saveStateToLocalStorage();
        }

        function updateMainRailTotals() {
            const displayContainers = document.querySelectorAll('.rail-totals-main-display');
            if (displayContainers.length === 0) return;

            let totalRailLength = 0;

            // 1. Calculate Total Rail Length from Bucket
            bucket.forEach(item => {
                const option = findOptionById(item.optionId);
                if (option) {
                    const name = option.name.toLowerCase();
                    if (name.includes('atlas rail') && !name.includes('dolly') && !name.includes('adapter') && !name.includes('cable') && !name.includes('bracket')) {

                        const match = name.match(/(\d+(\.\d+)?)\s*m/);
                        if (match) {
                            const length = parseFloat(match[1]);
                            totalRailLength += length * item.quantity;
                        }
                    }
                }
            });

            // 2. Calculate Teethbelt Logic
            let totalBeltLength = 0;
            const isMotorized = productData.powered_rail && (productData.powered_rail.toString().toLowerCase() === 'yes' || productData.powered_rail == '1');

            if (isMotorized && totalRailLength > 0) {
                totalBeltLength = totalRailLength + 0.2;
            } else {
                totalBeltLength = 0;
            }

            // 3. Update Display
            displayContainers.forEach(container => {
                container.innerHTML = `
                    <div class="rail-total-item">
                        <span class="label">Total Rail Length:</span>
                        <span class="value">${totalRailLength.toFixed(1)} Meters</span>
                    </div>
                    <div class="rail-total-item">
                        <span class="label">Total ATLAS Rail Teethbelt:</span>
                        <span class="value">${totalBeltLength.toFixed(1)} Meters</span>
                    </div>`;
            });
        }

        function addToBucket(button) {
            const subOption = button.closest('.sub-option');
            const optionId = parseInt(subOption.dataset.optionId);
            const quantity = parseInt(subOption.querySelector('.quantity-select').value);

            bucket.push({ optionId, quantity });

            updateBucketDisplay();
            updateSubOptionDisplay(optionId, true);
            saveStateToLocalStorage();
            updateMainRailTotals(); 
        }

        function removeFromBucket(index) {
            const removedItem = bucket.splice(index, 1)[0];
            updateBucketDisplay();
            if (removedItem) { updateSubOptionDisplay(removedItem.optionId, false); }
            saveStateToLocalStorage();
            updateMainRailTotals(); 
        }

        function findOptionById(optionId) { if (!productData || !productData.categories) return null; for (const category of productData.categories) { const found = category.options.find(opt => opt.id === optionId); if (found) return found; } return null; }
        function findCategoryByOption(option) { if (!productData || !productData.categories) return null; for (const category of productData.categories) { if (category.options.some(opt => opt.id === option.id)) { return category; } } return null; }

        function updateBucketDisplay() {
            const bucketItemsEl = document.getElementById('bucketItems'); const bucketCountEl = document.querySelector('.bucket-count'); const totalAmountEl = document.querySelector('.total-amount'); const customerInfoEl = document.getElementById('customerInfo'); const symbol = currencySymbols[currentCurrency];
            if (bucket.length === 0) { bucketItemsEl.innerHTML = `<div class="empty-bucket">No items selected yet.<br>Choose your camera options to get started!</div>`; bucketCountEl.textContent = '0 items selected'; totalAmountEl.innerHTML = `Total: <span>${symbol}0.00</span>`; totalAmount = 0; customerInfoEl.style.display = 'none'; return; }
            customerInfoEl.style.display = 'block'; let itemsHTML = ''; totalAmount = 0; let totalItems = 0;
            if (!productData) return;
            bucket.forEach((item, index) => {
                let optionDetails = findOptionById(item.optionId); let categoryName = 'Unknown';
                if (optionDetails) { let category = findCategoryByOption(optionDetails); if (category) categoryName = category.name; }
                if (optionDetails) {
                    const priceKey = `price_${currentCurrency.toLowerCase()}`; const currentPrice = optionDetails[priceKey] || optionDetails.price_usd; const itemTotal = currentPrice * item.quantity; totalAmount += itemTotal; totalItems += item.quantity;
                    itemsHTML += `<div class="bucket-item"><div class="bucket-item-name">${optionDetails.name}</div><div class="bucket-item-option">${categoryName}</div><div class="bucket-item-details"><div class="bucket-item-quantity">Qty: ${item.quantity}</div><div class="bucket-item-price">${symbol}${itemTotal.toFixed(2)}</div><button class="bucket-item-remove" onclick="removeFromBucket(${index})">Remove</button></div></div>`;
                }
            });
            bucketItemsEl.innerHTML = itemsHTML; bucketCountEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} selected`; totalAmountEl.innerHTML = `Total<span>${symbol}${totalAmount.toFixed(2)}</span>`;
        }

        function updateSubOptionDisplay(optionId, inBucket) {
            const subOptionEl = document.querySelector(`.sub-option[data-option-id="${optionId}"]`);
            if (!subOptionEl) return;
            const button = subOptionEl.querySelector('button.add-btn, button.remove-btn');
            if (button) {
                const select = subOptionEl.querySelector('.quantity-select');
                if (inBucket) { const item = bucket.find(i => i.optionId === optionId); if (item && select) select.value = item.quantity; subOptionEl.classList.add('selected'); button.textContent = 'Remove'; button.classList.remove('add-btn'); button.classList.add('remove-btn'); }
                else { if (select) select.value = 1; subOptionEl.classList.remove('selected'); button.textContent = 'Add'; button.classList.remove('remove-btn'); button.classList.add('add-btn'); }
            }
            const yesNoSelect = subOptionEl.querySelector('select.yes-no-select');
            if (yesNoSelect) { yesNoSelect.value = inBucket ? 'yes' : 'no'; }
        }

        function updateAllSubOptionDisplays() { document.querySelectorAll('.sub-option').forEach(el => { const optionId = parseInt(el.dataset.optionId); if (isNaN(optionId)) return; const inBucket = bucket.some(item => item.optionId === optionId); updateSubOptionDisplay(optionId, inBucket); }); }

        function openLightbox(url) {
            if (!url || url.includes('placeholder')) return;
            const modal = document.getElementById('imageLightbox');
            const modalImg = document.getElementById('lightboxImage');
            modal.style.display = "flex";
            modalImg.src = url;
        }
        function closeLightbox() { document.getElementById('imageLightbox').style.display = "none"; }
        document.getElementById('imageLightbox').addEventListener('click', function (e) { if (e.target === this) closeLightbox(); });

        function downloadInvoice() {
            if (bucket.length === 0) { alert('Please add some items to your configuration before downloading the invoice.'); return; }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const symbol = currencySymbols[currentCurrency];

            const cableMgmt = productData.cable_management || 'No';
            const getPowerOption = () => { return productData.power_option || 'PSU (Default)'; };
            const selectedLens = Object.keys(lensControlState).filter(key => lensControlState[key]).join(', ') || 'None';
            const selectedSoftware = Object.keys(softwareState).filter(key => softwareState[key]).join(', ') || 'None';
            const isYes = (val) => val && (val.toString().toLowerCase() === 'yes' || val == '1');
            const toYesNo = (val) => isYes(val) ? 'Yes' : 'No';

            const configData = [
                [{ content: 'CAMERA INFORMATION:', colSpan: 2, styles: { fillColor: [0, 176, 80], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' } }],
                ['Camera Type:', productData.camera_type || 'PTZ'], ['Camera Make and Model:', productData.make_model || 'N/A'], ['Lens:', productData.lens || 'N/A'], ['Lens Configuration:', productData.lens_configuration || 'PTZ'],
                ['Lens Control*:', selectedLens],
                ['Software Option*:', selectedSoftware],
                [{ content: 'ATLAS CONFIGURATION:', colSpan: 2, styles: { fillColor: [0, 176, 80], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' } }],
                ['Power Option', getPowerOption()], ['Motorised Rail*?', toYesNo(productData.powered_rail)], ['Robotic Pan and Tilt Head*?', toYesNo(productData.remote_pan_tilt_head)], ['Cable Management System*?', cableMgmt], ['Currency:', currentCurrency]
            ];

            doc.autoTable({ body: configData, theme: 'grid', styles: { lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] }, columnStyles: { 0: { fillColor: [231, 230, 230], fontStyle: 'bold', width: 80 } }, margin: { top: 20 } });

            let finalY = doc.lastAutoTable.finalY + 10;
            doc.text('Detailed Items:', 14, finalY);

            const itemRows = [];
            bucket.forEach(item => {
                const opt = findOptionById(item.optionId);
                if (opt) {
                    const cat = findCategoryByOption(opt);
                    const priceKey = `price_${currentCurrency.toLowerCase()}`;
                    const price = opt[priceKey] || opt.price_usd;
                    const total = price * item.quantity;
                    itemRows.push([cat ? cat.name : 'N/A', opt.product_code ? `[${opt.product_code}] ${opt.name}` : opt.name, item.quantity, symbol + price.toFixed(2), symbol + total.toFixed(2)]);
                }
            });

            doc.autoTable({ startY: finalY + 5, head: [['Category', 'Option', 'Qty', 'Price', 'Total']], body: itemRows, theme: 'striped', headStyles: { fillColor: [44, 62, 80] }, foot: [['', '', '', 'TOTAL:', symbol + totalAmount.toFixed(2)]], footStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } });

            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.setFontSize(8); doc.text('Thank you for choosing Atlas Configurator!', 14, pageHeight - 20); doc.text('For support, contact us at support@atlasconfig.com', 14, pageHeight - 15);

            doc.save(`atlas-configurator-invoice-${Date.now()}.pdf`);
        }
