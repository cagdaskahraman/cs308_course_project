# Verifies progress-demo scope: requirements 1, 3, 5, 7, 9 against a running API.
# Usage: ensure backend is up (e.g. npm run start in backend), then:
#   powershell -ExecutionPolicy Bypass -File scripts/verify-course-requirements.ps1
#   (or pwsh on machines where PowerShell 7 is installed)
# Optional: $env:API_BASE = 'http://localhost:3000'

$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost:3000' }

function Assert-True([string]$name, [bool]$cond) {
  if (-not $cond) { throw "FAIL: $name" }
  Write-Host "OK   $name" -ForegroundColor Green
}

Write-Host "Checking API at $base ..." -ForegroundColor Cyan

# --- 1) Products in categories + cart without auth ---
$products = Invoke-RestMethod -Uri "$base/products"
Assert-True '1: GET /products returns a non-empty list' ($products.Count -gt 0)
$cats = Invoke-RestMethod -Uri "$base/products/categories"
Assert-True '1: GET /products/categories returns categories' ($cats.Count -gt 0)

$cart = Invoke-RestMethod -Method Post -Uri "$base/cart" -ContentType 'application/json' -Body '{}'
$p = $products | Where-Object { $_.stockQuantity -gt 0 } | Select-Object -First 1
if (-not $p) { throw 'No in-stock product for guest cart test' }
Invoke-RestMethod -Method Post -Uri "$base/cart/items" -ContentType 'application/json' `
  -Body (@{ cartId = $cart.id; productId = $p.id; quantity = 1 } | ConvertTo-Json) | Out-Null
Assert-True '1: Guest can add to cart (no auth header)' ($true)

# --- 7) Search + sort + out-of-stock still listed ---
$term = [string]$p.name
$search = Invoke-RestMethod -Uri "$base/products?search=$([uri]::EscapeDataString($term))"
Assert-True '7: Search returns at least one product' ($search.Count -gt 0)

$sorted = Invoke-RestMethod -Uri "$base/products?sortBy=price&sortOrder=asc"
Assert-True '7: Price sort returns list' ($sorted.Count -gt 0)
$sortedPop = Invoke-RestMethod -Uri "$base/products?sortBy=popularity&sortOrder=desc"
Assert-True '7: Popularity sort returns list' ($sortedPop.Count -gt 0)

$zeroStock = $products | Where-Object { $_.stockQuantity -eq 0 } | Select-Object -First 1
if ($zeroStock) {
  $found = Invoke-RestMethod -Uri "$base/products?search=$([uri]::EscapeDataString($zeroStock.name))"
  $stillThere = @($found | Where-Object { $_.id -eq $zeroStock.id }).Count -eq 1
  Assert-True '7: Out-of-stock product still appears in search results' $stillThere
} else {
  Write-Host 'SKIP 7: no zero-stock product in dataset' -ForegroundColor Yellow
}

# --- 9) Product fields on GET /products/:id ---
$detail = Invoke-RestMethod -Uri "$base/products/$($p.id)"
Assert-True '9: product has id' ($null -ne $detail.id -and $detail.id.Length -gt 0)
Assert-True '9: product has name' ($null -ne $detail.name)
Assert-True '9: product has model' ($null -ne $detail.model)
Assert-True '9: product has serialNumber' ($null -ne $detail.serialNumber)
Assert-True '9: product has description' ($null -ne $detail.description)
Assert-True '9: product has stockQuantity' ($null -ne $detail.stockQuantity)
Assert-True '9: product has price' ($null -ne $detail.price)
Assert-True '9: product has warrantyStatus' ($null -ne $detail.warrantyStatus)
Assert-True '9: product has distributorInfo' ($null -ne $detail.distributorInfo)

# --- 5) Reviews list (approved) public ---
$revs = Invoke-RestMethod -Uri "$base/reviews/product/$($p.id)?status=approved"
Assert-True '5: GET approved reviews for product succeeds' ($null -ne $revs)

# --- 3) Checkout decreases stock (requires auth + payment) ---
$email = ('verify_' + [guid]::NewGuid().ToString('N').Substring(0, 10) + '@test.local')
$pwd = 'VerifyTest123!'
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' `
  -Body (@{ email = $email; password = $pwd; confirmPassword = $pwd } | ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' `
  -Body (@{ email = $email; password = $pwd } | ConvertTo-Json)
$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }

$buy = $products | Where-Object { $_.stockQuantity -gt 2 } | Select-Object -First 1
if (-not $buy) { throw 'No product with stock > 2 for checkout test' }
$before = (Invoke-RestMethod -Uri "$base/products/$($buy.id)").stockQuantity

$cart2 = Invoke-RestMethod -Method Post -Uri "$base/cart" -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Method Post -Uri "$base/cart/items" -Headers $headers -ContentType 'application/json' `
  -Body (@{ cartId = $cart2.id; productId = $buy.id; quantity = 1 } | ConvertTo-Json) | Out-Null

$order = Invoke-RestMethod -Method Post -Uri "$base/orders/checkout" -Headers $headers -ContentType 'application/json' `
  -Body (@{
    cartId       = $cart2.id
    items        = @(@{ productId = $buy.id; quantity = 1 })
    billingEmail = $email
    payment      = @{
      cardHolder = 'VERIFY USER'
      cardNumber = '4242424242424242'
      expiry     = '08/28'
      cvc        = '737'
    }
  } | ConvertTo-Json -Depth 5)

Assert-True '3: Order created with processing status' ($order.status -eq 'processing')
$after = (Invoke-RestMethod -Uri "$base/products/$($buy.id)").stockQuantity
Assert-True '3: Stock decreased after checkout' ($after -eq ($before - 1))

$mine = Invoke-RestMethod -Uri "$base/orders/me" -Headers $headers
Assert-True '3: GET /orders/me lists new order' (@($mine | Where-Object { $_.id -eq $order.id }).Count -eq 1)

Write-Host "`nAll checks passed." -ForegroundColor Cyan
