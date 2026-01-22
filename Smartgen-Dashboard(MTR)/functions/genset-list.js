const API_URL = 'https://mgmgenerator.com/api/gensets';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const utoken = 'bebf6914640ec3ed6bf00398fb7969da';

    const url = new URL(API_URL);
    url.searchParams.set('utoken', utoken);

    const queryParams = event.queryStringParameters || {};
    Object.keys(queryParams).forEach(key => {
      if (key !== 'utoken') {
        url.searchParams.set(key, queryParams[key]);
      }
    });

    const options = {
      method: event.httpMethod,
      headers: event.headers,
    };

    if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
      options.body = event.body;
    }

    const response = await fetch(url.toString(), options);
    const body = await response.text();

    return {
      statusCode: response.status,
      headers,
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
