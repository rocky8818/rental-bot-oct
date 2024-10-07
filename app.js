const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const { getQuotation } = require("./src/services/quotation"); 

// Actualización de la expresión regular para capturar correctamente los códigos entre corchetes
const REGEX_RENTAL_INTEREST = '/^Hola me gustaría recibir información sobre la renta de: .*/i';
const REGEX_DATA = /\[(.*?)\]/;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNumber(value) {
  const number = parseFloat(value);
  return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

// Flujo para "Agente"
const agenteFlow = addKeyword(['Agente', 'agente'])
  .addAnswer(`*Rental Zone Agente*`);

// Flujo para las cotizaciones, utilizando la nueva expresión regular
const quotationFlow = addKeyword(REGEX_RENTAL_INTEREST, { regex: true })
  .addAnswer('Buenos días le atiende Alma Ramírez su asesora personal...', null, async (ctx, { flowDynamic }) => {
    await delay(2000);

    const text = ctx.body;
    const matches = text.match(REGEX_DATA);

    // Verificar si hay datos entre los corchetes
    if (!matches || !matches[1]) {
      await flowDynamic('No hay datos');
      return;
    }

    const textInsideBrackets = matches[1];
    const nameArray = textInsideBrackets.split(',').map(name => name.trim());

    let successMessages = [];
    let errorMessages = [];

    // Proceso de envío de cotizaciones
    for (const name of nameArray) {
      const result = await getQuotation(name);

      if (result.status) {
        console.log(`Success ${name} to: ${ctx.from}`);

        const message = {
          body: `${result.data.nombre}\n\nCosto por dia: $${formatNumber(result.data.dia)}MXN\nCosto por semana: $${formatNumber(result.data.semana)}MXN\nCosto por mes: $${formatNumber(result.data.mes)}MXN\n\nPrecios sin IVA\n\n más información 👉️${process.env.URL}/maquinaria/${result.data.id}`,
          media: `${process.env.URL}/img/up/${result.data.img}`
        };
        successMessages.push(message);
      } else {
        console.log(result);
        console.log(`Error for ${name}:`);
        errorMessages.push(`😦 Por el momento no tengo información de maquinaria "*${name}*", un momento para chatear con un asesor..`);
      }
    }

    // Enviar todos los mensajes de éxito
    for (const message of successMessages) {
      await flowDynamic([message]);
    }

    // Enviar todos los mensajes de error
    for (const errorMessage of errorMessages) {
      await flowDynamic(errorMessage);
    }
  })
  .addAnswer('Si gusta que le cotice formalmente, necesito su dirección exacta incluyendo Estado, Nombre de calle, colonia, código postal.');

// Flujo de bienvenida
const flowWelcome = addKeyword(['hola', 'buen dia', 'ayuda'])
  .addAnswer(`🚚 Hola bienvenido a *Rental Zone*`,
    { media: "https://rentalzone.mx/social.jpg" }
  )
  .addAnswer(
    `
    Escribe la opción
    \n👉️ Agente
    \n👉️ Dudas
    `,
    null,
    null,
    [quotationFlow, agenteFlow]
  );

// Función principal que inicializa el bot
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowWelcome]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
}

main();
