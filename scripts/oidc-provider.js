/* eslint-disable import/no-extraneous-dependencies */
import { Provider } from 'oidc-provider';

const config = {
  clients: [
    {
      client_id: 'testing',
      application_type: 'web',
      redirect_uris: [
        'http://127.0.0.1:3000/test.html',
        'http://bs-local:3000/test.html'
      ],
      token_endpoint_auth_method: 'none',
      grant_types: ['implicit', 'authorization_code'],
      response_types: ['id_token token', 'id_token', 'code']
    }
  ],
  responseTypes: ['id_token token', 'id_token', 'code'],
  routes: {
    authorization: '/authorize', // lgtm [js/hardcoded-credentials]
    token: '/oauth/token',
    end_session: '/v2/logout',
    jwks: '/.well-known/jwks.json'
  },
  pkce: {
    required: () => false
  },
  scopes: ['openid'],
  clientBasedCORS() {
    return true;
  },
  features: {
    webMessageResponseMode: {
      enabled: true
    },
    rpInitiatedLogout: {
      logoutSource: (ctx, form) => {
        // Move the buttons to inside the form tag on the logout page, as
        // IE11 doesn't support the HTML5 `form` attribute on input elements.
        const f = form.replace(
          '</form>',
          `
        <button autofocus type="submit" value="yes" name="logout">Yes, sign me out</button>
        <button type="submit">No, stay signed in</button>
        </form>`
        );

        ctx.body = `<!DOCTYPE html>
        <head>
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta charset="utf-8">
          <title>Logout Request</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          <style>
            @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);button,h1{text-align:center}h1{font-weight:100;font-size:1.3em}body{font-family:Roboto,sans-serif;margin-top:25px;margin-bottom:25px}.container{padding:0 40px 10px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:2px;box-shadow:0 2px 2px rgba(0,0,0,.3);overflow:hidden}button{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:36px;padding:0 8px;width:100%;display:block;margin-bottom:10px;position:relative;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#4d90fe;cursor:pointer}button:hover{border:0;text-shadow:0 1px rgba(0,0,0,.3);background-color:#357ae8}
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Do you want to sign-out from ${ctx.host}?</h1>
            ${f}
          </div>
        </body>
        </html>`;
      }
    }
  },
  jwks: {
    keys: [
      {
        d: 'VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ',
        dp: 'E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0',
        dq: 'F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc',
        e: 'AQAB',
        kty: 'RSA',
        n: 'xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ',
        p: '5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM',
        q: '3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M',
        qi: 'wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU',
        use: 'sig'
      }
    ]
  }
};

export default function createApp(opts) {
  const issuer = `http://127.0.0.1:${opts.port || 3000}/`;
  const provider = new Provider(issuer, config);

  const { invalidate: orig } = provider.Client.Schema.prototype;

  provider.Client.Schema.prototype.invalidate = (message, code) => {
    if (
      code === 'implicit-force-https' ||
      code === 'implicit-forbid-localhost'
    ) {
      return;
    }

    orig.call(this, message);
  };

  provider.use(async (ctx, next) => {
    await next();

    if (ctx.oidc?.route === 'end_session_success') {
      ctx.redirect('http://127.0.0.1:3000/test.html');
    }
  });

  return provider.app;
}
