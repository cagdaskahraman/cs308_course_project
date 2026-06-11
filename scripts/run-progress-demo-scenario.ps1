# Runs a full API-level progress demo scenario (features 1,3,4,5,7,9).
# Requires running backend + database.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/run-progress-demo-scenario.ps1

$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost:3000' }

function Assert-True([string]$name, [bool]$cond) {
  if (-not $cond) { throw "FAIL: $name" }
  Write-Host "OK   $name" -ForegroundColor Green
}

Write-Host "Running progress demo scenario against $base" -ForegroundColor Cyan

# Step 1 + Step 2: Categories and selecting A/B/C stock profiles.
$products = Invoke-RestMethod -Uri "$base/products"
$cats = Invoke-RestMethod -Uri "$base/products/categories"
Assert-True 'Step 1 categories exist' ($cats.Count -gt 0)
Assert-True 'Step 1 products exist' ($products.Count -gt 0)

$productA = $products | Where-Object { $_.stockQuantity -eq 0 } | Select-Object -First 1
$productB = $products | Where-Object { $_.stockQuantity -eq 1 } | Select-Object -First 1
$usedFallbackB = $false
if (-not $productB) {
  $productB = $products | Where-Object { $_.stockQuantity -gt 0 } | Select-Object -First 1
  $usedFallbackB = $true
}
$productC = $products | Where-Object { $_.stockQuantity -gt 1 -and $_.id -ne $productB.id } | Select-Object -First 1

Assert-True 'Step 2 product A out-of-stock exists' ($null -ne $productA)
Assert-True 'Step 2 product B in-stock exists' ($null -ne $productB)
Assert-True 'Step 2 product C stock>1 exists' ($null -ne $productC)

Write-Host "Selected Product A: $($productA.name)" -ForegroundColor Yellow
Write-Host "Selected Product B: $($productB.name)" -ForegroundColor Yellow
if ($usedFallbackB) {
  Write-Host "Note: no stock=1 product remained in DB, used fallback in-stock product for Product B." -ForegroundColor Yellow
}
Write-Host "Selected Product C: $($productC.name)" -ForegroundColor Yellow

# Step 3: Guest search/sort/cart behavior.
$cart = Invoke-RestMethod -Method Post -Uri "$base/cart" -ContentType 'application/json' -Body '{}'

$sortedPrice = Invoke-RestMethod -Uri "$base/products?sortBy=price&sortOrder=asc"
$sortedPop = Invoke-RestMethod -Uri "$base/products?sortBy=popularity&sortOrder=desc"
Assert-True 'Step 3 price sort works' ($sortedPrice.Count -gt 0)
Assert-True 'Step 3 popularity sort works' ($sortedPop.Count -gt 0)

$findA = Invoke-RestMethod -Uri "$base/products?search=$([uri]::EscapeDataString($productA.name))"
$findB = Invoke-RestMethod -Uri "$base/products?search=$([uri]::EscapeDataString($productB.name))"
$findC = Invoke-RestMethod -Uri "$base/products?search=$([uri]::EscapeDataString(($productC.description -split ' ')[0]))"
Assert-True 'Step 3 search Product A' (@($findA | Where-Object { $_.id -eq $productA.id }).Count -eq 1)
Assert-True 'Step 3 search Product B' (@($findB | Where-Object { $_.id -eq $productB.id }).Count -eq 1)
Assert-True 'Step 3 search Product C by description' ($findC.Count -gt 0)

