# Tunnel Cloudflare — plus stable que localtunnel (pas de page "Continue", pas de 408).
# Usage : npm run tunnel
# Gardez CE terminal ouvert + npm start sur le port 3000

Write-Host ""
Write-Host "=== Tunnel mobile FacturePro (Cloudflare) ===" -ForegroundColor Cyan
Write-Host "1. Verifiez que 'npm start' tourne (http://localhost:3000)"
Write-Host "2. Copiez l'URL https://....trycloudflare.com ci-dessous"
Write-Host "3. Admin -> Parametres OU User -> Parametres -> URL publique QR -> Enregistrer"
Write-Host "4. Regenerez le PDF puis scannez le QR"
Write-Host "5. NE FERMEZ PAS ce terminal"
Write-Host ""

$ErrorActionPreference = "Continue"
npx --yes cloudflared tunnel --url http://127.0.0.1:3000
