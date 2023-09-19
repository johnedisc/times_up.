import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import EventEmitter from 'events';
import { IncomingMessage, ServerResponse } from 'http';
import { findUsers, registerUser } from './postgresqlDB';

export const serverHit = new EventEmitter();
const PORT: number | string = process.env.PORT || 3300;
//const certs = {
//  key: fs.readFileSync('/etc/ssl/sslTime/privateKey.pem'),
//  cert: fs.readFileSync('/etc/ssl/sslTime/originCert.pem'),
//};
//const certs = {
//  key: fs.readFileSync('/etc/ssl/sslTime/timesup.test.key'),
//  cert: fs.readFileSync('/etc/ssl/sslTime/timesup.test.crt'),
//  passphrase: 'Priknedis'
//};

const serveFile = async (filePath: string, contentType: string, httpResponse: any): Promise<void> => {
  console.log('line 10', filePath, contentType);
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    httpResponse.writeHead(200, { 'Content-Type': contentType });
    httpResponse.end(data);
  } catch (error) {
    console.log(error);
    httpResponse.statusCode = 500;
    httpResponse.end();
  }
}

const parseRequest = (request: IncomingMessage, response: ServerResponse): void => {
  console.log(request.url);

  serverHit.emit('hit', request);

  if (request.url?.includes('auth')) {

    let body:any = [];
    let bodyString:string;
    let bodyJSON:any;

    request
      .on('error', err => {
        console.error(err);
      })
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        bodyString = Buffer.concat(body).toString();
        bodyJSON = JSON.parse(bodyString);
        const userLogInData = {
          userName: bodyJSON.email,
          password: bodyJSON.password,
          name: bodyJSON.name
        }

        if (request.url === '/auth/register' && request.method === 'POST') {
          try {
            if (findUsers(userLogInData.userName) !== undefined) throw new Error('user already exists');
            const dbResponse = registerUser('ralph@bob.net','ralph','masks');
            response.writeHead(201, { 'Content-Type': 'text/plain' });
            response.end(dbResponse);
          } catch (error) {
            console.error(error);
            response.writeHead(418, { 'Content-Type': 'text/plain' });
            response.end('trouble');
          }
        }
      });

  } else if (request.url) {
    const extension: any  = path.extname(request.url);
    let contentType: string;

    switch (extension) {
      case '.css':
        contentType = 'text/css';
      break;
      case '.js':
        contentType = 'text/javascript';
      break;
      case '.json':
        contentType = 'application/json';
      break;
      case '.jpg':
        contentType = 'image/jpeg';
      break;
      case '.png':
        contentType = 'image/png';
      break;
      case '.txt':
        contentType = 'text/plain';
      break;
      default:
        contentType = 'text/html';
    }

    let filePath = 
      contentType === 'text/html' && request.url === '/'
        ? path.join(__dirname, '..', '..', 'client', 'index.html')
          : contentType === 'text/html' && request.url === '/index.html'
            ? path.join(__dirname, '..', '..', 'client', 'index.html')
              : contentType === 'text/css'
                ? path.join(__dirname, '..', '..', 'client', 'src', 'css', path.basename(request.url))
                  : path.join(__dirname, '..', '..', 'client', request.url);

    // ensures spa won't try to reload to the current spot
    if (!extension && request.url?.slice(-1) !== '/') {
      filePath = path.join(__dirname, '..', '..', 'client', 'index.html');
    }

    // check if file exists
    let fileExists = fs.existsSync(filePath);


    if (fileExists) {
      // serve file
      serveFile(filePath, contentType, response);

    } else {
      // 301 redirect
      switch(path.parse(filePath).base) {
        case 'unused-url.html':
          response.writeHead(301, { 'Location': '/index.html' });
          response.end();
          break;
        case 'www-something.html':
          response.writeHead(301, { 'Location': '/' });
          response.end();
          break;
        default:
////          serve a 404
          console.log('trouble at the mill');
//          serveFile(path.join(__dirname, '..', '..', 'client', 'src', '404.html'), 'text/html', response);
      };
    };
  }
} 

const server = http.createServer(parseRequest);
server.listen(PORT, () => console.log(`server is running on ${PORT}`));
