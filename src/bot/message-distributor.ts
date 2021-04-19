import { FreeStuffBot, Core } from "../index";
import { Message, Guild, MessageOptions, Channel } from "discord.js";
import Const from "./const";
import Database from "../database/database";
import { GuildData, DatabaseGuildData, Theme } from "../types";
import { Long } from "mongodb";
import { DbStats } from "../database/db-stats";
import ThemeOne from "./themes/1";
import ThemeTwo from "./themes/2";
import ThemeThree from "./themes/3";
import ThemeFour from "./themes/4";
import ThemeFive from "./themes/5";
import ThemeSix from "./themes/6";
import ThemeSeven from "./themes/7";
import ThemeEight from "./themes/8";
import ThemeNine from "./themes/9";
import ThemeTen from "./themes/10";
import SentryManager from "../thirdparty/sentry/sentry";
import Redis from "../database/redis";
import { GameFlag, GameInfo } from "freestuff";


export default class MessageDistributor {

  private readonly themes: Theme[] = [
    new ThemeOne(),
    new ThemeTwo(),
    new ThemeThree(),
    new ThemeFour(),
    new ThemeFive(),
    new ThemeSix(),
    new ThemeSeven(),
    new ThemeEight(),
    new ThemeNine(),
    new ThemeTen()
  ];

  //

  public constructor(bot: FreeStuffBot) { }

  //

  public async distribute(content: GameInfo[]) {
    content = content.filter(g => g.type == 'free'); // TODO

    const lga = await Redis.getSharded('lga');
    const startAt = lga ? parseInt(lga, 10) : 0;

    const query = Core.singleShard
      ? { sharder: { $gt: startAt },
          channel: { $ne: null } }
      : { sharder: { $mod: [Core.options.shardCount, Core.options.shards[0]], $gt: startAt },
          channel: { $ne: null } };

    const guilds: DatabaseGuildData[] = await Database
      .collection('guilds')
      .find(query)
      .sort({ sharder: 1 })
      .toArray();
    if (!guilds) return;

    console.log(`Starting to announce ${content.length} games on ${guilds.length} guilds: ${content.map(g => g.title)} - ${new Date().toLocaleTimeString()}`);
    await Redis.setSharded('am', '0');
    for (const g of guilds) {
      if (!g) continue;
      try {
        Redis.setSharded('lga', g.sharder + '');
        const successIn = await this.sendToGuild(g, content, false, false);
        if (successIn.length) {
          for (const id of successIn)
            Redis.incSharded('am_' + id);
          await new Promise(res => setTimeout(() => res(null), 200 * successIn.length));
        }
      } catch(ex) {
        console.error(ex);
        SentryManager.report(ex);
      }
    }
    console.log(`Done announcing: ${content.map(g => g.title)} - ${new Date().toLocaleTimeString()}`);
    const announcementsMade = await Promise.all(content.map(async game => {
      return { id: game.id, reach: parseInt(await Redis.getSharded('am_' + game.id), 10) }
    }));
    const announcementsMadeTotal = announcementsMade.map(e => e.reach).reduce((p, c) => (p + c), 0);

    content.forEach(c => Redis.setSharded('am_' + c.id, '0')); // AMount (of announcements done)
    await Redis.setSharded('lga', ''); // Last Guild Announced (guild id)

    (await DbStats.usage).announcements.updateToday(announcementsMadeTotal, true);

    announcementsMade.forEach(game => Core.fsapi.postGameAnalytics(game.id, 'discord', { reach: game.reach }))
  }

  public test(guild: Guild, content: GameInfo): void {
    Database
      .collection('guilds')
      .findOne({ _id: Long.fromString(guild.id) })
      .then((g: DatabaseGuildData) => {
        if (!g) return;
        this.sendToGuild(g, [ content ], true, true);
      })
      .catch(console.error);
  }

  public async sendToGuild(g: DatabaseGuildData, content: GameInfo[], test: boolean, force: boolean): Promise<number[]> {
    const data = await Core.databaseManager.parseGuildData(g);
    
    if (!data) return [];

    // forced will ignore filter settings
    if (!force) {
      content = content
        .filter(game => data.price <= game.org_price[data.currency == 'euro' ? 'euro' : 'dollar'])
        .filter(game => data.trashGames || !(game.flags & GameFlag.TRASH))
        .filter(game => data.storesList.includes(game.store));
        
      if (!content.length) return [];
    }

    // check if channel is valid
    if (!data.channelInstance) return [];
    if (!data.channelInstance.send) return [];
    if (!data.channelInstance.guild.available) return [];

    // check if permissions match
    const self = data.channelInstance.guild.me;
    const permissions = self.permissionsIn(data.channelInstance);
    if (!permissions.has('SEND_MESSAGES')) return [];
    if (!permissions.has('VIEW_CHANNEL')) return [];
    if (!permissions.has('EMBED_LINKS') && Const.themesWithEmbeds.includes(data.theme)) return [];
    if (!permissions.has('USE_EXTERNAL_EMOJIS') && Const.themesWithExtemotes[data.theme]) data.theme = Const.themesWithExtemotes[data.theme];

    // build message objects
    let messageContents = content.map((game, index) => this.buildMessage(game, data, test, !!index));
    messageContents = messageContents.filter(mes => !!mes);
    if (!messageContents.length) return [];

    // send the messages
    let messages: Message[] = [];
    for (const mesCont of messageContents)
      messages.push(await data.channelInstance.send(...mesCont) as Message);
    if (messages.length && data.react && permissions.has('ADD_REACTIONS') && permissions.has('READ_MESSAGE_HISTORY'))
      await messages[messages.length - 1].react('🆓');
    // if (!test && (data.channelInstance as Channel).type === 'news')
    //   messages.forEach(m => m.crosspost());
    // TODO check if ratelimited
    // TODO check if it has the "manage messages" permission. although not required to publish own messages, there needs to be a way to turn this off

    return content.map(game => game.id);
  }

  public buildMessage(content: GameInfo, data: GuildData, test: boolean, disableMention: boolean): [ string, MessageOptions? ] {
    const theme = this.themes[data.theme] || this.themes[0];
    return theme.build(content, data, { test, disableMention });
  }

}
