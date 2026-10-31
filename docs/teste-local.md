# Guia de Teste Local — DNS Shield

Como rodar o bloqueio no **seu próprio computador** (sem Raspberry Pi) e como
**reverter** com segurança. Seu PC faz o papel do Pi: roda o Pi-hole e serve DNS
na porta 53. Serve para Mac, Linux e Windows.

> ⚠️ Isto é **teste**. A experiência plug-and-play real (Wi-Fi automático via
> hostapd) só existe no Raspberry Pi. Aqui o bloqueio é idêntico — muda só que
> você aponta o DNS manualmente.

---

## 1. Subir o app (Pi-hole local)

**macOS / Linux:**
```bash
cd local-test
cp ../.env.example .env        # defina PIHOLE_PASSWORD no .env (opcional)
./up.sh
```

**Windows (PowerShell):**
```powershell
cd local-test
.\up.ps1
```

Ao final:
- Painel: http://localhost:8090/admin (senha = `PIHOLE_PASSWORD`, padrão `changeme`)
- DNS servido na porta 53 do seu computador

## 2. Provar o bloqueio (sem mexer no DNS do PC)

```bash
./test-block.sh        # macOS/Linux
.\test-block.ps1       # Windows
```
Anúncios devem aparecer como `0.0.0.0` (BLOQUEADO); sites normais resolvem.

## 3. Ativar a proteção no navegador (apontar o DNS)

### macOS
```bash
# ATIVAR (protege este Mac):
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1 && sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```
> Use `Ethernet` no lugar de `Wi-Fi` se estiver no cabo.
> Veja os nomes das interfaces com: `networksetup -listallnetworkservices`

### Linux
```bash
# ATIVAR (temporário):
echo 'nameserver 127.0.0.1' | sudo tee /etc/resolv.conf
```

### Windows (PowerShell como Administrador)
```powershell
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses 127.0.0.1
Clear-DnsClientCache
```

Depois: abra o YouTube ou um site com anúncios e acompanhe os bloqueios ao vivo
no painel (http://localhost:8090/admin).

## 4. REVERTER (fazer sempre ao terminar)

Se você parar o container **sem reverter**, o PC fica sem resolver nomes
(internet "cai"). Reverta primeiro, depois pare o container.

### macOS
```bash
sudo networksetup -setdnsservers Wi-Fi Empty && sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### Linux
```bash
sudo systemctl restart systemd-resolved     # ou restaure seu /etc/resolv.conf
```

### Windows (PowerShell como Administrador)
```powershell
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ResetServerAddresses
Clear-DnsClientCache
```

## 5. Parar o app

```bash
cd local-test
docker compose down          # para e remove os containers
docker compose down -v       # também apaga os dados do Pi-hole local
```

## 6. Proteger a REDE TODA (opcional)

Para que celular, TV e outros dispositivos usem o bloqueio, no painel do
**roteador** defina o DNS primário como o **IP deste computador na rede local**:
- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I`
- Windows: `ipconfig` (campo IPv4)

Nenhum desses IPs é fixo no código nem vai para o Git — são descobertos em
runtime e ficam só na sua máquina.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Internet "caiu" após o teste | DNS ainda apontado e container parado | Rode a reversão (passo 4) |
| Porta 53 ocupada ao subir | Outro resolvedor de DNS local ativo | Pare o serviço de DNS ou ajuste a porta no compose |
| Painel não abre | Pi-hole ainda inicializando | Aguarde ~30s e recarregue |
| Anúncios não bloqueiam | Cache do navegador/SO | Limpe o cache de DNS e force refresh (Cmd/Ctrl+Shift+R) |
