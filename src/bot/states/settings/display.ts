import Emojis from '../../emojis'
import { GenericInteraction } from '../../../cordo/types/ibase'
import { ButtonStyle, ComponentType } from '../../../cordo/types/iconst'
import { InteractionApplicationCommandCallbackData } from '../../../cordo/types/custom'
import { MessageComponentSelectOption } from '../../../cordo/types/icomponent'
import Const from '../../const'


export default function (i: GenericInteraction): InteractionApplicationCommandCallbackData {
  const themeOptions: MessageComponentSelectOption[] = Const.themes.map(t => ({
    value: t.id + '',
    label: t.name,
    description: t.description,
    default: i.guildData?.theme.id === t.id,
    emoji: { name: t.emoji }
  }))

  const currencyOptions: MessageComponentSelectOption[] = Const.currencies.map(c => ({
    value: c.id + '',
    label: `${c.symbol} ${c.name}`,
    default: i.guildData?.currency.id === c.id
  }))

  // TODO: make the actual embed here be a test message with those settings applied
  // second embed below that one with just a description: for more info click here -> fsb.xyz/guide

  return {
    title: 'Display Settings',
    description: 'bla bla bla\nfor help join here or something lmao: https://discord.gg/WrnKKF8',
    components: [
      {
        type: ComponentType.SELECT,
        custom_id: 'settings_theme_change',
        options: themeOptions
      },
      {
        type: ComponentType.SELECT,
        custom_id: 'settings_currency_change',
        options: currencyOptions
      },
      {
        type: ComponentType.BUTTON,
        style: ButtonStyle.SECONDARY,
        custom_id: 'settings_main',
        label: 'Back',
        emoji: { id: Emojis.caretLeft.id }
      },
      {
        type: ComponentType.BUTTON,
        style: i.guildData?.react ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
        custom_id: 'settings_reaction_toggle',
        label: i.guildData?.react ? 'Auto Reaction Enabled' : 'Enable Auto Reaction',
        emoji: { name: '🆓' }
      }
    ]
  }
}