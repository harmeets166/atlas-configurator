<?php
// api.php - Main API Handler (With Notes Support)
include 'config.php';

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Security function
function checkAdminSession() {
    session_start();
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
}

function adminLogout() {
    session_start();
    session_unset();
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
}

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['endpoint']) ? explode('/', trim($_GET['endpoint'], '/')) : [];
$endpoint = $request[0] ?? '';
$id = $request[1] ?? null;

switch ($endpoint) {
    case 'products': handleProducts($method, $pdo, $id); break;
    case 'categories': handleCategories($method, $pdo, $id); break;
    case 'options': handleOptions($method, $pdo, $id); break;
    case 'orders': handleOrders($method, $pdo, $id); break;
    case 'admin': 
        $action = $id; 
        handleAdmin($method, $pdo, $action); 
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

// --- Products Handler ---
function handleProducts($method, $pdo, $id) {
    if ($method !== 'GET') checkAdminSession();
    switch ($method) {
        case 'GET':
            if ($id && is_numeric($id)) {
                if (isset($_SESSION['admin_id'])) getProductById($pdo, $id);
                else getProductWithOptions($pdo, $id);
            } else {
                getAllProducts($pdo);
            }
            break;
        case 'POST': createProduct($pdo); break;
        case 'PUT': if ($id) updateProduct($pdo, $id); break;
        case 'DELETE': if ($id) deleteProduct($pdo, $id); break;
    }
}

function getAllProducts($pdo) {
    $stmt = $pdo->query("SELECT * FROM products WHERE status = 'active' ORDER BY name");
    echo json_encode($stmt->fetchAll());
}

function getProductById($pdo, $productId) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if ($product) echo json_encode($product);
    else { http_response_code(404); echo json_encode(['error' => 'Product not found']); }
}

function getProductWithOptions($pdo, $productId) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND status = 'active'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) { http_response_code(404); echo json_encode(['error' => 'Product not found']); return; }
    
    // UPDATED: Added o.note to the SELECT query
    $stmt = $pdo->prepare("
        SELECT 
            c.*, c.assigned_step,
            o.id as option_id, o.name as option_name, o.description as option_desc,
            o.product_code, 
            o.price_usd, o.price_gbp, o.price_eur,
            o.inventory, o.display_order as option_order, o.auto_add_quantity,
            o.recommended_quantity,
            o.note,  
            o.image_url as option_image_url
        FROM categories c
        LEFT JOIN options o ON c.id = o.category_id AND o.status = 'active'
        WHERE c.product_id = ? AND c.status = 'active'
        ORDER BY c.assigned_step ASC, c.display_order ASC, o.display_order ASC
    ");
    $stmt->execute([$productId]);
    $results = $stmt->fetchAll();
    
    $categories = [];
    foreach ($results as $row) {
        $catId = $row['id'];
        if (!isset($categories[$catId])) {
            $categories[$catId] = [
                'id' => $row['id'], 
                'name' => $row['name'], 
                'description' => $row['description'],
                'assigned_step' => $row['assigned_step'] ?? 1, 
                'display_order' => $row['display_order'],
                'options' => []
            ];
        }
        if ($row['option_id']) {
            $categories[$catId]['options'][] = [
                'id' => (int)$row['option_id'],
                'name' => $row['option_name'],
                'product_code' => $row['product_code'],
                'description' => $row['option_desc'],
                'image_url' => $row['option_image_url'],
                'price_usd' => (float)$row['price_usd'],
                'price_gbp' => (float)$row['price_gbp'],
                'price_eur' => (float)$row['price_eur'],
                'inventory' => (int)$row['inventory'],
                'auto_add_quantity' => (int)$row['auto_add_quantity'],
                'recommended_quantity' => (int)$row['recommended_quantity'],
                'note' => $row['note'] // Added Note
            ];
        }
    }
    
    $product['categories'] = array_values($categories);
    echo json_encode($product);
}

function createProduct($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO products (name, description, base_price, camera_type, make_model, lens, external_lens_motors, powered_rail, remote_pan_tilt_head, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$data['name'], $data['description'] ?? '', $data['base_price'] ?? 0.00, $data['camera_type'] ?? null, $data['make_model'] ?? null, $data['lens'] ?? null, $data['external_lens_motors'] ?? 1, $data['powered_rail'] ?? 1, $data['remote_pan_tilt_head'] ?? 1, $data['image_url'] ?? null])) {
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        http_response_code(500); echo json_encode(['success' => false, 'error' => 'Failed']);
    }
}

