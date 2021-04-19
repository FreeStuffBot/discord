import { Message } from 'discord.js'
import { ReplyFunction, Command, GuildData } from '../../types'
import Const from '../const'
import { Core } from '../../index'


export default class VoteCommand extends Command {

  public constructor() {
    super({
      name: 'vote',
      desc: '=cmd_vote_desc',
      trigger: [ 'vote', 'topgg', 'top', 'botlist', 'v' ]
    })
  }

  public handle(_mes: Message, _args: string[], g: GuildData, repl: ReplyFunction): boolean {
    repl(
      Core.text(g, '=cmd_vote_1'),
      Core.text(g, '=cmd_vote_2', {
        topGGLink: Const.links.topgg,
        dblLink: Const.links.dbl,
        dlabsLink: Const.links.dlabs
      })
    )
    return true
  }

}
