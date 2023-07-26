import  https from 'https';
import url from 'url';

export default function getRequest(requestUrl:string) {
  // console.log('Requesting:', requestUrl);
  return new Promise((resolve, reject) => {

    // var options = {
    //   host: url,
    //   port: 80,
    //   path: "/"
    // };

    var content = "";

    var req = https.request(requestUrl, function (res) {
      res.setEncoding("utf8");
      if (!res.statusCode) {
        console.error('this response does not have a status code', requestUrl, res);
        throw new Error('No STATUS CODE!')
      }
      if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
        // The location for some (most) redirects will only contain the path,  not the hostname;
        // detect this and add the host to the path.
        let redirectUrl = res.headers.location;
        // The hostname is not included, parse it from the original URL and attach it.
        if (!url.parse(redirectUrl).hostname) {
          // Hostname included; make request to res.headers.location
          redirectUrl = url.parse(requestUrl).hostname + redirectUrl;
          console.log("Composing redirect URL:", redirectUrl);
        }
        console.log('Redirect to:', redirectUrl);
        if (redirectUrl !== requestUrl) {
          return getRequest(res.headers.location);
        } else {
          return Promise.reject('Redirect URL same as original URL');
        }

    // Otherwise no redirect; capture the response as normal
      } else {

        res.on("data", function (chunk) {
          content += chunk;
        });

        res.on("end", function () {
          // console.log("did it")
          resolve(content);
        });
      }
    });

    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36')
    req.setHeader('sec-ch-ua', '"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"');
    req.setHeader('sec-ch-ua-platform', '"macOS"');

    req.end();
  })
}
