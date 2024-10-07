import BotWhatsApp from "@bot-whatsapp/bot"
import QRPortalWeb from '@bot-whatsapp/portal'
import database from './db'
import provider from './provider'
import flow from "./flow"

const main = async () => {
    await BotWhatsApp.createBot({
    flow,
    provider,
    database
  })

  QRPortalWeb()
}

main()