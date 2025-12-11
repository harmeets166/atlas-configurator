// ADMIN JS


let currentUser = null; let currentEditId = null; const API_BASE = 'api.php?endpoint=';

function loadSavedCredentials() {
    const savedUser = localStorage.getItem('splitCameraUsername'); const savedPass = localStorage.getItem('splitCameraPassword');
    if (savedUser && savedPass) { document.getElementById('username').value = savedUser; document.getElementById('password').value = savedPass; document.getElementById('rememberMe').checked = true; }
}
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE}/admin/status`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) { currentUser = data.user; document.getElementById('welcomeUser').textContent = `Welcome, ${data.user.username}`; document.getElementById('loginContainer').style.display = 'none'; document.getElementById('dashboardContainer').style.display = 'block'; loadDashboardStats(); }
        }
    } catch (error) { console.error('Not logged in:', error); }
}
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value; const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await response.json();
        if (data.success) {
            if (document.getElementById('rememberMe').checked) { localStorage.setItem('splitCameraUsername', username); localStorage.setItem('splitCameraPassword', password); }
            else { localStorage.removeItem('splitCameraUsername'); localStorage.removeItem('splitCameraPassword'); }
            currentUser = data.user; document.getElementById('welcomeUser').textContent = `Welcome, ${data.user.username}`; document.getElementById('loginContainer').style.display = 'none'; document.getElementById('dashboardContainer').style.display = 'block'; loadDashboardStats();
        } else { alert('Invalid credentials'); }
    } catch (error) { console.error('Login error:', error); alert('Login failed'); }
});
async function logout() {
    try { await fetch(`${API_BASE}/admin/logout`); } catch (error) { console.error('Logout failed:', error); }
    finally { currentUser = null; document.getElementById('loginContainer').style.display = 'flex'; document.getElementById('dashboardContainer').style.display = 'none'; if (!document.getElementById('rememberMe').checked) { document.getElementById('username').value = ''; document.getElementById('password').value = ''; } }
}
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`);
        const stats = await response.json();
        document.getElementById('totalProducts').textContent = stats.total_products; document.getElementById('totalCategories').textContent = stats.total_categories; document.getElementById('totalOptions').textContent = stats.total_options; document.getElementById('ordersToday').textContent = stats.orders_today; document.getElementById('revenueToday').textContent = `$${stats.revenue_today.toFixed(2)}`;
    } catch (error) { console.error('Failed to load stats:', error); }
}
function showSection(sectionName) {
    const showDashboard = sectionName === 'dashboard';
    document.getElementById('statsGrid').style.display = showDashboard ? 'grid' : 'none'; document.getElementById('dashboardSection').style.display = showDashboard ? 'block' : 'none';
    document.querySelectorAll('.content-section').forEach(section => { if (section.id !== 'dashboardSection') section.classList.remove('active') });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (!showDashboard) document.getElementById(sectionName + 'Section').classList.add('active');
    const currentButton = document.querySelector(`.nav-btn[onclick="showSection('${sectionName}')"]`); if (currentButton) currentButton.classList.add('active');
    switch (sectionName) { case 'products': loadProducts(); break; case 'categories': loadCategories(); break; case 'options': loadOptions(); break; case 'orders': loadOrders(); break; }
}
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`); const products = await response.json(); const tbody = document.querySelector('#productsTable tbody'); tbody.innerHTML = '';
        products.forEach(p => { tbody.innerHTML += `<tr><td>${p.id}</td><td><img src="${p.image_url || 'https://via.placeholder.com/60?text=No+Image'}" class="product-image-thumbnail"></td><td>${p.name}</td><td>${p.description || ''}</td><td>$${parseFloat(p.base_price).toFixed(2)}</td><td><span class="status-${p.status}">${p.status}</span></td><td><button class="action-btn" onclick="editProduct(${p.id})">Edit</button><button class="action-btn delete" onclick="deleteProduct(${p.id})">Delete</button></td></tr>`; });
    } catch (error) { console.error('Failed to load products:', error); }
}
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`); const categories = await response.json(); const tbody = document.querySelector('#categoriesTable tbody'); tbody.innerHTML = '';
        categories.forEach(c => { tbody.innerHTML += `<tr><td>${c.id}</td><td>${c.product_name}</td><td>${c.name}</td><td>${c.description || ''}</td><td>${c.assigned_step || 1}</td><td>${c.display_order}</td><td><span class="status-${c.status}">${c.status}</span></td><td><button class="action-btn" onclick="editCategory(${c.id})">Edit</button><button class="action-btn delete" onclick="deleteCategory(${c.id})">Delete</button></td></tr>`; });
    } catch (error) { console.error('Failed to load categories:', error); }
}
async function loadOptions() {
    try {
        const response = await fetch(`${API_BASE}/options`); const options = await response.json(); const tbody = document.querySelector('#optionsTable tbody'); tbody.innerHTML = '';
        options.forEach(o => {
            const noteDisplay = o.note ? (o.note.length > 20 ? o.note.substring(0, 20) + '...' : o.note) : '-';
            tbody.innerHTML += `<tr><td>${o.id}</td><td><img src="${o.image_url || 'https://via.placeholder.com/60?text=No+Image'}" class="product-image-thumbnail"></td><td>${o.category_name}</td><td>${o.name}</td><td>${noteDisplay}</td><td>${o.product_code || ''}</td><td>$${parseFloat(o.price_usd).toFixed(2)}</td><td>£${parseFloat(o.price_gbp).toFixed(2)}</td><td>€${parseFloat(o.price_eur).toFixed(2)}</td><td><button class="action-btn" onclick="editOption(${o.id})">Edit</button><button class="action-btn delete" onclick="deleteOption(${o.id})">Delete</button></td></tr>`;
        });
    } catch (error) { console.error('Failed to load options:', error); }
}
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`); const orders = await response.json(); const tbody = document.querySelector('#ordersTable tbody'); tbody.innerHTML = '';
        orders.forEach(o => { tbody.innerHTML += `<tr><td>${o.order_number}</td><td>${o.customer_name || 'N/A'}</td><td>${o.customer_email || 'N/A'}</td><td>$${parseFloat(o.total_amount).toFixed(2)}</td><td>${o.item_count}</td><td>${new Date(o.created_at).toLocaleDateString()}</td><td><span class="status-${o.status || 'pending'}">${o.status || 'pending'}</span></td></tr>`; });
    } catch (error) { console.error('Failed to load orders:', error); }
}

async function openProductModal(productId = null, data = null) {
    currentEditId = productId; document.getElementById('productForm').reset(); const modalTitle = document.querySelector('#productModal .modal-title'); const preview = document.getElementById('productImagePreview');
    if (productId && data) {
        modalTitle.textContent = 'Edit Product';
        document.getElementById('productName').value = data.name;
        document.getElementById('productDescription').value = data.description;
        document.getElementById('productPrice').value = data.base_price;
        document.getElementById('productImageUrl').value = data.image_url || '';
        preview.src = data.image_url || ''; preview.style.display = data.image_url ? 'block' : 'none';
        document.getElementById('productCameraType').value = data.camera_type || 'Broadcast';
        document.getElementById('productMakeModel').value = data.make_model || '';
        document.getElementById('productLens').value = data.lens || '';
        document.getElementById('productExternalLensMotors').value = data.external_lens_motors;
        document.getElementById('productPoweredRail').value = data.powered_rail;
        document.getElementById('productRemotePanTiltHead').value = data.remote_pan_tilt_head;
    } else { modalTitle.textContent = 'Add Product'; preview.style.display = 'none'; }
    document.getElementById('productModal').style.display = 'flex';
}

async function openCategoryModal(categoryId = null, data = null) {
    currentEditId = categoryId; document.getElementById('categoryForm').reset(); const modalTitle = document.querySelector('#categoryModal .modal-title'); await loadProductsForSelect();
    if (categoryId && data) {
        modalTitle.textContent = 'Edit Category';
        document.getElementById('categoryProductId').value = data.product_id;
        document.getElementById('categoryName').value = data.name;
        document.getElementById('categoryDescription').value = data.description;
        document.getElementById('categoryOrder').value = data.display_order;
        document.getElementById('categoryStep').value = data.assigned_step || 1;
    } else {
        modalTitle.textContent = 'Add Category';
        document.getElementById('categoryStep').value = 1;
    }
    document.getElementById('categoryModal').style.display = 'flex';
}

async function openOptionModal(optionId = null, data = null) {
    currentEditId = optionId; document.getElementById('optionForm').reset(); const modalTitle = document.querySelector('#optionModal .modal-title'); const preview = document.getElementById('optionImagePreview'); await loadCategoriesForSelect();
    if (optionId && data) {
        modalTitle.textContent = 'Edit Option';
        document.getElementById('optionCategoryId').value = data.category_id;
        document.getElementById('optionName').value = data.name;
        document.getElementById('optionProductCode').value = data.product_code || '';
        document.getElementById('optionDescription').value = data.description;
        document.getElementById('optionPriceUSD').value = data.price_usd;
        document.getElementById('optionPriceGBP').value = data.price_gbp;
        document.getElementById('optionPriceEUR').value = data.price_eur;
        document.getElementById('optionOrder').value = data.display_order;
        document.getElementById('optionAutoAddQuantity').value = data.auto_add_quantity || 0;
        document.getElementById('optionRecQty').value = data.recommended_quantity || 0;
        document.getElementById('optionNote').value = data.note || '';
        document.getElementById('optionImageUrl').value = data.image_url || ''; preview.src = data.image_url || ''; preview.style.display = data.image_url ? 'block' : 'none';
    } else { modalTitle.textContent = 'Add Option'; preview.style.display = 'none'; }
    document.getElementById('optionModal').style.display = 'flex';
}

function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; currentEditId = null; }
async function loadProductsForSelect() { try { const response = await fetch(`${API_BASE}/products`); const products = await response.json(); const select = document.getElementById('categoryProductId'); select.innerHTML = '<option value="">Select Product</option>'; products.forEach(p => { select.innerHTML += `<option value="${p.id}">${p.name}</option>`; }); } catch (error) { console.error('Failed to load products for select:', error); } }
async function loadCategoriesForSelect() { try { const response = await fetch(`${API_BASE}/categories`); const categories = await response.json(); const select = document.getElementById('optionCategoryId'); select.innerHTML = '<option value="">Select Category</option>'; categories.forEach(c => { select.innerHTML += `<option value="${c.id}">${c.name}</option>`; }); } catch (error) { console.error('Failed to load categories for select:', error); } }

async function handleFormSubmit(formId, entityType, loadDataCallback) {
    const form = document.getElementById(formId); if (form.dataset.listenerAttached) return; form.dataset.listenerAttached = true;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        let formData;
        if (entityType === 'product') {
            formData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                base_price: parseFloat(document.getElementById('productPrice').value) || 0,
                image_url: document.getElementById('productImageUrl').value,
                camera_type: document.getElementById('productCameraType').value,
                make_model: document.getElementById('productMakeModel').value,
                lens: document.getElementById('productLens').value,
                external_lens_motors: document.getElementById('productExternalLensMotors').value,
                powered_rail: document.getElementById('productPoweredRail').value,
                remote_pan_tilt_head: document.getElementById('productRemotePanTiltHead').value
            };
        } else if (entityType === 'category') {
            formData = {
                product_id: document.getElementById('categoryProductId').value,
                name: document.getElementById('categoryName').value,
                description: document.getElementById('categoryDescription').value,
                display_order: parseInt(document.getElementById('categoryOrder').value) || 0,
                assigned_step: document.getElementById('categoryStep').value
            };
        } else {
            // Option Form
            formData = {
                category_id: document.getElementById('optionCategoryId').value,
                name: document.getElementById('optionName').value,
                product_code: document.getElementById('optionProductCode').value,
                image_url: document.getElementById('optionImageUrl').value,
                description: document.getElementById('optionDescription').value,
                price_usd: parseFloat(document.getElementById('optionPriceUSD').value) || 0,
                price_gbp: parseFloat(document.getElementById('optionPriceGBP').value) || 0,
                price_eur: parseFloat(document.getElementById('optionPriceEUR').value) || 0,
                inventory: 99999,
                display_order: parseInt(document.getElementById('optionOrder').value) || 0,
                auto_add_quantity: parseInt(document.getElementById('optionAutoAddQuantity').value) || 0,
                recommended_quantity: parseInt(document.getElementById('optionRecQty').value) || 0,
                note: document.getElementById('optionNote').value
            };
        }
        const method = currentEditId ? 'PUT' : 'POST'; const endpoint = entityType === 'category' ? 'categories' : `${entityType}s`; const url = currentEditId ? `${API_BASE}/${endpoint}/${currentEditId}` : `${API_BASE}/${endpoint}`;
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.success) {
                closeModal(`${entityType}Modal`);
                loadDataCallback();
                loadDashboardStats();
            } else {
                // Added alert for failures
                alert('Error saving: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(`Failed to save ${entityType}:`, error);
            alert(`Failed to save ${entityType}. Check console for details.\n\nIMPORTANT: Did you run the SQL command to add the 'note' column?`);
        }
    });
}
handleFormSubmit('productForm', 'product', loadProducts); handleFormSubmit('categoryForm', 'category', loadCategories); handleFormSubmit('optionForm', 'option', loadOptions);

async function editProduct(id) { try { const response = await fetch(`${API_BASE}/products/${id}`); const data = await response.json(); openProductModal(id, data); } catch (error) { alert('Error'); } }
async function editCategory(id) { try { const response = await fetch(`${API_BASE}/categories/${id}`); const data = await response.json(); openCategoryModal(id, data); } catch (error) { alert('Error'); } }
async function editOption(id) { try { const response = await fetch(`${API_BASE}/options/${id}`); const data = await response.json(); openOptionModal(id, data); } catch (error) { alert('Error'); } }

async function deleteEntity(type, id, callback) {
    if (!confirm(`Delete this ${type}?`)) return;
    try { const endpoint = type === 'category' ? 'categories' : `${type}s`; const response = await fetch(`${API_BASE}/${endpoint}/${id}`, { method: 'DELETE' }); const result = await response.json(); if (result.success) { callback(); loadDashboardStats(); } else { alert('Failed'); } } catch (e) { alert('Error'); }
}
function deleteProduct(id) { deleteEntity('product', id, loadProducts); } function deleteCategory(id) { deleteEntity('category', id, loadCategories); } function deleteOption(id) { deleteEntity('option', id, loadOptions); }

document.getElementById('productImageUrl').addEventListener('input', (e) => { const preview = document.getElementById('productImagePreview'); e.target.value ? (preview.src = e.target.value, preview.style.display = 'block') : preview.style.display = 'none'; });
document.getElementById('optionImageUrl').addEventListener('input', (e) => { const preview = document.getElementById('optionImagePreview'); e.target.value ? (preview.src = e.target.value, preview.style.display = 'block') : preview.style.display = 'none'; });

window.onclick = function (event) { if (event.target.classList.contains('modal')) { event.target.style.display = 'none'; currentEditId = null; } };
checkLoginStatus(); loadSavedCredentials();
setTimeout(() => { if (!localStorage.getItem('splitCameraUsername')) { document.getElementById('username').value = 'admin'; document.getElementById('password').value = 'admin@123'; } }, 500);