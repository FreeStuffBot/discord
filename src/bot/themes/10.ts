import { MessageOptions } from 'discord.js'
import { GameInfo } from 'freestuff'
import Experiments from '../../controller/experiments'
import { GuildData } from '../../types/datastructs'
import { Theme } from '../../types/context'
import { Core } from '../../index'
import Const from '../const'


export default class ThemeTen implements Theme {

  public build(content: GameInfo, data: GuildData, settings: { test?: boolean, disableMention?: boolean }): [string, MessageOptions] {
    const useProxyUrl = Experiments.runExperimentOnServer('use_proxy_url', data)
    const button = content.urls.client
      ? content.store === 'steam'
          ? `${Core.text(data, '=open_in_browser')}: [https://s.team/a/${content.urls.org.split('/app/')[1].split('/')[0]}](${useProxyUrl ? content.urls.browser : content.urls.org})\n${Core.text(data, '=open_in_steam_client')}: ${content.urls.client}`
          : `[${Core.text(data, '=open_in_browser')}](${useProxyUrl ? content.urls.browser : content.urls.org}) • [${Core.text(data, '=open_in_epic_games_client')}](${content.urls.client})`
      : `[${Core.text(data, '=open_in_browser')}](${useProxyUrl ? content.urls.default : content.urls.org})`

    const steamcontent = content.store === 'steam'
      ? [
        `Subids: ${content.store_meta.steam_subids}`,
        '',
        `addlicense asf ${content.store_meta.steam_subids.split(' ').map(id => `s/${id}`).join(', ')}`
        ]
      : []

    const lines = [
      '```yaml',
      `  Name: ${content.title}`,
      ` Store: ${Core.languageManager.get(data, 'platform_' + content.store)}`,
      ` Price: $${content.org_price.dollar} | €${content.org_price.euro}`,
      ` Until: ${content.until?.toLocaleDateString(Core.languageManager.get(data, 'date_format')) ?? 'unknown'}`,
      `  Tags: ${content.tags?.slice(0, 3).join(', ') ?? ''}`,
      `Rating: ${~~(content.rating * 100)}% positive`,
      ...steamcontent,
      '```',
      button
    ]
    return [
      ((data.roleInstance && !settings.disableMention) ? data.roleInstance.toString() : ''),
      {
        embed: {
          author: {
            name: Core.text(data, '=announcement_header')
          },
          description: lines.join('\n'),
          footer: {
            text: settings.test
              ? Core.text(data, '=announcement_footer_test')
              : Core.text(data, '=announcement_footer', { website: Const.links.websiteClean })
          }
        }
      }
    ]
  }

}
