# DNS Shield — Teste Local (ponte para qualquer PC)

Pasta **isolada** para testar o bloqueio de verdade no seu próprio computador
(Mac, Linux ou Windows), **sem Raspberry Pi** e **sem alterar o resto do projeto**.

Aqui o seu PC faz o papel do Raspberry Pi: roda o Pi-hole e expõe o DNS na
porta 53 da máquina. Você aponta o DNS do PC (ou do roteador) para ele e vê
anúncios e rastreadores sendo bloqueados.

## Como usar

### macOS / Linux
```bash
cd local-test
./up.sh            # sobe o Pi-hole local
./test-block.sh    # prova o bloqueio (sem mexer no DNS do PC)
./connect.sh       # mostra como apontar o DNS do PC para o Pi-hole
```

### Windows (PowerShell)
```powershell
cd local-test
.\up.ps1
.\test-block.ps1
.\connect.ps1
```

## O que cada passo faz

1. **up** — sobe o Pi-hole num container, DNS na porta 53, painel em
   http://localhost:8090/admin (senha definida em `PIHOLE_PASSWORD`, padrão `changeme`).
2. **test-block** — consulta o Pi-hole direto e mostra anúncio bloqueado
   (`0.0.0.0`) vs. site normal. Não precisa mudar nada no PC.
3. **connect** — imprime o comando exato para apontar o DNS do seu sistema para
   `127.0.0.1` (proteger só este PC) **e como reverter**.

## Proteger só o PC vs. a rede toda

- **Só este PC:** aponte o DNS para `127.0.0.1` (ver `connect`).
- **Rede inteira (celular, TV...):** no painel do **roteador**, defina o DNS
  primário como o **IP deste computador na rede local**.
  - Mac: `ipconfig getifaddr en0`
  - Linux: `hostname -I`
  - Windows: `ipconfig` (campo IPv4)

## Importante

- Isto é um **ambiente de teste**, não o produto final. A experiência
  plug-and-play (Wi-Fi automático via hostapd) só existe no Raspberry Pi.
- **Sempre reverta o DNS** quando terminar: se você parar o container sem
  reverter, o PC fica sem resolver nomes. Os comandos de reversão estão no
  `connect`.
- Parar e remover: `docker compose down` (nesta pasta). Adicione `-v` para
  apagar os dados do Pi-hole local.
