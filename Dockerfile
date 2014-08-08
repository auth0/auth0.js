FROM node

CMD ["npm", "test"]

ENV HOME /home/root
RUN mkdir -p /home/root/.browserstack/

RUN yes | apt-get update
RUN yes | apt-get install default-jre
RUN curl -o $HOME/.browserstack/BrowserStackTunnel.jar http://www.browserstack.com/BrowserStackTunnel.jar

ADD browserstack.json /home/root/
RUN cp /home/root/browserstack.json /home/root/.browserstack/

ADD . /auth0.js
WORKDIR /auth0.js

RUN npm i -g grunt-cli
RUN curl https://gist.githubusercontent.com/jfromaniello/26899be0cad9a7e8741d/raw/install-phantom-ubuntu.sh | bash

# Put the minimal configuration here, not sensitive data.
RUN rm -rf node_modules
RUN npm_config_unsafe_perm=true npm i