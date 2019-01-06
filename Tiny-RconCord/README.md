# config.json

```json

{

    "lang": "en",
    "chatLog": true,
    "server_folder": "",

    "webhook": {
        "use": false,
        "part": "",
        "url": ""
    },

    "discord": {

        "log_delay": 5000,
        "debug": false,
        "prefix": "/",
        "lib": "discord.js",
        "token": "",

        "channelID": {
            "rcon": "",
            "bot": "",
            "log": ""
        }

    },
    "minecraft": {

        "debug": true,
        "serverIP": "",
        "port": 25574,

        "rcon": {
            "ip": "localhost",
            "password": "",
            "debug": false,
            "port": 25510,
            "delay": 10
        },

        "query": {
            "port": 25511,
            "delay": 120000
        },

        "avatar_url": "https://minotar.net/helm/%username%/256.png"

    },

    "npmPlugins": []

}

```

### lang
Choose a lang inside the folder i18 to use

### chatLog
Enable the chat-log on your console

## webhook

### use
Use the webhook system or not

### part
Edit the final part from the webhook POST

### url
The webhook URL

## discord

### log_delay
The log delay before the text be send into Discord

### debug
Debug Mode on or off

### prefix
The prefix to use the commands from the bot

### lib
Change the Discord Lib code from the app. You can see the library codes compatible inside the discord folder

### token
The bot token

### channelID
The list of channelIDs to connect with your bot

## minecraft

### debug
Debug Mode on or off

### serverIP
The server ip from your Minecraft Server

### port
The port from your Minecraft Server

### rcon
The rcon connection info from your Minecraft Server

```ini
enable-rcon=true
rcon.password=password
rcon.port=25510
broadcast-rcon-to-ops=true
broadcast-console-to-ops=true
```

### query
The query connection info from your Minecraft Server

```ini
query.port=25511
enable-query=true
```

### avatar_url
The URL template to send helm avatar from the minecraft account of the users

### regex
Regex to catch all minecraft messages

### logs
Gamerules to set when the rcon server start

## npmPlugins
Your plugin is a npm module? Insert the module name inside the array. The array will be used to make a `require('name');`.