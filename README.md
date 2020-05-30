# Nakamura
## lightweight and extensible Discord API wrapper

Yes, you are meant to build on top of this to fit your needs

## Idea

The idea is that **you** cache everything you need. The library should not do any caching. It will provide you with help methods and structures for easier use. 

There are two kinda objects: `Partial` and `Complete`. `Partial` objects store only the ID of the discord object along with the client, while `Complete` objects store all information regarding objects. (`Partial` objects contain all the utility methods, `Complete` objects just contain more data.). You can choose which objects you want to be `Partial` and which to be `Complete` by specifying them in the client options:

```{
  partial: ["role", "member", "guild"] // Every other object is complete (emoji, presence, channel, user)
}```

Example of caching every guild:

```js
const guilds = new Map();
bot.on("loadGuild", guild => {
    guilds.set(guild.id, guild);
});

bot.on("joinGuild", guild => {
    guilds.set(guild.id, guild);
})
```

This means that you also have to update all the cached objects if you want them to be up to date:

```js
bot.on("updateGuild", (prevGuild, newGuild) => {
    guilds.set(newGuild.id, newGuild);
})
``` 

## It does cache SOME things

Since the library allows you to create `PartialUser`s, if you DM a `PartialUser` the DM channel will be fetched every time you call the `send` method on a new `PartialUser` object. So if there are two `PartialUser` objects which represent the SAME user, if you use `send` on both of them, the DM channel will be fetched twice. 

TLDR: DM channel IDs are cached.


## Some details

- `PartialMember` objects generally contain a `guild` property, which either points to `PartialGuild` or `Guild`, but it won't have one if you create the partial.