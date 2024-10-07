async function getQuotation(name) {
  const url = `${process.env.URL}/api/quotation`;
  console.log(url);
  const body = { name };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
          return {
              stuatus: true,
              data: data.data,
          };
      } else {
          return {
              stuatus: false,
              error: data.error,
              code: response.status,
          };
      }
  } catch (error) {
      return {
          stuatus: false,
          error: {
              message: error.message,
              data: null,
          },
          code: 500,
      };
  }
}

module.exports = { getQuotation };
