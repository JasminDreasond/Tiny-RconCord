# Plugins
Here you have a complete example of how the plugin works

## pg object
always when a plugin starts running, all of the below items are available for it.

### dsBot
Discord Bot

### request
Request Module https://github.com/request/request

### plugins
Plugin Modules

### emojiStrip
emojiStrip Module https://www.npmjs.com/package/emoji-strip

### webhoook

## get(id, callback)
id: webhook URL

callback: the callback

## send(token, item, callback)
token: The token object from webhook

item: the original webhook body

callback: the callback

### json_stringify
json-beautify Module https://www.npmjs.com/package/json-beautify

### moment
moment.js Module https://momentjs.com/

### lang
Language texts

### log\[option\](text)
Log Console

## log.info
Send a info to console

## log.warn
Send a warning to console

## log.error
Send a error to console

## log.debug
Send a debug to console

## log.chat
Send a chat info to console

## log.discord
Send a Discord Info console

## log.minecraft
Send a Minecraft Info to console

### connCommand(cmd,callback)
cmd: minecraft command

callback: the callback

### i18(lang, [string,string,string...])
Convert a lang string to a complete text using regex

lang: language text

string: string list to insert into the regex

### c
The config.json

### folder
The plugin folder

### getDS()
Safe Discord Info

## server

### online
System status

### first
Get first loading info

### shutdown
Get shutdown status

### query
Get query cache

### timeout
Safe Timeout
