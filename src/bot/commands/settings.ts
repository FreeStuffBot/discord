import { Message } from 'discord.js'
import { GuildData } from '../../types/datastructs'
import { Command, CommandHandler, ReplyFunction, SettingsSubcommand } from '../../types/commands'
import { Core } from '../../index'
import Const from '../const'
import Logger from '../../lib/logger'
import SetChannelHandler from './set/channel'
import SetLanguageHandler from './set/language'
import SetMentionHandler from './set/mention'
import SetMinpriceHandler from './set/minprice'
import SetReactHandler from './set/react'
import SetStoreHandler from './set/store'
import SetThemeHandler from './set/theme'
import SetTrashHandler from './set/trash'
import SetCurrencyHandler from './set/currency'
import SetPrefixHanler from './set/prefix'


export default class SettingsCommand extends Command {

  public readonly commands: Map<string, (CommandHandler & SettingsSubcommand)> = new Map();

  public constructor() {
    super({
      name: 'settings',
      desc: '=cmd_settings_desc',
      trigger: [ 'set', 'settings', 'setting', 'config', 'configure', 'change' ],
      serverManagerOnly: true
    })

    this.commands.set('channel', new SetChannelHandler())
    this.commands.set('language lang local locale', new SetLanguageHandler())
    this.commands.set('mention role', new SetMentionHandler())
    this.commands.set('theme', new SetThemeHandler())
    this.commands.set('store stores shop platform', new SetStoreHandler())
    this.commands.set('currency', new SetCurrencyHandler())
    this.commands.set('react reaction', new SetReactHandler())
    this.commands.set('trash bad garbage', new SetTrashHandler())
    this.commands.set('minimum minimumprice min price cost', new SetMinpriceHandler())
    this.commands.set('prefix', new SetPrefixHanler())
  }

  public handle(mes: Message, args: string[], g: GuildData, repl: ReplyFunction): boolean {
    if (!g) {
      repl(
        Core.text(g, '=cmd_error_readd_1'),
        Core.text(g, '=cmd_error_readd_2', {
          discordInvite: Const.links.botInvite
        })
      )
      return true
    }

    if (args.length < 1) {
      try {
        const cmdlist = Array.from(this.commands.values())
          .map(c => c.getMetaInfo(g))
          .filter(c => !!c)
          .map(c => ((typeof c[0] === 'string') ? [ c ] : c) as ([ string, string, any? ])[])
          .map(c => c.map(e => `• \`@${mes.guild.me.user.username} set ${e[0]}\` ─ ${Core.text(g, e[1], e[2])}`))
        const cmdlistFlat = [].concat.apply([], cmdlist)

        mes.channel.send({
          embed: {
            title: Core.text(g, '=cmd_settings_missing_args_1'),
            description: Core.text(g, '=cmd_settings_missing_args_2') + '\n\n' + cmdlistFlat.join('\n\n'),
            footer: { text: `@${mes.author.tag}` },
            color: 0x2F3136
          }
        })
        return true
      } catch (ex) { Logger.error(ex) }
    }

    for (const key of this.commands.keys()) {
      if (key.split(' ').includes(args[0].toLowerCase())) {
        const command = this.commands.get(key)
        args.splice(0, 1)
        command.handle(mes, args, g, repl)
        return true
      }
    }

    repl(
      Core.text(g, '=cmd_settings_not_found_1', { name: args[0] }),
      Core.text(g, '=cmd_settings_not_found_2')
    )

    return true
  }

}