function updateProduct($pdo, $productId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, base_price = ?, camera_type = ?, make_model = ?, lens = ?, external_lens_motors = ?, powered_rail = ?, remote_pan_tilt_head = ?, image_url = ? WHERE id = ?");
    $stmt->execute([$data['name'], $data['description'], $data['base_price'], $data['camera_type'], $data['make_model'], $data['lens'], $data['external_lens_motors'], $data['powered_rail'], $data['remote_pan_tilt_head'], $data['image_url'] ?? null, $productId]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

function deleteProduct($pdo, $productId) {
    $stmt = $pdo->prepare("UPDATE products SET status = 'inactive' WHERE id = ?");
    $stmt->execute([$productId]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

// --- Categories Handler ---
function handleCategories($method, $pdo, $id) {
    if ($method !== 'GET') checkAdminSession();
    switch ($method) {
        case 'GET':
            if ($id && is_numeric($id)) getCategoryById($pdo, $id);
            else getAllCategories($pdo);
            break;
        case 'POST': createCategory($pdo); break;
        case 'PUT': if ($id) updateCategory($pdo, $id); break;
        case 'DELETE': if ($id) deleteCategory($pdo, $id); break;
    }
}

function getAllCategories($pdo) {
    $stmt = $pdo->query("SELECT c.*, p.name as product_name FROM categories c JOIN products p ON c.product_id = p.id WHERE c.status = 'active' ORDER BY c.assigned_step ASC, c.display_order ASC");
    echo json_encode($stmt->fetchAll());
}

function getCategoryById($pdo, $categoryId) {
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$categoryId]);
    $category = $stmt->fetch();
    if ($category) echo json_encode($category);
    else { http_response_code(404); echo json_encode(['error' => 'Not found']); }
}

function createCategory($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO categories (product_id, name, description, display_order, assigned_step) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$data['product_id'], $data['name'], $data['description'] ?? '', $data['display_order'] ?? 0, $data['assigned_step'] ?? 1])) {
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        http_response_code(500); echo json_encode(['success' => false, 'error' => 'Failed']);
    }
}