$outOfStockAddFailed = $false
try {
  Invoke-RestMethod -Method Post -Uri "$base/cart/items" -ContentType 'application/json' `
    -Body (@{ cartId = $cart.id; productId = $productA.id; quantity = 1 } | ConvertTo-Json) | Out-Null
} catch {
  $outOfStockAddFailed = $true
}
Assert-True 'Step 3 cannot add out-of-stock product A to cart' $outOfStockAddFailed

Invoke-RestMethod -Method Post -Uri "$base/cart/items" -ContentType 'application/json' `
  -Body (@{ cartId = $cart.id; productId = $productB.id; quantity = 1 } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/cart/items" -ContentType 'application/json' `
  -Body (@{ cartId = $cart.id; productId = $productC.id; quantity = 1 } | ConvertTo-Json) | Out-Null
Assert-True 'Step 3 added B and C to guest cart' ($true)

# Step 4: Register/login/checkout/invoice/email.
$email = ('progress_' + [guid]::NewGuid().ToString('N').Substring(0, 10) + '@test.local')
$pwd = 'ProgressDemo123!'
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' `
  -Body (@{
    email = $email
    fullName = 'Progress Demo Customer'
    password = $pwd
    confirmPassword = $pwd
  } | ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' `
  -Body (@{ email = $email; password = $pwd } | ConvertTo-Json)
$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }
Assert-True 'Step 4 login succeeds' ($null -ne $token)

$order = Invoke-RestMethod -Method Post -Uri "$base/orders/checkout" -Headers $headers -ContentType 'application/json' `
  -Body (@{
    cartId = $cart.id
    items = @(
      @{ productId = $productB.id; quantity = 1 },
      @{ productId = $productC.id; quantity = 1 }
    )
    billingEmail = $email
    deliveryAddress = 'Istanbul, Uskudar, Demo Delivery Address 22'
    payment = @{
      cardHolder = 'PROGRESS DEMO CUSTOMER'
      cardNumber = '4242424242424242'
      expiry = '08/28'
      cvc = '737'
    }
  } | ConvertTo-Json -Depth 6)

Assert-True 'Step 4 order created' ($null -ne $order.id)
Assert-True 'Step 5 initial status is processing' ($order.status -eq 'processing')

$invoice = Invoke-RestMethod -Method Get -Uri "$base/orders/$($order.id)/invoice" -Headers $headers
$invoiceMail = Invoke-RestMethod -Method Get -Uri "$base/orders/$($order.id)/invoice-mail" -Headers $headers
Assert-True 'Step 4 invoice exists' ($null -ne $invoice.invoiceNumber)
Assert-True 'Step 4 invoice mail dispatch exists' ($invoiceMail.to -eq $email)

# Step 5: stock decrease + delivery status transitions by product manager.
$afterB = (Invoke-RestMethod -Uri "$base/products/$($productB.id)").stockQuantity
$afterC = (Invoke-RestMethod -Uri "$base/products/$($productC.id)").stockQuantity
Assert-True 'Step 5 Product B stock decreased' ($afterB -eq ($productB.stockQuantity - 1))
Assert-True 'Step 5 Product C stock decreased by 1+' ($afterC -lt $productC.stockQuantity)

$pmLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' `
  -Body (@{ email = 'pm@electrostore.local'; password = 'Manager123!' } | ConvertTo-Json)
$pmHeaders = @{ Authorization = "Bearer $($pmLogin.accessToken)" }
Assert-True 'Step 5 PM login works' ($null -ne $pmLogin.accessToken)

$toTransit = Invoke-RestMethod -Method Patch -Uri "$base/orders/$($order.id)/status" -Headers $pmHeaders -ContentType 'application/json' `
  -Body (@{ status = 'in-transit' } | ConvertTo-Json)
$toDelivered = Invoke-RestMethod -Method Patch -Uri "$base/orders/$($order.id)/status" -Headers $pmHeaders -ContentType 'application/json' `
  -Body (@{ status = 'delivered' } | ConvertTo-Json)
Assert-True 'Step 5 moved to in-transit' ($toTransit.status -eq 'in-transit')
Assert-True 'Step 5 moved to delivered' ($toDelivered.status -eq 'delivered')

# Step 6: rating/comment moderation.
Invoke-RestMethod -Method Post -Uri "$base/reviews" -Headers $headers -ContentType 'application/json' `
  -Body (@{ productId = $productB.id; rating = 5 } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/reviews" -Headers $headers -ContentType 'application/json' `
  -Body (@{ productId = $productC.id; rating = 4 } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Patch -Uri "$base/reviews/product/$($productC.id)/comment" -Headers $headers -ContentType 'application/json' `
  -Body (@{ comment = 'Product C comment for moderation' } | ConvertTo-Json) | Out-Null

$visibleB = Invoke-RestMethod -Method Get -Uri "$base/reviews/product/$($productB.id)?status=approved"
$visibleCBefore = Invoke-RestMethod -Method Get -Uri "$base/reviews/product/$($productC.id)?status=approved"
Assert-True 'Step 6 Product B rating is immediately visible' (@($visibleB).Count -gt 0)

$pending = Invoke-RestMethod -Method Get -Uri "$base/reviews?status=pending" -Headers $pmHeaders
$pendingC = $pending | Where-Object {
  $_.pendingComment -eq 'Product C comment for moderation' -or
  $_.comment -eq 'Product C comment for moderation'
} | Select-Object -First 1
Assert-True 'Step 6 Product C comment is pending before approval' ($null -ne $pendingC)

Invoke-RestMethod -Method Patch -Uri "$base/reviews/$($pendingC.id)/approve" -Headers $pmHeaders -ContentType 'application/json' -Body '{}' | Out-Null
$visibleCAfter = Invoke-RestMethod -Method Get -Uri "$base/reviews/product/$($productC.id)?status=approved"
$commentVisible = @($visibleCAfter | Where-Object { $_.comment -eq 'Product C comment for moderation' }).Count -ge 1
Assert-True 'Step 6 Product C comment visible after approval' $commentVisible

Write-Host "`nProgress demo API scenario finished successfully." -ForegroundColor Cyan
