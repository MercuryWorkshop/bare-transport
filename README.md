#  Bare Client
This is a [proxy-transports](https://github.com/MercuryWorkshop/proxy-transports) transport using the [TompHTTP Bare Server](https://github.com/tomphttp/specifications/blob/master/BareServer.md).

## Usage:
Here is a basic example of using bare-transport. The Bare server is specified in the first argument. 
```js
import BareClient from "@mercuryworkshop/bare-transport";
let client = new BareClient("https://example.com/bare/");

// pass to proxy
```

You can also use the non-esm build
```html
<script src="https://unpkg.com/@mercuryworkshop/bare-transport@2/dist/index.js"></script>
<script>
  let client = new BareMod.BareClient("https://example.com/bare/");
</script>
```