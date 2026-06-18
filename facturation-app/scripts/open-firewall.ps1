# Ouvre le port 3000 pour le serveur React (scan QR depuis le téléphone).
# Clic droit → Exécuter en tant qu'administrateur

$ruleName = "FacturePro Dev 3000"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "La regle '$ruleName' existe deja." -ForegroundColor Yellow
} else {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 3000 `
        -Profile Any | Out-Null
    Write-Host "Regle pare-feu ajoutee : port TCP 3000 (tous profils reseau)." -ForegroundColor Green
}

Write-Host ""
Write-Host "Test sur le telephone (meme Wi-Fi, 4G desactivee) :" -ForegroundColor Cyan
Write-Host "  http://192.168.1.11:3000"
Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"
