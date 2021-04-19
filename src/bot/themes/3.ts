import { MessageOptions } from 'discord.js'
import { GameInfo } from 'freestuff'
import { GuildData, Theme } from '../../types'
import BaseTheme, { themeSettings } from './basetheme'


export default class ThemeThree implements Theme {

  public build(content: GameInfo, data: GuildData, settings: { test?: boolean, disableMention?: boolean }): [string, MessageOptions] {
    const fullSettings: themeSettings = {
      ...settings,
      themeImages: true,
      themeExtraInfo: true
    }
    return BaseTheme.build(content, data, fullSettings)
  }

}
