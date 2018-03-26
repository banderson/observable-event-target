# observable-event-target

More details to come, but this is a sample implementation of `ObservableEventTarget` as [outlined in the Observable spec](https://github.com/tc39/proposal-observable).

TODO: Step one is to make this example work:

```js
const displayImage = document.querySelector("#displayImage");

const image = new Image();
const load = image.on('load', { receiveError: true, once: true });
image.src = "./possibleImage";

load.subscribe({
  next(e) {
    displayImage.src = e.target.src;
  },
  error(e) {
    displayImage.src = "errorloading.png";
  },
  complete() {
    // this notification will be received after next ()
    // as a result of the once member being set to true
  }
})
```

Interface as defined by [the spec](https://github.com/tc39/proposal-observable/blob/aa89e60bda5117014b2da8c18494e2a8076c0edd/ObservableEventTarget.md#observableeventtarget-api):

```
interface Event { /* https://dom.spec.whatwg.org/#event */ }

dictionary OnOptions {
  // listen for an "error" event on the EventTarget,
  // and send it to each Observer's error method
  boolean receiveError = false;

  // member indicates that the callback will not cancel
  // the event by invoking preventDefault().
  boolean passive = false;,

  // handler function which can optionally execute stateful
  // actions on the event before the event is dispatched to
  // Observers (ex. event.preventDefault()).
  EventHandler handler = null;

  // member indicates that the Observable will complete after
  // one event is dispatched.
  boolean once = false;
}

interface ObservableEventTarget extends EventTarget {
  Observable<Event> on(DOMString type, optional (OnOptions or boolean) options);
}
```

This implementation obviously draws heavily from [the example implementation](https://goo.gl/yNeFVu) but was re-implemented from scratch as a learning exercise.
