# Nakamura
## lightweight and extensible Discord API wrapper

Yes, you are meant to build on top of this to fit your needs

## Idea

The idea is that **you** cache everything you need. The library should not do any caching. It will provide you with help methods and structures for easier use. 

There are two kinda objects: `Partial` and `Complete`. `Partial` objects store only the ID of the discord object along with the client, while `Complete` objects store all information regarding objects. (`Partial` objects contain all the utility methods, `Complete` objects just contain more data.). You can choose which objects you want to be `Partial` and which to be `Complete` by specifying them in the client options:

```{
  partial: ["Role", "Member", "Guild"] // Every other object is complete (emoji, presence, channel, user)
}```

Example of caching every guild:

```js
const guilds = new Map();
bot.on("loadGuild", guild => {
    guilds.set(guild.id, guild);
});

bot.on("joinGuild", guild => {
    guilds.set(guild.id, guild);
});

bot.on("messageCreate", message => {
    // here message.guild will be a PARTIAL object, guilds will only be full in the loadGuild and joinGuild events.
    const fullGuild = guilds.get(message.guild.id);
});


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

## It reuses objects when it cans

For example, when a message gets created, 5 objects get created: a `Message`, a `User`/`PartialUser` object, a `Member`/`PartialMember` object, a `PartialChannel` object and a `PartialGuild` object. Other libs, for example `discord.js` saves all of those objects in a cache, so it just gets them from the cache or adds them in. Since this library does not cache anything, it has to create them. Partial objects are light and that's why it's recommended to work with them.

The library tries to reuse objects where it cans, without creating new objects. In the above example, `message.member.user` is going to be the same object as `message.author`, same with `message.member.guild` and `message.guild`. 

## Some details

- `PartialMember` objects generally contain a `guild` property, which either points to `PartialGuild` or `Guild`, but it won't have one if you create the partial and don't provide the guild.