function updateCategory($pdo, $categoryId) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE categories SET product_id = ?, name = ?, description = ?, display_order = ?, assigned_step = ? WHERE id = ?");
    $stmt->execute([$data['product_id'], $data['name'], $data['description'], $data['display_order'], $data['assigned_step'], $categoryId]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

function deleteCategory($pdo, $categoryId) {
    $stmt = $pdo->prepare("UPDATE categories SET status = 'inactive' WHERE id = ?");
    $stmt->execute([$categoryId]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

// --- Options Handler ---
function handleOptions($method, $pdo, $id) {
    if ($method !== 'GET') checkAdminSession();
    switch ($method) {
        case 'GET':
            if ($id && is_numeric($id)) getOptionById($pdo, $id);
            else getAllOptions($pdo);
            break;
        case 'POST': createOption($pdo); break;
        case 'PUT': if ($id) updateOption($pdo, $id); break;
        case 'DELETE': if ($id) deleteOption($pdo, $id); break;
    }
}

function getAllOptions($pdo) {
    // UPDATED: Added o.note to SELECT
    $stmt = $pdo->query("SELECT o.*, c.name as category_name FROM options o JOIN categories c ON o.category_id = c.id WHERE o.status = 'active' ORDER BY o.display_order");
    echo json_encode($stmt->fetchAll());
}

function getOptionById($pdo, $optionId) {
    $stmt = $pdo->prepare("SELECT * FROM options WHERE id = ?");
    $stmt->execute([$optionId]);
    $option = $stmt->fetch();
    if ($option) echo json_encode($option);
    else { http_response_code(404); echo json_encode(['error' => 'Not found']); }
}

function createOption($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    // UPDATED: Added note column to INSERT
    $stmt = $pdo->prepare("INSERT INTO options (category_id, name, product_code, description, price_usd, price_gbp, price_eur, inventory, display_order, auto_add_quantity, recommended_quantity, image_url, note) VALUES (?, ?, ?, ?, ?, ?, ?, 99999, ?, ?, ?, ?, ?)");
    
    // UPDATED: Execute array includes note
    if ($stmt->execute([
        $data['category_id'], 
        $data['name'], 
        $data['product_code'] ?? '', 
        $data['description'] ?? '', 
        $data['price_usd'] ?? 0, 
        $data['price_gbp'] ?? 0, 
        $data['price_eur'] ?? 0, 
        $data['display_order'] ?? 0, 
        $data['auto_add_quantity'] ?? 0, 
        $data['recommended_quantity'] ?? 0,
        $data['image_url'] ?? null,
        $data['note'] ?? null // Added Note
    ])) {
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        http_response_code(500); echo json_encode(['success' => false, 'error' => 'Failed']);
    }
}

function updateOption($pdo, $optionId) {
    $data = json_decode(file_get_contents('php://input'), true);
    // UPDATED: Added note column to UPDATE
    $stmt = $pdo->prepare("UPDATE options SET category_id = ?, name = ?, product_code = ?, description = ?, price_usd = ?, price_gbp = ?, price_eur = ?, inventory = 99999, display_order = ?, auto_add_quantity = ?, recommended_quantity = ?, image_url = ?, note = ? WHERE id = ?");
    
    // UPDATED: Execute array includes note
    $stmt->execute([
        $data['category_id'], 
        $data['name'], 
        $data['product_code'], 
        $data['description'], 
        $data['price_usd'], 
        $data['price_gbp'], 
        $data['price_eur'], 
        $data['display_order'], 
        $data['auto_add_quantity'], 
        $data['recommended_quantity'], 
        $data['image_url'] ?? null, 
        $data['note'] ?? null, // Added Note
        $optionId
    ]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

function deleteOption($pdo, $optionId) {
    $stmt = $pdo->prepare("UPDATE options SET status = 'inactive' WHERE id = ?");
    $stmt->execute([$optionId]);
    echo json_encode(['success' => $stmt->rowCount() > 0]);
}

// --- Orders Handler ---
function handleOrders($method, $pdo, $id) {
    if ($method === 'GET') checkAdminSession();
    switch ($method) {
        case 'POST': createOrder($pdo); break;
        case 'GET': getAllOrders($pdo); break;
    }
}

function createOrder($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $pdo->beginTransaction();
        $orderNumber = 'SC-' . date('Ymd') . '-' . mt_rand(1000, 9999);
        $stmt = $pdo->prepare("INSERT INTO orders (order_number, customer_email, customer_name, total_amount) VALUES (?, ?, ?, ?)");
        $stmt->execute([$orderNumber, $data['customer_email'] ?? '', $data['customer_name'] ?? '', $data['total_amount']]);
        $orderId = $pdo->lastInsertId();
        $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, option_id, category_name, option_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
        
        foreach ($data['items'] as $item) {
            $itemStmt->execute([$orderId, $item['optionId'], $item['category'], $item['option'], $item['price'], $item['quantity']]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'order_number' => $orderNumber]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed']);
    }
}

function getAllOrders($pdo) {
    $stmt = $pdo->query("SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count FROM orders o ORDER BY o.created_at DESC LIMIT 100");
    echo json_encode($stmt->fetchAll());
}

// --- Admin Handler ---
function handleAdmin($method, $pdo, $action) {
    if ($action === 'login' && $method === 'POST') {
        adminLogin($pdo);
    } else if ($action === 'dashboard' && $method === 'GET') {
        checkAdminSession();
        getDashboardStats($pdo);
    } else if ($action === 'status' && $method === 'GET') {
        checkAdminSession();
        echo json_encode(['success' => true, 'user' => [ 'id' => $_SESSION['admin_id'], 'username' => $_SESSION['admin_username'] ]]);
    } else if ($action === 'logout' && $method === 'GET') {
        adminLogout();
    }
}

function adminLogin($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? AND status = 'active'");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    if ($user && $data['password'] === $user['password']) {
        session_start();
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']]]);
    } else {
        http_response_code(401); echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
}

function getDashboardStats($pdo) {
    $stats = [];
    $stats['total_products'] = $pdo->query("SELECT COUNT(*) FROM products WHERE status = 'active'")->fetchColumn();
    $stats['total_categories'] = $pdo->query("SELECT COUNT(*) FROM categories WHERE status = 'active'")->fetchColumn();
    $stats['total_options'] = $pdo->query("SELECT COUNT(*) FROM options WHERE status = 'active'")->fetchColumn();
    $stats['orders_today'] = $pdo->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    $stats['revenue_today'] = (float)$pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    $stats['low_inventory'] = 0;
    echo json_encode($stats);
}
?>