const EventTarget = require('event-target').default;
const Observable = require('zen-observable');

class ObservableEventTarget extends EventTarget {
  on(type, opts = {}) {
    return new Observable(observer => {
      const eventCallback = e => {
        if (typeof opts.handler === 'function') {
          opts.handler(e);
        }
        if (e.cancelable && e.defaultPrevented) {
          return;
        }

        observer.next(e);
        if (opts.once) {
          observer.complete();
        }
      };

      this.addEventListener(type, eventCallback);
      return () => {
        this.removeEventListener(type, eventCallback);
      };
    });
  }
}

module.exports = ObservableEventTarget;
