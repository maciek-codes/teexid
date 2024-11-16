# TODO

- [x] - TS
- [x] - Send cards
- [x] - Send room state on re-join
- [x] - Card submission
- [x] - Voting
    - Submit votes
- [] - Game end

- [] - UI

-
- Need to keep history of votes at the end of voting
- Sync server state to supabase
- Test for race conditions
- maybe need to use better queue

# DO Setup

1. Instal DO insighgts

```bash
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

2. Update

```bash
apt-get update && apt-get upgrade -y
```

3. Install tools

```bash
# Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

nvm install 22
node -v
npm -v

# Nginx, certbot
sudo apt install sqlite3 git nginx -y
sudo apt install python3 python3-venv libaugeas0 -y
sudo npm install -g pm2

sudo python3 -m venv /opt/certbot/

echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

### User, group

```bash
adduser maciek
groups maciek
```

### Add SSH key

```bash
nano .ssh/authorized_keys
```

### CHeck ssh config

```bash
sudo sshd -t
```

### Restart SSH

```bash
sudo systemctl restart ssh.service
```
