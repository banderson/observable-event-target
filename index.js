const EventTarget = require('event-target').default;
const Observable = require('zen-observable');

class ObservableEventTarget extends EventTarget {
  on(type, handler, opts) {
    return new Observable(observer => {
      const eventCallback = e => {
        observer.next(e);
      };
      this.addEventListener(type, eventCallback, opts);
      return () => {
        this.removeEventListener(type, eventCallback);
      };
    });
  }
}

module.exports = ObservableEventTarget;
